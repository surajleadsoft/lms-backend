const mongoose = require("mongoose");

const languageConfigurationSchema = new mongoose.Schema(
    {
        language: {
            type: String,
            enum: [
                "C",
                "CPP",
                "JAVA",
                "PYTHON",
                "JAVASCRIPT"
            ],
            required: true
        },
        starterCode: {
            type: String,
            default: ""
        },
        
        driverCode: {
            type: String,
            default: ""
        },

        imports: {
            type: String,
            default: ""
        }
    },
    {
        _id: false
    }
);


// =========================================================
// SAMPLE TEST CASE
// =========================================================

const sampleTestCaseSchema = new mongoose.Schema(
    {
        input: {
            type: String,
            required: true
        },

        expectedOutput: {
            type: String,
            required: true
        },

        explanation: {
            type: String,
            default: ""
        }
    }
);


// =========================================================
// HIDDEN TEST CASE
// =========================================================

const hiddenTestCaseSchema = new mongoose.Schema(
    {
        input: {
            type: String,
            required: true
        },

        expectedOutput: {
            type: String,
            required: true
        },

        explanation: {
            type: String,
            default: ""
        },

        weight: {
            type: Number,
            default: 1,
            min: 1
        }
    }
);


// =========================================================
// EXECUTION SETTINGS
// =========================================================

const executionSettingsSchema = new mongoose.Schema(
    {
        timeLimit: {
            type: Number,
            default: 2,
            min: 1
        },

        memoryLimit: {
            type: Number,
            default: 256,
            min: 32
        },

        maximumAttempts: {
            type: Number,
            default: 3,
            min: 1
        },

        evaluationType: {
            type: String,
            enum: [
                "EXACT",
                "CUSTOM"
            ],
            default: "EXACT"
        },

        caseSensitive: {
            type: Boolean,
            default: true
        },

        ignoreLeadingTrailingSpaces: {
            type: Boolean,
            default: true
        },

        ignoreExtraNewLines: {
            type: Boolean,
            default: true
        }
    },
    {
        _id: false
    }
);


// =========================================================
// MAIN QUESTION SCHEMA
// =========================================================

const questionSchema = new mongoose.Schema(
    {

        // =====================================================
        // QUESTION TYPE
        // =====================================================

        questionType: {
            type: String,

            enum: [
                "SINGLE_CHOICE",
                "MULTIPLE_CHOICE",
                "FILL_BLANK",
                "CODING"
            ],

            required: true,

            default: "SINGLE_CHOICE",

            index: true
        },


        // =====================================================
        // EXISTING FIELDS
        // DO NOT CHANGE THESE NAMES
        // =====================================================

        subjectName: {
            type: String,

            required: true,

            trim: true,

            index: true
        },


        chapterName: {
            type: String,

            required: true,

            trim: true,

            index: true
        },


        difficultyLevel: {
            type: String,

            required: true,

            enum: [
                "Easy",
                "Medium",
                "Hard"
            ],

            index: true
        },


        // =====================================================
        // COMPANY TAGS
        // =====================================================

        companyTags: {
            type: [String],

            default: []
        },


        // =====================================================
        // ALGORITHM / TOPIC TAGS
        // =====================================================

        topicTags: {
            type: [String],

            default: []
        },


        // =====================================================
        // QUESTION TEXT
        //
        // Existing field retained
        // =====================================================

        questionText: {
            type: String,

            required: true
        },


        // =====================================================
        // MCQ OPTIONS
        //
        // Existing format retained:
        //
        // {
        //     A: "Option A",
        //     B: "Option B",
        //     C: "Option C",
        //     D: "Option D"
        // }
        //
        // =====================================================

        options: {
            type: Object,

            default: {}
        },


        // =====================================================
        // ANSWER
        //
        // Existing field retained for backward compatibility
        //
        // Single:
        // "A"
        //
        // Fill:
        // "Paris"
        //
        // =====================================================

        answer: {
            type: String,

            default: ""
        },


        // =====================================================
        // MULTIPLE CORRECT ANSWERS
        //
        // Example:
        //
        // ["A", "C"]
        //
        // =====================================================

        correctAnswers: {
            type: [String],

            default: []
        },


        // =====================================================
        // FILL BLANK ACCEPTED ANSWERS
        //
        // Example:
        //
        // ["Paris", "paris"]
        //
        // =====================================================

        acceptedAnswers: {
            type: [[String]],
            default: []
        },


        // =====================================================
        // CODING QUESTION
        // =====================================================

        coding: {

            // -------------------------------------------------
            // Problem Definition
            // -------------------------------------------------

            inputFormat: {
                type: String,

                default: ""
            },


            outputFormat: {
                type: String,

                default: ""
            },


            constraints: {
                type: String,

                default: ""
            },


            functionSignature: {
                type: String,

                default: ""
            },


            additionalNotes: {
                type: String,

                default: ""
            },


            // -------------------------------------------------
            // Supported Languages
            // -------------------------------------------------

            languages: {
                type: [String],

                enum: [
                    "C",
                    "CPP",
                    "JAVA",
                    "PYTHON",
                    "JAVASCRIPT"
                ],

                default: []
            },


            // -------------------------------------------------
            // Language Specific Configuration
            // -------------------------------------------------

            languageConfigurations: {
                type: [languageConfigurationSchema],

                default: []
            },


            // -------------------------------------------------
            // Execution Settings
            // -------------------------------------------------

            executionSettings: {
                type: executionSettingsSchema,

                default: () => ({})
            },


            // -------------------------------------------------
            // Sample Test Cases
            // -------------------------------------------------

            sampleTestCases: {
                type: [sampleTestCaseSchema],

                default: []
            },


            // -------------------------------------------------
            // Hidden Test Cases
            // -------------------------------------------------

            hiddenTestCases: {
                type: [hiddenTestCaseSchema],

                default: []
            }

        },


        // =====================================================
        // QUESTION STATUS
        // =====================================================

        status: {
            type: String,

            enum: [
                "DRAFT",
                "ACTIVE",
                "INACTIVE"
            ],

            default: "ACTIVE",

            index: true
        },


        // =====================================================
        // VERSION
        // =====================================================

        version: {
            type: Number,

            default: 1
        },


        // =====================================================
        // CREATED BY
        // =====================================================

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            default: null
        },


        // =====================================================
        // UPDATED BY
        // =====================================================

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            default: null
        }

    },

    {
        timestamps: true
    }
);


