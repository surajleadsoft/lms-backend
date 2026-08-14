const cluster = require("cluster");
const os = require("os");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const compression = require("compression");
const helmet = require("helmet");
const http = require("http");
const WebSocket = require("ws");
const rateLimit = require("express-rate-limit");
const { executeJudge0 } = require("./services/judgeService");
const { default: axios } = require("axios");


  // ------------ Worker Process (Your Express app) ------------
  const studentRoutes = require('./routes/studentRoute');
  const courseRoutes = require('./routes/courseRoutes');
  const moduleRoutes = require('./routes/moduleRoutes');
  const contentRoutes = require('./routes/ContentRoutes');
  const adminRoutes = require('./routes/AdminRoutes');
  const compileRoute = require('./routes/compile');
  const courseModuleRoute = require('./routes/courseModuleRoutes');
  const courseVideoRoute = require('./routes/courseVideoRoute');
  const courseRegistrationRoute = require('./routes/CourseRegistrationRoute');
  const attendanceRoute = require('./routes/AttendanceRoute');
  const watchVideoRoute = require('./routes/WatchVideosRoute');
  const subjectRoute = require('./routes/subjectRoutes');
  const chapterRoute = require('./routes/chapterRoute');
  const categoryRoute = require('./routes/categoryRoute');
  const questionRoute = require('./routes/questionRoute');
  const examRoute = require('./routes/ExamRoute');
  const examSectionRoute = require('./routes/examSectionRoute');
  const paymentRoute = require('./routes/paymentRoute');
  const resourceRoute = require('./routes/ResourceRoute');
  const annoucementRoute = require('./routes/AnnouncementRoute');
  const campusRoute = require('./routes/campusRoute');
  const applicationRoute = require('./routes/applicationRoute');
  const learningCourseRoute = require('./routes/learningCourseRoute')
  const chapterCompletion = require('./routes/chapterCompletionRoute')
  const testResultRoute = require('./routes/testResultRoute')
  const leaderboardRoute = require('./routes/LeaderboardRoute')
  const codingChaptersRoute = require('./routes/codingChapterRoute');
  const codingCompletionRoute = require('./routes/codingCompletionRoute');
  const openExamRoute = require('./routes/openExamRoute')
  const openUserRoute = require('./routes/OpenUserRoute')
  const codingQuestionRoute = require('./routes/codingQuestionRoute')
  const feedbackRoute = require('./routes/feedbackRoutes')

  const app = express();
  const server = http.createServer(app);

  const corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://course-admin.leadsoft.academy',
      'https://courses.leadsoft.academy',
      'https://lms-admin.leadsoft.academy',
      'https://self-learn.leadsoft.academy',
      'https://coding.leadsoft.academy'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };

  // Middleware
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '30mb' }));
  app.use(compression());
  app.use(helmet());
  app.use("/uploads", express.static("uploads"));
  app.use('/uploads/resources', express.static('uploads/resources'));

  // Rate Limiting (per IP)
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 2000, // max requests per IP per minute
    message: 'Too many requests from this IP, please try again after a minute.'
  });
  app.use(limiter);

  // Routes
  app.use('/api', studentRoutes);
  app.use('/course', courseRoutes);
  app.use('/module', moduleRoutes);
  app.use('/content', contentRoutes);
  app.use('/admin', adminRoutes);
  app.use('/course-module', courseModuleRoute);
  app.use('/course-video', courseVideoRoute);
  app.use('/course-reg', courseRegistrationRoute);
  app.use('/attendance', attendanceRoute);
  app.use('/watch', watchVideoRoute);
  app.use('/subject', subjectRoute);
  app.use('/chapter', chapterRoute);
  app.use('/category', categoryRoute);
  app.use('/question', questionRoute);
  app.use('/exam', examRoute);
  app.use('/compile', compileRoute);
  app.use('/exam-section', examSectionRoute);
  app.use('/payment', paymentRoute);
  app.use('/resource', resourceRoute);
  app.use('/announce', annoucementRoute);
  app.use('/campus', campusRoute);
  app.use('/application', applicationRoute);
  app.use('/learning', learningCourseRoute);
  app.use('/chapter-completion', chapterCompletion);
  app.use('/test-result', testResultRoute)
  app.use('/leader', leaderboardRoute)
  app.use('/coding', codingChaptersRoute)
  app.use('/coding-completion', codingCompletionRoute)
  app.use('/open-exam', openExamRoute)
  app.use('/open-user', openUserRoute)
  app.use('/coding-question',codingQuestionRoute)
  app.use('/feedback',feedbackRoute)


  const wss = new WebSocket.Server({ server });

  const BASE = "http://127.0.0.1:8055";

  wss.on("connection", (ws) => {
    console.log("🟢 WebSocket Connected");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {

          case "START_EXAM":
            const startRes = await axios.post(
              `${BASE}/exam-section/startExam`,
              data.payload
            );
            ws.send(JSON.stringify({
              type: "EXAM_STARTED",
              ...startRes.data
            }));
            break;

          case "SAVE_SECTION":
            const saveRes = await axios.post(
              `${BASE}/exam-section/addSection1`,
              data.payload
            );
            ws.send(JSON.stringify({
              type: "SECTION_SAVED",
              ...saveRes.data
            }));
            break;

          case "CHEATED":
            const cheatRes = await axios.post(
              `${BASE}/exam-section/cheated-sections`,
              data.payload
            );
            ws.send(JSON.stringify({
              type: "CHEATED_SAVED",
              ...cheatRes.data
            }));
            break;

          default:
            ws.send(JSON.stringify({
              status: false,
              message: "Unknown type"
            }));
        }

      } catch (err) {
        ws.send(JSON.stringify({
          status: false,
          message: err.message
        }));
      }
    });

    ws.on("close", () => {
      console.log("🔴 WebSocket Disconnected");
    });
  });


  // MongoDB Connection
  mongoose.set('strictQuery', false);
  mongoose.connect('mongodb://localhost:27017/course-lms', {
    maxPoolSize: 300
  })
    .then(() => console.log(`✅ Worker ${process.pid} connected to MongoDB`))
    .catch(err => console.error("❌ DB Connection Failed:", err));

  // Judge0 Setup
  const PORT = 8055;
  const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions";
  const API_KEY = "90b6e44b46msh7cf016e49d43e06p16ec0fjsn433cfec9a908";

  const languages = {
    c: 50,
    cpp: 54,
    java: 91,
    python3: 71,
  };



