// server/routers/auth.js
import express from 'express';
import { login, register, profile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import {
  validate,
  registerSchema,
  loginSchema,
} from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/profile', verifyToken, profile);

export default router;
