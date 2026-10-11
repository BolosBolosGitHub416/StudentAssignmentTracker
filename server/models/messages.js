// server/models/messages.js  (course chat history)
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, trim: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