const buildBatchInput = (testCases) => {

    return [

        testCases.length,

        ...testCases.map(
            testCase =>
                String(
                    testCase.input || ""
                ).trim()
        )

    ].join("\n");
};

const normalizeOutput = (output) => {

    if (!output) {
        return [];
    }

    return String(output)
        .trim()
        .split(/\r?\n/)
        .map(line => line.trim());
};


app.post("/run", async (req, res) => {

    try {

        const {
            questionId,
            language,
            code,
            testCase,
            input,
            expectedOutput
        } = req.body;


        console.log("");
        console.log("========================================");
        console.log("▶ /RUN - SINGLE TEST CASE");
        console.log("========================================");


        // =========================================================
        // VALIDATION
        // =========================================================

        if (!questionId) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Question",

                error:
                    "questionId is required"
            });
        }


        if (!languages[language]) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Unsupported Language",

                error:
                    "Unsupported language"
            });
        }


        if (
            typeof code !== "string" ||
            !code.trim()
        ) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Code",

                error:
                    "Code is required"
            });
        }


        // testCase must be a single number
        const testCaseNumber =
            Number(testCase);


        if (
            !Number.isInteger(
                testCaseNumber
            ) ||
            testCaseNumber < 1
        ) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Test Case",

                error:
                    "A valid testCase number is required"
            });
        }


        if (
            input === undefined ||
            input === null
        ) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Input",

                error:
                    "Test case input is required"
            });
        }


        if (
            expectedOutput === undefined ||
            expectedOutput === null
        ) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Expected Output",

                error:
                    "Expected output is required"
            });
        }


        // =========================================================
        // NORMALIZE INPUT
        // =========================================================

        const stdin =
            String(input)
                .replace(/\r\n/g, "\n");


        const expected =
            String(expectedOutput)
                .replace(/\r\n/g, "\n");


        console.log(
            "Question ID:",
            questionId
        );

        console.log(
            "Language:",
            language
        );

        console.log(
            "Test Case:",
            testCaseNumber
        );

        console.log(
            "Input:",
            JSON.stringify(stdin)
        );

        console.log(
            "Expected Output:",
            JSON.stringify(expected)
        );

        console.log(
            "Code Length:",
            code.length
        );


        // =========================================================
        // EXECUTE ONLY THIS TEST CASE
        // =========================================================

        console.log("");
        console.log(
            `🚀 Executing Judge0 for Test Case ${testCaseNumber}`
        );


        const result =
            await executeJudge0({

                language,

                sourceCode:
                    String(code),

                stdin
            });


        console.log("");
        console.log(
            `📥 Judge0 Response - Test Case ${testCaseNumber}`
        );

        console.log(
            JSON.stringify(
                result,
                null,
                2
            )
        );


        // =========================================================
        // COMPILATION ERROR
        // =========================================================

        if (
            result?.compile_output
        ) {

            console.log(
                `❌ Compilation Error - Test Case ${testCaseNumber}`
            );


            return res.json({

                status: true,

                testCase:
                    testCaseNumber,

                verdict:
                    "Compilation Error",

                passed: false,

                actualOutput:
                    "",

                expectedOutput:
                    expected,

                error:
                    result.compile_output || "",

                compilationError: {

                    message:
                        result.compile_output || ""
                },

                time:
                    result.time ?? null,

                memory:
                    result.memory ?? null
            });
        }


        // =========================================================
        // RUNTIME ERROR
        // =========================================================

        if (
            result?.status?.id >= 7 &&
            result?.status?.id <= 12
        ) {

            console.log(
                `❌ Runtime Error - Test Case ${testCaseNumber}`
            );


            const actualOutput =
                String(
                    result.stdout ?? ""
                )
                    .replace(/\r\n/g, "\n")
                    .trim();


            const runtimeError =
                String(
                    result.stderr ??
                    result.message ??
                    ""
                );


            return res.json({

                status: true,

                testCase:
                    testCaseNumber,

                verdict:
                    "Runtime Error",

                passed: false,

                actualOutput,

                expectedOutput:
                    expected,

                error:
                    runtimeError,

                stderr:
                    runtimeError,

                time:
                    result.time ?? null,

                memory:
                    result.memory ?? null
            });
        }


        // =========================================================
        // TIME LIMIT EXCEEDED
        // =========================================================

        if (
            result?.status?.id === 5
        ) {

            console.log(
                `⏱️ TLE - Test Case ${testCaseNumber}`
            );


            const actualOutput =
                String(
                    result.stdout ?? ""
                )
                    .replace(/\r\n/g, "\n")
                    .trim();


            return res.json({

                status: true,

                testCase:
                    testCaseNumber,

                verdict:
                    "Time Limit Exceeded",

                passed: false,

                actualOutput,

                expectedOutput:
                    expected,

                error:
                    "Time Limit Exceeded",

                time:
                    result.time ?? null,

                memory:
                    result.memory ?? null
            });
        }


        // =========================================================
        // NORMAL OUTPUT
        // =========================================================

        const actual =
            String(
                result.stdout ?? ""
            )
                .replace(/\r\n/g, "\n")
                .trim();


        const expectedNormalized =
            String(expected)
                .replace(/\r\n/g, "\n")
                .trim();


        console.log("");
        console.log(
            `Actual Output - TC ${testCaseNumber}:`,
            JSON.stringify(actual)
        );

        console.log(
            `Expected Output - TC ${testCaseNumber}:`,
            JSON.stringify(
                expectedNormalized
            )
        );


        // =========================================================
        // COMPARE
        // =========================================================

        const passed =
            actual ===
            expectedNormalized;


        console.log(
            `TC ${testCaseNumber} RESULT:`,
            passed
                ? "✅ PASSED"
                : "❌ FAILED"
        );


        // =========================================================
        // RESPONSE
        // =========================================================

        return res.json({

            status: true,

            testCase:
                testCaseNumber,

            verdict:
                passed
                    ? "Accepted"
                    : "Wrong Answer",

            passed,

            actualOutput:
                actual,

            expectedOutput:
                expectedNormalized,

            error:
                "",

            time:
                result.time ?? null,

            memory:
                result.memory ?? null
        });


    } catch (error) {

        console.error("");
        console.error(
            "========================================"
        );

        console.error(
            "❌ /RUN ERROR"
        );

        console.error(
            error?.response?.data ||
            error?.message ||
            error
        );

        console.error(
            "========================================"
        );


        return res.status(500).json({

            status: false,

            verdict:
                "Execution Error",

            passed: false,

            testCase:
                req.body?.testCase ?? null,

            actualOutput:
                "",

            expectedOutput:
                String(
                    req.body?.expectedOutput ??
                    ""
                ),

            error:
                error?.response?.data?.message ||
                error?.message ||
                "Unable to execute code"
        });
    }

});
app.post("/submit", async (req, res) => {

    try {

        const {
            questionId,
            language,
            code,
            testCase
        } = req.body;


        console.log("");
        console.log("========================================");
        console.log("▶ /SUBMIT - SINGLE HIDDEN TEST CASE");
        console.log("========================================");


        // =========================================================
        // VALIDATION
        // =========================================================

        if (!questionId) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Question",

                error:
                    "questionId is required"
            });
        }


        if (!languages[language]) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Unsupported Language",

                error:
                    "Unsupported language"
            });
        }


        if (
            typeof code !== "string" ||
            !code.trim()
        ) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Code",

                error:
                    "Code is required"
            });
        }


        const testCaseNumber =
            Number(testCase);


        if (
            !Number.isInteger(
                testCaseNumber
            ) ||
            testCaseNumber < 1
        ) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Test Case",

                error:
                    "A valid testCase number is required"
            });
        }


        // =========================================================
        // GET QUESTION
        // =========================================================

        const question =
            await Question.findById(
                questionId
            ).lean();


        if (!question) {

            return res.status(404).json({

                status: false,

                verdict:
                    "Question Not Found",

                error:
                    "Question not found"
            });
        }


        // =========================================================
        // GET HIDDEN TEST CASES
        // =========================================================

        const hiddenTestCases =
            question?.coding
                ?.hiddenTestCases || [];


        if (
            !Array.isArray(
                hiddenTestCases
            ) ||
            hiddenTestCases.length === 0
        ) {

            return res.status(400).json({

                status: false,

                verdict:
                    "No Hidden Test Cases",

                error:
                    "Hidden test cases are not configured"
            });
        }


        // =========================================================
        // CHECK TEST CASE NUMBER
        // =========================================================

        if (
            testCaseNumber >
            hiddenTestCases.length
        ) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Test Case",

                error:
                    `Hidden test case ${testCaseNumber} does not exist`
            });
        }


        // =========================================================
        // GET ONLY REQUESTED TEST CASE
        // =========================================================

        const selectedTestCase =
            hiddenTestCases[
                testCaseNumber - 1
            ];


        if (!selectedTestCase) {

            return res.status(400).json({

                status: false,

                verdict:
                    "Invalid Test Case",

                error:
                    "Unable to load hidden test case"
            });
        }


        const stdin =
            String(
                selectedTestCase?.input ??
                selectedTestCase?.testInput ??
                ""
            )
                .replace(/\r\n/g, "\n");


        const expected =
            String(
                selectedTestCase?.expectedOutput ??
                selectedTestCase?.output ??
                ""
            )
                .replace(/\r\n/g, "\n");


        console.log(
            "Question ID:",
            questionId
        );

        console.log(
            "Language:",
            language
        );

        console.log(
            "Hidden Test Case:",
            testCaseNumber
        );

        /*
         * Don't print expected output in production.
         * It is hidden from the student.
         */

        console.log(
            "Hidden Input:",
            JSON.stringify(stdin)
        );


        // =========================================================
        // EXECUTE ONLY THIS HIDDEN TEST CASE
        // =========================================================

        console.log("");
        console.log(
            `🔐 Executing Hidden Test Case ${testCaseNumber}`
        );


        const result =
            await executeJudge0({

                language,

                sourceCode:
                    String(code),

                stdin
            });


        console.log("");
        console.log(
            `📥 Judge0 Response - Hidden TC ${testCaseNumber}`
        );

        console.log(
            JSON.stringify(
                result,
                null,
                2
            )
        );


        // =========================================================
        // COMPILATION ERROR
        // =========================================================

        if (
            result?.compile_output
        ) {

            console.log(
                `❌ Compilation Error - Hidden TC ${testCaseNumber}`
            );


            return res.json({

                status: true,

                testCase:
                    testCaseNumber,

                verdict:
                    "Compilation Error",

                passed: false,

                actualOutput:
                    "",

                error:
                    result.compile_output || "",

                compilationError: {

                    message:
                        result.compile_output || ""
                },

                time:
                    result.time ?? null,

                memory:
                    result.memory ?? null
            });
        }


        // =========================================================
        // RUNTIME ERROR
        // =========================================================

        if (
            result?.status?.id >= 7 &&
            result?.status?.id <= 12
        ) {

            const actualOutput =
                String(
                    result.stdout ?? ""
                )
                    .replace(/\r\n/g, "\n")
                    .trim();


            const runtimeError =
                String(
                    result.stderr ??
                    result.message ??
                    ""
                );


            console.log(
                `❌ Runtime Error - Hidden TC ${testCaseNumber}`
            );


            return res.json({

                status: true,

                testCase:
                    testCaseNumber,

                verdict:
                    "Runtime Error",

                passed: false,

                actualOutput,

                error:
                    runtimeError,

                time:
                    result.time ?? null,

                memory:
                    result.memory ?? null
            });
        }


        // =========================================================
        // TIME LIMIT EXCEEDED
        // =========================================================

        if (
            result?.status?.id === 5
        ) {

            const actualOutput =
                String(
                    result.stdout ?? ""
                )
                    .replace(/\r\n/g, "\n")
                    .trim();


            console.log(
                `⏱️ TLE - Hidden TC ${testCaseNumber}`
            );


            return res.json({

                status: true,

                testCase:
                    testCaseNumber,

                verdict:
                    "Time Limit Exceeded",

                passed: false,

                actualOutput,

                error:
                    "Time Limit Exceeded",

                time:
                    result.time ?? null,

                memory:
                    result.memory ?? null
            });
        }


        // =========================================================
        // NORMAL OUTPUT
        // =========================================================

        const actual =
            String(
                result.stdout ?? ""
            )
                .replace(/\r\n/g, "\n")
                .trim();


        const expectedNormalized =
            String(expected)
                .replace(/\r\n/g, "\n")
                .trim();


        console.log(
            `Hidden TC ${testCaseNumber} actual:`,
            JSON.stringify(actual)
        );


        // =========================================================
        // COMPARE
        // =========================================================

        const passed =
            actual ===
            expectedNormalized;


        console.log(
            `Hidden TC ${testCaseNumber}:`,
            passed
                ? "✅ PASSED"
                : "❌ FAILED"
        );


        // =========================================================
        // IMPORTANT
        //
        // DO NOT RETURN expectedOutput
        // FOR HIDDEN TEST CASES
        // =========================================================

        return res.json({

            status: true,

            testCase:
                testCaseNumber,

            verdict:
                passed
                    ? "Accepted"
                    : "Wrong Answer",

            passed,

            actualOutput:
                actual,

            error:
                "",

            time:
                result.time ?? null,

            memory:
                result.memory ?? null
        });


    } catch (error) {

        console.error("");
        console.error(
            "========================================"
        );

        console.error(
            "❌ /SUBMIT ERROR"
        );

        console.error(
            error?.response?.data ||
            error?.message ||
            error
        );

        console.error(
            "========================================"
        );


        return res.status(500).json({

            status: false,

            verdict:
                "Execution Error",

            passed: false,

            testCase:
                req.body?.testCase ?? null,

            actualOutput:
                "",

            error:
                error?.response?.data?.message ||
                error?.message ||
                "Unable to submit code"
        });
    }

});
  server.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} started on port ${PORT}`);
  });

