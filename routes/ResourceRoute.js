const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Resource = require('../models/Resource');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resources/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { courseName, resourceName } = req.body;
    const fileLocation = req.file ? req.file.filename : null;

    if (!fileLocation) {
      return res.json({ status: false, message: 'File is required' });
    }

    const resource = new Resource({ courseName, resourceName, fileLocation });
    await resource.save();
    return res.json({ status: true, message: 'Resource created successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ status: false, message: 'Resource already exists for this course' });
    }
    return res.json({ status: false, message: 'Failed to create resource' });
  }
});

// UPDATE Resource with optional file upload
router.put('/:courseName/:resourceName', upload.single('file'), async (req, res) => {
  try {
    const { courseName, resourceName } = req.params;
    const updates = req.body;

    if (req.file) {
      updates.fileLocation = req.file.filename;
    }

    const resource = await Resource.findOneAndUpdate(
      { courseName, resourceName },
      updates,
      { new: true }
    );

    if (!resource) {
      return res.json({ status: false, message: 'Resource not found' });
    }

    return res.json({ status: true, message: 'Resource updated successfully', data: resource });
  } catch (err) {
    return res.json({ status: false, message: 'Failed to update resource' });
  }
});

// GET all resources for a course
router.get('/:courseName', async (req, res) => {
  try {
    const courseName = req.params.courseName;    
    const resources = await Resource.find({
      courseName: { $regex: new RegExp(`^${courseName}$`, 'i') } // case-insensitive exact match
    });
    return res.json({ status: true, data: resources });
  } catch (err) {
    return res.json({ status: false, message: 'Failed to fetch resources' });
  }
});

// GET specific resource
router.get('/:courseName/:resourceName', async (req, res) => {
  try {
    const { courseName, resourceName } = req.params;
    const resource = await Resource.findOne({ courseName, resourceName });
    if (!resource) {
      return res.json({ status: false, message: 'Resource not found' });
    }
    return res.json({ status: true, data: resource });
  } catch (err) {
    return res.json({ status: false, message: 'Error fetching resource' });
  }
});


// DELETE a resource
router.delete('/:courseName/:resourceName', async (req, res) => {
  try {
    const { courseName, resourceName } = req.params;
    const result = await Resource.findOneAndDelete({ courseName, resourceName });
    if (!result) {
      return res.json({ status: false, message: 'Resource not found' });
    }
    return res.json({ status: true, message: 'Resource deleted successfully' });
  } catch (err) {
    return res.json({ status: false, message: 'Failed to delete resource' });
  }
});

module.exports = router;
