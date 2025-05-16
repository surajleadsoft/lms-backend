const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  emailAddress: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,    
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    required: true,
  },
  inTime:{
    type:[String],
    required:true
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
