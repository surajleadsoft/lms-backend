const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  emailAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  driveName:{
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  appliedDate: {
    type: Date,
    required: true,
  },
  appliedTime: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
