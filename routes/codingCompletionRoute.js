const express = require('express');
const router = express.Router();
const CodingCompletion = require('../models/CodingCompletion'); // import schema

// -------------------- POST: Save a solution --------------------
router.post('/completion', async (req, res) => {
    try {
        const { userName, chapterName, problemTitle, language, solution } = req.body;

        if (!userName || !chapterName || !problemTitle || !language || !solution) {
            return res.json({ status: false, message: 'All fields are required' });
        }

        const newCompletion = new CodingCompletion({
            userName,
            chapterName,
            problemTitle,
            language,
            solution
        });

        await newCompletion.save();

        res.json({ status: true, message: 'Solution saved successfully', data: newCompletion });
    } catch (error) {
        console.error(error);
        res.json({ status: false, message: 'Server error', error: error.message });
    }
});

// -------------------- GET: Retrieve solutions by userName --------------------
router.get('/codingCompletions/:userName', async (req, res) => {
    try {
        const { userName } = req.params;

        const solutions = await CodingCompletion.find({ userName }).sort({ createdAt: -1 });

        if (!solutions.length) {
            return res.json({ status: false, message: 'No solutions found for this user', data: [] });
        }

        res.json({ status: true, message: 'Solutions retrieved successfully', data: solutions });
    } catch (error) {
        console.error(error);
        res.json({ status: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
