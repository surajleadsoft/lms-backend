const mongoose = require('mongoose');

const chapterCompletionSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true
  },
  chapterNo: {
    type: Number,
    required: true
  },
  chapterName: {
    type: String,
    required: true
  },
  totalDuration: {
    type: String, // In seconds or minutes — adjust as needed
    required: true
  },
  currentDuration: {
    type: String, // In seconds or minutes — adjust as needed
    required: true,
    default: "00:00"
  },
  completionPercentage: {
    type: Number,
    required: true,
    default: 0
  },
  emailAddress: {
    type: String,
    required: true
  }
}, { timestamps: true });

chapterCompletionSchema.index({ emailAddress: 1, courseName: 1, chapterNo: 1, chapterName: 1 }, { unique: true });

module.exports = mongoose.model('chapterCompletion', chapterCompletionSchema);
