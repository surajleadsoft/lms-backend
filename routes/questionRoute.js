const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// INSERT a question
router.post('/', async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.json({ status: true, message: 'Question added successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ status: false, message: 'Duplicate question for this subject and chapter' });
    }
    res.json({ status: false, message: 'Server error: ' + err.message });
  }
});

// GET all questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find();
    res.json({ status: true, message: 'All questions fetched', data: questions });
  } catch (err) {
    res.json({ status: false, message: 'Server error: ' + err.message });
  }
});

// GET by subject
router.get('/subject/:subjectName', async (req, res) => {
  try {
    const questions = await Question.find({ subjectName: req.params.subjectName });
    res.json({ status: true, message: 'Questions by subject fetched', data: questions });
  } catch (err) {
    res.json({ status: false, message: 'Server error: ' + err.message });
  }
});

router.post('/random', async (req, res) => {
  const { subjectName, chapterName, noOfquestions } = req.body;

  if (!subjectName || !chapterName || !noOfquestions) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const questions = await Question.aggregate([
      {
        $match: {
          subjectName: subjectName,
          chapterName: chapterName,
        },
      },
      {
        $sample: { size: parseInt(noOfquestions) },
      },
    ]);

    res.json({status:true,data:questions });
  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.json({ status:false,error: 'Internal Server Error' });
  }
});

// GET by subject and chapter
router.get('/subject/:subjectName/chapter/:chapterName', async (req, res) => {
  try {
    const questions = await Question.find({
      subjectName: req.params.subjectName,
      chapterName: req.params.chapterName,
    });
    res.json({ status: true, message: 'Questions by subject and chapter fetched', data: questions });
  } catch (err) {
    res.json({ status: false, message: 'Server error: ' + err.message });
  }
});

// GET by subjectName, chapterName, and difficultyLevel
router.get('/subject/:subjectName/chapter/:chapterName/level/:difficultyLevel', async (req, res) => {
  try {
    const { subjectName, chapterName, difficultyLevel } = req.params;

    const questions = await Question.find({
      subjectName,
      chapterName,
      difficultyLevel,
    });

    res.json({
      status: true,
      message: 'Filtered questions fetched successfully',
      data: questions,
    });
  } catch (err) {
    res.json({
      status: false,
      message: 'Server error: ' + err.message,
    });
  }
});


module.exports = router;
