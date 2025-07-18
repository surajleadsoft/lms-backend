const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student')

// POST: Insert new course
router.post('/insert', async (req, res) => {
  try {
    const { courseName,courseFees,startDate,instructorName,duration } = req.body;
    const course = new Course({ courseName,courseFees,startDate,instructorName,duration });
    await course.save();
    res.status(201).json({ success: true, message: 'Course inserted', data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/get', async (req, res) => {
    try {      
      const courses = await Course.find();
      res.status(201).json({ success: true, data: courses });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
});

router.get('/get/:courseName', async (req, res) => {
  try {      
    const courseName = req.params.courseName 
    const courses = await Course.find({courseName});
    res.status(201).json({ success: true, data: courses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/courses-with-count', async (req, res) => {
  try {
    const courses = await Course.find();
    const courseData = await Promise.all(
      courses.map(async (course) => {
        const count = await Student.countDocuments({
          'basic.courseName.courseName': course.courseName,
          'basic.isActive':true
        });

        return {
          courseName: course.courseName,
          courseFees: course.courseFees,
          instructorName: course.instructorName,
          SrNo: course.SrNo,
          studentCount: count,
          updatedAt: course.updatedAt
        };
      })
    );
    // const courseData = await Promise.all(
    //   courses.map(async (course) => {
    //     const count = await Student.countDocuments({ 'basic.courseName': course.courseName });
    //     return {
    //       courseName: course.courseName,
    //       instructorName:course.instructorName,
    //       SrNo: course.SrNo,
    //       studentCount: count,
    //       updatedAt:course.updatedAt
    //     };
    //   })
    // );

    res.json({ success: true, data: courseData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/courses-with-count/:courseName', async (req, res) => {
  try {
    const courseNameParam = req.params.courseName;

    // Assuming Course is a model for another schema with course details
    const courses = await Course.find({ courseName: courseNameParam });

    const courseData = await Promise.all(
      courses.map(async (course) => {
        const count = await Student.countDocuments({
          'basic.courseName.courseName': course.courseName,
          'basic.isActive':true
        });

        return {
          courseName: course.courseName,
          courseFees: course.courseFees,
          instructorName: course.instructorName,
          SrNo: course.SrNo,
          studentCount: count,
          updatedAt: course.updatedAt
        };
      })
    );

    res.json({ success: true, data: courseData });
  } catch (error) {
    res.json({ success: false, message: error.message });
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
