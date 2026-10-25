// server/utils/models.js

import mongoose from 'mongoose';

// Ensure models are registered when this module is imported
import '../models/user.js';
import '../models/assignment.js';
import '../models/announcements.js';
import '../models/messages.js';
import '../models/notifications.js';
import '../models/notificationPrefs.js';

export const getModel = (name) => {
  const model = mongoose.models[name];
  if (!model) {
    throw new Error(
      `Mongoose model "${name}" is not registered. Make sure models are imported and the database is connected.`
    );
  }
  return model;
};

export default getModel;
