const express = require('express');
const router = express.Router();
const ExamSection = require('../models/examSection'); // Adjust path as per your folder structure
const Exams = require('../models/Exams'); // path may vary
const Question = require('../models/Question'); 
const Category = require('../models/Categories'); 
const Student = require('../models/Student')

function addTimes(time1, time2) {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  let minutes = m1 + m2;
  let hours = h1 + h2 + Math.floor(minutes / 60);
  minutes %= 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const getStatusFromPercentage = (percentString) => {
  const percent = parseFloat(percentString.replace('%', ''));
  return percent >= 70 ? 'passed' : 'failed';
};

function addTimes(time1, time2) {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  let minutes = m1 + m2;
  let hours = h1 + h2 + Math.floor(minutes / 60);
  minutes %= 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

router.post('/exam-consolated-summary', async (req, res) => {
  try {
    const { examNames } = req.body;

    if (!Array.isArray(examNames) || examNames.length === 0) {
      return res.status(400).json({ status: false, error: 'examNames (array) is required' });
    }

    // Parallelize DB queries
    const [exams, attemptResults] = await Promise.all([
      Exams.find({ examName: { $in: examNames } }, { examName: 1, category: 1 }).lean(),
      ExamSection.aggregate([
        { $match: { examName: { $in: examNames } } },
        { $unwind: "$sections" },
        {
          $group: {
            _id: {
              emailAddress: "$emailAddress",
              fullName: "$fullName",
              examName: "$examName",
              sectionName: "$sections.sectionName"
            },
            totalCorrect: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$sections.questions",
                    as: "q",
                    cond: { $eq: ["$$q.status", "correct"] }
                  }
                }
              }
            },
            totalWrong: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$sections.questions",
                    as: "q",
                    cond: { $eq: ["$$q.status", "wrong"] }
                  }
                }
              }
            },
            timeTaken: { $first: "$sections.timeTaken" },
            totalMarks: { $first: "$sections.totalMarks" },
            noOfquestions: { $first: "$sections.noOfquestions" }
          }
        },
        {
          $addFields: {
            marksObtained: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$totalCorrect", "$noOfquestions"] },
                    "$totalMarks"
                  ]
                },
                2
              ]
            }
          }
        },
        {
          $group: {
            _id: { emailAddress: "$_id.emailAddress", fullName: "$_id.fullName" },
            examRecords: {
              $push: {
                examName: "$_id.examName",
                sectionName: "$_id.sectionName",
                totalCorrect: "$totalCorrect",
                totalWrong: "$totalWrong",
                timeTaken: "$timeTaken",
                marksObtained: "$marksObtained"
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            emailAddress: "$_id.emailAddress",
            fullName: "$_id.fullName",
            examRecords: 1
          }
        }
      ])
    ]);

    if (!exams.length) return res.json({ status: false, error: 'No exams found' });

    const examCategories = exams.map(e => e.category);
    const categories = await Category.find(
      { categoryName: { $in: examCategories } },
      { courseName: 1, categoryName: 1 }
    ).lean();

    const courseNames = categories.map(c => c.courseName);

    const students = await Student.find(
      { "basic.courseName.courseName": { $in: courseNames }, "basic.isActive": true },
      { "basic.firstName": 1, "basic.lastName": 1, "basic.emailAddress": 1 }
    ).lean();

    // Map attempt results by email
    const attemptMap = new Map(attemptResults.map(r => [r.emailAddress, r]));

    const finalData = students.map(stu => {
      const studentEmail = stu.basic.emailAddress;
      const attempt = attemptMap.get(studentEmail);
      const studentRecords = attempt ? attempt.examRecords : [];
      const fullName = `${stu.basic.firstName} ${stu.basic.lastName}`;

      const consolidatedRecords = examNames.map(examName => {
        const recordsForExam = studentRecords.filter(rec => rec.examName === examName);
        return recordsForExam.length > 0
          ? recordsForExam
          : [{
              examName,
              sectionName: 'N/A',
              totalCorrect: 'N/A',
              totalWrong: 'N/A',
              timeTaken: 'N/A',
              marksObtained: 'Absent'
            }];
      }).flat();

      return { emailAddress: studentEmail, fullName, examRecords: consolidatedRecords };
    });

    // Sort by total correct desc
    finalData.sort((a, b) =>
      b.examRecords.reduce((s, r) => s + (Number(r.totalCorrect) || 0), 0) -
      a.examRecords.reduce((s, r) => s + (Number(r.totalCorrect) || 0), 0)
    );

    res.json({ status: true, data: finalData });
  } catch (err) {
    console.error("Error in /exam-consolated-summary:", err);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});


