// server/models/notifications.js (in-app notification history)
import mongoose from 'mongoose';
import { PRIORITY_ORDER } from '../utils/notificationRules.js';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['deadline', 'overdue', 'announcement', 'system'],
      default: 'deadline',
    },
    priority: {
      type: String,
      enum: PRIORITY_ORDER,
      default: 'MEDIUM',
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    dedupeKey: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
// prevents repeat alerts for the same assignment at the same priority level
notificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);

export default mongoose.model('Notification', notificationSchema);
