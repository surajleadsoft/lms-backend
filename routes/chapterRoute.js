
const express = require('express');
const router = express.Router();
const Chapter = require('../models/Chapters');

// Insert Chapter
router.post('/add', async (req, res) => {
    const { subjectName, chapterName } = req.body;

    try {
        const newChapter = new Chapter({ subjectName, chapterName });
        await newChapter.save();
        return res.json({ status: true, message: 'Chapter added successfully' });
    } catch (err) {
        if (err.code === 11000) {
            return res.json({ status: false, message: 'Chapter already exists for this subject' });
        }
        return res.json({ status: false, message: 'Failed to add chapter' });
    }
});

// Update Chapter
router.put('/update/:id', async (req, res) => {
    const { subjectName, chapterName } = req.body;

    try {
        // Check for duplicate before updating
        const exists = await Chapter.findOne({
            subjectName,
            chapterName,
            _id: { $ne: req.params.id }
        });

        if (exists) {
            return res.json({ status: false, message: 'Duplicate chapter for this subject' });
        }

        await Chapter.findByIdAndUpdate(req.params.id, { subjectName, chapterName });
        return res.json({ status: true, message: 'Chapter updated successfully' });

    } catch (err) {
        return res.json({ status: false, message: 'Failed to update chapter' });
    }
});

// Delete Chapter
router.delete('/delete/:id', async (req, res) => {
    try {
        await Chapter.findByIdAndDelete(req.params.id);
        return res.json({ status: true, message: 'Chapter deleted successfully' });
    } catch (err) {
        return res.json({ status: false, message: 'Failed to delete chapter' });
    }
});

// Get All Chapters
router.get('/all', async (req, res) => {
    try {
        const chapters = await Chapter.find();
        return res.json({ status: true, message: 'Chapters fetched successfully', data: chapters });
    } catch (err) {
        return res.json({ status: false, message: 'Failed to fetch chapters' });
    }
});

module.exports = router;
