const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const nodemailer = require('nodemailer');
const Course = require('../models/Course')
const path = require('path');
const fs = require('fs');
const Payment = require('../models/payments'); // adjust the path as needed


async function addCreditsToExistingStudents() {
  try {
    const result = await Student.updateMany(
      { credits: { $exists: false } }, // Only update documents that don't already have the field
      { $set: { credits: 50 } }
    );
  } catch (err) {
    console.error('Error updating credits:', err);
  }
}

// addCreditsToExistingStudents()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'suraj.leadsoft@gmail.com',
    pass: 'kwas sayn cjrn usla',
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
    .replace(/{{loginUrl}}/g, 'https://courses.leadsoft.academy')
    .replace(/{{startDate}}/g, data.startDate)
    .replace(/{{instructorName}}/g, data.instructorName)
    .replace(/{{courseDuration}}/g, data.courseDuration)
    .replace(/{{privacyPolicyUrl}}/g, 'https://courses.leadsoft.academy/privacy')
    .replace(/{{termsUrl}}/g, 'https://courses.leadsoft.academy/terms')
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
  const courseName = req.params.courseName;

  if (!courseName) {
    return res.json({ status: false, error: 'courseName is required' });
  }

  try {
    const students = await Student.aggregate([
      {
        $match: {
          'basic.courseName.courseName': courseName
        }
      },
      {
        $addFields: {
          email: '$basic.emailAddress'
        }
      },
      {
        $lookup: {
          from: 'payments',
          let: { studentEmail: '$basic.emailAddress' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$emailAddress', '$$studentEmail'] },
                    { $eq: ['$paymentCourse', courseName] },
                    { $eq: ['$status', 'Approved'] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalPaid: { $sum: '$amountToPay' }
              }
            }
          ],
          as: 'paymentInfo'
        }
      },
      {
        $addFields: {
          totalPaid: {
            $ifNull: [{ $arrayElemAt: ['$paymentInfo.totalPaid', 0] }, 0]
          }
        }
      },
      {
        $project: {
          basic: 1,
          parent: 1,
          academic: 1,
          certification: 1,
          social: 1,
          credits: 1,
          totalPaid: 1
        }
      }
    ]);

    return res.json({ status: true, details: students });
  } catch (error) {
    console.error(error);
    return res.json({ status: false, error: 'Internal Server Error', details: error.message });
  }
});
router.post('/update-password', async (req, res) => {
  const { emailAddress, newPassword } = req.body;

  if (!emailAddress || !newPassword) {
    return res.json({ status:false, message: 'Email and new password are required.' });
  }

  try {
    const student = await Student.findOneAndUpdate(
      { "basic.emailAddress": emailAddress },
      { $set: { "basic.password": newPassword } },
      { new: true }
    );

    if (!student) {
      return res.json({ status:false, message: 'Student not found with that email.' });
    }

    res.json({status:true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.json({status:false, message: 'Internal server error.' });
  }
});

const loadTemplate1 = () => {
  const filePath = path.join(__dirname, '../templates', 'passwordOTP.html');
  return fs.readFileSync(filePath, 'utf-8');
};

const populateTemplate2 = (template, data) => {
  return template
    .replace(/{{userName}}/g, data.emailAddress)
    .replace(/{{otpCode}}/g, data.otpCode)
    .replace(/{{resetUrl}}/g, `https://courses.leadsoft.academy/forgot-password?status=verify&username=${data.emailAddress}`)    
    .replace(/{{privacyPolicyUrl}}/g, 'https://courses.leadsoft.academy/privacy-policy')
    .replace(/{{termsUrl}}/g, 'https://courses.leadsoft.academy/terms')
    .replace(/{{currentYear}}/g, new Date().getFullYear());
};

const sendEmail2 = async (toEmail, data) => {  
  const rawTemplate = loadTemplate1();
  const html = populateTemplate2(rawTemplate, data);

  const mailOptions = {
    from: `"LeadSoft Placement Academy" <suraj.leadsoft@gmail.com>`,
    to: toEmail,
    subject: 'LeadSoft Placement Academy - OTP Verification For Forgot Your Password.',
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

router.patch('/student/add-credits', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.json({status:false, error: 'Email is required' });
    }

    // Find student by email and increment credits by 5
    const updatedStudent = await Student.findOneAndUpdate(
      { "basic.emailAddress": email },
      { $inc: { credits: 5 } },
      { new: true } // return updated document
    );

    if (!updatedStudent) {
      return res.json({ error: 'Student not found' });
    }

    return res.json({
      message: 'Credits updated successfully',
      credits: updatedStudent.credits,
      student: updatedStudent,
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/student/decrement-credits', async (req, res) => {
  try {
    const { email, amount } = req.body;

    if (!email || typeof amount !== 'number') {
      return res.json({status:false, message: 'Email and numeric amount are required' });
    }

    // Find the student
    const student = await Student.findOne({ "basic.emailAddress": email });

    if (!student) {
      return res.json({status:false, message: 'Student not found' });
    }

    // Check if credits are sufficient
    if (student.credits < amount) {
      return res.json({status:false,message: 'Insufficient credits' });
    }

    // Perform the decrement
    const updatedStudent = await Student.findOneAndUpdate(
      { "basic.emailAddress": email },
      { $inc: { credits: -amount } },
      { new: true }
    );

    return res.json({
      status:true,
      message: `Credits decremented by ${amount}`,
      credits: updatedStudent.credits,
      student: updatedStudent,
    });
  } catch (error) {
    console.error('Error decrementing credits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/student/increment-credits', async (req, res) => {
  try {
    const { email, amount } = req.body;

    if (!email || typeof amount !== 'number') {
      return res.json({ status: false, message: 'Email and numeric amount are required' });
    }

    // Find the student
    const student = await Student.findOne({ "basic.emailAddress": email });

    if (!student) {
      return res.json({ status: false, message: 'Student not found' });
    }

    // Perform the increment
    const updatedStudent = await Student.findOneAndUpdate(
      { "basic.emailAddress": email },
      { $inc: { credits: amount } },
      { new: true }
    );

    return res.json({
      status: true,
      message: `Credits incremented by ${amount}`,
      credits: updatedStudent.credits,
      student: updatedStudent,
    });

  } catch (error) {
    console.error('Error incrementing credits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



router.post('/send-otp',async (req,res)=>{
  const {emailAddress,otp} = req.body
  const mailData={
    emailAddress:emailAddress,
    otpCode:otp
  }
  let status = await sendEmail2(emailAddress,mailData)
  if(status){
    res.json({status:true,message:'OTP sent successfully !!'})
  } else{
    res.json({status:false,message:'Failed to send OTP'})
  }
})

// Add or update basic details
router.post('/student/basic', async (req, res) => {
  const { emailAddress, courseName, ...restBasicData } = req.body;

  if (!emailAddress || !courseName) {
    return res.json({ status: false, message: "Email and courseName are required" });
  }

  try {
    let student = await Student.findOne({ "basic.emailAddress": emailAddress });

    if (student) {
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

router.get('/student-id/:id',async(req,res)=>{
  const id = req.params.id
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
        fullName: `${student.basic.firstName} ${student.basic.lastName}`,
        course: student.basic.courseName,
        mobileNo:student.basic.mobileNo
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
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 10;
    const skip = (page - 1) * limit;

    const students = await Student.find()
      .sort({ 'basic.registrationDate': -1 })
      .skip(skip)
      .limit(limit);

    const totalStudents = await Student.countDocuments();
    const totalPages = Math.ceil(totalStudents / limit);

    res.json({
      status: true,
      currentPage: page,
      totalPages,
      totalStudents,
      data: students
    });
  } catch (err) {
    console.error(err);
    res.json({ status: false, message: err.message });
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
