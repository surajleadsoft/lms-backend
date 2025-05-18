const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
    trim: true,
  },
  chapterName: {
    type: String,
    required: true,
    trim: true,
  },
  difficultyLevel: {
    type: String,    
    required: true,
  },
  companyTags: {
    type: [String],
    default: [],
  },
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: Object,
    required: true,
    // Example: { A: "Option A", B: "Option B", C: "Option C", D: "Option D" }
  },
  answer: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
});

// Prevent duplicate questionText for same subject + chapter
questionSchema.index(
  { subjectName: 1, chapterName: 1, questionText: 1 },
  { unique: true }
);

module.exports = mongoose.model('Question', questionSchema);
