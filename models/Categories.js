const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true,
    index: true // ✅ search often
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  categoryType: {
    type: String,
    required: true,
    enum: ['Paid', 'Free']
  },
  categoryStatus: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  }
});

// ✅ unique compound index
categorySchema.index({ courseName: 1, categoryName: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
