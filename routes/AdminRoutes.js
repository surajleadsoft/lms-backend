const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// Login API
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    res.json({ success: true, message: 'Login successful', admin: { username: admin.username } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
