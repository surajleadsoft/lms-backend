const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [
    {
      option1: { type: String, required: true },
      option2: { type: String, required: true },
      option3: { type: String, required: true },
      option4: { type: String, required: true }
    }
  ],
  answer:{type:String},
  userAnswer: { type: String, default: null },
  status: {
    type: String,
    enum: ['correct', 'wrong', 'skipped'],
    default: 'skipped'
  }
});


const sectionSchema = new mongoose.Schema({
  sectionName: { type: String, required: true },
  totalDuration: { type: Number, required: true }, // in minutes or seconds
  totalMarks: { type: Number, required: true },
  noOfquestions: { type: Number, required: true },
  timeTaken: { type: String }, // optional: in seconds
  questions: [questionSchema]     
});

const examSectionSchema = new mongoose.Schema({
  emailAddress: { type: String, required: true,index:true},
  fullName: { type: String, required: true },
  examName: { type: String, required: true },
  sections: [sectionSchema]
}, { timestamps: true });

examSectionSchema.index({ examName: 1 });

module.exports = mongoose.model('ExamSection', examSectionSchema);