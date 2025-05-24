const express = require('express');
const router = express.Router();
const Exam = require('../models/Exams');
const ExamSection = require('../models/examSection');

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
