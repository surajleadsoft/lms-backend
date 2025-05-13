const express = require('express');
const router = express.Router();
const CourseModule = require('../models/CourseModule'); // adjust the path as needed

// INSERT - Prevent duplicates
router.post('/add', async (req, res) => {
  const { courseName, moduleName } = req.body;

  try {
    const existingModule = await CourseModule.findOne({ courseName, moduleName });
    if (existingModule) {
      return res.json({ status:false, message: 'Module already exists for this course.' });
    }

    const newModule = new CourseModule({ courseName, moduleName });
    await newModule.save();
    res.json({status:true, message: 'Module added successfully', data: newModule });
  } catch (err) {
    res.json({ status:false,message: 'Server error.', error: err.message });
  }
});

// GET - By courseName and moduleName
router.get('/:courseName', async (req, res) => {
  const courseName = req.params.courseName

  try {
    const module = await CourseModule.find({ courseName });
    if (!module) {
      return res.json({status:false, message: 'Module not found.' });
    }
    res.json({status:true,message:module});
  } catch (err) {
    res.json({status:false, message: 'Server error.', error: err.message });
  }
});

router.get('/:courseName/:moduleName', async (req, res) => {
  const courseName = req.params.courseName
  const moduleName = req.params.moduleName

  try {
    const module = await CourseModule.find({ courseName,moduleName });
    if (!module) {
      return res.json({status:false, message: 'Module not found.' });
    }
    res.json({status:true,message:module});
  } catch (err) {
    res.json({status:false, message: 'Server error.', error: err.message });
  }
});

// UPDATE - By courseName and moduleName
router.put('/update', async (req, res) => {
  const { courseName, moduleName, newModuleName } = req.body;

  try {
    const updated = await CourseModule.findOneAndUpdate(
      { courseName, moduleName },
      { moduleName: newModuleName },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Module not found for update.' });
    }

    res.json({ message: 'Module updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// DELETE - By courseName and moduleName
router.delete('/delete', async (req, res) => {
  const { courseName, moduleName } = req.body;

  try {
    const deleted = await CourseModule.findOneAndDelete({ courseName, moduleName });

    if (!deleted) {
      return res.status(404).json({ message: 'Module not found for deletion.' });
    }

    res.json({ message: 'Module deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
