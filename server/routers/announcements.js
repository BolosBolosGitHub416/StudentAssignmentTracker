// server/routers/announcements.js
import express from 'express';
import { listAnnouncements, createAnnouncement } from '../controllers/announcementController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);
router.get('/', listAnnouncements);
router.post('/', requireRole('admin', 'advisor'), createAnnouncement);

export default router;