// -------------------------
// Exam Attempted
// -------------------------
router.get('/exam-attempted', async (req, res) => {
  try {
    const { emailAddress } = req.query;
    if (!emailAddress) return res.json({ status: false, message: 'emailAddress is required' });

    const records = await ExamSection.find(
      { emailAddress },
      { examName: 1, sections: 1 }
    ).lean();

    if (!records.length) {
      return res.json({ status: false, message: 'No records found', count: 0, records: [] });
    }

    res.json({ status: true, message: 'Records found', count: records.length, records });
  } catch (error) {
    console.error("Error in /exam-attempted:", error);
    res.status(500).json({ status: false, message: 'Something went wrong' });
  }
});

// -------------------------
// Exam Summary
// -------------------------
router.post('/exam-summary', async (req, res) => {
  try {
    const { examName, emailAddress, fullName } = req.body;
    if (!examName || !emailAddress || !fullName) {
      return res.json({ status: false, message: 'examName, emailAddress & fullName required' });
    }

    const record = await ExamSection.findOne(
      { examName, emailAddress, fullName },
      { sections: 1 }
    ).lean();

    if (!record) return res.json({ status: false, message: 'No record found' });

    const summary = record.sections.map(section => {
      const totalCorrect = section.questions.filter(q => q.status === "correct").length;
      const totalWrong = section.questions.filter(q => q.status === "wrong").length;
      const marksObtained = ((totalCorrect / section.noOfquestions) * section.totalMarks).toFixed(2);

      return {
        sectionName: section.sectionName,
        totalCorrect,
        totalWrong,
        timeTaken: section.timeTaken,
        marksObtained
      };
    });

    res.json({ status: true, message: 'Summary fetched successfully', data: summary });
  } catch (error) {
    console.error("Error in /exam-summary:", error);
    res.status(500).json({ status: false, message: 'Something went wrong' });
  }
});

// -------------------------
// Exam Result Summary
// -------------------------
router.post('/exam-result-summary', async (req, res) => {
  try {
    const { examName, emailAddress, fullName } = req.body;
    if (!examName || !emailAddress || !fullName) {
      return res.json({ status: false, message: 'examName, emailAddress & fullName required' });
    }

    const record = await ExamSection.findOne(
      { examName, emailAddress, fullName },
      { sections: 1 }
    ).lean();

    if (!record) return res.json({ status: false, message: 'No record found' });

    const summary = record.sections.map(section => {
      const totalCorrect = section.questions.filter(q => q.status === "correct").length;
      const totalWrong = section.questions.filter(q => q.status === "wrong").length;
      const marksObtained = ((totalCorrect / section.noOfquestions) * section.totalMarks).toFixed(2);

      return {
        sectionName: section.sectionName,
        totalCorrect,
        totalWrong,
        timeTaken: section.timeTaken,
        marksObtained,
        totalMarks: section.totalMarks,
        noOfquestions: section.noOfquestions
      };
    });

    const totalMarksObtained = summary.reduce((sum, sec) => sum + Number(sec.marksObtained), 0);
    const totalMarks = summary.reduce((sum, sec) => sum + sec.totalMarks, 0);
    const totalCorrect = summary.reduce((sum, sec) => sum + sec.totalCorrect, 0);
    const totalWrong = summary.reduce((sum, sec) => sum + sec.totalWrong, 0);
    const totalQuestions = summary.reduce((sum, sec) => sum + sec.noOfquestions, 0);
    const totalTimeTaken = summary.reduce((time, sec) => addTimes(time, sec.timeTaken), '00:00');

    const resultSummary = {
      totalMarksObtained,
      totalMarks,
      totalCorrect,
      totalWrong,
      totalQuestions,
      totalTimeTaken
    };

    res.json({ status: true, message: 'Result summary fetched successfully', data: resultSummary });
  } catch (error) {
    console.error("Error in /exam-result-summary:", error);
    res.status(500).json({ status: false, message: 'Something went wrong' });
  }
});


