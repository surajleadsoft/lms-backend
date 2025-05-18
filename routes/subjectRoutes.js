const express = require('express');
const router = express.Router();
const Subject = require('../models/Subjects');

// ✅ Create a new subject
router.post('/add', async (req, res) => {
  const { subjectName, subjectTags } = req.body;

  try {
    // Check for duplicate
    const existing = await Subject.findOne({ subjectName });
    if (existing) {
      return res.json({ status: false, message: 'Subject already exists' });
    }

    const subject = new Subject({ subjectName, subjectTags });
    await subject.save();
    res.json({ status: true, message: 'Subject added successfully' });
  } catch (err) {
    res.json({ status: false, message: 'Error adding subject' });
  }
});

// ✅ Get all subjects
router.get('/all', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json({ status: true, message: 'Subjects fetched successfully', data: subjects });
  } catch (err) {
    res.json({ status: false, message: 'Error fetching subjects' });
  }
});

// ✅ Update a subject by ID
router.put('/update/:id', async (req, res) => {
  const { subjectName, subjectTags } = req.body;
  const { id } = req.params;

  try {
    const existing = await Subject.findOne({ subjectName, _id: { $ne: id } });
    if (existing) {
      return res.json({ status: false, message: 'Another subject with this name already exists' });
    }

    const updated = await Subject.findByIdAndUpdate(
      id,
      { subjectName, subjectTags },
      { new: true }
    );

    if (updated) {
      res.json({ status: true, message: 'Subject updated successfully' });
    } else {
      res.json({ status: false, message: 'Subject not found' });
    }
  } catch (err) {
    res.json({ status: false, message: 'Error updating subject' });
  }
});

// ✅ Delete a subject by ID
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Subject.findByIdAndDelete(id);
    if (deleted) {
      res.json({ status: true, message: 'Subject deleted successfully' });
    } else {
      res.json({ status: false, message: 'Subject not found' });
    }
  } catch (err) {
    res.json({ status: false, message: 'Error deleting subject' });
  }
});

module.exports = router;
