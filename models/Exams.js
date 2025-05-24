const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  sectionNo: Number,
  sectionName: String,
  chapterName: String,
  subjectName: String,
  noOfquestions: Number,
  duration: Number,
  totalMarks: Number,
});

const ExamSchema = new mongoose.Schema({
  examName: String,
  category: String,
  examDate: Date,
  examStartTime: String,
  examEndTime: String,
  duration: Number,
  isProctered: Boolean,
  noOfSections: Number,
  qualificationCriteria: Number,
  totalQuestions: Number,
  totalMarks: Number,
  sections: [SectionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Exams', ExamSchema);
