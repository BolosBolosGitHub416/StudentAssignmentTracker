// server/routers/messages.js
import express from 'express';
import { listMessages } from '../controllers/messageController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);
router.get('/', listMessages);

export default router;
