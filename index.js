const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const studentRoutes = require('./routes/studentRoute');
const courseRoutes = require('./routes/courseRoutes')
const moduleRoutes = require('./routes/moduleRoutes')
const contentRoutes = require('./routes/ContentRoutes')
const adminRoutes = require('./routes/AdminRoutes')
const courseModuleRoute = require('./routes/courseModuleRoutes')
const courseVideoRoute = require('./routes/courseVideoRoute')
const courseRegistrationRoute = require('./routes/CourseRegistrationRoute')
const attendanceRoute = require('./routes/AttendanceRoute')
const watchVideoRoute = require('./routes/WatchVideosRoute')
const subjectRoute = require('./routes/subjectRoutes')
const chapterRoute = require('./routes/chapterRoute')
const categoryRoute = require('./routes/categoryRoute')
const questionRoute = require('./routes/questionRoute')
const examRoute = require('./routes/ExamRoute');
const examSectionRoute = require('./routes/examSectionRoute');
const paymentRoute = require('./routes/paymentRoute')
const resourceRoute = require('./routes/ResourceRoute')
const annoucementRoute = require('./routes/AnnouncementRoute')
const campusRoute = require('./routes/campusRoute');
const applicationRoute = require('./routes/applicationRoute')

const URL ='mongodb+srv://surajleadsoft:LeadSoft%40123@lms.s4b2zfu.mongodb.net/course-lms?retryWrites=true&w=majority&appName=lms'

const server = express()
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://course-admin.leadsoft.academy',
    'https://courses.leadsoft.academy',
    'https://lms-admin.leadsoft.academy',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:true
};
server.use(cors(corsOptions))
server.use(bodyParser.json())
server.use('/api',studentRoutes)
server.use('/course',courseRoutes)
server.use('/module',moduleRoutes)
server.use('/content',contentRoutes)
server.use('/admin',adminRoutes)
server.use('/course-module',courseModuleRoute)
server.use('/course-video',courseVideoRoute)
server.use('/course-reg',courseRegistrationRoute)
server.use('/attendance',attendanceRoute)
server.use('/watch',watchVideoRoute)
server.use('/subject',subjectRoute)
server.use('/chapter',chapterRoute)
server.use('/category',categoryRoute)
server.use('/question',questionRoute)
server.use('/exam',examRoute)
server.use('/exam-section',examSectionRoute)
server.use('/payment',paymentRoute)
server.use('/resource',resourceRoute)
server.use('/announce',annoucementRoute)
server.use('/campus',campusRoute)
server.use('/application',applicationRoute)
server.use('/uploads/resources', express.static('uploads/resources'));

mongoose.connect(URL)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ DB Connection Failed:", err));



server.listen(8055,()=>{
    console.log('Server started listening on port 8055')
})