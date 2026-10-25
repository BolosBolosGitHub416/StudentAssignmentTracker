// server/models/assignment.js
// optimized indexes for analytics, priority, and reminder queries

import mongoose from 'mongoose';

const STATUS = ['assigned', 'in_progress', 'completed', 'overdue'];

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    // Canonical owner field (was mixed studentId / userId in Phase I)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    course: {
      type: String,
      default: 'General',
      trim: true,
      maxlength: 80,
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    weight: {
      type: Number,
      default: 0,
      min: [0, 'Weight cannot be negative'],
      max: [100, 'Weight cannot exceed 100'],
    },
    grade: {
      type: Number,
      default: null,
      min: [0, 'Grade cannot be negative'],
      max: [100, 'Grade cannot exceed 100'],
      validate: {
        validator(v) {
          return v === null || v === undefined || (typeof v === 'number' && !Number.isNaN(v));
        },
        message: 'Grade must be a number between 0 and 100 or null',
      },
    },
    status: {
      type: String,
      enum: {
        values: STATUS,
        message: 'Status must be one of: assigned, in_progress, completed, overdue',
      },
      default: 'assigned',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        // Back-compat for any remaining client code that still reads studentId
        ret.studentId = String(ret.userId);
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes used by analytics, priority list, and reminder job
assignmentSchema.index({ userId: 1, status: 1, dueDate: 1 });
assignmentSchema.index({ userId: 1, course: 1 });
assignmentSchema.index({ status: 1, dueDate: 1 }); // reminder window scans
assignmentSchema.index({ course: 1, dueDate: -1 });

// Keep status consistent with grade when possible
assignmentSchema.pre('save', function setStatusFromGrade() {
  if (this.grade !== null && this.grade !== undefined && this.status !== 'completed') {
    this.status = 'completed';
  }
  next();
});

export const ASSIGNMENT_STATUS = STATUS;
export default mongoose.model('Assignment', assignmentSchema);
