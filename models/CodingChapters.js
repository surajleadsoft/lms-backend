const mongoose = require('mongoose')

const QuestionSchema = new mongoose.Schema({
  questionNo: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  inputFormat: {
    type: String,
    required: true,
  },
  outputFormat: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Easy",
  },
  driverCodes: [
    {
      language: { type: String, required: true }, // e.g., "Java", "Python", "C++"
      code: { type: String, required: true },     // driver code snippet
    },
  ],
  constraints: {
    type: [String], // e.g., "1 <= n <= 10^5"
    default: [],
  },
  sampleTestCases: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true },
      explanation: { type: String },
    },
  ],
  hiddenTestCases: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true },
    },
  ],
  solution: {
    type: String, // store reference solution (optional)
  },
  tags: {
    type: [String], // e.g., ["array", "dp"]
    default: [],
  },
});

// Main Chapter schema
const ChapterSchema = new mongoose.Schema(
  {
    chapterName: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String], // tags related to chapter
      default: [],
    },
    category: {
      type: String,
      enum: ["popular", "new"],
      default: "new",
    },
    chapterAssignedTo: {
      type: [String], // list of usernames/emails/userIds
      default: [],
    },
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

// Auto increment questionNo inside each chapter
ChapterSchema.pre("save", function (next) {
  if (this.isModified("questions")) {
    this.questions.forEach((q, idx) => {
      q.questionNo = idx + 1;
    });
  }
  next();
});

module.exports = mongoose.model("CodingChapters", ChapterSchema);
