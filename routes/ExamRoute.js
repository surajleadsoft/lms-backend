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
    // Step 1: Fetch exam details
    const exam = await Exam.findOne({ examName, category });
    if (!exam || !exam.sections) {
      return res.status(404).json({ status: false, message: 'Exam not found or sections missing' });
    }

    const fullSections = [];

    // Step 2: Populate questions per section
    for (const section of exam.sections) {
      const { subjectName, chapterName, noOfquestions } = section;

      const questions = await Question.aggregate([
        {
          $match: { subjectName, chapterName }
        },
        {
          $sample: { size: parseInt(noOfquestions) }
        }
      ]);

      const formattedQuestions = questions.map(q => ({
        ...q,
        answer: q.answer ? Buffer.from(q.answer.toString()).toString('base64') : '',
        userAnswer: '',
      }));

      fullSections.push({
        sectionName: section.sectionName,
        duration: section.duration,
        noOfquestions: section.noOfquestions,
        totalMarks: section.totalMarks,
        questions: formattedQuestions,
      });
    }

    // Step 3: Compose final exam object
    const totalQuestions = fullSections.reduce((sum, s) => sum + s.noOfquestions, 0);
    const totalDuration = fullSections.reduce((sum, s) => sum + s.duration, 0);
    const sectionNames = fullSections.map(s => s.sectionName).join(', ');

    const finalExamObj = {
      examName,
      category,
      totalQuestions,
      totalDuration,
      qualificationCriteria: exam.qualificationCriteria, // ✅ Added here
      sectionNames,
      sections: fullSections,
    };

    return res.json({ status: true, data: finalExamObj });

  } catch (error) {
    console.error('Error fetching full exam:', error);
    return res.status(500).json({ status: false, error: 'Internal Server Error' });
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

    res.json({
      status: true,
      data: exams
    });
  } catch (error) {
    console.error('Error fetching exam records with attempts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.json({ status: false, message: 'Error fetching exam', error: error.message });
  }
});
// Get exam by ID
router.get('/exam/by-exam-name/:examName/:category', async (req, res) => {
  try {
    const examName = req.params.examName
    const category = req.params.category
    const exam = await Exam.find({examName,category});
    if (!exam) {
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
    const { email } = req.query; // Get email from query parameter

    const exams = await Exam.find({ category });

    if (!exams || exams.length === 0) {
      return res.json({ status: false, message: 'No exams found for this category' });
    }

    // For each exam, check if the email has attempted it
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
