// server/controllers/notificationController.js
import mongoose from 'mongoose';
import Notification from '../models/notifications.js';
import NotificationPrefs from '../models/notificationPrefs.js';
import { PRIORITY_ORDER, DEFAULT_PREFS } from '../utils/notificationRules.js';
import { runReminderCycle } from '../services/reminderJob.js';

const pickPrefs = (doc) => ({
  inAppAlerts: doc?.inAppAlerts ?? DEFAULT_PREFS.inAppAlerts,
  emailReminders: doc?.emailReminders ?? DEFAULT_PREFS.emailReminders,
  minPriority: doc?.minPriority ?? DEFAULT_PREFS.minPriority,
  reminderDaysBefore: doc?.reminderDaysBefore ?? DEFAULT_PREFS.reminderDaysBefore,
});

// GET /api/notifications
export const listNotifications = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const [items, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ userId, read: false }),
    ]);
    res.json({ items, unreadCount });
  } catch (err) { next(err); }
};

// PUT /api/notifications/:id/read
export const markRead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Notification not found' });
    const doc = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId }, { read: true }, { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Notification not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

// PUT /api/notifications/read-all
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// GET /api/notifications/prefs
export const getPrefs = async (req, res, next) => {
  try {
    res.json(pickPrefs(await NotificationPrefs.findOne({ userId: req.user.userId }).lean()));
  } catch (err) { next(err); }
};

// PUT /api/notifications/prefs
export const updatePrefs = async (req, res, next) => {
  try {
    const { inAppAlerts, emailReminders, minPriority, reminderDaysBefore } = req.body;
    const update = {};
    if (inAppAlerts !== undefined) update.inAppAlerts = Boolean(inAppAlerts);
    if (emailReminders !== undefined) update.emailReminders = Boolean(emailReminders);
    if (minPriority !== undefined) {
      if (!PRIORITY_ORDER.includes(minPriority)) return res.status(400).json({ error: `minPriority must be one of: ${PRIORITY_ORDER.join(', ')}` });
      update.minPriority = minPriority;
    }
    if (reminderDaysBefore !== undefined) {
      const n = Number(reminderDaysBefore);
      if (!Number.isInteger(n) || n < 0 || n > 14) return res.status(400).json({ error: 'reminderDaysBefore must be a whole number from 0 to 14' });
      update.reminderDaysBefore = n;
    }
    const doc = await NotificationPrefs.findOneAndUpdate(
      { userId: req.user.userId }, { $set: update }, { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json(pickPrefs(doc));
  } catch (err) { next(err); }
};

// POST /api/notifications/check  (runs the reminder rules for the current student now)
export const checkNow = async (req, res, next) => {
  try {
    const result = await runReminderCycle({ io: req.app.get('io'), userId: req.user.userId });
    res.json(result);
  } catch (err) { next(err); }
};
