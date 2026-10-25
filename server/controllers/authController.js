// server/controllers/authController.js
// Password hashing is handled by the User pre-save hook 

import User from '../models/user.js';
import { generateToken } from '../middleware/auth.js';
import sendEmail from '../utils/sendEmail.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role = 'student' } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendEmail(
          email,
          'Welcome to Student Portal',
          `Hello ${firstName}, your account was successfully created.`
        );
      } catch (mailErr) {
        console.warn('[auth] welcome email failed:', mailErr.message);
      }
    }

    const token = generateToken(newUser);
    res.status(201).json({
      token,
      user: newUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password'
    );

    if (!existingUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatches = await existingUser.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(existingUser);
    res.json({
      token,
      user: existingUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const profile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};
