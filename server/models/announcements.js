const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema({
  course: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Announcement", AnnouncementSchema);