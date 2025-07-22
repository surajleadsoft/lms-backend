const express = require('express');
const router = express.Router();
const LearningCourse = require('../models/LearningCourse');
const Student = require('../models/Student'); // adjust path accordingly
const ChapterCompletion = require('../models/chapterCompletion'); // import the model


// Create a new course (without chapters initially)
router.post('/', async (req, res) => {
  try {
    const course = new LearningCourse(req.body);
    const saved = await course.save();
    res.json({ status: true, message: 'Course created successfully', data: saved });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
});
router.get('/courses/:courseName/chapters', async (req, res) => {
  const { courseName } = req.params;
  const { email } = req.query;

  if (!email) {
    return res.json({ status: false, message: "Email is required in query params", data: null });
  }

  try {
    const course = await LearningCourse.findOne({ courseName });

    if (!course) {
      return res.json({
        status: false,
        message: 'Course not found',
        data: null
      });
    }

    const completions = await ChapterCompletion.find({
      emailAddress: email,
      courseName
    });

    const completionMap = new Map();
    completions.forEach(item => {
      completionMap.set(item.chapterNo, {
        completionPercentage: item.completionPercentage,
        currentDuration: item.currentDuration
      });
    });

    const chaptersWithProgress = course.chapters.map(chapter => {
      const progress = completionMap.get(chapter.chapterNo) || {
        completionPercentage: 0,
        currentDuration: '00:00'
      };

      return {
        ...chapter.toObject(),
        completionPercentage: progress.completionPercentage,
        currentDuration: progress.currentDuration
      };
    });

    return res.json({
      status: true,
      courseName: course.courseName,
      data: chaptersWithProgress
    });

  } catch (error) {
    console.error('Error fetching chapters with completion:', error);
    return res.json({
      status: false,
      message: 'Server error',
      data: null
    });
  }
});

// Get all courses
router.get('/', async (req, res) => {
   try {
    const courses = await LearningCourse.find().sort({ createdAt: -1 });

    const courseData = await Promise.all(
      courses.map(async (course) => {
        let studentCount = 0;

        // Count students where courseName is in assigned list and is active
        if (course.coursesAssigned && course.coursesAssigned.length > 0) {
          studentCount = await Student.countDocuments({
            'basic.courseName.courseName': { $in: course.coursesAssigned },
            'basic.isActive': true
          });
        }

        return {
          id:course.id,
          courseName: course.courseName,
          chapters:course.chapters,
          tags: course.tags,
          category: course.category,
          learningIcon: course.learningIcon,
          studentCount,
          updatedAt: course.updatedAt
        };
      })
    );
    // console.log(courseData)
    res.json({ status: true, message: 'Course data with student count', data: courseData });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});

router.get('/get-courses', async (req, res) => {
  const { emailAddress } = req.query;

  if (!emailAddress) {
    return res.json({ status: false, message: 'Email address is required' });
  }

  try {
    // Step 1: Find student by email and active
    const student = await Student.findOne({
      'basic.emailAddress': emailAddress,
      'basic.isActive': true
    });

    if (!student) {
      return res.json({ status: false, message: 'Student not found or not active' });
    }

    // Step 2: Extract enrolled course names
    const enrolledCourseNames = student.basic.courseName.map(c => c.courseName);

    if (enrolledCourseNames.length === 0) {
      return res.json({ status: true, message: 'No courses assigned to student', data: [] });
    }

    // Step 3: Find all learning courses assigned to these course names
    const learningCourses = await LearningCourse.find({
      coursesAssigned: { $in: enrolledCourseNames }
    });

    // Step 4: Fetch chapter completions
    const completions = await ChapterCompletion.find({ emailAddress });

    // Step 5: Deduplicate courses and calculate completion %
    const uniqueCoursesMap = new Map();

    // Helper: convert time string to seconds
    const timeToSeconds = (timeStr) => {
      if (!timeStr) return 0;

      // Handle pure minute values like "5"
      if (!timeStr.includes(':')) {
        const minutes = parseFloat(timeStr);
        return isNaN(minutes) ? 0 : minutes * 60;
      }

      // Handle "MM:SS" or "M:SS" format
      const [minsStr, secsStr] = timeStr.split(':');
      const mins = parseInt(minsStr);
      const secs = parseInt(secsStr);
      
      if (isNaN(mins) || isNaN(secs)) return 0;

      return (mins * 60) + secs;
    };


    for (const course of learningCourses) {
      if (!uniqueCoursesMap.has(course.courseName)) {
        const chapters = course.chapters || [];

        const videoCount = chapters.filter(ch =>
          ch.chapterType === 'video' || ch.chapterType === 'youtube'
        ).length;
        const testCount = chapters.filter(ch => ch.chapterType === 'test').length;
        const totalChapters = chapters.length;

        // Calculate realistic partial completion
        let totalCompletionFraction = 0;

        chapters.forEach(chapter => {
          const comp = completions.find(cc =>
            cc.courseName === course.courseName &&
            cc.chapterNo === chapter.chapterNo
          );

          if (comp) {
            const currentSec = timeToSeconds(comp.currentDuration || "00:00");
            const totalSec = timeToSeconds(comp.totalDuration || "00:00");

            if (!isNaN(currentSec) && !isNaN(totalSec) && totalSec > 0) {
              const watchedFraction = currentSec / totalSec;
              totalCompletionFraction += Math.min(watchedFraction, 1); // cap at 1
            }
          }
        });

        const completionPercentage = totalChapters > 0
          ? Math.round((totalCompletionFraction / totalChapters) * 100)
          : 0;

        // Determine if the course is 'new' (within 3 weeks)
        const createdDate = new Date(course.createdAt);
        const now = new Date();
        const threeWeeksAgo = new Date(now.setDate(now.getDate() - 21));
        const category = createdDate >= threeWeeksAgo ? 'new' : 'popular';

        uniqueCoursesMap.set(course.courseName, {
          _id: course._id,
          courseName: course.courseName,
          tags: course.tags,
          learningIcon: course.learningIcon,
          category,
          coursesAssigned: course.coursesAssigned,
          noOfVideos: videoCount,
          noOfTests: testCount,
          totalChapters,
          completionPercentage,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        });
      }
    }

    const uniqueLearningCourses = Array.from(uniqueCoursesMap.values());

    return res.json({
      status: true,
      message: 'Unique learning courses assigned to student',
      data: uniqueLearningCourses
    });

  } catch (err) {
    console.error(err);
    return res.json({ status: false, message: err.message });
  }
});


// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await LearningCourse.findById(req.params.id);
    if (!course) return res.json({ status: false, message: 'Course not found' });
    res.json({ status: true, message: 'Course fetched successfully', data: course });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
});

