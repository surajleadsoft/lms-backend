const express = require('express');
const router = express.Router();
const CourseContent = require('../models/courseContentSchema');

// Utility: Get next serial number for a course/module
const getNextSerialNo = async (courseName) => {
  const count = await CourseContent.countDocuments({ courseName });
  return count + 1;
};

// Add a course video
router.post('/add-video', async (req, res) => {
  try {
    const { courseName, moduleName, videoTitle, videoURL, description } = req.body;

    const serialNo = await getNextSerialNo(courseName);

    const newVideo = new CourseContent({
      courseName,
      moduleName,
      serialNo,
      contentType: 'video',
      videoTitle,
      videoURL,
      description
    });

    await newVideo.save();
    res.json({ status: true, message: 'Video content added successfully' });
  } catch (err) {
    res.json({ status: false, message: 'Error adding video: ' + err.message });
  }
});

// Add a course exam
router.post('/add-exam', async (req, res) => {
  try {
    const { courseName, moduleName, examTitle, description } = req.body;

    const serialNo = await getNextSerialNo(courseName, moduleName);

    const newExam = new CourseContent({
      courseName,
      moduleName,
      serialNo,
      contentType: 'exam',
      examTitle,
      description
    });

    await newExam.save();
    res.json({ status: true, message: 'Exam content added successfully' });
  } catch (err) {
    res.json({ status: false, message: 'Error adding exam: ' + err.message });
  }
});

// Get all course content (video + exam)
router.get('/all', async (req, res) => {
  try {
    const content = await CourseContent.find().sort({ createdDate: -1 });
    res.json({ status: true, message: 'Course content retrieved', data: content });
  } catch (err) {
    res.json({ status: false, message: 'Error retrieving content: ' + err.message });
  }
});

// Optional: Get next serial number by course and module
router.get('/next-serial/:courseName', async (req, res) => {
  try {
    const courseName = req.params.courseName;
    const serialNo = await getNextSerialNo(courseName);
    res.json({ status: true, message: 'Next serial number retrieved', serialNo });
  } catch (err) {
    res.json({ status: false, message: 'Error fetching serial number: ' + err.message });
  }
});

module.exports = router;
