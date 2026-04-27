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
              `${BASE}/exam-section/addSection`,
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

  app.post("/run", async (req, res) => {
    try {
      const { language, code, input, expectedOutput } = req.body;

      if (!languages[language]) {
        return res.json({ status: false, error: "Unsupported language" });
      }

      const submission = await axios.post(
        `${JUDGE0_URL}?base64_encoded=false&wait=true`,
        {
          source_code: code,
          stdin: input,
          language_id: languages[language],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const result = submission.data;

      const responseData = {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        compile_output: result.compile_output,
        time: result.time,
        memory: result.memory,
        verdict: "Wrong Answer",
        compilationError: null,
      };

      if (result.compile_output) {
        const compileError = result.compile_output;
        const lineMatch = compileError.match(/:(\d+):/);
        const line = lineMatch ? parseInt(lineMatch[1]) : null;

        responseData.compilationError = {
          message: compileError,
          line: line,
        };
        responseData.verdict = "Compilation Error";
      } else if (result.stdout && expectedOutput && result.stdout.trim() === expectedOutput.trim()) {
        responseData.verdict = "Accepted";
      }

      res.json(responseData);
    } catch (error) {
      console.error(error.response?.data || error.message);
      res.json({
        status: false,
        error: "Something went wrong",
        details: error.response?.data,
      });
    }
  });

  app.post("/submit", async (req, res) => {
    try {
      const { language, code, input, expectedOutput } = req.body;

      if (!languages[language]) {
        return res.json({ status: false, error: "Unsupported language" });
      }

      const submission = await axios.post(
        `${JUDGE0_URL}?base64_encoded=false&wait=true`,
        {
          source_code: code,
          stdin: input,
          language_id: languages[language],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const result = submission.data;

      const responseData = {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        compile_output: result.compile_output,
        time: result.time,
        memory: result.memory,
        verdict: "Wrong Answer",
        compilationError: null,
      };

      if (result.compile_output) {
        const compileError = result.compile_output;
        const lineMatch = compileError.match(/:(\d+):/);
        const line = lineMatch ? parseInt(lineMatch[1]) : null;

        responseData.compilationError = {
          message: compileError,
          line: line,
        };
        responseData.verdict = "Compilation Error";
      } else if (result.stdout && expectedOutput && result.stdout.trim() === expectedOutput.trim()) {
        responseData.verdict = "Accepted";
      }

      res.json(responseData);
    } catch (error) {
      console.error(error.response?.data || error.message);
      res.json({
        status: false,
        error: "Something went wrong",
        details: error.response?.data,
      });
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} started on port ${PORT}`);
  });

