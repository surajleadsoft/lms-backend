const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const nodemailer = require('nodemailer');
const Course = require('../models/Course')
const path = require('path');
const fs = require('fs');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'suraj.leadsoft@gmail.com',
    pass: 'dqfs agxa orro zsjo',
  },
});

const loadTemplate = () => {
  const filePath = path.join(__dirname, '../templates', 'register.html');
  return fs.readFileSync(filePath, 'utf-8');
};

const populateTemplate1 = (template, data) => {
  return template
    .replace(/{{studentName}}/g, data.studentName)
    .replace(/{{courseName}}/g, data.courseName)
    .replace(/{{studentEmail}}/g, data.studentEmail)
    .replace(/{{studentPassword}}/g, data.studentPassword)
    .replace(/{{loginUrl}}/g, 'https://www.courses.leadsoft.academy')
    .replace(/{{startDate}}/g, data.startDate)
    .replace(/{{instructorName}}/g, data.instructorName)
    .replace(/{{courseDuration}}/g, data.courseDuration)
    .replace(/{{privacyPolicyUrl}}/g, 'https://www.courses.leadsoft.academy')
    .replace(/{{termsUrl}}/g, 'https://www.courses.leadsoft.academy')
    .replace(/{{currentYear}}/g, new Date().getFullYear());
};

const sendEmail = async (toEmail, data) => {
  
  const rawTemplate = loadTemplate();
  const html = populateTemplate1(rawTemplate, data);

  const mailOptions = {
    from: `"LeadSoft Placement Academy" <no-reply>@leadsoft.academy>`,
    to: toEmail,
    subject: '🚀 LeadSoft Placement Academy - Course Registration Confirmation 🎯',
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
const getCourseInfo =async(courseName) => {
  try {      
    
    const courses = await Course.find({courseName});
    return courses[0];
  } catch (error) {
    return null;
  }
}
router.get('/students/by-course/:courseName', async (req, res) => {
  const  courseName  = req.params.courseName; // Expect courseName as a query parameter

  if (!courseName) {
    return res.status(400).json({ error: 'courseName is required' });
  }

  try {
    const students = await Student.find({ 'basic.courseName': courseName });
    res.json({status:true,details:students});
  } catch (error) {
    res.json({status:false, error: 'Internal Server Error', details: error.message });
  }
})
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
    console.log(courseData)
    const data={
      studentName: `${basicData.firstName} ${basicData.middleName} ${basicData.lastName}`,
      courseName: basicData.courseName,
      studentEmail: emailAddress,
      studentPassword: 'LeadSoft@123',
      loginUrl: 'https://www.courses.leadsoft.academy',
      startDate: new Date(courseData.startDate).toLocaleDateString(),
      instructorName: courseData.instructorName,
      courseDuration: courseData.duration,
      currentYear: new Date().getFullYear(),
      privacyPolicyUrl: basicData.privacyPolicyUrl || 'https://leadsoft.academy/privacy',
      termsUrl: basicData.termsUrl || 'https://leadsoft.academy/terms',
    }
    console.log(await sendEmail(data.studentEmail,data))
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
