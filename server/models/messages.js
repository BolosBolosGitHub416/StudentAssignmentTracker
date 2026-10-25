// server/models/messages.js  (course chat history)
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 40,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

messageSchema.index({ course: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
