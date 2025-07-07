const express = require('express');
const router = express.Router();
const Exam = require('../models/Exams');
const ExamSection = require('../models/examSection');
const Question = require('../models/Question')

// Create (Insert) Exam
router.post('/exam', async (req, res) => {
  try {
    const exam = new Exam(req.body);
    await exam.save();
    res.json({ status: true, message: 'Exam created successfully', data: exam });
  } catch (error) {
    res.json({ status: false, message: 'Error creating exam', error: error.message });
  }
});

// exam.controller.js or routes.js
router.get('/exam/full/:examName/:category', async (req, res) => {
  const { examName, category } = req.params;

  try {
    const exam = await Exam.findOne({ examName, category });
    if (!exam || !Array.isArray(exam.sections)) {
      return res.json({ status: false, message: 'Exam not found or sections missing' });
    }

    const fullSections = [];

    for (const section of exam.sections) {
      const { sectionName, duration, totalMarks, chapters } = section;

      if (!sectionName || !Array.isArray(chapters)) {
        console.warn(`⚠️ Skipping section due to invalid structure:`, section);
        continue;
      }

      let sectionQuestions = [];
      let sectionTotalQuestions = 0;

      for (const chapter of chapters) {
        const { subjectName, chapterName, noOfquestions } = chapter;

        if (!subjectName || !chapterName || !noOfquestions || isNaN(noOfquestions)) {
          console.warn(`⚠️ Invalid chapter in section "${sectionName}":`, chapter);
          continue;
        }

        const sampleSize = parseInt(noOfquestions);

        const questions = await Question.aggregate([
          { $match: { subjectName, chapterName } },
          { $sample: { size: sampleSize } }
        ]);

        const formattedQuestions = questions.map(q => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
          difficultyLevel: q.difficultyLevel,
          companyTags: q.companyTags,
          answer: q.answer ? Buffer.from(q.answer.toString()).toString('base64') : '',
          userAnswer: ''
        }));

        sectionQuestions.push(...formattedQuestions);
        sectionTotalQuestions += formattedQuestions.length;
      }

      fullSections.push({
        sectionName,
        duration,
        totalMarks,
        totalQuestions: sectionTotalQuestions,
        questions: sectionQuestions
      });
    }

    const totalQuestions = fullSections.reduce((sum, sec) => {
      return sum + (typeof sec.totalQuestions === 'number' ? sec.totalQuestions : 0);
    }, 0);

    const totalDuration = fullSections.reduce((sum, sec) => {
      return sum + (typeof sec.duration === 'number' ? sec.duration : 0);
    }, 0);

    const sectionNames = fullSections.map(sec => sec.sectionName).join(', ');

    const finalExamObj = {
      examName,
      category,
      qualificationCriteria: exam.qualificationCriteria,
      sectionNames,
      totalQuestions,
      totalDuration,
      sections: fullSections
    };

    return res.json({ status: true, data: finalExamObj });
  } catch (error) {
    console.error('❌ Error fetching full exam:', error);
    return res.json({ status: false, error: 'Internal Server Error' });
  }
});

// Get all exams
router.get('/exam', async (req, res) => {
  try {
    const exams = await Exam.aggregate([
      {
        $lookup: {
          from: 'examsections',
          localField: 'examName',
          foreignField: 'examName',
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
          'attempts': 0
        }
      }
    ]);

    res.json({ status: true, data: exams });
  } catch (error) {
    console.error('Error fetching exam records with attempts:', error);
    res.json({ status: false, message: 'Server error' });
  }
});

// Get exam by ID
router.get('/exam/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.json({ status: false, message: 'Exam not found' });
    }
    res.json({ status: true, message: 'Exam fetched successfully', data: exam });
  } catch (error) {
    res.json({ status: false, message: 'Error fetching exam', error: error.message });
  }
});

router.delete('/exam/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.json({ status: false, message: 'Exam not found' });
    }
    res.json({ status: true, message: 'Exam deleted successfully', data: exam });
  } catch (error) {
    res.json({ status: false, message: 'Error deleting exam', error: error.message });
  }
});

router.get('/exam/by-exam-name/:examName/:category', async (req, res) => {
  try {
    const examName = req.params.examName;
    const category = req.params.category;
    const exam = await Exam.find({ examName, category });
    if (!exam || exam.length === 0) {
      return res.json({ status: false, message: 'Exam not found' });
    }
    res.json({ status: true, message: 'Exam fetched successfully', data: exam[0] });
  } catch (error) {
    res.json({ status: false, message: 'Error fetching exam', error: error.message });
  }
});

router.get('/by-category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const { email } = req.query;

    const exams = await Exam.find({ category });
    if (!exams || exams.length === 0) {
      return res.json({ status: false, message: 'No exams found for this category' });
    }

    const examsWithAttemptStatus = await Promise.all(
      exams.map(async (exam) => {
        const isAttempted = await ExamSection.exists({
          emailAddress: email,
          examName: exam.examName
        });
        return {
          ...exam._doc,
          attempted: !!isAttempted
        };
      })
    );

    res.json({
      status: true,
      message: 'Exams fetched successfully',
      data: examsWithAttemptStatus
    });
  } catch (error) {
    res.json({
      status: false,
      message: 'Error fetching exams',
      error: error.message
    });
  }
});

module.exports = router;
