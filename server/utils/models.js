// server/utils/models.js

import mongoose from 'mongoose';

export const getModel = (name) => {
  const model = mongoose.models[name];
  if (!model) {
    throw new Error(`Mongoose model "${name}" is not registered. Make sure models/${name.toLowerCase()}s.js is imported and the database is connected.`);
  }
  return model;
};
