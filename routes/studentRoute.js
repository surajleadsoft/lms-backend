const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

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
