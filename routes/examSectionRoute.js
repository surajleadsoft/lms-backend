const express = require('express');
const router = express.Router();
const ExamSection = require('../models/examSection'); // Adjust path as per your folder structure
const Exams = require('../models/Exams'); // path may vary
const Question = require('../models/Question'); 
const Category = require('../models/Categories'); 

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
