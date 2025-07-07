const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: String,
  options: Object,
  answer: String,
  userAnswer: String
});

const testResultSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  subjectName: String,
  chapterName: String,
  noOfQuestions: Number,
  questions: [questionSchema],
  correctAnswers: Number,
  wrongAnswers: Number,
  skippedAnswers: Number,
  percentage: Number,
  status: { type: String, enum: ['attempted', 'cleared', 'not-qualified'], default: 'attempted' },
  timeStarted: Date,
  timeEnded: Date,
  timeTakenInSeconds: Number,
}, { timestamps: true });

module.exports = mongoose.model('testResult', testResultSchema);