// =========================================================
// EXISTING DUPLICATE PROTECTION
// =========================================================

questionSchema.index(
    {
        subjectName: 1,
        chapterName: 1,
        questionText: 1
    },
    {
        unique: true
    }
);


// =========================================================
// CODING QUESTION VALIDATION
// =========================================================

questionSchema.pre("validate", function (next) {

    // =====================================================
    // SINGLE CHOICE
    // =====================================================

    if (this.questionType === "SINGLE_CHOICE") {

        if (
            !this.options ||
            Object.keys(this.options).length < 2
        ) {
            return next(
                new Error(
                    "Single Choice Question must have at least 2 options."
                )
            );
        }


        if (!this.answer) {
            return next(
                new Error(
                    "Single Choice Question must have a correct answer."
                )
            );
        }

    }


    // =====================================================
    // MULTIPLE CHOICE
    // =====================================================

    if (this.questionType === "MULTIPLE_CHOICE") {

        if (
            !this.options ||
            Object.keys(this.options).length < 2
        ) {
            return next(
                new Error(
                    "Multiple Choice Question must have at least 2 options."
                )
            );
        }


        if (
            !this.correctAnswers ||
            this.correctAnswers.length === 0
        ) {
            return next(
                new Error(
                    "Multiple Choice Question must have at least one correct answer."
                )
            );
        }

    }


    // =====================================================
    // FILL IN THE BLANK
    // =====================================================

    if (this.questionType === "FILL_BLANK") {

        if (
            !this.acceptedAnswers ||
            this.acceptedAnswers.length === 0
        ) {
            return next(
                new Error(
                    "Fill in the Blank Question must have at least one accepted answer."
                )
            );
        }

    }


    // =====================================================
    // CODING
    // =====================================================

    if (this.questionType === "CODING") {

        if (!this.coding) {

            return next(
                new Error(
                    "Coding configuration is required."
                )
            );

        }


        if (
            !this.coding.languages ||
            this.coding.languages.length === 0
        ) {

            return next(
                new Error(
                    "At least one programming language is required."
                )
            );

        }


        if (
            !this.coding.sampleTestCases ||
            this.coding.sampleTestCases.length === 0
        ) {

            return next(
                new Error(
                    "At least one sample test case is required."
                )
            );

        }


        if (
            !this.coding.hiddenTestCases ||
            this.coding.hiddenTestCases.length === 0
        ) {

            return next(
                new Error(
                    "At least one hidden test case is required."
                )
            );

        }

    }


    next();

});


module.exports = mongoose.model(
    "Question",
    questionSchema
);