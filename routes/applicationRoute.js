const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

// Insert new application
router.post('/add', async (req, res) => {
  try {
    const newApplication = new Application(req.body);
    const saved = await newApplication.save();
    res.json({status:true,message:'Applied successfully !!'});
  } catch (error) {
    res.json({status:false, error: error.message });
  }
});

// Get all applications
router.get('/all', async (req, res) => {
  try {
    const applications = await Application.find();
    res.json({status:true,data:applications});
  } catch (error) {
    res.json({status:false, error: error.message });
  }
});

// Get by emailAddress
router.get('/email/:emailAddress', async (req, res) => {
  try {
    const result = await Application.find({ emailAddress: req.params.emailAddress }).sort({appliedDate:-1});
    res.json({status:true,data:result});
  } catch (error) {
    res.json({status:false, error: error.message });
  }
});



// Get by campusName and position
router.get('/filter', async (req, res) => {
  const { campusName, position } = req.query;
  try {
    const result = await Application.find({ campusName, position });
    res.json({status:true,data:result});
  } catch (error) {
    res.json({status:false, error: error.message });
  }
});

module.exports = router;
