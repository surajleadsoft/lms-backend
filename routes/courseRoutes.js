const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// POST: Insert new course
router.post('/insert', async (req, res) => {
  try {
    const { courseName } = req.body;
    const course = new Course({ courseName });
    await course.save();
    res.status(201).json({ success: true, message: 'Course inserted', data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/get', async (req, res) => {
    try {      
      const courses = Course.find();
      res.status(201).json({ success: true, data: courses });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

// PUT: Update course name by SrNo
router.put('/update/:srNo', async (req, res) => {
  try {
    const { srNo } = req.params;
    const { courseName } = req.body;

    const updated = await Course.findOneAndUpdate(
      { SrNo: srNo },
      { courseName },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, message: 'Course updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
