const express = require('express')
const router = express.Router()
const Feedback = require('../models/Feedbacks')

/*
========================================
STORE FEEDBACK
POST /api/feedback/store
========================================
*/

router.post('/store', async (req, res) => {

    try {

        const {
            userName,
            courseName
        } = req.body

        // VALIDATION
        if (!userName || !courseName) {

            return res.json({
                status: false,
                message: 'userName and courseName are required'
            })

        }

        // CHECK EXISTING
        const existingFeedback =
            await Feedback.findOne({
                emailAddress: userName.toLowerCase(),
                courseName
            })

        if (existingFeedback) {

            return res.json({
                status: false,
                message: 'Feedback already submitted',
                alreadySubmitted: true,
                data: existingFeedback
            })

        }

        // CREATE
        const feedback = await Feedback.create({
            ...req.body,
            emailAddress: userName.toLowerCase()
        })

        return res.json({
            status: true,
            message: 'Feedback submitted successfully',
            alreadySubmitted: false,
            data: feedback
        })

    } catch (error) {

        return res.json({
            status: false,
            message: error.message
        })

    }

})

/*
========================================
CHECK FEEDBACK STATUS
POST /api/feedback/check
========================================
*/

router.post('/check', async (req, res) => {

    try {

        const {
            userName,
            courseName
        } = req.body

        if (!userName || !courseName) {

            return res.json({
                status: false,
                message: 'userName and courseName are required',
                alreadySubmitted: false
            })

        }

        const feedback = await Feedback.findOne({
            emailAddress: userName.toLowerCase(),
            courseName
        })

        return res.json({
            status: true,
            alreadySubmitted: !!feedback,
            data: feedback || null
        })

    } catch (error) {

        return res.json({
            status: false,
            message: error.message,
            alreadySubmitted: false
        })

    }

})

module.exports = router