// Update course (excluding chapters)
router.put('/:id', async (req, res) => {
  try {
    const updated = await LearningCourse.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.json({ status: false, message: 'Course not found' });
    res.json({ status: true, message: 'Course updated successfully', data: updated });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await LearningCourse.findByIdAndDelete(req.params.id);
    if (!deleted) return res.json({ status: false, message: 'Course not found' });
    res.json({ status: true, message: 'Course deleted successfully' });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
});

// Add a chapter to course
router.patch('/:id/add-chapter', async (req, res) => {
  try {
    const course = await LearningCourse.findById(req.params.id);
    if (!course) return res.json({ status: false, message: 'Course not found' });

    await course.addChapter(req.body);
    res.json({ status: true, message: 'Chapter added successfully', data: course });
  } catch (err) {           
    res.json({ status: false, message: err.message });
  }
});
// Reorder chapters
router.patch('/:id/reorder-chapters', async (req, res) => {
  try {
    const { chapters } = req.body;
    const course = await LearningCourse.findById(req.params.id);
    if (!course) return res.json({ status: false, message: 'Course not found' });

    // Replace chapters
    course.chapters = chapters;
    course.markModified('chapters');
    await course.save();

    res.json({ status: true, message: 'Chapters reordered', data: course.chapters });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
});

// Remove a chapter by chapterNo
router.patch('/:id/remove-chapter/:chapterNo', async (req, res) => {
  try {
    const course = await LearningCourse.findById(req.params.id);
    if (!course) return res.json({ status: false, message: 'Course not found' });

    await course.removeChapter(parseInt(req.params.chapterNo));
    res.json({ status: true, message: 'Chapter removed successfully', data: course });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
});


module.exports = router;
