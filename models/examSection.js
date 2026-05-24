const mongoose = require('mongoose');

const attemptedQuestionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },

  userAnswer: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ['correct', 'wrong', 'skipped'],
    default: 'skipped'
  },

  obtainedMarks: {
    type: Number,
    default: 0
  }
});

const sectionSchema = new mongoose.Schema({
  sectionName: {
    type: String,
    required: true
  },

  totalDuration: {
    type: Number,
    required: true
  },

  totalMarks: {
    type: Number,
    required: true
  },

  noOfquestions: {
    type: Number,
    required: true
  },

  questions: [attemptedQuestionSchema],

  attempted: {
    type: Number,
    default: 0
  },

  correct: {
    type: Number,
    default: 0
  },

  wrong: {
    type: Number,
    default: 0
  },

  marksObtained: {
    type: Number,
    default: 0
  },

  timeTaken: {
    type: String,
    default: "00:00"
  }
});

const examSectionSchema = new mongoose.Schema({
  emailAddress: {
    type: String,
    required: true,
    index: true
  },

  fullName: {
    type: String,
    required: true
  },

  examName: {
    type: String,
    required: true
  },

  sections: [sectionSchema],

  status: {
    type: String,
    enum: ['in-progress', 'completed', 'cheated'],
    default: 'in-progress'
  },

  totalAttempted: {
    type: Number,
    default: 0
  },

  totalCorrect: {
    type: Number,
    default: 0
  },

  totalWrong: {
    type: Number,
    default: 0
  },

  totalMarksObtained: {
    type: Number,
    default: 0
  },

  totalTimeTaken: {
    type: String,
    default: "00:00"
  },

  startedAt: {
    type: Date,
    default: Date.now
  },

  completedAt: {
    type: Date
  }

}, { timestamps: true });

examSectionSchema.index(
  { emailAddress: 1, examName: 1 },
  { unique: true }
);

module.exports = mongoose.model('ExamSection', examSectionSchema);