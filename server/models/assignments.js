import mongoose from "mongoose";
// Define the assignment schema
const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"]
  },
  course: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true 
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  weight: {
    type: Number,
    min: 0,
    max: 100
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending"
  }
}, { timestamps: true });

export const assignments = mongoose.model("assignments", assignmentSchema);
