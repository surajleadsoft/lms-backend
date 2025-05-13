const express = require('express');
const router = express.Router();
const Content = require('../models/Content');

// POST: Insert new content
router.post('/insert', async (req, res) => {
  try {
    const content = new Content(req.body);
    await content.save();
    res.status(201).json({ success: true, message: 'Content inserted', data: content });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT: Update content by srNo
router.put('/update/:srNo', async (req, res) => {
  try {
    const updated = await Content.findOneAndUpdate(
      { srNo: req.params.srNo },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    res.json({ success: true, message: 'Content updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE: Delete content by srNo
router.delete('/delete/:srNo', async (req, res) => {
  try {
    const deleted = await Content.findOneAndDelete({ srNo: req.params.srNo });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    res.json({ success: true, message: 'Content deleted', data: deleted });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET: Get all content or filter by course/module
router.get('/get-data/:courseName/:moduleName', async (req, res) => {
  try {
    const { courseName, moduleName } = req.params;
    
    console.log(courseName,moduleName)

    const content = await Content.find();

    res.json({ success: true, data: content });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
