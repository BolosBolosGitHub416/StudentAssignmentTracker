// server/utils/notificationRules.js
import { prioritizeAssignments } from './analytics.js';

// lowest to highest matches the labels produced by getPriorityLabel
export const PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'OVERDUE'];

export const DEFAULT_PREFS = {
  inAppAlerts: true,
  emailReminders: true,
  minPriority: 'HIGH',      // only alert at this priority or above (avoids overload)
  reminderDaysBefore: 2,    // only alert when the deadline is this close (overdue always counts)
};

const rank = (label) => PRIORITY_ORDER.indexOf(label);

const whenText = (days) => {
  if (days < 1) return 'in less than a day';
  const n = Math.ceil(days);
  return `in ${n} day${n > 1 ? 's' : ''}`;
};

export const buildAlert = (a) => {
  const label = a.priorityLabel;
  const overdue = label === 'OVERDUE';
  const due = new Date(a.dueDate).toLocaleDateString('en-CA');
  const weight = a.weight ?? 10;
  return {
    type: overdue ? 'overdue' : 'deadline',
    priority: label,
    title: overdue
      ? `Overdue: ${a.title}`
      : `${label === 'CRITICAL' ? 'Due very soon' : 'Upcoming deadline'}: ${a.title}`,
    message: overdue
      ? `${a.title} (${a.course}) was due ${due} and is worth ${weight}% of the course grade.`
      : `${a.title} (${a.course}) is due ${due}, ${whenText(a.daysUntilDue)}, and is worth ${weight}% of the course grade.`,
    assignmentId: a._id,
    // one alert per assignment per priority level so a student is told again only when it escalates
    dedupeKey: `${a._id}:${label}`,
  };
};


 // decides which alerts a student should get right now
 //assignments: plain objects (use .lean()) with title, course, dueDate, weight, status
 
export const evaluateAlerts = (assignments, prefs = {}) => {
  const p = { ...DEFAULT_PREFS, ...prefs };
  const minRank = Math.max(rank(p.minPriority), 0);

  return prioritizeAssignments(assignments)
    .filter((a) => a.status !== 'completed')
    .filter((a) => rank(a.priorityLabel) >= minRank)
    .filter((a) => a.daysUntilDue < 0 || a.daysUntilDue <= p.reminderDaysBefore)
    .map(buildAlert);
};