// POST /exam/addSection
router.post('/addSection', async (req, res) => {
  try {
    const { examName, emailAddress, fullName, section, status } = req.body;

    if (!examName || !emailAddress || !fullName || !section || !section.sectionName) {
      return res.json({ status: false, message: "examName, emailAddress, fullName, sectionName required" });
    }

    const questions = Array.isArray(section.questions) ? section.questions : [];

    // ✅ Pre-compute per-section stats before DB call
    const totalAttempted = questions.filter(q => q.userAnswer !== null).length || 0;
    const totalCorrect = questions.filter(q => q.status === "correct").length || 0;
    const totalWrong = questions.filter(q => q.status === "wrong").length || 0;
    const marksObtained = section.noOfquestions > 0 
      ? Number(((totalCorrect / section.noOfquestions) * section.totalMarks).toFixed(2)) 
      : 0;

    section.attempted = totalAttempted;
    section.correct = totalCorrect;
    section.wrong = totalWrong;
    section.marksObtained = marksObtained;
    section.timeTaken = section.timeTaken || '00:00';

    // ✅ Try update existing section atomically
    let record = await ExamSection.findOneAndUpdate(
      {
        examName,
        emailAddress,
        fullName,
        "sections.sectionName": section.sectionName
      },
      {
        $set: {
          "sections.$.questions": section.questions,
          "sections.$.attempted": section.attempted,
          "sections.$.correct": section.correct,
          "sections.$.wrong": section.wrong,
          "sections.$.marksObtained": section.marksObtained,
          "sections.$.timeTaken": section.timeTaken,
          "sections.$.totalMarks": section.totalMarks,
          "sections.$.noOfquestions": section.noOfquestions,
          "sections.$.totalDuration": section.totalDuration
        }
      },
      { new: true }
    );

    if (!record) {
      // ✅ If no matching section → push as new
      record = await ExamSection.findOneAndUpdate(
        { examName, emailAddress, fullName },
        {
          $push: { sections: section },
          $setOnInsert: { status: 'in-progress', startedAt: new Date() }
        },
        { new: true, upsert: true }
      );
    }

    // ✅ Recompute totals (still need to aggregate at app level)
    let totalMarksObtained = 0, totalMarks = 0, totalCorrectAll = 0, totalWrongAll = 0, totalQuestions = 0, totalTimeTaken = '00:00';

    record.sections.forEach(sec => {
      totalMarksObtained += Number(sec.marksObtained || 0);
      totalMarks += Number(sec.totalMarks || 0);
      totalCorrectAll += Number(sec.correct || 0);
      totalWrongAll += Number(sec.wrong || 0);
      totalQuestions += Number(sec.noOfquestions || 0);
      totalTimeTaken = addTimes(totalTimeTaken, sec.timeTaken || '00:00');
    });

    await ExamSection.updateOne(
      { _id: record._id },
      {
        $set: {
          totalMarksObtained,
          totalMarks,
          totalCorrect: totalCorrectAll,
          totalWrong: totalWrongAll,
          totalQuestions,
          totalTimeTaken,
          ...(status && {
            status,
            completedAt: status === "completed" ? new Date() : undefined
          })
        }
      }
    );

    res.json({ status: true, message: "Section saved successfully", data: record });
  } catch (error) {
    console.error("Error in /addSection:", error);
    res.status(500).json({ status: false, message: "Something went wrong" });
  }
});

// 📌 Start Exam Route
router.post('/startExam', async (req, res) => {
  try {
    const { examName, emailAddress, fullName } = req.body;

    if (!examName || !emailAddress || !fullName) {
      return res.json({ status: false, message: "examName, emailAddress, fullName required" });
    }

    // Check if exam already started
    let record = await ExamSection.findOne({ examName, emailAddress, fullName });

    if (!record) {
      // New exam attempt
      record = new ExamSection({
        examName,
        emailAddress,
        fullName,
        status: "in-progress",
        startedAt: new Date(), // set when exam starts
      });
    } else if (!record.startedAt) {
      // Exam exists but no startedAt → set it
      record.startedAt = new Date();
      record.status = "in-progress";
    }

    await record.save();

    res.json({ status: true, message: "Exam started successfully", data: record });
  } catch (error) {
    console.error("Error in /startExam:", error);
    res.status(500).json({ status: false, message: "Something went wrong" });
  }
});

