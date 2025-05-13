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

const URL ='mongodb+srv://surajleadsoft:LeadSoft%40123@lms.s4b2zfu.mongodb.net/course-lms?retryWrites=true&w=majority&appName=lms'

const server = express()
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://courses.leadsoft.academy',
    'https://lms-admin.leadsoft.academy',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
server.use(cors())
server.use(bodyParser.json())
server.use('/api',studentRoutes)
server.use('/course',courseRoutes)
server.use('/module',moduleRoutes)
server.use('/content',contentRoutes)
server.use('/admin',adminRoutes)
server.use('/course-module',courseModuleRoute)
server.use('/course-video',courseVideoRoute)
server.use('/course-reg',courseRegistrationRoute)

mongoose.connect(URL)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ DB Connection Failed:", err));

server.listen(8055,()=>{
    console.log('Server started listening on port 8055')
})