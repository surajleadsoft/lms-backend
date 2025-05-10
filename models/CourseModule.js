const mongoose = require('mongoose');

const courseModuleSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  moduleName: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CourseModule', courseModuleSchema);