router.get('/exam-result-summary', async (req, res) => {
  const { emailAddress } = req.query;

  if (!emailAddress) {
    return res.json({ status: false, message: "emailAddress is required" });
  }

  try {
    const tests = await ExamSection.find({ emailAddress }).sort({ createdAt: -1 });;

    if (!tests || tests.length === 0) {
      return res.json({ status: true, message: "No records found", data: [] });
    }

    const results = tests.map(test => {
      let totalMarks = 0;
      let marksReceived = 0;

      (test.sections || []).forEach(section => {
        const sectionMarks = section.totalMarks || 0;
        const correct = (section.questions || []).filter(q => q.status === 'correct').length;

        totalMarks += sectionMarks;
        marksReceived += correct;
      });

      const percentage = totalMarks > 0
        ? `${((marksReceived / totalMarks) * 100).toFixed(2)}%`
        : "0.00%";

      return {
        examName: test.examName,
        percentage,
        status: getStatusFromPercentage(percentage)
      };
    });

    res.json({ status: true, data: results });

  } catch (err) {
    console.error(err);
    res.json({ status: false, message: "Server error" });
  }
});


router.post('/exam-stats', async (req, res) => {
  try {
    const { examName } = req.body;
    if (!examName) return res.json({ status: false, message: 'examName is required' });

    const exam = await Exams.findOne({ examName }, { examName: 1, category: 1 }).lean();
    if (!exam) return res.json({ status: false, message: 'Exam not found' });

    const sections = await Question.find({ examName }, { sectionName: 1 }).lean();

    const sectionStats = await Promise.all(
      sections.map(async sec => {
        const attempts = await ExamSection.find(
          { examName, "sections.sectionName": sec.sectionName },
          { "sections.$": 1 }
        ).lean();

        let totalCorrect = 0, totalWrong = 0, timeTaken = '00:00', marksObtained = 0;
        attempts.forEach(attempt => {
          const section = attempt.sections[0];
          const correct = section.questions.filter(q => q.status === "correct").length;
          const wrong = section.questions.filter(q => q.status === "wrong").length;
          totalCorrect += correct;
          totalWrong += wrong;
          marksObtained += (correct / section.noOfquestions) * section.totalMarks;
          timeTaken = addTimes(timeTaken, section.timeTaken);
        });

        return {
          sectionName: sec.sectionName,
          totalCorrect,
          totalWrong,
          marksObtained: marksObtained.toFixed(2),
          timeTaken
        };
      })
    );

    res.json({ status: true, message: 'Exam stats fetched successfully', data: { examName, sectionStats } });
  } catch (error) {
    console.error("Error in /exam-stats:", error);
    res.status(500).json({ status: false, message: 'Something went wrong' });
  }
});

router.post('/exam/section-questions', async (req, res) => {
  const { subjectName, chapterName, noOfquestions } = req.body;

  if (
    typeof subjectName !== 'string' ||
    typeof chapterName !== 'string' ||
    isNaN(noOfquestions) ||
    parseInt(noOfquestions) <= 0
  ) {
    return res.status(400).json({
      status: false,
      message: 'Valid subjectName, chapterName, and noOfquestions are required'
    });
  }

  const sampleSize = parseInt(noOfquestions);

  try {
    const questions = await Question.aggregate([
      {
        $match: { subjectName, chapterName }
      },
      {
        $sample: { size: sampleSize }
      },
      {
        $project: {
          questionText: 1,
          options: 1,
          answer: 1
        }
      }
    ]);

    const formattedQuestions = questions.map(({ questionText, options, answer }) => ({
      questionText,
      options,
      answer: Buffer.from(answer).toString('base64'),
      userAnswer: ''
    }));

    res.json({
      status: true,
      data: {
        subjectName,
        chapterName,
        noOfquestions: formattedQuestions.length,
        questions: formattedQuestions
      }
    });
  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    res.status(500).json({
      status: false,
      message: 'Internal Server Error'
    });
  }
});

// 2. Get records by examName
router.get('/examName/:examName', async (req, res) => {
  try {
    const { examName } = req.params;
    const records = await ExamSection.find({ examName }).lean();
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/result-by-user/:examName/:emailAddress', async (req, res) => {
  try {
    const { examName,emailAddress } = req.params;
    const records = await ExamSection.find({ examName, emailAddress }).lean();
    res.json({status:true,message:records});
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

// 3. Get records by emailAddress and fullName (query params)
router.get('/user', async (req, res) => {
  try {
    const { emailAddress, fullName } = req.query;

    if (!emailAddress || !fullName) {
      return res.status(400).json({ error: 'emailAddress and fullName are required' });
    }

    const records = await ExamSection.find({ emailAddress, fullName }).lean();
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;