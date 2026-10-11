// server/controllers/announcementController.js
import Announcement from '../models/announcements.js';

// GET /api/announcements
export const listAnnouncements = async (req, res, next) => {
  try {
    res.json(await Announcement.find().sort({ createdAt: -1 }).limit(50).populate('createdBy', 'firstName lastName name'));
  } catch (err) { next(err); }
};

// POST /api/announcements  (admin/advisor only enforced in the router)
export const createAnnouncement = async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const message = String(req.body.message || '').trim();
    const course = String(req.body.course || 'General').trim();
    if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

    const created = await Announcement.create({ title, message, course, createdBy: req.user.userId });

    // real-time in-app notification to everyone who is online
    req.app.get('io')?.emit('notification', {
      _id: `announcement-${created._id}`,
      type: 'announcement',
      priority: 'MEDIUM',
      title: `Announcement (${course}): ${title}`,
      message,
      transient: true,
      read: false,
      createdAt: created.createdAt,
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
};
