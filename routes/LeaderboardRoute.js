const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const ChapterCompletion = require('../models/chapterCompletion');
const LearningCourse = require('../models/LearningCourse');

router.get('/learning-courses-leaderboard', async (req, res) => {
  try {
    const learningCourses = await LearningCourse.find({ isActive: true });

    const [students, completions] = await Promise.all([
      Student.find({ 'basic.isActive': true })
        .select('basic.firstName basic.lastName basic.emailAddress basic.courseName'),
      ChapterCompletion.find()
    ]);

    const timeToSeconds = (timeStr) => {
      if (!timeStr) return 0;
      if (!timeStr.includes(':')) {
        const minutes = parseFloat(timeStr);
        return isNaN(minutes) ? 0 : minutes * 60;
      }
      const [minsStr, secsStr] = timeStr.split(':');
      const mins = parseInt(minsStr);
      const secs = parseInt(secsStr);
      return (isNaN(mins) || isNaN(secs)) ? 0 : (mins * 60) + secs;
    };

    const leaderboard = students.map(student => {
      const email = student.basic.emailAddress;
      const studentCourses = student.basic.courseName.map(c => c.courseName);

      let totalCompletionFraction = 0;
      let totalPossibleChapters = 0;
      let completedCourses = 0;

      const eligibleCourses = learningCourses.filter(course =>
        course.coursesAssigned.some(assignedCourse => studentCourses.includes(assignedCourse))
      );

      eligibleCourses.forEach(course => {
        const courseChapters = course.chapters || [];
        totalPossibleChapters += courseChapters.length;

        let courseCompletionFraction = 0;

        courseChapters.forEach(chapter => {
          const completion = completions.find(cc =>
            cc.emailAddress === email &&
            cc.courseName === course.courseName &&
            cc.chapterNo === chapter.chapterNo
          );

          if (completion) {
            const currentSec = timeToSeconds(completion.currentDuration || "00:00");
            const totalSec = timeToSeconds(completion.totalDuration || "00:00");

            if (!isNaN(currentSec) && !isNaN(totalSec) && totalSec > 0) {
              const watchedFraction = currentSec / totalSec;
              courseCompletionFraction += Math.min(watchedFraction, 1);
            }
          }
        });

        totalCompletionFraction += courseCompletionFraction;

        if (courseCompletionFraction === courseChapters.length) {
          completedCourses++;
        }
      });

      const completionPercentage = totalPossibleChapters > 0
        ? Math.round((totalCompletionFraction / totalPossibleChapters) * 100)
        : 0;

      const badge = getBadge(completionPercentage);

      return {
        fullName: `${student.basic.firstName} ${student.basic.lastName}`,
        emailAddress: email,
        eligibleCourses: eligibleCourses.length,
        completedCourses,
        completionPercentage,
        progressLevel: getProgressLevel(completionPercentage),
        badge
      };
    });

    // Filter
    const activeStudents = leaderboard
      .filter(s => ['gold', 'silver', 'bronze'].includes(s.badge) && s.eligibleCourses > 0);

    const inactiveStudents = leaderboard
      .filter(s => s.badge === 'normal' || s.eligibleCourses === 0 || s.completionPercentage === 0)
      .map(s => ({ ...s, rank: null }));

    // Sort active by percentage descending
    activeStudents.sort((a, b) => b.completionPercentage - a.completionPercentage);

    // Assign rank to active students
    activeStudents.forEach((s, idx) => s.rank = idx + 1);

    res.json({
      status: true,
      data: {
        activeStudents,
        inactiveStudents,
        metrics: {
          totalStudents: students.length,
          activeStudents: activeStudents.length,
          inactiveStudents: inactiveStudents.length,
          averageCompletion: activeStudents.length > 0
            ? Math.round(activeStudents.reduce((sum, s) => sum + s.completionPercentage, 0) / activeStudents.length)
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// Badge mapping
function getBadge(percentage) {
  if (percentage >= 90) return 'gold';
  if (percentage >= 75) return 'silver';
  if (percentage >= 50) return 'bronze';
  return 'normal';
}

function getProgressLevel(percentage) {
  if (percentage === 0) return 'Not Started';
  if (percentage < 25) return 'Beginner';
  if (percentage < 50) return 'Intermediate';
  if (percentage < 75) return 'Advanced';
  if (percentage < 100) return 'Expert';
  return 'Master';
}

module.exports = router;
