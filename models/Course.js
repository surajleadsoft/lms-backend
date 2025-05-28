const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  courseFees:{
    type:Number,
    required:true
  },
  startDate:{
    type:Date,
    required:true
  },  
  isAdmissionOpen:{type:Boolean,default:false},
  instructorName:{
    type:String,
    required:true
  },
  duration:{
    type:String,
    required:true
  }
}, {
  timestamps: true
});

// Auto increment field for SrNo
courseSchema.plugin(AutoIncrement, { inc_field: 'SrNo' });

module.exports = mongoose.model('Course', courseSchema);
