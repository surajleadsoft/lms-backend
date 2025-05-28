const express = require('express');
const router = express.Router();
const CourseContent = require('../models/courseContentSchema');
const WatchedVideo = require('../models/watchVideos')

// Utility: Get next serial number for a course/module
const getNextSerialNo = async (courseName) => {
  const count = await CourseContent.countDocuments({ courseName });
  return count + 1;
};

// Add a course video
router.post('/add-video', async (req, res) => {
  try {
    const { courseName, moduleName, videoTitle, videoURL, description } = req.body;

    const serialNo = await getNextSerialNo(courseName);

    const newVideo = new CourseContent({
      courseName,
      moduleName,
      serialNo,
      contentType: 'video',
      videoTitle,
      videoURL,
      description
    });

    await newVideo.save();
    res.json({ status: true, message: 'Video content added successfully' });
  } catch (err) {
    res.json({ status: false, message: 'Error adding video: ' + err.message });
  }
});

// Add a course exam
router.post('/add-exam', async (req, res) => {
  try {
    const { courseName, moduleName, examTitle, description } = req.body;

    const serialNo = await getNextSerialNo(courseName, moduleName);

    const newExam = new CourseContent({
      courseName,
      moduleName,
      serialNo,
      contentType: 'exam',
      examTitle,
      description
    });

    await newExam.save();
    res.json({ status: true, message: 'Exam content added successfully' });
  } catch (err) {
    res.json({ status: false, message: 'Error adding exam: ' + err.message });
  }
});

// Get all course content (video + exam)
router.get('/all/:coursename', async (req, res) => {
  try {
    const courseName = req.params.coursename
    const content = await CourseContent.find({courseName}).sort({ createdDate: -1 });
    res.json({ status: true, message: 'Course content retrieved', data: content });
  } catch (err) {
    res.json({ status: false, message: 'Error retrieving content: ' + err.message });
  }
});

router.get('/videos/:courseName/:moduleName', async (req, res) => {
  try {
    const { courseName, moduleName } = req.params;

    const videos = await CourseContent.find({
      courseName,
      moduleName,
      contentType: 'video'
    }).sort({ createdDate: -1 });

    res.json({
      status: true,
      message: 'Videos retrieved successfully',
      data: videos
    });
  } catch (err) {
    res.json({
      status: false,
      message: 'Error retrieving videos: ' + err.message
    });
  }
});
router.get('/videos/:courseName/:moduleName/:email', async (req, res) => {
  try {
    const { courseName, moduleName,email } = req.params;

    if (!email) {
      return res.json({
        status: false,
        message: 'Email address is required'
      });
    }

    // Step 1: Get all video contents
    const videos = await CourseContent.find({
      courseName,
      moduleName,
      contentType: 'video'
    }).sort({ createdDate: -1 });

    // Step 2: Get all watchedVideo entries for this user
    const watchedData = await WatchedVideo.find({
      emailAddress: email,
      courseName,
      moduleName
    });

    // Step 3: Create a map for fast lookup
    const watchedMap = {};
    watchedData.forEach(entry => {
      watchedMap[entry.serialNo] = {
        percentage: entry.percentage,
        currentTime: entry.currentTime
      };
    });

    // Step 4: Merge the percentage and currentTime into each video
    const enrichedVideos = videos.map(video => {
      const extra = watchedMap[video.serialNo] || { percentage: 0, currentTime: '0' };
      return {
        ...video.toObject(),
        percentage: extra.percentage,
        currentTime: extra.currentTime
      };
    });

    res.json({
      status: true,
      message: 'Videos retrieved successfully with watch data',
      data: enrichedVideos
    });

  } catch (err) {
    res.json({
      status: false,
      message: 'Error retrieving videos: ' + err.message
    });
  }
});
router.get('/get-video/:courseName,:serialNo', async (req, res) => {
  try {
    const serialNo = req.params.serialNo
    const courseName = req.params.courseName

    const videos = await CourseContent.find({
      serialNo,
      courseName
    })

    res.json({
      status: true,
      message: 'Videos retrieved successfully',
      data: videos
    });
  } catch (err) {
    res.json({
      status: false,
      message: 'Error retrieving videos: ' + err.message
    });
  }
});

// Optional: Get next serial number by course and module
router.get('/next-serial/:courseName', async (req, res) => {
  try {
    const courseName = req.params.courseName;
    const serialNo = await getNextSerialNo(courseName);
    res.json({ status: true, message: 'Next serial number retrieved', serialNo });
  } catch (err) {
    res.json({ status: false, message: 'Error fetching serial number: ' + err.message });
  }
});

module.exports = router;
