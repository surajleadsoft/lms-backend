// models/Campus.js
const mongoose = require('mongoose');

const campusSchema = new mongoose.Schema({
  applyLink: {
    type: String,
    required: true
  },
  batchEligible: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  compensation: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  driveName: {
    type: String,
    required: true
  },
  driveType: {
    type: String,
    required: true
  },
  lastDateToApply: {
    type: Date,
    required: true
  },
  locations: {
    type: String,
    required: true
  },
  package: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Campus', campusSchema);
