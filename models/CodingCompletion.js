const mongoose = require('mongoose');

const codingCompletionSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        index: true // Index for faster lookups per user
    },
    chapterName: {
        type: String,
        required: true,
        index: true // Index for filtering by chapter
    },
    problemTitle: {
        type: String,
        required: true,
        index: true // Index for problem lookups
    },
    language: {
        type: String,
        required: true,
        enum: ['Java', 'Python', 'C++', 'C', 'JavaScript'] // Optional: restrict languages
    },
    solution: {
        type: String,
        required: true
    },
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Compound index to optimize queries per user and chapter
codingCompletionSchema.index({ userName: 1, chapterName: 1, problemTitle: 1 }, { unique: false });

const CodingCompletion = mongoose.model('codingCompletions', codingCompletionSchema);

module.exports = CodingCompletion;
