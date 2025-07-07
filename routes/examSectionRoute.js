const express = require('express');
const router = express.Router();
const ExamSection = require('../models/examSection'); // Adjust path as per your folder structure
const Exams = require('../models/Exams'); // path may vary
const Question = require('../models/Question'); 
const Category = require('../models/Categories'); 
const Student = require('../models/Student')

function addTimes(time1, time2) {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  let minutes = m1 + m2;
  let hours = h1 + h2 + Math.floor(minutes / 60);
  minutes %= 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
router.get('/exam-attempted', async (req, res) => {
  const { emailAddress } = req.query;

  if (!emailAddress) {
    return res.json({
      status: false,
      message: 'emailAddress is required',
    });
  }

  try {
    const records = await ExamSection.find({ emailAddress });

    if (records.length === 0) {
      return res.json({
        status: false,
        message: 'No records found',
        count: 0,
        records: [],
      });
    }

    return res.json({
      status: true,
      message: 'Records found',
      count: records.length,
      records,
    });

  } catch (error) {
    return res.json({
      status: false,
      message: 'Something went wrong',
    });
  }
});

const getStatusFromPercentage = (percentString) => {
  const percent = parseFloat(percentString.replace('%', ''));
  return percent >= 70 ? 'passed' : 'failed';
};

router.get('/exam-result-summary', async (req, res) => {
  const { emailAddress } = req.query;

  if (!emailAddress) {
    return res.json({ status: false, message: "emailAddress is required" });
  }

  try {
    const tests = await ExamSection.find({ emailAddress }).sort({ createdAt: -1 });;

    if (!tests || tests.length === 0) {
      return res.json({ status: true, message: "No records found", data: [] });
    }

    const results = tests.map(test => {
      let totalMarks = 0;
      let marksReceived = 0;

      (test.sections || []).forEach(section => {
        const sectionMarks = section.totalMarks || 0;
        const correct = (section.questions || []).filter(q => q.status === 'correct').length;

        totalMarks += sectionMarks;
        marksReceived += correct;
      });

      const percentage = totalMarks > 0
        ? `${((marksReceived / totalMarks) * 100).toFixed(2)}%`
        : "0.00%";

      return {
        examName: test.examName,
        percentage,
        status: getStatusFromPercentage(percentage)
      };
    });

    res.json({ status: true, data: results });

  } catch (err) {
    console.error(err);
    res.json({ status: false, message: "Server error" });
  }
});


router.get('/exam-summary', async (req, res) => {
  const { examName } = req.query;

  if (!examName) {
    return res.json({status:false, error: "examName is required" });
  }

  try {
    const exam = await Exams.findOne({ examName });

    if (!exam) {
      return res.json({ status: false, message: "Exam not found" });
    }

    const examCategory = exam.category;
    const categoryExam = await Category.findOne({categoryName:examCategory})
    if(!categoryExam){
      return res.json({status:false,message:"Category not found"})
    }

    // Fetch all students enrolled in this category
    const allStudents = await Student.find({ "basic.courseName.courseName": categoryExam.courseName,"basic.isActive":true });

    // Fetch all exam records for the selected exam
    const attemptedStudents = await ExamSection.find({ examName });

    const attemptedMap = new Map();
    attemptedStudents.forEach(student => {
      attemptedMap.set(student.emailAddress, student);
    });

    const addTimes = (time1, time2) => {
      const [h1, m1] = time1.split(":").map(Number);
      const [h2, m2] = time2.split(":").map(Number);
      let totalMinutes = h1 * 60 + m1 + h2 * 60 + m2;
      let hours = Math.floor(totalMinutes / 60);
      let minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const results = allStudents.map(student => {
      const fullName = `${student.basic.firstName} ${student.basic.lastName}`.trim();
      const emailAddress = student.basic.emailAddress;
      const examRecord = attemptedMap.get(emailAddress);

      if (!examRecord) {
        return {
          fullName,
          emailAddress,
          examName,
          markReceived: "-",
          totalMarks: "-",
          percentage: "Absent",
          totalTimeTaken: "-",
          status: "Absent",
          sections: []
        };
      }

      let totalMarks = 0;
      let markReceived = 0;
      let totalTimeTaken = "00:00";

      const sections = (examRecord.sections || []).map(section => {
        const correct = (section.questions || []).filter(q => q.status === 'correct').length;
        const secTotal = section.totalMarks || 0;
        totalMarks += secTotal;
        markReceived += correct;
        totalTimeTaken = addTimes(totalTimeTaken, section.timeTaken || "00:00");

        return {
          sectionName: section.sectionName,
          timeTaken: section.timeTaken,
          totalMarks: secTotal,
          marksReceived: correct
        };
      });

      const percentage = totalMarks > 0
        ? `${((markReceived / totalMarks) * 100).toFixed(2)}%`
        : "0.00%";

      return {
        fullName,
        emailAddress,
        examName,
        markReceived,
        totalMarks,
        percentage,
        totalTimeTaken,
        status: "Present",
        sections
      };
    });

    res.json({ status: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, error: "Server error" });
  }
});

// router.get('/exam-summary', async (req, res) => {
//   const { examName } = req.query;

//   if (!examName) {
//     return res.status(400).json({ error: "examName is required" });
//   }

//   try {
//     const students = await ExamSection.find({ examName });

//     const results = students.map(student => {
//       let totalMarks = 0;
//       let markReceived = 0;
//       let totalTimeTaken = "00:00";

//       const sections = (student.sections || []).map(section => {
//         const correct = (section.questions || []).filter(q => q.status === 'correct').length;
//         const secTotal = section.totalMarks || 0;
//         totalMarks += secTotal;
//         markReceived += correct;
//         totalTimeTaken = addTimes(totalTimeTaken, section.timeTaken || "00:00");

//         return {
//           sectionName: section.sectionName,
//           timeTaken: section.timeTaken,
//           totalMarks: secTotal,
//           marksReceived: correct
//         };
//       });

//       const percentage = totalMarks > 0
//         ? `${((markReceived / totalMarks) * 100).toFixed(2)}%`
//         : "0.00%";

//       return {
//         fullName: student.fullName,
//         markReceived,
//         emailAddress: student.emailAddress,
//         examName: student.examName,
//         totalTimeTaken,
//         totalMarks,
//         percentage,
//         sections
//       };
//     });

//     res.json({status:true,data:results});
//   } catch (err) {
//     console.error(err);
//     res.json({status:false, error: "Server error" });
//   }
// });


// 1. Insert a new exam section record
router.post('/addSection', async (req, res) => {
  try {
    const { emailAddress, fullName, examName, section } = req.body;
    if (!emailAddress || !fullName || !examName || !section || !section.sectionName) {
      return res.json({status:false, error: 'Missing required fields' });
    }

    // Try to find an existing exam record for the user
    let record = await ExamSection.findOne({ emailAddress, examName });

    if (record) {
      // Check if the section already exists
      const index = record.sections.findIndex(
        s => s.sectionName === section.sectionName
      );

      if (index !== -1) {
        // Overwrite existing section
        record.sections[index] = section;
      } else {
        // Push new section
        record.sections.push(section);
      }

      await record.save();
      return res.json({status:true, message: 'Section added/updated successfully', data: record });
    } else {
      // Create new document with the section
      const newRecord = new ExamSection({
        emailAddress,
        fullName,
        examName,
        sections: [section]
      });

      const saved = await newRecord.save();
      return res.json({status:true, message: 'New exam record created', data: saved });
    }
  } catch (error) {
    console.log(error)
    res.json({status:false, error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [examCount, questionCount, categoryCount, attemptCount] = await Promise.all([
      Exams.countDocuments(),
      Question.countDocuments(),
      Category.countDocuments(),
      ExamSection.countDocuments()
    ]);

    res.json({
      status: true,
      data: {
        totalExams: examCount,
        totalQuestions: questionCount,
        totalCategories: categoryCount,
        totalExamAttempts: attemptCount
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.json({
      status: false,
      message: 'Server error while fetching dashboard statistics.'
    });
  }
});

// 2. Get records by examName
router.get('/examName/:examName', async (req, res) => {
  try {
    const { examName } = req.params;
    const records = await ExamSection.find({ examName });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/result-by-user/:examName/:emailAddress', async (req, res) => {
  try {
    const { examName,emailAddress } = req.params;
    const records = await ExamSection.find({ examName, emailAddress });
    res.json({status:true,message:records});
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

// 3. Get records by emailAddress and fullName (query params)
router.get('/user', async (req, res) => {
  try {
    const { emailAddress, fullName } = req.query;

    if (!emailAddress || !fullName) {
      return res.status(400).json({ error: 'emailAddress and fullName are required' });
    }

    const records = await ExamSection.find({ emailAddress, fullName });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;