const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    subjectTags: {
      type: [String], // Array of tags (e.g., ['math', 'algebra'])
      default: []
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt fields automatically
  }
);

// Export the model
module.exports = mongoose.model('Subject', subjectSchema);
