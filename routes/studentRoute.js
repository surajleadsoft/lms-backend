const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const nodemailer = require('nodemailer');
const Course = require('../models/Course')
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'suraj.leadsoft@gmail.com',
    pass: 'dqfs agxa orro zsjo',
  },
});

// Handlebars template engine setup
transporter.use('compile', hbs({
  viewEngine: {
    partialsDir: path.resolve('../templates'),
    defaultLayout: false,
  },
  viewPath: path.resolve('../templates/'),
  extName: '.handlebars',
}));

const sendEmail = async (toEmail, data) => {
  const mailOptions = {
    from: '"LeadSoft Placement Academy" <no-reply@leadsoft.academy>',
    to: toEmail,
    subject: 'Course Registration Confirmation',
    template: 'register',
    context: {
      studentName: data.studentName,
      courseName: data.courseName,
      studentEmail: data.studentEmail,
      studentPassword: data.studentPassword,
      loginUrl: data.loginUrl,
      startDate: data.startDate,
      instructorName: data.instructorName,
      courseDuration: data.courseDuration,
      currentYear: new Date().getFullYear(),
      privacyPolicyUrl: data.privacyPolicyUrl || 'https://yourdomain.com/privacy',
      termsUrl: data.termsUrl || 'https://yourdomain.com/terms',
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true
    
  } catch (err) {
    console.error('Error sending email:', err);
    return false
    
  }
};
const getCourseInfo =async(courseName) => {
  try {      
    const courseName = courseName 
    const courses = await Course.find({courseName});
    return courses[0];
  } catch (error) {
    return null;
  }
}
// Add or update basic details
router.post('/student/basic', async (req, res) => {
  const { emailAddress, ...basicData } = req.body;

  if (!emailAddress) return res.status(400).json({ message: "Email is required" });

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { "basic": { ...basicData, emailAddress } } },
      { upsert: true, new: true }
    );
    const courseData =await getCourseInfo(basicData.courseName)
    const data={
      studentName: `${basicData.firstName} ${basicData.middleName} ${basicData.lastName}`,
      courseName: basicData.courseName,
      studentEmail: basicData.emailAddress,
      studentPassword: 'LeadSoft@123',
      loginUrl: 'https://www.courses.leadsoft.academy',
      startDate: courseData.startDate,
      instructorName: courseData.instructorName,
      courseDuration: courseData.courseDuration,
      currentYear: new Date().getFullYear(),
      privacyPolicyUrl: basicData.privacyPolicyUrl || 'https://yourdomain.com/privacy',
      termsUrl: basicData.termsUrl || 'https://yourdomain.com/terms',
    }
    console.log(await sendEmail(basicData.emailAddress,data))
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add or update academic details
router.post('/student/academic', async (req, res) => {
  const { emailAddress, academic } = req.body;
  if (!emailAddress || !academic) {
    return res.status(400).json({ message: "Email and academic details are required" });
  }

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { academic } },
      { new: true }
    );
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add or update certification details
router.post('/student/certification', async (req, res) => {
  const { emailAddress, certification } = req.body;
  if (!emailAddress || !certification) {
    return res.status(400).json({ message: "Email and certification are required" });
  }

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { certification } },
      { new: true }
    );
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add or update parent details
router.post('/student/parent', async (req, res) => {
  const { emailAddress, parent } = req.body;
  if (!emailAddress || !parent) {
    return res.status(400).json({ message: "Email and parent details are required" });
  }

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { parent } },
      { new: true }
    );
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add or update social profiles
router.post('/student/social', async (req, res) => {
  const { emailAddress, social } = req.body;
  if (!emailAddress || !social) {
    return res.status(400).json({ message: "Email and social links are required" });
  }

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { social } },
      { new: true }
    );
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/student/get', async (req, res) => {
  
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
