// server/models/notificationPrefs.js  (per-user notification settings)
import mongoose from 'mongoose';
import { PRIORITY_ORDER } from '../utils/notificationRules.js';

const prefsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    inAppAlerts: { type: Boolean, default: true },
    emailReminders: { type: Boolean, default: true },
    minPriority: { type: String, enum: PRIORITY_ORDER, default: 'HIGH' },
    reminderDaysBefore: { type: Number, min: 0, max: 14, default: 2 },
  },
  { timestamps: true }
);

export default mongoose.model('NotificationPrefs', prefsSchema);
