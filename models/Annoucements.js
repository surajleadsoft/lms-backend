const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  announcementTitle: { type: String, required: true },
  announcementDetails: { type: String, required: true },
  date: { type: String, required: true }
});

// Prevent duplicate announcements with same details
announcementSchema.index(
  { courseName: 1, announcementTitle: 1, announcementDetails: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
