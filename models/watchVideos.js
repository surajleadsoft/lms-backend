const mongoose = require('mongoose');

const watchedVideoSchema = new mongoose.Schema({
  emailAddress: { type: String, required: true },
  courseName: { type: String, required: true },
  moduleName: { type: String, required: true },
  serialNo: { type: Number, required: true },
  action: {
    type: String,
    enum: ['play', 'pause', 'resume', 'complete'],
    required: true
  },
  duration: { type: String, required: true },
  currentTime: { type: String, required: true },
  percentage: { type: Number, min: 0, max: 100, required: true },
  watchedAt: { type: Date, default: Date.now }
});

watchedVideoSchema.index({ emailAddress: 1, courseName: 1, moduleName: 1, serialNo: 1 }, { unique: true });

module.exports = mongoose.model('WatchedVideo', watchedVideoSchema);
