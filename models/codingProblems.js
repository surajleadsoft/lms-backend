// models/Question.js
const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  explanation: { type: String, default: "" }, // optional (only in sample)
});

const codeSchema = new mongoose.Schema({
  language: { type: String, required: true },
  code: { type: String, required: true },
});

const questionSchema = new mongoose.Schema(
  {
    basicData: {
      title: { type: String, required: true },
      category: { type: String, required: true },
      description: { type: String, required: true },
      difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
      constraints: { type: String, required: true },
      inputFormat: { type: String, required: true },
      outputFormat: { type: String, required: true },
      tags: { type: [String], default: [] },
    },

    sampleTestCases: [testCaseSchema],
    hiddenTestCases: [testCaseSchema],

    code: codeSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("codingProblems", questionSchema);
