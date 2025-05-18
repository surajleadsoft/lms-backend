const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  categoryType: {
    type: String,
    required: true,
    enum: ['Paid', 'Free'] // optional: add allowed types
  },
  categoryStatus: {
    type: String,
    required: true,
    enum: ['active', 'inactive'], // optional: enforce valid status
    default: 'active'
  }
});

// ✅ Ensure categoryName is unique for a given courseName
categorySchema.index({ courseName: 1, categoryName: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
