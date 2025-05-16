const express = require('express');
const router = express.Router();
const Course = require('../models/CourseRegistration');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'suraj.leadsoft@gmail.com',
    pass: 'dqfs agxa orro zsjo',
  },
});

// Create a new course registration entry
router.post('/register-course', async (req, res) => {
  try {
    
    const courseData = await Course.findOneAndUpdate(
      { courseName: req.body.courseName }, 
      req.body,                            
      { new: true, upsert: true }          
    );    
    res.json({ status: true, message: 'Course registered or updated successfully!', data: courseData });
  } catch (error) {
    console.log(error)
    res.json({ status: false, message: 'Failed to register or update course', error: error.message });
  }
});
const loadTemplate = () => {
  const filePath = path.join(__dirname, '../templates', 'enquiry.html');
  return fs.readFileSync(filePath, 'utf-8');
};
const populateTemplate1 = (template, data) => {
  return template
    .replace(/{{studentName}}/g, data.studentName)
    .replace(/{{courseName}}/g, data.courseName)
    .replace(/{{studentEmail}}/g, data.studentEmail)
    .replace(/{{inductionDate}}/g, data.inductionDate)
    .replace(/{{inductionTime}}/g, data.inductionTime)
    .replace(/{{inductionLink}}/g, data.inductionLink)
    .replace(/{{currentYear}}/g, new Date().getFullYear())
    .replace(/{{privacyPolicyUrl}}/g, 'https://www.courses.leadsoft.academy')
    .replace(/{{termsUrl}}/g, 'https://www.courses.leadsoft.academy')
};

const sendEmail = async (toEmail, data) => {
  
  const rawTemplate = loadTemplate();
  const html = populateTemplate1(rawTemplate, data);

  const mailOptions = {
    from: `"LeadSoft Placement Academy" <suraj.leadsoft@gmail.com>`,
    to: toEmail,
    subject: `🚀 ${data.studentName}, You're All Set to Start ${data.courseName} 🎯`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.response);
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return false
  }
};
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
    console.log(error)
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

router.post('/register-student', async (req, res) => {
  try {
    const {collegeName,courseName,education,emailAddress,fullName,gender,mobileNo} = req.body

    // Find the course by courseName
    const course = await Course.findOne({ courseName });

    if (!course) {
      return res.json({
        status: false,
        message: 'Course not found'
      });
    }

    // Check if the student with this email already exists in this course
    const existingStudent = course.students.find(s => s.emailAddress === req.body.emailAddress);
    if (existingStudent) {
      return res.json({
        status: false,
        message: "You've already registered for this course !!"
      });
    }

    // Add student to the students array
    course.students.push(req.body);
    await course.save();
    const isoString = course.inductionSessionDate;
    const dateObj = new Date(isoString);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const formattedDate = dateObj.toLocaleDateString('en-US', dateOptions);
    const formattedTime = dateObj.toLocaleTimeString('en-US', timeOptions);
    
    const emailData={
      studentName:req.body.fullName,
      courseName:req.body.courseName,
      studentEmail:req.body.emailAddreess,
      inductionDate:formattedDate,
      inductionTime:formattedTime,
      inductionLink:course.inductionSessionLink
    }
    sendEmail(req.body.emailAddress,emailData)
    return res.json({
      status: true,
      message: 'Seat allocated successfully !!'
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      message: 'Internal server error'
    });
  }
});
router.post('/register-email', async (req, res) => {
  try {
    const {courseName,emailAddress,fullName} = req.body
    console.log(courseName,emailAddress,fullName)
    // Find the course by courseName
    const course = await Course.findOne({ courseName });

    if (!course) {
      return res.json({
        status: false,
        message: 'Course not found'
      });
    }
    const isoString = course.inductionSessionDate;
    const dateObj = new Date(isoString);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const formattedDate = dateObj.toLocaleDateString('en-US', dateOptions);
    const formattedTime = dateObj.toLocaleTimeString('en-US', timeOptions);
    
    const emailData={
      studentName:fullName,
      courseName:courseName,
      studentEmail:emailAddress,
      inductionDate:formattedDate,
      inductionTime:formattedTime,
      inductionLink:course.inductionSessionLink
    }
    sendEmail(req.body.emailAddress,emailData)
    return res.json({
      status: true,
      message: 'Mail sent successfully !!'
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      message: 'Internal server error'
    });
  }
});

router.get('/get-classes/:courseName', async (req, res) => {
  try {
    const course = await Course.findOne({ courseName: req.params.courseName });
    if (!course) return res.json({ status: false, message: 'Course not found' });
    res.json({ status: true, message: 'Classes fetched', classes: course.classes });
  } catch (err) {
    res.json({ status: false, message: 'Server error' });
  }
});

// ✅ Add a new class
router.post('/add-class/:courseName', async (req, res) => {
  const { className, startDate, endDate, time, status, sessionLink } = req.body;
  try {
    const course = await Course.findOne({ courseName: req.params.courseName });
    if (!course) return res.json({ status: false, message: 'Course not found' });

    const exists = course.classes.some(c => c.className.toLowerCase().trim() === className.toLowerCase().trim());
    if (exists) return res.json({ status: false, message: 'Class already exists' });

    course.classes.push({ className, startDate, endDate, time, status, sessionLink });
    await course.save();
    res.json({ status: true, message: 'Class added' });
  } catch (err) {
    res.json({ status: false, message: 'Error adding class' });
  }
});

// ✅ Update a class
router.put('/update-class/:courseName/:className', async (req, res) => {
  const { className, startDate, endDate, time, status, sessionLink } = req.body;
  try {
    const course = await Course.findOne({ courseName: req.params.courseName });
    if (!course) return res.json({ status: false, message: 'Course not found' });

    const index = course.classes.findIndex(c => c.className === req.params.className);
    if (index === -1) return res.json({ status: false, message: 'Class not found' });

    course.classes[index] = { className, startDate, endDate, time, status, sessionLink };
    await course.save();
    res.json({ status: true, message: 'Class updated' });
  } catch (err) {
    res.json({ status: false, message: 'Error updating class' });
  }
});

// ✅ Delete a class
router.delete('/delete-class/:courseName/:className', async (req, res) => {
  try {
    const course = await Course.findOne({ courseName: req.params.courseName });
    if (!course) return res.json({ status: false, message: 'Course not found' });

    const before = course.classes.length;
    course.classes = course.classes.filter(c => c.className !== req.params.className);

    if (course.classes.length === before) {
      return res.json({ status: false, message: 'Class not found' });
    }

    await course.save();
    res.json({ status: true, message: 'Class deleted' });
  } catch (err) {
    res.json({ status: false, message: 'Error deleting class' });
  }
});

router.delete('/courses/:courseName/student', async (req, res) => {
  const { courseName } = req.params;
  const { emailAddress } = req.body;

  if (!emailAddress) {
    return res.status(400).json({ status: false, message: 'Email address is required.' });
  }

  try {
    const result = await Course.findOneAndUpdate(
      { courseName },
      { $pull: { students: { emailAddress } } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ status: false, message: 'Course not found or no changes made.' });
    }

    return res.status(200).json({ status: true, message: 'Student deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: 'Internal server error.' });
  }
});

module.exports = router;
