const express = require('express');
const router = express.Router();
const Category = require('../models/Categories');

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
