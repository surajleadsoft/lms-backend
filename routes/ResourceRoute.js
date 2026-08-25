const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');

const uploadDir = path.join(__dirname, '../uploads/resources');

// Create folder automatically if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

console.log('Resource upload directory:', uploadDir);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() +
            '-' +
            file.originalname.replace(/\s+/g, '-');

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 10 MB
    },
    fileFilter: function (req, file, cb) {

        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed'));
        }

        cb(null, true);
    }
});

router.post('/', upload.single('file'), async (req, res) => {

    try {

        console.log('================ RESOURCE UPLOAD ================');
        console.log('BODY:', req.body);
        console.log('FILE:', req.file);

        const { courseName, resourceName } = req.body;

        if (!req.file) {
            return res.status(400).json({
                status: false,
                message: 'File is required'
            });
        }

        const resource = new Resource({
            courseName,
            resourceName,
            fileLocation: req.file.filename
        });

        await resource.save();

        console.log('Resource saved successfully');
        console.log('Filename:', req.file.filename);

        return res.json({
            status: true,
            message: 'Resource created successfully'
        });

    } catch (err) {
        console.error('RESOURCE UPLOAD ERROR:', err);
        if (err.code === 11000) {
            return res.json({
                status: false,
                message: 'Resource already exists for this course'
            });
        }
        return res.status(500).json({
            status: false,
            message: err.message || 'Failed to create resource'
        });
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
