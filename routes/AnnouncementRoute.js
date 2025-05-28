const express = require('express');
const router = express.Router();
const Announcement = require('../models/Annoucements');

// Add new announcement
router.post('/add', async (req, res) => {
  try {
    const { courseName, announcementTitle, announcementDetails, date } = req.body;

    await Announcement.create({ courseName, announcementTitle, announcementDetails, date });
    res.json({ status: true, message: 'Announcement added successfully' });
  } catch (error) {
    console.log(error)
    if (error.code === 11000) {
      res.json({ status: false, message: 'Duplicate announcement not allowed' });
    } else {
      res.json({ status: false, message: 'Server error while adding announcement' });
    }
  }
});

// Get all announcements
router.get('/all', async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json({ status: true, message: 'Announcements fetched', data: announcements });
  } catch (error) {
    res.json({ status: false, message: 'Failed to fetch announcements' });
  }
});

// Get announcements by courseName
router.get('/:courseName', async (req, res) => {
  try {
    const courseName = req.params.courseName;
    const announcements = await Announcement.find({ courseName });
    res.json({ status: true, message: 'Course announcements fetched', data: announcements });
  } catch (error) {
    res.json({ status: false, message: 'Error fetching course announcements' });
  }
});

// Update announcement by ID
router.put('/update/:id', async (req, res) => {
  try {
    const { courseName, announcementTitle, announcementDetails, date } = req.body;
    await Announcement.findByIdAndUpdate(req.params.id, {
      courseName, announcementTitle, announcementDetails, date
    });
    res.json({ status: true, message: 'Announcement updated successfully' });
  } catch (error) {
    res.json({ status: false, message: 'Failed to update announcement' });
  }
});

// Delete announcement by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ status: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.json({ status: false, message: 'Failed to delete announcement' });
  }
});

module.exports = router;
