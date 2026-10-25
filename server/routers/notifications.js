// server/routers/notifications.js
import express from 'express';
import {
  listNotifications,
  markRead,
  markAllRead,
  getPrefs,
  updatePrefs,
  checkNow,
} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

router.get('/', listNotifications);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);
router.get('/prefs', getPrefs);
router.put('/prefs', updatePrefs);
router.post('/check', checkNow);

export default router;
