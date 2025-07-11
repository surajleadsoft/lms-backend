const express = require('express');
const router = express.Router();
const WatchedVideo = require('../models/watchVideos');
const CourseContent = require('../models/courseContentSchema')
const Category = require('../models/Categories'); // Adjust path as needed
const Exam = require('../models/Exams');

router.get('/test-count/:courseName', async (req, res) => {
  const { courseName } = req.params;

  try {
    // Step 1: Find all categories for the given courseName
    const categories = await Category.find({ courseName }).select('categoryName');

    if (!categories.length) {
      return res.json({ status: false, message: 'No categories found for this course.' });
    }

    // Step 2: Extract category names
    const categoryNames = categories.map(c => c.categoryName);

    // Step 3: Count exams where category matches any of the category names
    const examCount = await Exam.countDocuments({ category: { $in: categoryNames } });

    return res.json({ status: true, courseName, examCount });
  } catch (err) {
    console.error(err);
    return res.json({ status: false, message: 'Server error while counting exams.' });
  }
});

// INSERT OR UPDATE
router.post('/watch-status', async (req, res) => {
  try {
    const {
      emailAddress,
      courseName,
      moduleName,
      serialNo,
      action,
      duration,
      currentTime,
      percentage
    } = req.body;

    if (!emailAddress || !courseName || !moduleName || serialNo == null || !action || duration == null || currentTime == null || percentage == null) {
      return res.json({ status: false, message: 'All fields are required' });
    }

    const filter = { emailAddress, courseName, moduleName, serialNo };
    const update = {
      action,
      duration,
      currentTime,
      percentage,
      watchedAt: new Date()
    };

    const result = await WatchedVideo.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true, // insert if not found
      setDefaultsOnInsert: true
    });

    res.json({ status: true, data: result, message: 'Watch status saved successfully' });
  } catch (error) {
    console.error('Error in watch-status:', error);
    res.json({ status: false, message: 'Server Error' });
  }
});

// GET by courseName
router.get('/get-by-course/:email/:courseName', async (req, res) => {
  try {
    const { email, courseName } = req.params;

    // Get all videos for the course
    const courseVideos = await CourseContent.find({ courseName, contentType: 'video' });
    const totalVideos = courseVideos.length;

    if (totalVideos === 0) {
      return res.json({ status: true, overallPercentage: 0, message: 'No videos found for this course' });
    }

    // Get watched videos for the user & course
    const watchedVideos = await WatchedVideo.find({ emailAddress: email, courseName });

    // Map serialNo to percentage for quick lookup
    const watchedMap = {};
    watchedVideos.forEach(v => {
      watchedMap[v.serialNo] = v.percentage || 0;
    });

    // Sum watched percentages for all course videos
    let totalWatchedPercentage = 0;
    courseVideos.forEach(video => {
      totalWatchedPercentage += watchedMap[video.serialNo] || 0;  // 0 if not watched
    });

    // Calculate overall percentage (average over all videos)
    const overallPercentage = totalWatchedPercentage / totalVideos;

    res.json({
      status: true,
      overallPercentage: Math.floor(overallPercentage),
      totalVideos,
      watchedVideosCount: watchedVideos.length,
      message: 'Course completion percentage fetched successfully'
    });
  } catch (err) {
    console.error('Error fetching course completion:', err);
    res.json({ status: false, message: 'Server error' });
  }
});



// GET by courseName + moduleName
// GET by courseName + moduleName with overall percentage
router.get('/get-by-module/:email/:courseName/:moduleName', async (req, res) => {
  try {
    const { email, courseName, moduleName } = req.params;    
    // Get all videos for the course and module
    const moduleVideos = await CourseContent.find({ 
      courseName, 
      moduleName,
      contentType: 'video' 
    });
    const totalVideos = moduleVideos.length;    

    if (totalVideos === 0) {
      return res.json({ status: true, overallPercentage: 0, message: 'No videos found for this module' });
    }

    // Get watched videos for the user, course, and module
    const watchedVideos = await WatchedVideo.find({ 
      emailAddress: email, 
      courseName, 
      moduleName 
    });

    // Map serialNo to percentage for quick lookup
    const watchedMap = {};
    watchedVideos.forEach(v => {
      watchedMap[v.serialNo] = v.percentage || 0;
    });

    // Sum watched percentages for all module videos
    let totalWatchedPercentage = 0;
    moduleVideos.forEach(video => {
      totalWatchedPercentage += watchedMap[video.serialNo] || 0;  // 0 if not watched
    });

    // Calculate overall percentage (average over all module videos)
    const overallPercentage = totalWatchedPercentage / totalVideos;

    res.json({
      status: true,
      overallPercentage: Math.floor(overallPercentage),
      totalVideos,
      watchedVideosCount: watchedVideos.length,
      message: 'Module completion percentage fetched successfully'
    });
  } catch (err) {
    console.error('Error fetching module completion:', err);
    res.json({ status: false, message: 'Server error' });
  }
});


// GET by courseName + moduleName + serialNo
router.get('/get-by-video/:email/:courseName/:moduleName/:serialNo', async (req, res) => {
  try {
    const { email, courseName, moduleName, serialNo } = req.params;
    const data = await WatchedVideo.findOne({ emailAddress: email, courseName, moduleName, serialNo });
    res.json({ status: true, data });
  } catch (err) {
    console.log(err)
    res.json({ status: false, message: 'Error fetching by video' });
  }
});

module.exports = router;
