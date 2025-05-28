const express = require('express');
const router = express.Router();
const Attendance = require('../models/attendanceSchema');

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
