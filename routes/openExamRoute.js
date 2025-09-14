const express = require('express');
const router = express.Router();
const OpenExam = require('../models/OpenExam');
const ExamSection = require('../models/examSection');
const Question = require('../models/Question')
// ✅ Create (Insert) Open Exam
router.post('/open-exam', async (req, res) => {
  try {
    const exam = new OpenExam(req.body);
    await exam.save();

    res.json({
      status: true,
      message: 'Open Exam created successfully',
      data: {
        examId: exam.examId,   // 👈 unique 5-char id
        examName: exam.examName,
        collegeName: exam.collegeName,
        duration: exam.duration,
        totalQuestions: exam.totalQuestions,
        totalMarks: exam.totalMarks
      }
    });
  } catch (error) {
    let errMsg = error.message;
    if (error.code === 11000) {
      if (error.keyValue.examId) errMsg = 'examId must be unique (collision occurred)';
      if (error.keyValue.category) errMsg = 'Category must be unique (already exists)';
    }
    res.json({ status: false, message: 'Error creating open exam', error: errMsg });
  }
});

// ✅ Get all open exams (with attempt count)
router.get('/open-exam', async (req, res) => {
  try {
    const exams = await OpenExam.aggregate([
      {
        $lookup: {
          from: 'examsections',
          localField: 'examId',   // use examId now
          foreignField: 'examId',
          as: 'attempts'
        }
      },
      {
        $addFields: {
          attemptedStudentsCount: { $size: '$attempts' }
        }
      },
      {
        $project: {
          __v: 0,
          attempts: 0
        }
      }
    ]);

    res.json({ status: true, data: exams });
  } catch (error) {
    console.error('Error fetching open exam records with attempts:', error);
    res.json({ status: false, message: 'Server error' });
  }
});
router.get('/open-exam/full/:examId', async (req, res) => {
  const { examId } = req.params;

  try {
    // Fetch exam by examId
    
    const exam = await OpenExam.findOne({ examId }).lean();
    if (!exam || !Array.isArray(exam.sections)) {
      return res.json({ status: false, message: 'Invalid exam id !!' });
    }

    // Collect promises for all chapter queries
    const allChapterPromises = [];
    exam.sections.forEach(section => {
      if (Array.isArray(section.chapters)) {
        section.chapters.forEach(chapter => {
          const { subjectName, chapterName, noOfquestions } = chapter;
          if (subjectName && chapterName && noOfquestions && !isNaN(noOfquestions)) {
            const sampleSize = parseInt(noOfquestions);

            // Aggregate query per chapter
            const chapterPromise = Question.aggregate([
              { $match: { subjectName, chapterName } },
              { $sample: { size: sampleSize } }
            ]).then(questions => ({
              sectionName: section.sectionName,
              subjectName,
              chapterName,
              questions
            }));

            allChapterPromises.push(chapterPromise);
          }
        });
      }
    });

    // Execute queries concurrently
    const chapterResults = await Promise.all(allChapterPromises);

    // Prepare section data efficiently
    const sectionData = new Map();
    exam.sections.forEach(sec => {
      sectionData.set(sec.sectionName, {
        sectionName: sec.sectionName,
        duration: sec.duration,
        totalMarks: sec.totalMarks,
        totalQuestions: 0,
        questions: []
      });
    });

    // Populate questions into sections
    for (const result of chapterResults) {
      const section = sectionData.get(result.sectionName);
      if (!section) continue;

      result.questions.forEach(q => {
        section.questions.push({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
          difficultyLevel: q.difficultyLevel,
          companyTags: q.companyTags,
          // Encode answer safely in base64
          answer: q.answer ? Buffer.from(String(q.answer)).toString('base64') : '',
          userAnswer: ''
        });
        section.totalQuestions++;
      });
    }

    // Build finalSections
    const finalSections = Array.from(sectionData.values());

    // Calculate totals
    const totalQuestions = finalSections.reduce((sum, sec) => sum + sec.totalQuestions, 0);
    const totalDuration = exam.duration;
    const sectionNames = finalSections.map(sec => sec.sectionName).join(', ');

    // Final exam object
    const finalExamObj = {
      examId: exam.examId,
      examName: exam.examName,
      collegeName: exam.collegeName,
      qualificationCriteria: exam.qualificationCriteria,
      sectionNames,
      totalQuestions,
      totalDuration,
      sections: finalSections
    };

    return res.json({ status: true, data: finalExamObj });
  } catch (error) {
    console.error('❌ Error fetching full exam:', error);
    return res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
});
// ✅ Get single open exam by examId
router.get('/open-exam/by-exam-id/:examId', async (req, res) => {
  try {
    const exam = await OpenExam.findOne({ examId: req.params.examId.toLowerCase() });
    if (!exam) {
      return res.json({ status: false, message: 'Open Exam not found' });
    }
    res.json({ status: true, message: 'Open Exam fetched successfully', data: exam });
  } catch (error) {
    res.json({ status: false, message: 'Error fetching open exam', error: error.message });
  }
});

// ✅ Delete open exam by examId
router.delete('/open-exam/by-exam-id/:examId', async (req, res) => {
  try {
    const exam = await OpenExam.findOneAndDelete({ examId: req.params.examId.toLowerCase() });
    if (!exam) {
      return res.json({ status: false, message: 'Open Exam not found' });
    }
    res.json({ status: true, message: 'Open Exam deleted successfully', data: exam });
  } catch (error) {
    res.json({ status: false, message: 'Error deleting open exam', error: error.message });
  }
});

// ✅ Get exams by examId + attempt status
router.get('/open-exam/status/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const { email } = req.query;

    const exam = await OpenExam.findOne({ examId: examId.toLowerCase() });
    if (!exam) {
      return res.json({ status: false, message: 'Exam not found' });
    }

    const isAttempted = await ExamSection.exists({
      emailAddress: email,
      examId: examId.toLowerCase()
    });

    res.json({
      status: true,
      message: 'Exam status fetched successfully',
      data: {
        ...exam._doc,
        attempted: !!isAttempted
      }
    });
  } catch (error) {
    res.json({
      status: false,
      message: 'Error fetching exam status',
      error: error.message
    });
  }
});

module.exports = router;
