// server/controllers/userController.js
// Admin-only user listing MongoDB backed

import User from '../models/user.js';

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(
      users.map((u) => ({
        ...u,
        id: String(u._id),
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ ...user, id: String(user._id) });
  } catch (err) {
    next(err);
  }
};
