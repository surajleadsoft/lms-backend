const express = require('express');
const router = express.Router();
const Attendance = require('../models/attendanceSchema');
const Student = require('../models/Student');

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

router.get('/attendance-summary', async (req, res) => {
  try {
    const { courseName, date } = req.query;

    if (!courseName || !date) {
      return res.json({ status: false, message: 'courseName and date are required' });
    }

    const targetDate = new Date(date);

    // Get all active students in the given course
    const students = await Student.find({
      'basic.courseName.courseName': courseName,
      'basic.isActive': true
    });
    
    const emailList = students.map(s => s.basic.emailAddress);
    // Get attendance records for those students on that date and course
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      emailAddress: { $in: emailList },
      courseName: courseName,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // Map attendance by email with both status and inTime
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.emailAddress] = {
        status: record.status === 'Present' ? 'Present' : 'Absent',
        inTime: record.inTime || [],
      };
    });

    // Construct response
    const result = students.map(student => {
      const attendanceInfo = attendanceMap[student.basic.emailAddress];
      return {
        fullName: `${student.basic.firstName} ${student.basic.middleName || ''} ${student.basic.lastName}`.trim(),
        email: student.basic.emailAddress,
        status: attendanceInfo?.status || 'Absent',
        inTime: attendanceInfo?.inTime || [],
      };
    }); 

    // Sort by status
    const sortedResult = result.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'Present' ? 1 : -1;
    });

    res.json({ status: true, data: sortedResult });
  } catch (error) {
    console.error('Attendance status error:', error);
    res.json({ status: false, message: error.message });
  }
});


// ✅ Insert a new attendance record
router.post('/join', async (req, res) => {
  try {
    const { emailAddress, courseName, className, date, inTime, status } = req.body;

    const existingRecord = await Attendance.findOne({
      emailAddress,
      courseName,
      className,
      date
    });

    if (existingRecord) {
      // Append inTime to existing inTime array
      existingRecord.inTime.push(inTime);
      await existingRecord.save();
      return res.json({
        status: true,
        message: 'Existing attendance updated with new inTime',
        data: existingRecord
      });
    } else {
      // Create new attendance with inTime as array
      const newAttendance = new Attendance({
        emailAddress,
        courseName,
        className,
        date,
        inTime: [inTime],
        status
      });
      const saved = await newAttendance.save();
      return res.json({
        status: true,
        message: 'New attendance record inserted successfully',
        data: saved
      });
    }
  } catch (error) {
    res.json({
      status: false,
      message: error.message
    });
  }
});


// ✅ Get all attendance records
router.get('/', async (req, res) => {
  try {
    const records = await Attendance.find();
    res.json({
      status: true,
      message: 'Attendance records fetched successfully',
      data: records
    });
  } catch (error) {
    res.json({
      status: false,
      message: error.message
    });
  }
});

// ✅ Get records by emailAddress, courseName, className using req.params
router.get('/:emailAddress/:courseName/:className', async (req, res) => {
  try {
    const { emailAddress, courseName, className } = req.params;
    const records = await Attendance.find({ emailAddress, courseName, className });

    res.json({
      status: true,
      message: 'Filtered attendance records fetched successfully',
      data: records
    });
  } catch (error) {
    res.json({
      status: false,
      message: error.message
    });
  }
});

// ✅ Update attendance record by ID
router.put('/:id', async (req, res) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({
        status: false,
        message: 'Attendance record not found'
      });
    }
    res.json({
      status: true,
      message: 'Attendance record updated successfully',
      data: updated
    });
  } catch (error) {
    res.json({
      status: false,
      message: error.message
    });
  }
});

// ✅ Delete attendance record by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.json({
        status: false,
        message: 'Attendance record not found'
      });
    }
    res.json({
      status: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    res.json({
      status: false,
      message: error.message
    });
  }
});
router.get('/present-count', async (req, res) => {
  const { emailAddress } = req.query;

  if (!emailAddress) {
    return res.json({
      status: false,
      message: 'emailAddress is required',
    });
  }

  try {
    const count = await Attendance.countDocuments({
      emailAddress,
      status: 'Present',
    });

    if (count === 0) {
      return res.json({
        status: true,
        message: 'No records found',
        count:0
      });
    }

    return res.json({
      status: true,
      message: 'Records found',
      count:count,
    });

  } catch (error) {
    return res.json({
      status: false,
      message: 'Something went wrong',
    });
  }
});

module.exports = router;
