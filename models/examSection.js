const mongoose = require('mongoose');


// ============================================================
// ATTEMPTED QUESTION SCHEMA
// ============================================================

const attemptedQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },

    // Supports:
    // MCQ       -> "Option A"
    // TRUE_FALSE -> "true"
    // FILL_BLANK -> ["Suraj", "Sunil", "Pawar"]
    // Other      -> object/string if required
    userAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    questionType: {
      type: String,
      required: true
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
  },
  {
    _id: false
  }
);


// ============================================================
// SECTION SCHEMA
// ============================================================

const sectionSchema = new mongoose.Schema(
  {
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

    questions: {
      type: [attemptedQuestionSchema],
      default: []
    },

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
      default: '00:00'
    }
  }
);


// ============================================================
// EXAM SECTION SCHEMA
// ============================================================

const examSectionSchema = new mongoose.Schema(
  {
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

    sections: {
      type: [sectionSchema],
      default: []
    },

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
      default: '00:00'
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);


// ============================================================
// UNIQUE INDEX
// ============================================================

examSectionSchema.index(
  {
    emailAddress: 1,
    examName: 1
  },
  {
    unique: true
  }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model(
  'ExamSection',
  examSectionSchema
);