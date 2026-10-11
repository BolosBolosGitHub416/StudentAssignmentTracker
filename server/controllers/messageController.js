// server/controllers/messageController.js
import Message from '../models/messages.js';

// GET /api/messages?course=CPAN212  (last 50 chat messages)
export const listMessages = async (req, res, next) => {
  try {
    const course = String(req.query.course || 'General').trim();
    const items = await Message.find({ course }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(items.reverse());
  } catch (err) { next(err); }
};
