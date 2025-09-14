const express = require('express');
const router = express.Router();
const OpenUser = require('../models/OpenUsers'); // adjust path

router.post('/', async (req, res) => {
  try {
    const { emailAddress, fullName, rollNo, mobileNo, instituteName, examName } = req.body;

    // ✅ Validate required fields
    if (!emailAddress || !fullName || !rollNo || !mobileNo || !instituteName || !examName) {
      return res.status(400).json({ status: false, error: 'All fields are required' });
    }

    // ✅ Check if email or mobile already exists for SAME exam + institute
    const existingUser = await OpenUser.findOne({
      $or: [{ emailAddress }, { mobileNo }],
      examName,
      instituteName,
    });

    if (existingUser) {
      let conflictField = existingUser.emailAddress === emailAddress ? 'Email' : 'Mobile number';
      return res.json({
        status: false,
        error: `${conflictField} already exists for this exam and institute.`,
      });
    }

    // ✅ Create new user
    const newUser = new OpenUser({
      emailAddress,
      fullName,
      rollNo,
      mobileNo,
      instituteName,
      examName,
    });

    const savedUser = await newUser.save();

    const tmp = {
      userName: savedUser.emailAddress,
      fullName: savedUser.fullName,
    };

    return res.json({
      status: true,
      message: 'User registered successfully',
      user: tmp,
    });

  } catch (err) {
    console.error('Registration error:', err);

    // Handle duplicate key error at DB level (just in case)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.json({
        status: false,
        error: `${field} already exists for this exam and institute.`,
      });
    }

    return res.json({ status: false, error: 'Server error' });
  }
});

module.exports = router;
