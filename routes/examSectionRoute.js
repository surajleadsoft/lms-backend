const express = require('express');
const router = express.Router();

// Models
const ExamSection = require('../models/examSection');
const Exams = require('../models/Exams');
const Question = require('../models/Question');
const Category = require('../models/Categories');
const Student = require('../models/Student');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Normalizes question type strings into standardized uppercase formats.
 */
function normalizeQuestionType(type) {
  return String(type || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Normalizes user/correct answer text by removing HTML tags, decoding entities,
 * and stripping extra whitespace for accurate comparison.
 */
function normalizeAnswer(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\u00a0/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Validates if an answer is non-existent or empty.
 */
function isEmptyAnswer(answer) {
  if (answer === null || answer === undefined) return true;
  if (Array.isArray(answer)) {
    return answer.every(item => normalizeAnswer(item) === "");
  }
  return normalizeAnswer(answer) === "";
}

/**
 * Safely extracts raw string values from primitive or object options.
 */
function extractOptionValue(option) {
  if (option === null || option === undefined) return "";
  if (typeof option === "object") {
    return String(option.value ?? option.text ?? option.label ?? option.option ?? "");
  }
  return String(option);
}

/**
 * Extracts options array out of primitive arrays or dynamic key-value option objects.
 */
function getOptions(question) {
  const options = question?.options;
  if (!options) return [];

  if (Array.isArray(options)) {
    return options.map((option, index) => ({
      key: `option${index + 1}`,
      index,
      value: extractOptionValue(option)
    }));
  }

  if (typeof options === "object") {
    return Object.entries(options)
      .filter(([key]) => /^option\d+$/i.test(key))
      .sort(([a], [b]) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10))
      .map(([key, value], index) => ({
        key,
        index,
        value: extractOptionValue(value)
      }));
  }

  return [];
}

/**
 * Resolves option references ("A", "option1", raw option text) to the target string.
 */
function resolveSingleChoice(question, answer) {
  const submitted = normalizeAnswer(answer);
  if (!submitted) return null;

  const options = getOptions(question);
  for (const option of options) {
    const value = normalizeAnswer(option.value);
    const key = normalizeAnswer(option.key);
    const letter = String.fromCharCode(65 + option.index).toLowerCase();

    if (submitted === value || submitted === key || submitted === letter) {
      return option.value.trim();
    }
  }
  return null;
}

/**
 * Adds time strings in HH:MM:SS or MM:SS format.
 */
function addTimes(t1 = "00:00:00", t2 = "00:00:00") {
  const parse = (t) => {
    const parts = String(t).split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };
  
  const sec1 = parse(t1);
  const sec2 = parse(t2);
  const total = sec1 + sec2;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [hours, minutes, seconds]
    .map(v => String(v).padStart(2, '0'))
    .join(':');
}

// ============================================================
// QUESTION EVALUATORS
// ============================================================

function evaluateSingleChoice(question, userAnswer) {
  if (isEmptyAnswer(userAnswer)) {
    return { status: "skipped", attempted: false, correct: false, obtainedMarks: 0, userAnswer: null, correctAnswer: question.answer ?? null };
  }

  const resolvedUserAnswer = resolveSingleChoice(question, userAnswer);
  if (resolvedUserAnswer === null) {
    throw new Error(`Invalid option selected for question ${question._id}`);
  }

  const resolvedCorrectAnswer = resolveSingleChoice(question, question.answer);
  const finalCorrectAnswer = resolvedCorrectAnswer !== null ? resolvedCorrectAnswer : String(question.answer ?? "");
  const correct = normalizeAnswer(resolvedUserAnswer) === normalizeAnswer(finalCorrectAnswer);

  return {
    status: correct ? "correct" : "wrong",
    attempted: true,
    correct,
    obtainedMarks: correct ? Number(question.marks || 0) : 0,
    userAnswer: resolvedUserAnswer,
    correctAnswer: finalCorrectAnswer
  };
}

function evaluateTrueFalse(question, userAnswer) {
  if (isEmptyAnswer(userAnswer)) {
    return { status: "skipped", attempted: false, correct: false, obtainedMarks: 0, userAnswer: null };
  }

  const user = normalizeAnswer(userAnswer);
  if (user !== "true" && user !== "false") {
    throw new Error("Invalid TRUE_FALSE answer");
  }

  const correctAnswer = normalizeAnswer(question.answer);
  const correct = user === correctAnswer;

  return {
    status: correct ? "correct" : "wrong",
    attempted: true,
    correct,
    obtainedMarks: correct ? Number(question.marks || 0) : 0,
    userAnswer: user,
    correctAnswer
  };
}

function evaluateMultipleChoice(question, userAnswer) {
  if (!Array.isArray(userAnswer) || userAnswer.length === 0) {
    return { status: "skipped", attempted: false, correct: false, obtainedMarks: 0, userAnswer: [] };
  }

  const resolve = answer => {
    const result = resolveSingleChoice(question, answer);
    return result ? normalizeAnswer(result) : null;
  };

  const submitted = userAnswer.map(resolve).filter(Boolean);
  if (submitted.length !== userAnswer.length) {
    throw new Error("Invalid multiple-choice option selected");
  }

  const correctAnswers = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];
  const correct = correctAnswers.map(resolve).filter(Boolean);

  submitted.sort();
  correct.sort();

  const isCorrect = submitted.length === correct.length && submitted.every((val, idx) => val === correct[idx]);

  return {
    status: isCorrect ? "correct" : "wrong",
    attempted: true,
    correct: isCorrect,
    obtainedMarks: isCorrect ? Number(question.marks || 0) : 0,
    userAnswer: submitted
  };
}

function evaluateFillBlank(question, userAnswer) {
  const answers = Array.isArray(userAnswer) ? userAnswer : [];
  const accepted = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [];
  const blankCount = accepted.length;

  if (blankCount === 0) {
    return { status: "skipped", attempted: false, correct: false, obtainedMarks: 0, blankResults: [] };
  }

  let attemptedCount = 0;
  let correctCount = 0;
  const blankResults = new Array(blankCount);

  for (let i = 0; i < blankCount; i++) {
    const rawUser = answers[i] ?? "";
    const user = normalizeAnswer(rawUser);
    const acceptedForBlank = Array.isArray(accepted[i]) ? accepted[i] : [];
    const acceptedNormalized = acceptedForBlank.map(normalizeAnswer).filter(Boolean);

    const attempted = user !== "";
    const correct = attempted && acceptedNormalized.includes(user);

    if (attempted) attemptedCount++;
    if (correct) correctCount++;

    blankResults[i] = {
      blank: `BLANK_${i + 1}`,
      userAnswer: rawUser,
      correct,
      acceptedAnswers: acceptedForBlank
    };
  }

  if (attemptedCount === 0) {
    return { status: "skipped", attempted: false, correct: false, obtainedMarks: 0, blankResults };
  }

  const marks = Number(question.marks || 0);
  const obtainedMarks = Number((marks * (correctCount / blankCount)).toFixed(2));
  const correct = correctCount === blankCount;

  return {
    status: correct ? "correct" : "wrong",
    attempted: true,
    correct,
    obtainedMarks,
    userAnswer: answers,
    blankResults
  };
}

function calculateCodingMarks(question, codingSubmission) {

    console.log(
        "\n========== CODING MARK CALCULATION =========="
    );

    console.log(
        "Question ID:",
        question?._id
    );

    console.log(
        "Question Marks:",
        question?.marks
    );


    // ============================================================
    // GET HIDDEN TEST CASES
    // ============================================================

    let hiddenTests = [];

    if (
        Array.isArray(
            question?.coding?.hiddenTestCases
        )
    ) {
        hiddenTests =
            question.coding.hiddenTestCases;

    } else if (
        Array.isArray(
            question?.hiddenTestCases
        )
    ) {
        hiddenTests =
            question.hiddenTestCases;

    } else if (
        Array.isArray(
            question?.testCases
        )
    ) {
        hiddenTests =
            question.testCases.filter(
                tc =>
                    tc?.isHidden === true ||
                    tc?.is_hidden === true ||
                    tc?.hidden === true
            );
    }


    // ============================================================
    // GET TEST RESULTS
    // ============================================================

    let results = [];

    if (
        Array.isArray(
            codingSubmission?.hiddenTestResults
        ) &&
        codingSubmission.hiddenTestResults.length > 0
    ) {

        results =
            codingSubmission.hiddenTestResults;

    } else if (
        Array.isArray(
            codingSubmission?.testResults
        ) &&
        codingSubmission.testResults.length > 0
    ) {

        results =
            codingSubmission.testResults;

    } else if (
        Array.isArray(
            codingSubmission
                ?.codingResult
                ?.hiddenTestResults
        ) &&
        codingSubmission
            .codingResult
            .hiddenTestResults.length > 0
    ) {

        results =
            codingSubmission
                .codingResult
                .hiddenTestResults;
    }


    // ============================================================
    // CHECK WHETHER CODE WAS SUBMITTED
    // ============================================================

    const hasCode =
        Boolean(
            codingSubmission?.code &&
            String(
                codingSubmission.code
            ).trim().length > 0
        );


    // ============================================================
    // NO HIDDEN TEST CASES
    // ============================================================

    if (
        hiddenTests.length === 0
    ) {

        console.log(
            "No hidden test cases found."
        );

        return {

            status:
                hasCode
                    ? "wrong"
                    : "skipped",

            attempted:
                hasCode,

            correct:
                false,

            obtainedMarks:
                0,

            weightedPassed:
                0,

            weightedTotal:
                0,

            passedTestCases:
                0,

            totalTestCases:
                0,

            hiddenTestResults:
                []
        };
    }


    // ============================================================
    // GET QUESTION MARKS
    //
    // Coding question marks come from question.marks.
    //
    // Example:
    //
    // question.marks = 15
    // ============================================================

    const totalQuestionMarks =
        Number(
            question?.marks ??
            question?.coding?.marks ??
            question?.totalMarks ??
            15
        );


    // ============================================================
    // TOTAL HIDDEN TEST CASES
    // ============================================================

    const totalTestCases =
        hiddenTests.length;


    // ============================================================
    // MARKS FOR EACH HIDDEN TEST CASE
    //
    // Example:
    //
    // Question = 15 marks
    // Hidden tests = 5
    //
    // 15 / 5 = 3 marks per test
    // ============================================================

    const marksPerTestCase =
        totalTestCases > 0
            ? totalQuestionMarks /
              totalTestCases
            : 0;


    // ============================================================
    // BUILD FINAL HIDDEN TEST RESULT ARRAY
    // ============================================================

    const hiddenTestResults =
        hiddenTests.map(
            (testCase, index) => {

                const testCaseNumber =
                    index + 1;


                // ====================================================
                // FIND RESULT FOR CURRENT TEST CASE
                // ====================================================

                const result =
                    results.find(
                        r =>
                            Number(
                                r?.testCase
                            ) ===
                            testCaseNumber
                    ) ||
                    results.find(
                        r =>
                            Number(
                                r?.testCaseId
                            ) ===
                            testCaseNumber
                    ) ||
                    results[index] ||
                    {};


                // ====================================================
                // READ STATUS DESCRIPTION
                // ====================================================

                const statusDescription =
                    typeof result?.status === "object"
                        ? String(
                            result
                                ?.status
                                ?.description ||
                            ""
                        )
                        : String(
                            result?.status ||
                            ""
                        );


                // ====================================================
                // READ VERDICT
                // ====================================================

                const verdict =
                    String(
                        result?.verdict ||
                        ""
                    )
                        .trim()
                        .toUpperCase();


                // ====================================================
                // CHECK WHETHER THIS TEST PASSED
                // ====================================================

                const passed =
                    result?.passed === true ||

                    result?.passed === "true" ||

                    result?.isPassed === true ||

                    result?.success === true ||

                    statusDescription
                        .trim()
                        .toLowerCase() ===
                        "passed" ||

                    statusDescription
                        .trim()
                        .toLowerCase() ===
                        "accepted" ||

                    verdict ===
                        "ACCEPTED" ||

                    verdict ===
                        "PASSED" ||

                    Number(
                        result?.statusId
                    ) === 3 ||

                    Number(
                        result?.status?.id
                    ) === 3;


                // ====================================================
                // MARKS FOR THIS TEST CASE
                //
                // PASSED = equal share of question marks
                // FAILED = 0
                // ====================================================

                const marksAwarded =
                    passed
                        ? Number(
                            marksPerTestCase.toFixed(2)
                        )
                        : 0;


                return {

                    testCase:
                        testCaseNumber,

                    passed,

                    marksAwarded,

                    // Keep for compatibility
                    weight:
                        1,

                    actualOutput:
                        result?.actualOutput ??
                        result?.output ??
                        "",

                    expectedOutput:
                        testCase?.expectedOutput ??
                        testCase?.output ??
                        "",

                    verdict:
                        result?.verdict ??
                        statusDescription ??
                        ""
                };
            }
        );


    // ============================================================
    // COUNT PASSED HIDDEN TEST CASES
    // ============================================================

    const passedHiddenTestCases =
        hiddenTestResults.filter(
            testCase =>
                testCase.passed === true
        ).length;


    // ============================================================
    // CALCULATE OBTAINED MARKS
    //
    // THIS IS THE IMPORTANT PART.
    //
    // obtainedMarks =
    //
    // passed hidden tests
    // ×
    // marks for each hidden test
    //
    // Example:
    //
    // Question = 15
    // Tests = 5
    // Passed = 3
    //
    // Marks/test = 15 / 5 = 3
    //
    // Obtained = 3 × 3 = 9
    // ============================================================

    const obtainedMarks =
        Number(
            (
                passedHiddenTestCases *
                marksPerTestCase
            ).toFixed(2)
        );


    // ============================================================
    // QUESTION IS CORRECT ONLY IF ALL TESTS PASSED
    // ============================================================

    const correct =
        passedHiddenTestCases ===
        totalTestCases;


    // ============================================================
    // STATUS
    //
    // IMPORTANT:
    //
    // We DO NOT use "partial".
    //
    // Partial marks are represented through obtainedMarks.
    //
    // 3/5 tests:
    // status = wrong
    // obtainedMarks = 9
    // ============================================================

    let status;

    if (!hasCode) {

        status =
            "skipped";

    } else if (correct) {

        status =
            "correct";

    } else {

        status =
            "wrong";
    }


    // ============================================================
    // DEBUG
    // ============================================================

    console.log(
        "--------------------------------------------"
    );

    console.log(
        "Question Marks:",
        totalQuestionMarks
    );

    console.log(
        "Hidden Test Cases:",
        totalTestCases
    );

    console.log(
        "Marks Per Test Case:",
        marksPerTestCase
    );

    console.log(
        "Passed Hidden Tests:",
        passedHiddenTestCases
    );

    console.log(
        "Failed Hidden Tests:",
        totalTestCases -
        passedHiddenTestCases
    );

    console.log(
        "Obtained Marks:",
        obtainedMarks
    );

    console.log(
        "Status:",
        status
    );

    console.log(
        "--------------------------------------------"
    );


    // ============================================================
    // RETURN FINAL CODING RESULT
    // ============================================================

    return {

        status,

        attempted:
            hasCode,

        correct,

        obtainedMarks,

        // These remain COUNTS for compatibility
        // with your existing ExamSection schema.

        weightedPassed:
            passedHiddenTestCases,

        weightedTotal:
            totalTestCases,

        passedTestCases:
            passedHiddenTestCases,

        totalTestCases,

        hiddenTestResults
    };
}
function evaluateQuestion(question, userAnswer, codingSubmission = null) {
  if (!question) throw new Error("Question data is required");

  const type = normalizeQuestionType(question.questionType);

  switch (type) {
    case "SINGLE_CHOICE":
    case "SINGLE_CHOICE_QUESTION":
    case "MCQ":
      return evaluateSingleChoice(question, userAnswer);
    case "TRUE_FALSE":
    case "TRUE_FALSE_QUESTION":
      return evaluateTrueFalse(question, userAnswer);
    case "MULTIPLE_CHOICE":
    case "MULTIPLE_CHOICE_QUESTION":
    case "MULTI_CHOICE":
      return evaluateMultipleChoice(question, userAnswer);
    case "FILL_BLANK":
    case "FILL_IN_THE_BLANK":
    case "FILL":
      return evaluateFillBlank(question, userAnswer);
    case "CODING":
      return calculateCodingMarks(question, codingSubmission);
    default:
      throw new Error(`Unsupported question type: ${question.questionType}`);
  }
}

// ============================================================
// API ROUTES
// ============================================================

router.post('/exam-consolated-summary', async (req, res) => {
  try {
    const { examNames } = req.body;
    if (!Array.isArray(examNames) || examNames.length === 0) {
      return res.status(400).json({ status: false, error: 'examNames (array) is required' });
    }

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

    const attemptMap = new Map(attemptResults.map(r => [r.emailAddress, r]));

    const finalData = students.map(stu => {
      const studentEmail = stu.basic.emailAddress;
      const attempt = attemptMap.get(studentEmail);
      const studentRecords = attempt ? attempt.examRecords : [];
      const fullName = `${stu.basic.firstName} ${stu.basic.lastName}`;

      const consolidatedRecords = examNames.flatMap(examName => {
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
      });

      return { emailAddress: studentEmail, fullName, examRecords: consolidatedRecords };
    });

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

router.get("/exam-attempted", async (req, res) => {
  try {
    const { emailAddress } = req.query;
    if (!emailAddress) {
      return res.status(400).json({ status: false, message: "emailAddress is required." });
    }

    const records = await ExamSection.find({ emailAddress })
      .populate('sections.questions.questionId')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ status: true, count: records.length, records });
  } catch (error) {
    console.error("EXAM ATTEMPTED ERROR:", error);
    return res.status(500).json({ status: false, message: "Failed to fetch exam attempts." });
  }
});

router.get('/exam-summary', async (req, res) => {
  const { examName } = req.query;
  if (!examName) return res.json({ status: false, error: "examName is required" });

  try {
    const exam = await Exams.findOne({ examName }).lean();
    if (!exam) return res.json({ status: false, message: "Exam not found" });

    const categoryExam = await Category.findOne({ categoryName: exam.category }).lean();
    if (!categoryExam) return res.json({ status: false, message: "Category not found" });

    const allStudents = await Student.find(
      { "basic.courseName.courseName": categoryExam.courseName, "basic.isActive": true },
      { "basic.firstName": 1, "basic.lastName": 1, "basic.emailAddress": 1 }
    ).lean();

    const attemptedStudents = await ExamSection.find({ examName }).lean();
    const attemptedMap = new Map(attemptedStudents.map(record => [record.emailAddress, record]));

    const results = allStudents.map(student => {
      const fullName = `${student.basic.firstName} ${student.basic.lastName}`.trim();
      const emailAddress = student.basic.emailAddress;
      const examRecord = attemptedMap.get(emailAddress);

      if (!examRecord) {
        return {
          fullName,
          emailAddress,
          examName,
          markReceived: "-",
          totalMarks: "-",
          percentage: "Absent",
          totalTimeTaken: "-",
          status: "Absent",
          sections: []
        };
      }

      const { totalMarksObtained, totalTimeTaken, sections } = examRecord;
      const totalMarks = sections.reduce((sum, sec) => sum + (sec.totalMarks || 0), 0);
      const percentage = totalMarks > 0 ? `${((totalMarksObtained / totalMarks) * 100).toFixed(2)}%` : "0.00%";

      return {
        fullName,
        emailAddress,
        examName,
        markReceived: totalMarksObtained,
        totalMarks,
        percentage,
        totalTimeTaken,
        status: examRecord.status || "Present",
        sections: sections.map(sec => ({
          sectionName: sec.sectionName,
          timeTaken: sec.timeTaken,
          totalMarks: sec.totalMarks,
          marksReceived: sec.marksObtained
        }))
      };
    });

    res.json({ status: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, error: "Server error" });
  }
});

router.post("/addSection", async (req, res) => {
  try {
    const { examName, emailAddress, fullName, section, status } = req.body;

    if (!examName || !emailAddress || !fullName || !section || !section.sectionName) {
      return res.status(400).json({ status: false, message: "examName, emailAddress, fullName and section are required." });
    }

    const submittedQuestions = Array.isArray(section.questions) ? section.questions : [];
    const questionIds = submittedQuestions.map(q => q.questionId).filter(Boolean);

    const databaseQuestions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(databaseQuestions.map(q => [String(q._id), q]));

    const processedQuestions = [];

    for (const attemptedQuestion of submittedQuestions) {
      const originalQuestion = questionMap.get(String(attemptedQuestion.questionId));
      if (!originalQuestion) continue;

      const userAnswer = attemptedQuestion.userAnswer;
      const questionType = normalizeQuestionType(originalQuestion.questionType);

      // Extract and normalize coding payload
      let codingSubmission = null;
      // Replace the CODING extraction block inside router.post("/addSection")

      // Updated CODING processing inside router.post("/addSection")

      if (questionType === "CODING") {
        const rawCoding = attemptedQuestion.codingSubmission || attemptedQuestion.codingResult || {};
        
        const code = typeof userAnswer === "string" 
          ? userAnswer 
          : (userAnswer?.code || rawCoding.code || attemptedQuestion.code || "");

        // Gather hidden test results if forwarded by frontend
        let hiddenTestResults = 
          Array.isArray(rawCoding.hiddenTestResults) && rawCoding.hiddenTestResults.length > 0 ? rawCoding.hiddenTestResults :
          Array.isArray(attemptedQuestion.hiddenTestResults) && attemptedQuestion.hiddenTestResults.length > 0 ? attemptedQuestion.hiddenTestResults :
          Array.isArray(userAnswer?.hiddenTestResults) && userAnswer.hiddenTestResults.length > 0 ? userAnswer.hiddenTestResults :
          Array.isArray(rawCoding.codingResult?.hiddenTestResults) && rawCoding.codingResult.hiddenTestResults.length > 0 ? rawCoding.codingResult.hiddenTestResults : [];

        // Fallback: If frontend submitted code without test execution results, evaluate against DB hidden cases
        

        codingSubmission = {
          language: rawCoding.language || attemptedQuestion.language || userAnswer?.language || "java",
          code: code,
          hiddenTestResults: hiddenTestResults,
          codingResult: rawCoding.codingResult || rawCoding || userAnswer
        };

        console.log('CODING SUBMISSION = ',codingSubmission)
      }

      // Evaluate question against database version
      const result = evaluateQuestion(originalQuestion, userAnswer, codingSubmission);

      const processedQuestion = {
        questionId: originalQuestion._id,
        userAnswer: userAnswer ?? null,
        questionType,
        status: result.status,
        obtainedMarks: Number(result.obtainedMarks || 0)
      };

      if (questionType === "FILL_BLANK") {
        processedQuestion.blankResults = result.blankResults || [];
      }

      if (questionType === "CODING") {
    processedQuestion.codingResult = {
        language:
            codingSubmission?.language || "",

        code:
            codingSubmission?.code || "",

        verdict:
            result.status || "",

        passedTestCases:
            Number(result.passedTestCases || 0),

        totalTestCases:
            Number(result.totalTestCases || 0),

        weightedPassed:
            Number(result.weightedPassed || 0),

        weightedTotal:
            Number(result.weightedTotal || 0),

        obtainedMarks:
            Number(result.obtainedMarks || 0),

        totalMarks:
            Number(
                originalQuestion.marks ||
                originalQuestion.totalMarks ||
                15
            ),

        hiddenTestResults:
            result.hiddenTestResults || []
    };
}

      processedQuestions.push(processedQuestion);
    }

    const attempted =
    processedQuestions.filter(
        q => q.status !== "skipped"
    ).length;

const correct =
    processedQuestions.filter(
        q => q.status === "correct"
    ).length;

const wrong =
    processedQuestions.filter(
        q =>
            q.status === "wrong" ||
            q.status === "partial"
    ).length;

const skipped =
    processedQuestions.filter(
        q => q.status === "skipped"
    ).length;
    const marksObtained = Number(processedQuestions.reduce((sum, q) => sum + Number(q.obtainedMarks || 0), 0).toFixed(2));

    const sectionData = {
      sectionName: section.sectionName,
      totalDuration: Number(section.totalDuration || 0),
      totalMarks: Number(section.totalMarks || 0),
      noOfquestions: Number(section.noOfquestions || processedQuestions.length),
      questions: processedQuestions,
      attempted,
      correct,
      wrong,
      skipped,
      marksObtained,
      timeTaken: section.timeTaken || "00:00:00"
    };

    let examSection = await ExamSection.findOne({ emailAddress, examName });

    if (!examSection) {
      examSection = new ExamSection({
        emailAddress,
        fullName,
        examName,
        sections: [sectionData],
        status: "in-progress",
        startedAt: new Date()
      });
    } else {
      const existingIndex = examSection.sections.findIndex(s => s.sectionName === section.sectionName);
      if (existingIndex !== -1) {
        examSection.sections[existingIndex] = sectionData;
      } else {
        examSection.sections.push(sectionData);
      }
    }

    let totalQuestions = 0, totalAttempted = 0, totalCorrect = 0, totalWrong = 0, totalSkipped = 0, totalMarks = 0, totalMarksObtained = 0;
    let totalTimeTaken = "00:00:00";

    examSection.sections.forEach(currentSection => {
      totalQuestions += Number(currentSection.noOfquestions || 0);
      totalAttempted += Number(currentSection.attempted || 0);
      totalCorrect += Number(currentSection.correct || 0);
      totalWrong += Number(currentSection.wrong || 0);
      totalSkipped += Number(currentSection.skipped || 0);
      totalMarks += Number(currentSection.totalMarks || 0);
      totalMarksObtained += Number(currentSection.marksObtained || 0);
      totalTimeTaken = addTimes(totalTimeTaken, currentSection.timeTaken || "00:00:00");
    });

    examSection.totalQuestions = totalQuestions;
    examSection.totalAttempted = totalAttempted;
    examSection.totalCorrect = totalCorrect;
    examSection.totalWrong = totalWrong;
    examSection.totalSkipped = totalSkipped;
    examSection.totalMarks = Number(totalMarks.toFixed(2));
    examSection.totalMarksObtained = Number(totalMarksObtained.toFixed(2));
    examSection.totalTimeTaken = totalTimeTaken;

    const normalizedStatus = String(status || "").trim().toLowerCase();
    if (normalizedStatus === "completed") {
      examSection.status = "completed";
      examSection.completedAt = new Date();
    } else if (normalizedStatus === "cheated") {
      examSection.status = "cheated";
      examSection.completedAt = new Date();
    } else {
      examSection.status = "in-progress";
    }

    await examSection.save();

    return res.status(200).json({
      status: true,
      message: examSection.status === "completed" ? "Exam completed successfully." : "Section saved successfully.",
      examCompleted: examSection.status === "completed",
      data: {
        section: sectionData,
        totalQuestions: examSection.totalQuestions,
        totalAttempted: examSection.totalAttempted,
        totalCorrect: examSection.totalCorrect,
        totalWrong: examSection.totalWrong,
        totalSkipped: examSection.totalSkipped,
        totalMarks: examSection.totalMarks,
        totalMarksObtained: examSection.totalMarksObtained,
        totalTimeTaken: examSection.totalTimeTaken,
        examStatus: examSection.status,
        completedAt: examSection.completedAt || null
      }
    });
  } catch (error) {
    console.error("ADD SECTION ERROR:", error);
    return res.status(500).json({ status: false, message: "Failed to save section.", error: error.message });
  }
});

router.post('/startExam', async (req, res) => {
  try {
    const { examName, emailAddress, fullName } = req.body;
    if (!examName || !emailAddress || !fullName) {
      return res.json({ status: false, message: "examName, emailAddress, fullName required" });
    }

    let record = await ExamSection.findOne({ examName, emailAddress, fullName });

    if (!record) {
      record = new ExamSection({
        examName,
        emailAddress,
        fullName,
        status: "in-progress",
        startedAt: new Date()
      });
    } else if (!record.startedAt) {
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

router.post("/exam-result-summary", async (req, res) => {
  try {
    const { examName, emailAddress } = req.body;
    if (!examName || !emailAddress) {
      return res.status(400).json({ status: false, message: "examName and emailAddress are required." });
    }

    const record = await ExamSection.findOne({ examName, emailAddress }).lean();
    if (!record) return res.json({ status: false, message: "No exam record found." });

    const summary = (record.sections || []).map(section => ({
      sectionName: section.sectionName,
      totalCorrect: Number(section.correct || 0),
      totalWrong: Number(section.wrong || 0),
      totalSkipped: Number(section.skipped || 0),
      totalAttempted: Number(section.attempted || 0),
      timeTaken: section.timeTaken,
      marksObtained: Number(section.marksObtained || 0),
      totalMarks: Number(section.totalMarks || 0),
      noOfquestions: Number(section.noOfquestions || 0)
    }));

    const totalMarks = summary.reduce((sum, sec) => sum + sec.totalMarks, 0);
    const totalMarksObtained = summary.reduce((sum, sec) => sum + sec.marksObtained, 0);
    const totalCorrect = summary.reduce((sum, sec) => sum + sec.totalCorrect, 0);
    const totalWrong = summary.reduce((sum, sec) => sum + sec.totalWrong, 0);
    const totalSkipped = summary.reduce((sum, sec) => sum + sec.totalSkipped, 0);
    const totalQuestions = summary.reduce((sum, sec) => sum + sec.noOfquestions, 0);
    const totalAttempted = summary.reduce((sum, sec) => sum + sec.totalAttempted, 0);
    const totalTimeTaken = summary.reduce((total, sec) => addTimes(total, sec.timeTaken || "00:00:00"), "00:00:00");

    const percentage = totalMarks > 0 ? Number(((totalMarksObtained / totalMarks) * 100).toFixed(2)) : 0;

    return res.json({
      status: true,
      message: "Result summary fetched successfully.",
      data: {
        examName: record.examName,
        totalMarks: Number(totalMarks.toFixed(2)),
        totalMarksObtained: Number(totalMarksObtained.toFixed(2)),
        percentage: `${percentage}%`,
        totalQuestions,
        totalAttempted,
        totalCorrect,
        totalWrong,
        totalSkipped,
        totalTimeTaken,
        status: record.status,
        sections: summary
      }
    });
  } catch (error) {
    console.error("EXAM RESULT SUMMARY ERROR:", error);
    return res.status(500).json({ status: false, message: "Failed to fetch exam result." });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [examCount, questionCount, categoryCount, attemptCount] = await Promise.all([
      Exams.countDocuments(),
      Question.countDocuments(),
      Category.countDocuments(),
      ExamSection.countDocuments()
    ]);

    res.json({
      status: true,
      data: {
        totalExams: examCount,
        totalQuestions: questionCount,
        totalCategories: categoryCount,
        totalExamAttempts: attemptCount
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.json({ status: false, message: 'Server error while fetching dashboard statistics.' });
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
      { $match: { subjectName, chapterName } },
      { $sample: { size: sampleSize } },
      { $project: { questionText: 1, options: 1, answer: 1 } }
    ]);

    const formattedQuestions = questions.map(({ questionText, options, answer }) => ({
      questionText,
      options,
      answer: Buffer.from(answer || '').toString('base64'),
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
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
});

router.get('/examName/:examName', async (req, res) => {
  try {
    const { examName } = req.params;
    const records = await ExamSection.find({ examName }).lean();

    if (!records || records.length === 0) {
      return res.json({ status: true, progressCount: 0, completedCount: 0, avgPercentile: 0, data: [] });
    }

    const progressCount = records.filter(r => r.status === "in-progress").length;
    const completedCount = records.filter(r => r.status === "completed").length;

    let maxMarks = 0;
    if (records[0].sections && records[0].sections.length > 0) {
      maxMarks = records[0].sections.reduce((sum, sec) => sum + (sec.totalMarks || 0), 0);
    }

    let totalPercentile = 0;
    let completedWithMarks = 0;

    records.forEach(record => {
      if (record.status === "completed" && maxMarks > 0) {
        const percentile = (record.totalMarksObtained / maxMarks) * 100;
        totalPercentile += percentile;
        completedWithMarks++;
      }
    });

    const avgPercentile = completedWithMarks > 0 ? (totalPercentile / completedWithMarks).toFixed(2) : 0;

    res.json({ status: true, progressCount, completedCount, avgPercentile, data: records });
  } catch (error) {
    console.error(error);
    res.json({ status: false, error: error.message });
  }
});

router.get('/exam-report/:examName', async (req, res) => {
    try {

        const { examName } = req.params;


        // ============================================================
        // GET EXAM
        // ============================================================

        const exam =
            await Exams
                .findOne({ examName })
                .lean();


        if (!exam) {
            return res.json({
                status: false,
                message: "Exam not found"
            });
        }


        // ============================================================
        // GET CATEGORY
        // ============================================================

        const category =
            await Category
                .findOne({
                    categoryName: exam.category
                })
                .lean();


        if (!category) {
            return res.json({
                status: false,
                message: "Category not found"
            });
        }


        // ============================================================
        // GET ACTIVE STUDENTS
        // ============================================================

        const students =
            await Student
                .find({
                    "basic.courseName.courseName":
                        category.courseName,

                    "basic.active":
                        true
                })
                .lean();


        // ============================================================
        // GET ALL ATTEMPTS
        // ============================================================

        const attempts =
            await ExamSection
                .find({
                    examName
                })
                .lean();


        // ============================================================
        // EMAILS OF STUDENTS WHO ATTEMPTED
        // ============================================================

        const attemptedEmails =
            new Set(
                attempts.map(
                    attempt =>
                        attempt.emailAddress
                )
            );


        // ============================================================
        // PROCESS ATTEMPTS
        // ============================================================

        const finalData =
            attempts.map(
                attempt => {

                    // ====================================================
                    // COPY ORIGINAL ATTEMPT
                    // ====================================================

                    const data = {
                        ...attempt
                    };


                    // ====================================================
                    // SECTIONS FROM ATTEMPT
                    // ====================================================

                    const attemptSections =
                        Array.isArray(
                            attempt.sections
                        )
                            ? attempt.sections
                            : [];


                    // ====================================================
                    // EXAM TOTALS
                    // ====================================================

                    let totalCorrect = 0;

                    let totalWrong = 0;

                    let totalSkipped = 0;

                    let totalAttempted = 0;

                    let totalMarksObtained = 0;

                    let totalMaximumMarks = 0;


                    // ====================================================
                    // CALCULATE EACH SECTION
                    // ====================================================

                    const calculatedSections =
                        attemptSections.map(
                            section => {

                                // ========================================
                                // SECTION NAME
                                // ========================================

                                const sectionName =
                                    String(
                                        section?.sectionName ||
                                        ""
                                    )
                                        .trim()
                                        .toLowerCase();


                                // ========================================
                                // CHECK CODING SECTION
                                // ========================================

                                const isCodingSection =
                                    sectionName === "coding" ||
                                    sectionName.includes("coding");


                                // ========================================
                                // CODING RULE
                                //
                                // Every coding question = 15 marks.
                                //
                                // Other questions = 1 mark.
                                // ========================================

                                const marksPerQuestion =
                                    isCodingSection
                                        ? 15
                                        : 1;


                                // ========================================
                                // QUESTION ARRAY
                                // ========================================

                                const questions =
                                    Array.isArray(
                                        section?.questions
                                    )
                                        ? section.questions
                                        : [];


                                // ========================================
                                // IF QUESTIONS ARE AVAILABLE
                                //
                                // Calculate directly from question
                                // statuses.
                                // ========================================

                                let sectionCorrect = 0;

                                let sectionWrong = 0;

                                let sectionSkipped = 0;

                                let sectionAttempted = 0;

                                let sectionMarksObtained = 0;


                                if (
                                    questions.length > 0
                                ) {

                                    questions.forEach(
                                        question => {

                                            const status =
                                                String(
                                                    question?.status ||
                                                    ""
                                                )
                                                    .trim()
                                                    .toLowerCase();


                                            // =================================
                                            // CORRECT
                                            // =================================

                                            if (
                                                status ===
                                                "correct"
                                            ) {

                                                sectionCorrect++;

                                                sectionAttempted++;

                                                sectionMarksObtained +=
                                                    marksPerQuestion;

                                            }


                                            // =================================
                                            // WRONG / PARTIAL
                                            // =================================

                                            else if (
                                                status ===
                                                    "wrong" ||

                                                status ===
                                                    "partial"
                                            ) {

                                                sectionWrong++;

                                                sectionAttempted++;


                                                // =================================
                                                // CODING PARTIAL MARKS
                                                //
                                                // For coding:
                                                //
                                                // DO NOT simply use question
                                                // obtainedMarks because older
                                                // records may contain values
                                                // such as 1.5.
                                                //
                                                // Calculate from hidden tests.
                                                // =================================

                                                if (
                                                    isCodingSection
                                                ) {

                                                    const codingResult =
                                                        question?.codingResult ||
                                                        {};


                                                    const hiddenResults =
                                                        Array.isArray(
                                                            codingResult
                                                                ?.hiddenTestResults
                                                        )
                                                            ? codingResult.hiddenTestResults
                                                            : [];


                                                    // ---------------------------------
                                                    // COUNT PASSED HIDDEN TESTS
                                                    // ---------------------------------

                                                    let passedTests = 0;


                                                    hiddenResults.forEach(
                                                        result => {

                                                            const statusDesc =
                                                                typeof result?.status ===
                                                                "object"
                                                                    ? String(
                                                                        result?.status
                                                                            ?.description ||
                                                                        ""
                                                                    )
                                                                    : String(
                                                                        result?.status ||
                                                                        ""
                                                                    );


                                                            const verdict =
                                                                String(
                                                                    result?.verdict ||
                                                                    ""
                                                                )
                                                                    .trim()
                                                                    .toUpperCase();


                                                            const passed =
                                                                result?.passed === true ||

                                                                result?.passed === "true" ||

                                                                result?.isPassed === true ||

                                                                result?.success === true ||

                                                                statusDesc
                                                                    .toLowerCase() ===
                                                                    "passed" ||

                                                                statusDesc
                                                                    .toLowerCase() ===
                                                                    "accepted" ||

                                                                verdict ===
                                                                    "ACCEPTED" ||

                                                                verdict ===
                                                                    "PASSED" ||

                                                                result?.statusId ===
                                                                    3 ||

                                                                result?.status?.id ===
                                                                    3;


                                                            if (
                                                                passed
                                                            ) {
                                                                passedTests++;
                                                            }

                                                        }
                                                    );


                                                    // ---------------------------------
                                                    // TOTAL HIDDEN TESTS
                                                    // ---------------------------------

                                                    const totalHiddenTests =
                                                        hiddenResults.length;


                                                    // ---------------------------------
                                                    // CODING QUESTION MARKS
                                                    //
                                                    // 15 / hidden tests
                                                    // ---------------------------------

                                                    if (
                                                        totalHiddenTests >
                                                        0
                                                    ) {

                                                        const marksPerHiddenTest =
                                                            15 /
                                                            totalHiddenTests;


                                                        sectionMarksObtained +=
                                                            Number(
                                                                (
                                                                    marksPerHiddenTest *
                                                                    passedTests
                                                                ).toFixed(2)
                                                            );

                                                    }

                                                }

                                                else {

                                                    // =================================
                                                    // NORMAL QUESTION
                                                    //
                                                    // Wrong = 0 marks
                                                    // =================================

                                                    sectionMarksObtained +=
                                                        0;

                                                }

                                            }


                                            // =================================
                                            // SKIPPED
                                            // =================================

                                            else if (
                                                status ===
                                                "skipped"
                                            ) {

                                                sectionSkipped++;

                                            }

                                        }
                                    );

                                }

                                else {

                                    // =================================================
                                    // FALLBACK FOR OLD RECORDS
                                    //
                                    // If question details are unavailable,
                                    // use stored section values.
                                    // =================================================

                                    sectionCorrect =
                                        Number(
                                            section?.correct ||
                                            0
                                        );


                                    sectionWrong =
                                        Number(
                                            section?.wrong ||
                                            0
                                        );


                                    sectionSkipped =
                                        Number(
                                            section?.skipped ||
                                            0
                                        );


                                    sectionAttempted =
                                        Number(
                                            section?.attempted ||
                                            0
                                        );


                                    if (
                                        isCodingSection
                                    ) {

                                        /*
                                         * Every fully correct coding question
                                         * gets 15 marks.
                                         *
                                         * For old records where question
                                         * details are unavailable, calculate
                                         * using correct-question count.
                                         */
                                        sectionMarksObtained =
                                            Number(
                                                (
                                                    sectionCorrect *
                                                    15
                                                ).toFixed(2)
                                            );

                                    }

                                    else {

                                        sectionMarksObtained =
                                            Number(
                                                (
                                                    sectionCorrect *
                                                    1
                                                ).toFixed(2)
                                            );

                                    }

                                }


                                // ====================================================
                                // ATTEMPTED
                                // ====================================================

                                if (
                                    questions.length > 0
                                ) {

                                    sectionAttempted =
                                        sectionCorrect +
                                        sectionWrong;

                                }


                                // ====================================================
                                // SECTION TOTAL MARKS
                                //
                                // Coding:
                                //
                                // noOfQuestions × 15
                                //
                                // Other:
                                //
                                // noOfQuestions × 1
                                // ====================================================

                                const numberOfQuestions =
                                    Number(
                                        section?.noOfquestions ??
                                        questions.length ??
                                        0
                                    );


                                const sectionTotalMarks =
                                    numberOfQuestions *
                                    marksPerQuestion;


                                // ====================================================
                                // ADD TO EXAM TOTALS
                                // ====================================================

                                totalCorrect +=
                                    sectionCorrect;


                                totalWrong +=
                                    sectionWrong;


                                totalSkipped +=
                                    sectionSkipped;


                                totalAttempted +=
                                    sectionAttempted;


                                totalMarksObtained +=
                                    sectionMarksObtained;


                                totalMaximumMarks +=
                                    sectionTotalMarks;


                                // ====================================================
                                // RETURN UPDATED SECTION
                                // ====================================================

                                return {

                                    ...section,

                                    correct:
                                        sectionCorrect,

                                    wrong:
                                        sectionWrong,

                                    skipped:
                                        sectionSkipped,

                                    attempted:
                                        sectionAttempted,

                                    marksObtained:
                                        Number(
                                            sectionMarksObtained.toFixed(2)
                                        ),

                                    totalMarks:
                                        sectionTotalMarks,

                                    isCodingSection,

                                    marksPerQuestion

                                };

                            }
                        );


                    // ============================================================
                    // SET FINAL EXAM VALUES
                    // ============================================================

                    data.sections =
                        calculatedSections;


                    data.totalCorrect =
                        totalCorrect;


                    data.totalWrong =
                        totalWrong;


                    data.totalSkipped =
                        totalSkipped;


                    data.totalAttempted =
                        totalAttempted;


                    data.totalMarks =
                        totalMaximumMarks;


                    data.totalMarksObtained =
                        Number(
                            totalMarksObtained.toFixed(2)
                        );


                    return data;

                }
            );


        // ============================================================
        // ADD ABSENT STUDENTS
        // ============================================================

        students.forEach(
            student => {

                const email =
                    student
                        ?.basic
                        ?.emailAddress;


                if (
                    !attemptedEmails.has(
                        email
                    )
                ) {

                    finalData.push({

                        fullName:
                            `${student.basic.firstName} ${student.basic.lastName}`,

                        emailAddress:
                            email,

                        mobileNo:
                            student.basic.mobileNo,

                        examName,

                        status:
                            "not started",

                        attendance:
                            "Absent",

                        totalQuestions:
                            Number(
                                exam.totalQuestions ||
                                0
                            ),

                        totalAttempted:
                            0,

                        totalCorrect:
                            0,

                        totalWrong:
                            0,

                        totalSkipped:
                            0,

                        totalMarks:
                            Number(
                                exam.totalMarks ||
                                0
                            ),

                        totalMarksObtained:
                            0,

                        totalTimeTaken:
                            "-",

                        startedAt:
                            null,

                        completedAt:
                            null

                    });

                }

            }
        );


        // ============================================================
        // COUNTS
        // ============================================================

        const progressCount =
            finalData.filter(
                student =>
                    student.status ===
                    "in-progress"
            ).length;


        const completedCount =
            finalData.filter(
                student =>
                    student.status ===
                    "completed"
            ).length;


        const absentCount =
            finalData.filter(
                student =>
                    student.status ===
                    "not started"
            ).length;


        const cheatedCount =
            finalData.filter(
                student =>
                    student.status ===
                    "cheated"
            ).length;


        const attemptedCount =
            completedCount +
            progressCount +
            cheatedCount;


        // ============================================================
        // CALCULATE MAXIMUM MARKS
        //
        // Use exam sections.
        //
        // Coding section = questions × 15
        // Other section  = questions × 1
        // ============================================================

        let maxMarks = 0;


        if (
            Array.isArray(
                exam.sections
            ) &&
            exam.sections.length > 0
        ) {

            exam.sections.forEach(
                section => {

                    const sectionName =
                        String(
                            section?.sectionName ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const isCodingSection =
                        sectionName === "coding" ||
                        sectionName.includes("coding");


                    const numberOfQuestions =
                        Number(
                            section?.chapters
                                ?.reduce(
                                    (
                                        sum,
                                        chapter
                                    ) =>
                                        sum +
                                        Number(
                                            chapter?.noOfquestions ||
                                            0
                                        ),
                                    0
                                ) ||
                            0
                        );


                    /*
                     * If chapter question count is not available,
                     * use section totalMarks.
                     */
                    const questionCount =
                        numberOfQuestions > 0
                            ? numberOfQuestions
                            : Number(
                                section?.totalMarks ||
                                0
                            );


                    if (
                        isCodingSection
                    ) {

                        maxMarks +=
                            questionCount *
                            15;

                    }

                    else {

                        maxMarks +=
                            questionCount *
                            1;

                    }

                }
            );

        }

        else {

            /*
             * Fallback.
             */
            maxMarks =
                Number(
                    exam.totalMarks ||
                    0
                );

        }


        // ============================================================
        // ATTEMPTED STUDENTS
        // ============================================================

        const attemptedStudents =
            finalData.filter(
                student =>

                    student.status ===
                        "completed" ||

                    student.status ===
                        "in-progress" ||

                    student.status ===
                        "cheated"
            );


        // ============================================================
        // AVERAGE PERCENTAGE
        // ============================================================

        let avgPercentile = 0;


        if (
            attemptedStudents.length > 0 &&
            maxMarks > 0
        ) {

            const totalPercentile =
                attemptedStudents.reduce(
                    (
                        sum,
                        student
                    ) => {

                        const obtainedMarks =
                            Number(
                                student.totalMarksObtained ||
                                0
                            );


                        const percentage =
                            (
                                obtainedMarks /
                                maxMarks
                            ) *
                            100;


                        return (
                            sum +
                            percentage
                        );

                    },
                    0
                );


            avgPercentile =
                (
                    totalPercentile /
                    attemptedStudents.length
                ).toFixed(2);

        }


        // ============================================================
        // ATTENDANCE PERCENTAGE
        // ============================================================

        const attendancePercentage =
            finalData.length > 0
                ? (
                    (
                        attemptedCount /
                        finalData.length
                    ) *
                    100
                ).toFixed(2)
                : 0;


        // ============================================================
        // DEBUG
        // ============================================================

        console.log(
            "\n========== EXAM REPORT =========="
        );

        console.log(
            "Exam:",
            examName
        );

        console.log(
            "Maximum Marks:",
            maxMarks
        );

        console.log(
            "Attempted:",
            attemptedCount
        );

        console.log(
            "Absent:",
            absentCount
        );

        console.log(
            "Completed:",
            completedCount
        );

        console.log(
            "Average Percentage:",
            avgPercentile
        );

        console.log(
            "=================================\n"
        );


        // ============================================================
        // FINAL RESPONSE
        // ============================================================

        return res.json({

            status:
                true,

            totalStudents:
                finalData.length,

            attemptedCount,

            absentCount,

            progressCount,

            completedCount,

            cheatedCount,

            attendancePercentage,

            avgPercentile,

            maxMarks,

            data:
                finalData

        });


    } catch (error) {

        console.error(
            "EXAM REPORT ERROR:",
            error
        );


        return res.json({

            status:
                false,

            error:
                error.message

        });

    }
});

router.delete('/exam-reaccess/:examName/:emailAddress', async (req, res) => {
  try {
    const { examName, emailAddress } = req.params;
    if (!examName || !emailAddress) {
      return res.json({ status: false, message: "examName and emailAddress are required" });
    }

    const deletedRecord = await ExamSection.findOneAndDelete({ examName, emailAddress });
    if (!deletedRecord) {
      return res.json({ status: false, message: "No record found to delete" });
    }

    res.json({ status: true, message: "Record deleted successfully", data: deletedRecord });
  } catch (error) {
    console.error(error);
    res.json({ status: false, error: error.message });
  }
});

router.get('/result-by-user/:examName/:emailAddress', async (req, res) => {
  try {
    const { examName, emailAddress } = req.params;
    const records = await ExamSection.find({ examName, emailAddress })
      .populate('sections.questions.questionId')
      .lean();
    res.json({ status: true, message: records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message });
  }
});

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

router.post('/checkResume', async (req, res) => {
  try {
    const { examName, emailAddress } = req.body;
    if (!examName || !emailAddress) {
      return res.json({ status: false, message: "examName and emailAddress are required" });
    }

    const record = await ExamSection.findOne({ examName, emailAddress }).lean();
    if (!record || record.status === "completed" || record.status === "cheated") {
      return res.json({ status: true, resumeAvailable: false });
    }

    const lastSectionIndex = Math.max((record.sections?.length || 1) - 1, 0);
    const lastSection = record.sections?.[lastSectionIndex];

    return res.json({
      status: true,
      resumeAvailable: true,
      data: {
        examName: record.examName,
        emailAddress: record.emailAddress,
        fullName: record.fullName,
        status: record.status,
        activeSectionIndex: lastSectionIndex,
        activeQuestionIndex: 0,
        sectionName: lastSection?.sectionName || "",
        startedAt: record.startedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ status: false, message: "Something went wrong" });
  }
});

module.exports = router;