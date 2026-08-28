const mongoose = require("mongoose");


// ============================================================
// CODING RESULT SCHEMA
// ============================================================

const codingResultSchema = new mongoose.Schema(
    {
        language: {
            type: String,
            default: ""
        },

        code: {
            type: String,
            default: ""
        },

        verdict: {
            type: String,
            default: ""
        },

        passedTestCases: {
            type: Number,
            default: 0
        },

        totalTestCases: {
            type: Number,
            default: 0
        },

        weightedPassed: {
            type: Number,
            default: 0
        },

        weightedTotal: {
            type: Number,
            default: 0
        },

        hiddenTestResults: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        }
    },
    {
        _id: false
    }
);


// ============================================================
// ATTEMPTED QUESTION SCHEMA
// ============================================================

const attemptedQuestionSchema = new mongoose.Schema(
    {
        questionId: {
            type: mongoose.Schema.Types.ObjectId,

            ref: "Question",

            required: true
        },


        // =====================================================
        // STUDENT ANSWER
        //
        // MCQ:
        // "A"
        //
        // MULTIPLE:
        // ["A", "C"]
        //
        // FILL:
        // ["Java", "Python"]
        //
        // CODING:
        // actual source code string
        // =====================================================

        userAnswer: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },


        // =====================================================
        // QUESTION TYPE SNAPSHOT
        // =====================================================

        questionType: {
            type: String,
            required: true
        },


        // =====================================================
        // RESULT
        // =====================================================

        status: {
            type: String,

            enum: [
                "correct",
                "wrong",
                "skipped",
                "partial"
            ]
        },


        // =====================================================
        // MARKS OBTAINED
        // =====================================================

        obtainedMarks: {
            type: Number,
            default: 0,
            min: 0
        },


        // =====================================================
        // FILL BLANK DETAILS
        // =====================================================

        blankResults: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },


        // =====================================================
        // CODING RESULT
        // =====================================================

        codingResult: {
            type: codingResultSchema,
            default: undefined
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
            required: true,
            min: 0
        },


        // Maximum marks available in this section
        totalMarks: {
            type: Number,
            required: true,
            min: 0
        },


        noOfquestions: {
            type: Number,
            required: true,
            min: 0
        },


        questions: {
            type: [attemptedQuestionSchema],
            default: []
        },


        attempted: {
            type: Number,
            default: 0,
            min: 0
        },


        correct: {
            type: Number,
            default: 0,
            min: 0
        },


        wrong: {
            type: Number,
            default: 0,
            min: 0
        },


        skipped: {
            type: Number,
            default: 0,
            min: 0
        },


        marksObtained: {
            type: Number,
            default: 0,
            min: 0
        },


        // HH:MM:SS
        timeTaken: {
            type: String,
            default: "00:00:00"
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
            required: true,
            index: true
        },


        sections: {
            type: [sectionSchema],
            default: []
        },


        status: {
            type: String,

            enum: [
                "in-progress",
                "completed",
                "cheated"
            ],

            default: "in-progress"
        },


        // =====================================================
        // EXAM TOTALS
        // =====================================================

        totalQuestions: {
            type: Number,
            default: 0
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


        totalSkipped: {
            type: Number,
            default: 0
        },


        totalMarks: {
            type: Number,
            default: 0
        },


        totalMarksObtained: {
            type: Number,
            default: 0
        },


        totalTimeTaken: {
            type: String,
            default: "00:00:00"
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
// UNIQUE ATTEMPT
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
    "ExamSection",
    examSectionSchema
);