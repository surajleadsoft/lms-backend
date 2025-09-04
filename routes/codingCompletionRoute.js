const express = require('express');
const router = express.Router();
const CodingCompletion = require('../models/CodingCompletion'); // import schema
const Student = require('../models/Student');
const CodingChapters = require("../models/CodingChapters"); // your CodingChapters model

router.delete('/completion/duplicates', async (req, res) => {
  try {
    // Group by unique keys and collect duplicate IDs
    const duplicates = await CodingCompletion.aggregate([
      {
        $group: {
          _id: {
            userName: "$userName",
            chapterName: "$chapterName",
            problemTitle: "$problemTitle",
            language: "$language"
          },
          docs: { $push: { _id: "$_id", createdAt: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } } // Only groups with duplicates
    ]);

    let deleteOps = [];

    duplicates.forEach(group => {
      // Sort by createdAt (keep the latest one, delete older)
      const sortedDocs = group.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const toDelete = sortedDocs.slice(1).map(doc => doc._id); // all except newest
      deleteOps = deleteOps.concat(toDelete);
    });

    if (deleteOps.length > 0) {
      await CodingCompletion.deleteMany({ _id: { $in: deleteOps } });
    }

    res.json({
      status: true,
      message: `Removed ${deleteOps.length} duplicate records successfully`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error', error: error.message });
  }
});

// -------------------- POST: Save a solution --------------------
router.post('/completion', async (req, res) => {
    try {
        const { userName, chapterName, problemTitle, language, solution } = req.body;

        if (!userName || !chapterName || !problemTitle || !language || !solution) {
            return res.status(400).json({ status: false, message: 'All fields are required' });
        }

        const updateResult = await CodingCompletion.updateOne(
            { userName, chapterName, problemTitle, language },   // filter
            { $set: { solution, lastUpdated: new Date() } },     // update
            { upsert: true }                                     // insert if not exists
        );

        res.json({
            status: true,
            message: updateResult.upsertedCount > 0
                ? 'Solution inserted successfully'
                : 'Solution updated successfully'
        });

    } catch (error) {
        console.error(error);
        res.json({ status: false, message: 'Server error', error: error.message });
    }
});


// -------------------- GET: Retrieve solutions by userName --------------------
router.get('/codingCompletions/:userName', async (req, res) => {
    try {
        const { userName } = req.params;

        const solutions = await CodingCompletion.find({ userName }).sort({ createdAt: -1 });

        if (!solutions.length) {
            return res.json({ status: false, message: 'No solutions found for this user', data: [] });
        }

        res.json({ status: true, message: 'Solutions retrieved successfully', data: solutions });
    } catch (error) {
        console.error(error);
        res.json({ status: false, message: 'Server error', error: error.message });
    }
});

router.post("/report", async (req, res) => {
  try {
    const { courseName, codingChapterName } = req.body;

    if (!courseName || !codingChapterName) {
      return res.json({
        status: false,
        message: "courseName and codingChapterName are required",
      });
    }

    // 1. Get all students in the given course
    const students = await Student.find({
      "basic.courseName.courseName": courseName,
      "basic.isActive": true,
    });

    if (!students.length) {
      return res.json({
        status: false,
        message: "No students found for this course",
      });
    }

    // 2. Get the chapter to fetch total questions
    const chapter = await CodingChapters.findOne({
      chapterName: codingChapterName,
      chapterAssignedTo: { $in: [courseName] }, // ensures this chapter belongs to course
    });

    if (!chapter) {
      return res.json({
        status: false,
        message: `Chapter '${codingChapterName}' not found for course '${courseName}'`,
      });
    }

    const totalQuestions = chapter.questions.length;

    // 3. For each student, count completed problems
    const report = await Promise.all(
      students.map(async (student) => {
        const email = student.basic.emailAddress;

        const completedCount = await CodingCompletion.countDocuments({
          userName: email,
          chapterName: codingChapterName,
        });

        return {
          name: `${student.basic.firstName} ${student.basic.lastName}`,
          email,
          completedQuestions: completedCount,
          totalQuestions,
        };
      })
    );
    report.sort((a, b) => b.completedQuestions - a.completedQuestions);

    // 4. Return response
    res.json({
      status: true,
      totalStudents: report.length,
      totalQuestions,
      data: report,
    });
  } catch (error) {
    console.error("Error generating coding report:", error);
    res.json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
