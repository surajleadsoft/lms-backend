const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({

    emailAddress: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    courseName: {
        type: String,
        required: true,
        trim: true
    },

    ratings: {

        overallTrainingExperience: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        },

        trainerKnowledge: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        },

        communicationExplanation: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        },

        practicalSessions: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        },

        placementPreparation: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        },

        lmsExperience: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        },

        doubtSupport: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        },

        assignmentsAndTests: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        },

        interviewPreparation: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        },

        overallSatisfaction: {
            type: Number,
            min: 1,
            max: 5,
            default: 0
        }
    },

    feedback: {

        likedMost: {
            type: String,
            default: ''
        },

        trainingHelped: {
            type: String,
            default: ''
        },

        improvements: {
            type: String,
            default: ''
        },

        recommendProgram: {
            type: Boolean,
            default: true
        },

        overallExperience: {
            type: String,
            default: ''
        }
    },

    careerImpact: {

        codingSkillsImproved: {
            type: Boolean,
            default: false
        },

        interviewConfidenceImproved: {
            type: Boolean,
            default: false
        },

        placed: {
            type: Boolean,
            default: false
        },

        companyName: {
            type: String,
            default: ''
        },

        package: {
            type: String,
            default: ''
        },

        jobRole: {
            type: String,
            default: ''
        },

        internshipCompleted: {
            type: Boolean,
            default: false
        },

        interestedInAdvancedPrograms: {
            type: Boolean,
            default: false
        }
    },

    testimonial: {

        shortTestimonial: {
            type: String,
            default: ''
        },

        profilePhoto: {
            type: String,
            default: ''
        },

        offerLetter: {
            type: String,
            default: ''
        },

        companyIdCard: {
            type: String,
            default: ''
        },

        videoTestimonialUrl: {
            type: String,
            default: ''
        }
    },

    marketingConsent: {

        allowPromotionalUse: {
            type: Boolean,
            default: false
        },

        allowSocialMediaUsage: {
            type: Boolean,
            default: false
        },

        allowMarketingCommunication: {
            type: Boolean,
            default: false
        },

        allowPlacementUpdates: {
            type: Boolean,
            default: false
        }
    },

    certificateDownloaded: {
        type: Boolean,
        default: false
    },

    certificateDownloadedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
})

feedbackSchema.index(
    { emailAddress: 1, courseName: 1 },
    { unique: true }
)

module.exports = mongoose.model('feedbacks', feedbackSchema)