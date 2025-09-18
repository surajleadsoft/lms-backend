const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  subjectName: { type: String, required: true, index: true }, // ✅ index
  chapterName: { type: String, required: true },
  noOfquestions: { type: Number, required: true }
});

const SectionSchema = new mongoose.Schema({
  sectionNo: { type: Number, required: true },
  sectionName: { type: String, required: true },
  duration: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  chapters: [ChapterSchema]
});

const ExamSchema = new mongoose.Schema({
  examName: { type: String, required: true, index: true }, // ✅ search often
  category: { type: String, required: true, index: true }, // ✅ exam filtering
  examDate: { type: Date, required: true, index: true },   // ✅ sorting/filter
  examStartTime: { type: String, required: true },
  examEndTime: { type: String, required: true },
  duration: { type: Number, required: true },
  isProctered: { type: Boolean, default: false },
  noOfSections: { type: Number, required: true },
  qualificationCriteria: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  sections: [SectionSchema]
}, { timestamps: true });

// ✅ compound index for category + date queries


module.exports = mongoose.model('Exams', ExamSchema);
