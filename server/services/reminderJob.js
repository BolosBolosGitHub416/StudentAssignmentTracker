// server/services/reminderJob.js
// scheduled deadline reminders creates in-app notifications, pushes them over
// Socket.IO and emails a single digest per student respects each students
// notification preferences and never repeats the same alert.
import Notification from '../models/notifications.js';
import NotificationPrefs from '../models/notificationPrefs.js';
import sendEmail from '../utils/sendEmail.js';
import { evaluateAlerts, DEFAULT_PREFS } from '../utils/notificationRules.js';
import { getModel } from '../utils/models.js';

const DAY = 24 * 60 * 60 * 1000;
const emailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

/**
 * rruns one reminder cycle pass userId to run for just one student (used by "Check now").
 * Returns { created, emailed }.
 */
export async function runReminderCycle({ io, userId } = {}) {
  const Assignment = getModel('Assignment');
  const User = getModel('User');

  const query = {
    status: { $ne: 'completed' },
    dueDate: { $gte: new Date(Date.now() - 30 * DAY), $lte: new Date(Date.now() + 15 * DAY) },
  };
  if (userId) query.userId = userId;
  const assignments = await Assignment.find(query).lean();

  const byUser = new Map();
  for (const a of assignments) {
    const key = String(a.userId);
    if (!byUser.has(key)) byUser.set(key, []);
    byUser.get(key).push(a);
  }
  if (byUser.size === 0) return { created: 0, emailed: 0 };

  const ids = [...byUser.keys()];
  const [users, prefsDocs] = await Promise.all([
    User.find({ _id: { $in: ids } }).select('email firstName name').lean(),
    NotificationPrefs.find({ userId: { $in: ids } }).lean(),
  ]);
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const prefsMap = new Map(prefsDocs.map((p) => [String(p.userId), p]));

  let created = 0;
  let emailed = 0;

  for (const [uid, list] of byUser) {
    const prefs = { ...DEFAULT_PREFS, ...(prefsMap.get(uid) || {}) };
    if (!prefs.inAppAlerts && !prefs.emailReminders) continue;

    const fresh = [];
    for (const alert of evaluateAlerts(list, prefs)) {
      try {
        // if in-app alerts are off we still store it (as read) so email is not repeated
        fresh.push(await Notification.create({ userId: uid, ...alert, read: !prefs.inAppAlerts }));
      } catch (err) {
        if (err.code !== 11000) throw err; // 11000 = already alerted at this level
      }
    }
    if (fresh.length === 0) continue;
    created += fresh.length;

    if (prefs.inAppAlerts && io) {
      for (const n of fresh) io.to(`user:${uid}`).emit('notification', n.toObject ? n.toObject() : n);
    }

    const user = userMap.get(uid);
    if (prefs.emailReminders && user?.email && emailConfigured()) {
      const name = user.firstName || user.name || 'there';
      const lines = fresh.map((n) => `- [${n.priority}] ${n.message}`).join('\n');
      try {
        await sendEmail(
          user.email,
          `Student Assignment Tracker: ${fresh.length} deadline alert${fresh.length > 1 ? 's' : ''}`,
          `Hi ${name},\n\nHere is what needs your attention:\n\n${lines}\n\nLog in to see your full priority list.`
        );
        emailed += 1;
      } catch (err) {
        console.warn('[reminders] email failed:', err.message);
      }
    }
  }
  return { created, emailed };
}

/** starts the recurring job. call once after the database is connected. */
export function startReminderJob(io) {
  const minutes = Number(process.env.REMINDER_INTERVAL_MINUTES) || 30;
  const tick = () =>
    runReminderCycle({ io })
      .then((r) => { if (r.created) console.log(`[reminders] ${r.created} alert(s), ${r.emailed} email(s)`); })
      .catch((err) => console.error('[reminders] cycle failed:', err.message));
  setTimeout(tick, 10_000); // first run shortly after startup
  return setInterval(tick, minutes * 60_000);
}
