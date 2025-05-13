const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const nodemailer = require('nodemailer');
const Course = require('../models/Course')
const path = require('path');
const fs = require('fs');

async function addCreditsToExistingStudents() {
  try {
    const result = await Student.updateMany(
      { credits: { $exists: false } }, // Only update documents that don't already have the field
      { $set: { credits: 50 } }
    );
    console.log(`Updated ${result.modifiedCount} students.`);
  } catch (err) {
    console.error('Error updating credits:', err);
  }
}

// addCreditsToExistingStudents()

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
    from: `"LeadSoft Placement Academy" <suraj.leadsoft@gmail.com>`,
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
  console.log('heck')
  const { emailAddress, courseName, ...restBasicData } = req.body;

  if (!emailAddress || !courseName) {
    return res.json({ status: false, message: "Email and courseName are required" });
  }

  try {
    let student = await Student.findOne({ "basic.emailAddress": emailAddress });

    if (student) {
      console.log('Student found');

      const existingCourses = student.basic.courseName || [];

      // Check if the course already exists
      const alreadyEnrolled = existingCourses.some(c => c.courseName === courseName);
      if (alreadyEnrolled) {
        return res.json({ status: false, message: "Student already enrolled in this course." });
      }

      // Add new course
      student.basic.courseName.push({ courseName });

      // Update other basic fields if provided
      student.basic.firstName = restBasicData.firstName || student.basic.firstName;
      student.basic.middleName = restBasicData.middleName || student.basic.middleName;
      student.basic.lastName = restBasicData.lastName || student.basic.lastName;
      student.basic.City = restBasicData.City || student.basic.City;
      student.basic.DateOfBirth = restBasicData.DateOfBirth || student.basic.DateOfBirth;
      student.basic.Gender = restBasicData.Gender || student.basic.Gender;
      student.basic.Age = restBasicData.Age || student.basic.Age;
      student.basic.mobileNo = restBasicData.mobileNo || student.basic.mobileNo;

    } else {
      console.log('Creating new student');

      student = new Student({
        basic: {
          firstName: restBasicData.firstName,
          middleName: restBasicData.middleName,
          lastName: restBasicData.lastName,
          emailAddress,
          Gender: restBasicData.Gender,
          DateOfBirth: restBasicData.DateOfBirth,
          Age: restBasicData.Age,
          City: restBasicData.City,
          mobileNo: restBasicData.mobileNo,
          courseName: [{ courseName }],
          registrationDate: new Date()
        },
        credits: 50 // default value
      });
    }

    await student.save();

    // Fetch course info and send email
    const courseData = await getCourseInfo(courseName);

    const data = {
      studentName: `${restBasicData.firstName} ${restBasicData.middleName || ''} ${restBasicData.lastName}`.trim(),
      courseName,
      studentEmail: emailAddress,
      studentPassword: 'LeadSoft@123',
      loginUrl: 'https://www.courses.leadsoft.academy',
      startDate: new Date(courseData.startDate).toLocaleDateString(),
      instructorName: courseData.instructorName,
      courseDuration: courseData.duration,
      currentYear: new Date().getFullYear(),
      privacyPolicyUrl: restBasicData.privacyPolicyUrl || 'https://leadsoft.academy/privacy',
      termsUrl: restBasicData.termsUrl || 'https://leadsoft.academy/terms',
    };

    await sendEmail(emailAddress, data);

    return res.json({ status: true, message: "Student enrolled/updated successfully." });

  } catch (err) {
    console.error(err);
    return res.json({ status: false, message: err.message });
  }
});

router.get('/student/:id',async(req,res)=>{
  const id = req.params.id
  console.log(id)
  const student = await Student.findById({_id:id})
  if(student){
    res.json({status:true,message:student.basic.courseName})
  } else{
    res.json({status:false,message:'Student not enrolled !!'})
  }
})

// Add or update basic details
router.post('/student/basic1', async (req, res) => {
  const { emailAddress, ...basicData } = req.body;

  if (!emailAddress) return res.status(400).json({ message: "Email is required" });

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { "basic": { ...basicData, emailAddress } } },
      { upsert: true, new: true }
    );
    
    res.json({status:true,message:'Updated !!',data:student});
  } catch (err) {
    res.json({status:false, message: err.message });
  }
});

// Add or update academic details
router.post('/student/academic', async (req, res) => {
  const { emailAddress, academic } = req.body;
  if (!emailAddress || !academic) {
    return res.json({status:false, message: "Email and academic details are required" });
  }

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { academic } },
      { new: true }
    );
    res.json({status:true,message:'Academic details updated !!',data:student});
  } catch (err) {
    res.json({status:false, message: err.message });
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
    res.json({status:true,message:'Certificate details updated !!',data:student});
  } catch (err) {
    res.json({status:false, message: err.message });
  }
});

// Add or update parent details
router.post('/student/parent', async (req, res) => {
  const { emailAddress, parent } = req.body;
  if (!emailAddress || !parent) {
    return res.json({status:false, message: "Email and parent details are required" });
  }

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { parent } },
      { new: true }
    );
    res.json({status:true,message:'Parent details updated !!',data:student});
  } catch (err) {
    res.json({status:false, message: err.message });
  }
});

// Add or update social profiles
router.post('/student/social', async (req, res) => {
  const { emailAddress, social } = req.body;
  if (!emailAddress || !social) {
    return res.json({status:false,message: "Email and social links are required" });
  }

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { social } },
      { new: true }
    );
    res.json({status:true,messae:'Social details updated !!',data:student});
  } catch (err) {
    res.json({status:false, message: err.message });
  }
});
router.post('/login', async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    return res.status(400).json({
      status: false,
      message: 'Email and password are required'
    });
  }

  try {
    const student = await Student.findOne({ 'basic.emailAddress': userName });

    if (!student) {
      return res.json({
        status: false,
        message: 'Invalid username !!'
      });
    }

    if (student.basic.password !== password) {
      return res.json({
        status: false,
        message: 'Invalid password !!'
      });
    }

    return res.json({
      status: true,
      message: 'Login successful',
      data: {
        studentId: student._id,
        name: `${student.basic.firstName}`,
        course: student.basic.courseName
      }
    });
  } catch (error) {
    return res.json({
      status: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/student-get', async (req, res) => {  
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/student/get/:email', async (req, res) => {
  const email = req.params.email;

  if (!email) {
    return res.json({
      status: false,
      message: "Email is required",
    });
  }

  try {
    const student = await Student.findOne({ 'basic.emailAddress': email });

    if (!student) {
      return res.json({
        status: false,
        message: "Student not found",
      });
    }

    return res.json({
      status: true,
      message: "Student fetched successfully",
      data: student,
    });
  } catch (err) {
    return res.json({
      status: false,
      message: "Internal Server error",
      error: err.message,
    });
  }
});

module.exports = router;
