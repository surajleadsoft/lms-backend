const mongoose = require('mongoose');

const courseContentSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  serialNo: { type: Number, required: true },
  moduleName: { type: String, required: true },
  contentType: { type: String, required: true, enum: ['video', 'exam'] },
  createdDate: { type: Date, required: true, default: Date.now },
  
  // For video content
  videoTitle: { type: String },
  videoURL: { type: String },
  
  // For exam content
  examTitle: { type: String },

  // Common field
  description: { type: String, required: true }
});

module.exports = mongoose.model('CourseContent', courseContentSchema);
