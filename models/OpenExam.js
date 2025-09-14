// models/OpenExam.js
const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  subjectName: { type: String, required: true, index: true },
  chapterName: { type: String, required: true, index: true },
  noOfquestions: { type: Number, required: true },
  // ✅ Pre-store questionIds for faster fetch
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
});

const SectionSchema = new mongoose.Schema({
  sectionNo: { type: Number, required: true },
  sectionName: { type: String, required: true },
  duration: { type: Number, required: true }, // minutes
  totalMarks: { type: Number, required: true },
  chapters: [ChapterSchema]
});

// helper → generate lowercase random string
function generateExamId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const OpenExamSchema = new mongoose.Schema({
  examId: { 
    type: String, 
    unique: true, 
    required: true, 
    minlength: 5, 
    maxlength: 5, 
    lowercase: true, 
    index: true 
  },
  examName: { type: String, required: true, index: true },
  collegeName: { type: String, required: true },
  examDate: { type: Date, required: true },
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

// ✅ Generate new examId for fresh exam
OpenExamSchema.pre('validate', async function (next) {
  if (this.isNew) {  // only when creating new exam
    let newId;
    let exists = true;

    while (exists) {
      newId = generateExamId();
      exists = await mongoose.models.OpenExam.findOne({ examId: newId });
    }

    this.examId = newId.toLowerCase(); // ensure lowercase
  }
  next();
});

// ✅ Indexes for performance
OpenExamSchema.index({ examId: 1 });
OpenExamSchema.index({ examName: 1, collegeName: 1 });

module.exports = mongoose.model('OpenExam', OpenExamSchema);
