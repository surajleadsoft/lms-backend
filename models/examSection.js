const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({ 
  questionText: { type: String, required: true }, 
  options: { 
    option1: { type: String, required: true }, 
    option2: { type: String, required: true }, 
    option3: { type: String, required: true }, 
    option4: { type: String, required: true } 
  }, 
  answer: { type: String }, 
  userAnswer: { type: String, default: null }, 
  status: { 
    type: String, 
    enum: ['correct', 'wrong', 'skipped'], 
    default: 'skipped' 
  } 
}); 

const sectionSchema = new mongoose.Schema({ 
  sectionName: { type: String, required: true }, 
  totalDuration: { type: Number, required: true }, // in minutes/seconds 
  totalMarks: { type: Number, required: true }, 
  noOfquestions: { type: Number, required: true }, 
  timeTaken: { type: String }, // optional
  questions: [questionSchema],

  // ✅ Pre-computed per-section stats
  attempted: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
  marksObtained: { type: Number, default: 0 },
  timeTaken: { type: String, default: "00:00" }
}); 

const examSectionSchema = new mongoose.Schema({ 
  emailAddress: { type: String, required: true, index: true }, 
  fullName: { type: String, required: true }, 
  examName: { type: String, required: true }, 
  sections: [sectionSchema],

  // ✅ Attempt-level status
  status: { 
    type: String, 
    enum: ['in-progress', 'completed', 'cheated'], 
    default: 'in-progress' 
  },

  // ✅ Pre-computed totals for O(1) fetch
  totalAttempted: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  totalWrong: { type: Number, default: 0 },
  totalMarksObtained: { type: Number, default: 0 },
  totalTimeTaken: { type: String, default: "00:00" },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

// Index for fast lookups
examSectionSchema.index({ emailAddress: 1, examName: 1 }, { unique: true });

module.exports = mongoose.model('ExamSection', examSectionSchema);
