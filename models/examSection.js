const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  status: { type: String, enum: ['correct', 'wrong', 'unattempted'], default: 'unattempted' },
  answer: String
});

const SectionSchema = new mongoose.Schema({
  sectionName: { type: String, required: true },
  noOfquestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  timeTaken: { type: String, default: '00:00' },
  questions: [QuestionSchema],

  // ✅ Pre-computed stats
  totalCorrect: { type: Number, default: 0 },
  totalWrong: { type: Number, default: 0 },
  marksObtained: { type: Number, default: 0 }
});

const examSectionSchema = new mongoose.Schema({
  examName: { type: String, required: true, index: true },
  emailAddress: { type: String, required: true, index: true },
  fullName: { type: String, required: true },
  sections: [SectionSchema],

  // ✅ Pre-computed overall stats
  totalMarksObtained: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  totalWrong: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  totalTimeTaken: { type: String, default: '00:00' }
}, { timestamps: true });

examSectionSchema.index({ emailAddress: 1, examName: 1 });

module.exports = mongoose.model('ExamSection', examSectionSchema);