const express = require('express');
const router = express.Router();
const Course = require('../models/CourseRegistration');

// Create a new course registration entry
router.post('/register-course', async (req, res) => {
  try {
    const courseData = new Course(req.body);
    await courseData.save();
    res.json({ status:true, message: 'Course registered successfully!', data: courseData });
  } catch (error) {
    res.json({ status:false, message: 'Failed to register course', error: error.message });
  }
});
// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses', error: error.message });
  }
});

router.get('/courses/:courseName', async (req, res) => {
  try {
    const course = await Course.findOne({ courseName: req.params.courseName });
    if (!course) {
      return res.json({status:false, message: 'Course not found' });
    }
    res.json({status:true,message:course});
  } catch (error) {
    res.json({status:false, message: 'Error fetching course', error: error.message });
  }
});


// Update a course by ID
router.put('/courses/:id', async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!updatedCourse) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course updated successfully', data: updatedCourse });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update course', error: error.message });
  }
});

module.exports = router;
