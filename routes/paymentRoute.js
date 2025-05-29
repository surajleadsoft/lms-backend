const express = require('express');
const router = express.Router();
const Payment = require('../models/payments'); // Adjust path
const Student = require('../models/Student');
const Course = require('../models/Course');

router.get('/check-all-payments/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // 1. Get student by email
    const student = await Student.findOne({ "basic.emailAddress": email });
    if (!student) {
      return res.json({ status: false, message: 'Student not found' });
    }

    const courses = student.basic.courseName; 

    // 2. Check each course
    const results = [];

    for (let courseObj of courses) {
      const courseName = courseObj.courseName;

      // Get full course details
      const course = await Course.findOne({ courseName });
      if (!course) {
        results.push({
          courseName,
          message: 'Course details not found',
          status: false
        });
        continue;
      }

      // Get all payments for this course by the student
      const payments = await Payment.find({
        emailAddress: email,
        paymentCourse: courseName
      });

      const totalPaid = payments.reduce((sum, p) => sum + p.amountToPay, 0);

      results.push({
        courseName,
        status: true,
        message: totalPaid >= course.courseFees ? 'completed' : 'remaining'
      });
    }

    return res.json({ status: true, data: results });

  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
});


// PUT - Update payment record(s) by emailAddress
router.put('/pay/:emailAddress', async (req, res) => {
  try {
    const email = req.params.emailAddress;
    const updateData = req.body;

    const result = await Payment.updateMany({ emailAddress: email }, updateData);

    if (result.matchedCount === 0) {
      return res.json({ status: false, message: 'No payment records found for this email' });
    }

    res.json({ status: true, message: 'Payment record(s) updated', modifiedCount: result.modifiedCount });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});

// GET - Get all payment records
router.get('/pay', async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json({ status: true, data:payments });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});
router.get('/pay/:emailAddress', async (req, res) => {
  try {
    const emailAddress = req.params.emailAddress
    const payments = await Payment.find({emailAddress});
    res.json({ status: true, data:payments });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});

router.post('/total', async (req, res) => {
  const { studentName, emailAddress, paymentCourse } = req.body;

  if (!studentName || !emailAddress || !paymentCourse) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await Payment.aggregate([
      {
        $match: {
          studentName,
          emailAddress,
          paymentCourse
        }
      },
      {
        $group: {
          _id: null,
          totalAmountPaid: { $sum: '$amountToPay' }
        }
      }
    ]);
    return result.length > 0 ? res.json({status:true,totalAmountPaid: result[0].totalAmountPaid }) : res.json({status:false,totalAmountPaid:0 });

    
  } catch (err) {
    console.log(err)
    res.json({ error: 'Server error', details: err.message });
  }
});
router.post('/total1', async (req, res) => {
  const { emailAddress, paymentCourse } = req.body;

  if (!emailAddress || !paymentCourse) {
    return res.json({status:false, error: 'Missing required fields' });
  }

  try {
    const result = await Payment.aggregate([
      {
        $match: {          
          emailAddress,
          paymentCourse
        }
      },
      {
        $group: {
          _id: null,
          totalAmountPaid: { $sum: '$amountToPay' }
        }
      }
    ]);
    return result.length > 0 ? res.json({status:true,totalAmountPaid: result[0].totalAmountPaid }) : res.json({status:false,totalAmountPaid:0 });

    
  } catch (err) {
    console.log(err)
    res.json({ error: 'Server error', details: err.message });
  }
});

router.get('/payment/total-sum', async (req, res) => {
  try {
    const result = await Payment.aggregate([
      {
        $match: { status: 'Approved' } // optional: filter by status
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amountToPay' }
        }
      }
    ]);

    const totalAmount = result[0]?.totalAmount || 0;

    res.json({ status: true, totalAmount });
  } catch (err) {
    console.error(err);
    res.json({ status: false, message: err.message });
  }
});



// GET - Get payment records by courseName (paymentCourse field)
router.post('/pay', async (req, res) => {
  try {
    const checkPayment = await Payment.find({transactionId:req.body.transactionId})
    if(checkPayment.length > 0){
      return res.json({ status: false, message: 'Duplicate transaction id', checkPayment });
    }
    const payment = new Payment(req.body);
    await payment.save();
    res.json({ status: true, message: 'Payment record created successfully', payment });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.transactionId) {
      res.json({ status: false, message: 'Invalid transaction Id !!' });
    } else {
      res.json({ status: false, message: error.message });
    }
  }
});

router.get('/all', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }); // or use createdAt: -1
    res.json({
      status: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.json({
      status: false,
      message: 'Server error while fetching payments.'
    });
  }
});

router.patch('/update-status/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  const { status } = req.body;

  // Only allow specific status values
  const validStatuses = ['Waiting', 'Approved', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.json({
      status: false,
      message: 'Invalid status. Allowed values: Waiting, Approved, Rejected'
    });
  }

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId },
      { status },
      { new: true }
    );

    if (!updatedPayment) {
      return res.json({
        status: false,
        message: 'Payment with the given transactionId not found.'
      });
    }

    res.json({
      status: true,
      message: 'Payment status updated successfully.',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.json({
      status: false,
      message: 'Server error while updating payment status.'
    });
  }
});

module.exports = router;
