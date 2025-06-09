const express = require('express');
const router = express.Router();
const Category = require('../models/Categories');
const Exam = require('../models/Exams');
const ExamSection = require('../models/examSection')
const Payment = require('../models/payments'); // Adjust path


// 🔹 Insert category
router.post('/', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.json({ status: true, message: 'Category inserted successfully' });
  } catch (err) {
    if (err.code === 11000) {
      res.json({ status: false, message: 'Duplicate categoryName for the same courseName' });
    } else {
        console.log(err)
      res.json({ status: false, message: 'Insertion failed' });
    }
  }
});

// 🔹 Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ status: true, message: 'Categories fetched successfully', data: categories });
  } catch (err) {
    res.json({ status: false, message: 'Failed to fetch categories' });
  }
});
const checkIfFullyPaid = async (emailAddress, paymentCourse) => {
  const result = await Payment.aggregate([
    {
      $match: {
        emailAddress,
        paymentCourse,
        status: 'Approved' // Only consider approved payments
      }
    },
    {
      $group: {
        _id: {
          email: "$emailAddress",
          course: "$paymentCourse"
        },
        totalPaid: { $sum: "$amountToPay" },
        courseFees: { $max: "$courseFees" } // assuming courseFees is same for all
      }
    },
    {
      $project: {
        _id: 0,
        emailAddress: "$_id.email",
        paymentCourse: "$_id.course",
        totalPaid: 1,
        courseFees: 1,
        isFullyPaid: { $gte: ["$totalPaid", "$courseFees"] } // ✅ change here
      }
    }
  ]);

  return result[0] || { isFullyPaid: false };
};
// 🔹 Get with courseName all categories
router.get('/get-by-course/:courseName', async (req, res) => {
  try {
    const { courseName } = req.params;
    const { email } = req.query;
    const payStatus = await checkIfFullyPaid(email, courseName);

    const categories = await Category.aggregate([
      {
        $match: { courseName: courseName }
      },
      {
        $lookup: {
          from: 'exams', // MongoDB collection name
          localField: 'categoryName',
          foreignField: 'category',
          as: 'exams'
        }
      },
      {
        $project: {
          categoryName: 1,
          courseName: 1,
          categoryType: 1,
          categoryStatus: 1,
          examNames: '$exams.examName',
          noOfExams: { $size: '$exams' }          
        }
      }
    ]);

    // Check how many exams the user has attempted for each category
    const resultWithCompletion = await Promise.all(
      categories.map(async (category) => {
        const examNames = category.examNames || [];

        let attemptedCount = 0;
        if (email && examNames.length > 0) {
          attemptedCount = await ExamSection.countDocuments({
            emailAddress: email,
            examName: { $in: examNames }
          });
        }

        const percentage = category.noOfExams > 0
          ? Math.round((attemptedCount / category.noOfExams) * 100)
          : 0;

        return {
          ...category,
          attemptedExams: attemptedCount,
          completionPercentage: percentage,
          payStatus:payStatus
        };
      })
    );

    res.json({
      status: true,
      message: 'Categories with completion percentage fetched successfully',
      data: resultWithCompletion
    });

  } catch (err) {
    res.json({
      status: false,
      message: 'Error fetching data',
      error: err.message
    });
  }
});


// 🔹 Update category
router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.json({ status: false, message: 'Category not found' });
    }

    // Toggle status
    category.categoryStatus = category.categoryStatus === 'active' ? 'inactive' : 'active';
    await category.save();

    res.json({ status: true, message: `Category status updated to ${category.categoryStatus}`,categoryStatus:category.categoryStatus });
  } catch (err) {
    console.log(err)
    res.json({ status: false, message: 'Update failed' });
  }
});


// 🔹 Delete category
router.delete('/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ status: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.json({ status: false, message: 'Delete failed' });
  }
});

module.exports = router;
