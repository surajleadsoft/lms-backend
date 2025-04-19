const express = require('express');
const router = express.Router();
const Module = require('../models/Module');

// POST: Insert a new module
router.post('/insert', async (req, res) => {
  try {
    const { courseName, moduleName } = req.body;
    const module = new Module({ courseName, moduleName });
    await module.save();
    res.status(201).json({ success: true, message: 'Module inserted', data: module });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT: Update module by srNo
router.put('/update/:srNo', async (req, res) => {
  try {
    const { srNo } = req.params;
    const { courseName, moduleName } = req.body;

    const updated = await Module.findOneAndUpdate(
      { srNo },
      { courseName, moduleName },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    res.json({ success: true, message: 'Module updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE: Delete module by srNo
router.delete('/delete/:srNo', async (req, res) => {
  try {
    const { srNo } = req.params;
    const deleted = await Module.findOneAndDelete({ srNo });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    res.json({ success: true, message: 'Module deleted', data: deleted });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET: Get all modules or filter by courseName
router.get('/', async (req, res) => {
  try {
    const { courseName } = req.query;
    const query = courseName ? { courseName } : {};
    const modules = await Module.find(query).sort({ srNo: 1 });

    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
