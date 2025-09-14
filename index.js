const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
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
const { default: axios } = require('axios');
const codingCompletionRoute = require('./routes/codingCompletionRoute');
const openExamRoute = require('./routes/openExamRoute')
const openUserRoute = require('./routes/OpenUserRoute')

const server = express();

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
server.use(cors(corsOptions));
server.use(express.json({ limit: '10mb' }));
server.use(compression());
server.use(helmet());
server.use('/uploads/resources', express.static('uploads/resources'));

// Rate Limiting (per IP)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // max requests per IP per minute
  message: 'Too many requests from this IP, please try again after a minute.'
});
server.use(limiter);

// Routes
server.use('/api', studentRoutes);
server.use('/course', courseRoutes);
server.use('/module', moduleRoutes);
server.use('/content', contentRoutes);
server.use('/admin', adminRoutes);
server.use('/course-module', courseModuleRoute);
server.use('/course-video', courseVideoRoute);
server.use('/course-reg', courseRegistrationRoute);
server.use('/attendance', attendanceRoute);
server.use('/watch', watchVideoRoute);
server.use('/subject', subjectRoute);
server.use('/chapter', chapterRoute);
server.use('/category', categoryRoute);
server.use('/question', questionRoute);
server.use('/exam', examRoute);
server.use('/compile', compileRoute);
server.use('/exam-section', examSectionRoute);
server.use('/payment', paymentRoute);
server.use('/resource', resourceRoute);
server.use('/announce', annoucementRoute);
server.use('/campus', campusRoute);
server.use('/application', applicationRoute);
server.use('/learning',learningCourseRoute);
server.use('/chapter-completion',chapterCompletion);
server.use('/test-result',testResultRoute)
server.use('/leader',leaderboardRoute)
server.use('/coding',codingChaptersRoute)
server.use('/coding-completion',codingCompletionRoute)
server.use('/open-exam',openExamRoute)
server.use('/open-user',openUserRoute)


// MongoDB Connection
mongoose.set('strictQuery', false);
mongoose.connect('mongodb+srv://surajleadsoft:LeadSoft%40123@lms.s4b2zfu.mongodb.net/course-lms?retryWrites=true&w=majority&appName=lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 100
})
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ DB Connection Failed:", err));

// Start Server
const PORT = 8055;

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions"; 
const API_KEY = "90b6e44b46msh7cf016e49d43e06p16ec0fjsn433cfec9a908"; // Your RapidAPI Key

// Correct Judge0 Language IDs
const languages = {
  c: 50,         // GCC 12.2.0
  cpp: 54,       // G++ 12.2.0
  java: 91,    // Java (OpenJDK 21.0.0)
  python3: 71,   // Python 3.11.2
};
server.post("/run", async (req, res) => {
  try {
    const { language, code, input, expectedOutput } = req.body;

    if (!languages[language]) {
      return res.json({ status: false, error: "Unsupported language" });
    }

    // Submit code to Judge0 with wait=true
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

    // Initialize response object
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

    // Check if there is a compilation error
    if (result.compile_output) {
      // Decode compilation output
      const compileError = result.compile_output;

      // Optional: extract line number using regex (works for C/C++/Java errors)
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

server.post("/submit", async (req, res) => {
  try {
    const { language, code, input, expectedOutput } = req.body;

    if (!languages[language]) {
      return res.json({ status: false, error: "Unsupported language" });
    }

    // Submit code to Judge0 with wait=true
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

    // Initialize response object
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

    // Check if there is a compilation error
    if (result.compile_output) {
      // Decode compilation output
      const compileError = result.compile_output;

      // Optional: extract line number using regex (works for C/C++/Java errors)
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
  console.log(`🚀 Server started on port ${PORT}`);
});
