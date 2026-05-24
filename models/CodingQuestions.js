const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
      trim: true
    },

    output: {
      type: String,
      required: true,
      trim: true
    },

    isHidden: {
      type: Boolean,
      default: false
    },

    weightage: {
      type: Number,
      default: 1,
      min: 1
    },

    explanation: {
      type: String,
      required: function () {
        return this.isHidden === false;
      },
      trim: true
    }
  },
  {
    _id: false
  }
);


const languageSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
      enum: [
        "c",
        "cpp",
        "java",
        "python",
        "javascript"
      ]
    },

    defaultCode: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
);

const codingQuestionSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    chapterName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },


    questionTitle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      required: true
    },

    difficultyLevel: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
      index: true
    },

    inputFormat: {
      type: String,
      required: true
    },

    outputFormat: {
      type: String,
      required: true
    },

    constraints: [
      {
        type: String,
        trim: true
      }
    ],


    testCases: {
      type: [testCaseSchema],
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "At least one test case is required"
      }
    },


    languageSupports: {
      type: [languageSchema],
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "At least one language support is required"
      }
    },


    marks: {
      type: Number,
      default: 25,
      min: 1
    },


    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      index: true
    }
  },
  {
    timestamps: true
  }
);

codingQuestionSchema.index({
  subjectName: 1,
  chapterName: 1
});

codingQuestionSchema.index({
  difficultyLevel: 1,
  isActive: 1
});

codingQuestionSchema.index({
  questionTitle: "text",
  description: "text"
});

module.exports = mongoose.model(
  "coding_questions",
  codingQuestionSchema
);