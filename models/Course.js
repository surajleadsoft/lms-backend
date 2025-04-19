const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    unique: true,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Auto increment field for SrNo
courseSchema.plugin(AutoIncrement, { inc_field: 'SrNo' });

module.exports = mongoose.model('Course', courseSchema);
