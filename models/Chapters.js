// models/Chapter.js

const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    subjectName: {
        type: String,
        required: true,
        trim: true
    },
    chapterName: {
        type: String,
        required: true,
        trim: true
    }
});

// Ensure unique chapter per subject
chapterSchema.index({ subjectName: 1, chapterName: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', chapterSchema);
