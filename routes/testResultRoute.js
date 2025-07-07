const express = require('express');
const router = express.Router();
const TestResult = require('../models/testResult');

// POST route to save the test result
router.post('/submit-test', async (req, res) => {
  try {
    const {
      userEmail,
      subjectName,
      chapterName,
      questions,
      noOfQuestions,
      timeStarted,
      timeEnded
    } = req.body;

    let correct = 0, wrong = 0, skipped = 0;

    questions.forEach(q => {
      const actual = Buffer.from(q.answer, 'base64').toString(); // decode
      const userAns = (q.userAnswer || '').trim();
      if (!userAns) skipped++;
      else if (userAns === actual.trim()) correct++;
      else wrong++;
    });

    const percentage = (correct / noOfQuestions) * 100;
    const timeTaken = (new Date(timeEnded) - new Date(timeStarted)) / 1000;

    let status = 'attempted';
    if (percentage >= 60) status = 'cleared';
    else status = 'not-qualified';

    const result = new TestResult({
      userEmail,
      subjectName,
      chapterName,
      noOfQuestions,
      questions,
      correctAnswers: correct,
      wrongAnswers: wrong,
      skippedAnswers: skipped,
      percentage: Number(percentage.toFixed(2)),
      status,
      timeStarted,
      timeEnded,
      timeTakenInSeconds: Math.round(timeTaken)
    });

    await result.save();
    res.json({ status: true, message: 'Test submitted successfully', data: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
