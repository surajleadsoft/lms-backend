// routes/campus.js
const express = require('express');
const router = express.Router();
const Campus = require('../models/Campus');
const Application = require('../models/Application');


// 1. Add a new campus drive
router.post('/add', async (req, res) => {
  try {
    const campus = new Campus(req.body);
    await campus.save();
    res.json({ status: true, message: 'Campus drive added successfully' });
  } catch (err) {
    res.json({ status: false, message: 'Error adding campus drive', error: err.message });
  }
});

router.get('/unapplied-upcoming/:emailAddress', async (req, res) => {
  const { emailAddress } = req.params;

  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + 2); // exactly 2 days later

  // Create separate objects to avoid mutation
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date(targetDate).setHours(23, 59, 59, 999));

  try {
    // 1. Get all applications by the user
    const userApplications = await Application.find({ emailAddress });

    const appliedSet = new Set(
      userApplications.map(app => 
        `${app.companyName.trim().toLowerCase()}|${app.driveName.trim().toLowerCase()}|${app.position.trim().toLowerCase()}`
      )
    );

    // 2. Get campuses with lastDateToApply = exactly 2 days later
    const campuses = await Campus.find({
      lastDateToApply: { $gte: startOfDay, $lte: endOfDay }
    });

    // 3. Filter out applied ones
    const unappliedCampuses = campuses.filter(campus => {
      const key = `${campus.companyName.trim().toLowerCase()}|${campus.driveName.trim().toLowerCase()}|${campus.position.trim().toLowerCase()}`;
      return !appliedSet.has(key);
    });

    res.json({ status: true, data: unappliedCampuses });
  } catch (error) {
    console.error('Error fetching unapplied upcoming campuses:', error);
    res.status(500).json({ status: false, error: error.message });
  }
});


router.get('/unapplied-campuses', async (req, res) => {
  const { emailAddress } = req.query;

  if (!emailAddress) {
    return res.json({status:false, error: 'Email address is required' });
  }

  try {
    // Step 1: Get all applications by user
    const applications = await Application.find({ emailAddress });

    // Step 2: Extract applied combinations (companyName + driveName)
    const appliedSet = new Set(
      applications.map(app => `${app.companyName}|||${app.driveName}`)
    );

    // Step 3: Fetch all campus drives
    const allCampuses = await Campus.find();

    // Step 4: Filter campuses not in appliedSet
    const unappliedCampuses = allCampuses.filter(campus => {
      const key = `${campus.companyName}|||${campus.driveName}`;
      return !appliedSet.has(key);
    });

    res.json({status:true,data:unappliedCampuses});
  } catch (err) {
    console.error('Error fetching unapplied campuses:', err);
    res.json({status:false, error: 'Server error' });
  }
});

// 2. Get all campus drives
router.get('/all', async (req, res) => {
  try {
    const campuses = await Campus.find().sort({ updatedAt: -1 });
    res.json({ status: true, message: 'Campus drives fetched', data: campuses });
  } catch (err) {
    res.json({ status: false, message: 'Error fetching campus drives', error: err.message });
  }
});

// 3. Get campus drive by company name
router.get('/company/:companyName', async (req, res) => {
  try {
    const campuses = await Campus.find({ companyName: req.params.companyName });
    res.json({ status: true, message: 'Drives for company fetched', data: campuses });
  } catch (err) {
    res.json({ status: false, message: 'Error fetching by company name', error: err.message });
  }
});

router.get('/company-by-id/:id', async (req, res) => {
  try {
    const campuses = await Campus.findById(req.params.id);
    res.json({ status: true, message: 'Drives for company fetched', data: campuses });
  } catch (err) {
    res.json({ status: false, message: 'Error fetching by company name', error: err.message });
  }
});

// 4. Get campus drive by position
router.get('/position/:position', async (req, res) => {
  try {
    const campuses = await Campus.find({ position: req.params.position });
    res.json({ status: true, message: 'Drives for position fetched', data: campuses });
  } catch (err) {
    res.json({ status: false, message: 'Error fetching by position', error: err.message });
  }
});

module.exports = router;
