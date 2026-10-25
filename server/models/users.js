// server/models/user.js
// indexes: email (unique) role for admin queries

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['student', 'teacher', 'admin', 'advisor'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never return password by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: 'Role must be one of: student, teacher, admin, advisor',
      },
      default: 'student',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound / secondary indexes for common lookups
userSchema.index({ role: 1, createdAt: -1 });

// hash password only when it is new or modified
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const ROLES_LIST = ROLES;
export default mongoose.model('User', userSchema);
