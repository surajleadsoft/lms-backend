const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  emailAddress: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  paymentCourse: {
    type: String,
    required: true,
    trim: true
  },
  courseFees: {
    type: Number,
    required: true,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['Partial', 'Complete'],
    required: true
  },
  amountToPay: {
    type: Number,
    required: true,
    min: 0
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Waiting', 'Approved', 'Rejected'],
    default: 'Waiting',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Payments', paymentSchema);
