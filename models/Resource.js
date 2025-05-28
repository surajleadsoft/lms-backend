const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
  },
  resourceName: {
    type: String,
    required: true,
  },
  fileLocation: {
    type: String,
    required: true,
  }
}, {
  timestamps: true
});

// Unique compound index to prevent duplicate resourceName under the same courseName
resourceSchema.index({ courseName: 1, resourceName: 1 }, { unique: true });

module.exports = mongoose.model('Resource', resourceSchema);
