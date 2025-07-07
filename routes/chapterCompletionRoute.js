const express = require('express');
const router = express.Router();
const ChapterCompletion = require('../models/chapterCompletion');

// Convert "hh:mm:ss" or "mm:ss" to total seconds
function durationToSeconds(timeString) {
  if (!timeString || typeof timeString !== 'string') return timeString;
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

// Calculate percentage (0–100)
function getPercentage(total, current) {
  if (!total || isNaN(total) || isNaN(current)) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

// ✅ Insert or update progress
router.post('/save', async (req, res) => {
  try {
    const {
      courseName,
      chapterNo,
      chapterName,
      totalDuration,
      currentDuration,
      emailAddress
    } = req.body;

    if (
      !courseName || chapterNo == null || !chapterName ||
      !totalDuration || !currentDuration || !emailAddress
    ) {
      return res.json({ status: false, message: "Missing required fields", data: null });
    }

    const totalSeconds =durationToSeconds(totalDuration);
    const currentSeconds =durationToSeconds(currentDuration);
    const completionPercentage = getPercentage(totalSeconds, currentSeconds);

    const filter = { emailAddress, courseName, chapterNo, chapterName };

    // ✅ Always update totalDuration too
    const update = {
      $set: {
        currentDuration,
        completionPercentage,
        totalDuration
      }
    };

    const options = { new: true, upsert: true };
    const result = await ChapterCompletion.findOneAndUpdate(filter, update, options);

    return res.json({ status: true, message: "Saved successfully", data: result });

  } catch (err) {
    console.error("Error saving progress:", err);
    return res.json({ status: false, message: "Server error", data: null });
  }
});


// ✅ Get all records
router.get('/all', async (req, res) => {
  try {
    const data = await ChapterCompletion.find().lean();
    return res.json({ status: true, message: "All records fetched", data });
  } catch (err) {
    return res.json({ status: false, message: "Error fetching data", data: [] });
  }
});

// ✅ Get user records by email and course
router.get('/user', async (req, res) => {
  try {
    const { emailAddress, courseName } = req.query;

    if (!emailAddress || !courseName) {
      return res.json({ status: false, message: "emailAddress and courseName required", data: [] });
    }

    const data = await ChapterCompletion.find({ emailAddress, courseName }).lean();
    return res.json({ status: true, message: "User data fetched", data });

  } catch (err) {
    return res.json({ status: false, message: "Server error", data: [] });
  }
});

module.exports = router;
