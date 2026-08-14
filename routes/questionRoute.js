const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const multer = require("multer");
const path = require("path");



const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads/");
    },
    filename(req, file, cb) {
        cb(
            null,
            Date.now() + path.extname(file.originalname)
        );
    }
});


const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter(req, file, cb) {
        const allowed = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/gif",
            "image/webp"
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only image files are allowed"
                )
            );
        }
    }
});


router.post("/editor-image",upload.single("image"),(req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    status: false,
                    message: "No image uploaded"
                });
            }
            const imageUrl =`${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;


            return res.json({
                status: true,
                message: "Image uploaded successfully",
                url: imageUrl
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: error.message
            });
        }
    }
);


router.post("/", async (req, res) => {
    try {
        console.log("\n====================================");
        console.log("CREATE QUESTION REQUEST");
        console.log("====================================");

        console.log(
            JSON.stringify(req.body, null, 2)
        );

        // Basic request validation
        if (!req.body || typeof req.body !== "object") {

            return res.status(400).json({
                status: false,
                message: "Invalid request body"
            });
        }

        console.log("\nCreating Question document...");

        const newQuestion = new Question(req.body);

        console.log("\nQuestion document created.");

        console.log(
            JSON.stringify(
                newQuestion.toObject(),
                null,
                2
            )
        );

        console.log("\nSaving question...");

        const savedQuestion =
            await newQuestion.save();

        console.log("\nQuestion saved successfully.");

        return res.status(201).json({
            status: true,
            message: "Question added successfully",
            data: savedQuestion
        });
    } catch (err) {
        console.error("Add Question Error:",err);
        if (err.code === 11000) {
            return res.status(409).json({
                status: false,
                message:"Duplicate question for this subject and chapter."
            });
        }
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map(
                error => error.message
            );
            return res.status(400).json({
                status: false,
                message: "Validation failed",
                errors
            });
        }
        return res.status(500).json({
            status: false,
            message:"Server error: " + err.message
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const questions = await Question.find().sort({createdAt: -1});

        return res.json({
            status: true,
            message:"All questions fetched",
            data: questions
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message:"Server error: " + err.message
        });
    }
});
router.get("/subject/:subjectName",async (req, res) => {
        try {
            const questions = await Question.find({
                    subjectName: req.params.subjectName
            });
            return res.json({
              status: true,
              message:"Questions by subject fetched",
              data: questions
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                message:"Server error: " +err.message
            });
        }
    }
);

router.get("/subject/:subjectName/chapter/:chapterName",async (req, res) => {

        try {
            const {
                subjectName,
                chapterName
            } = req.params;


            const questions =
                await Question.find({
                    subjectName,
                    chapterName
                });


            return res.json({
                status: true,
                message:"Questions by subject and chapter fetched",
                data: questions
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                message:"Server error: " +err.message
            });
        }
    }
);

router.get("/subject/:subjectName/chapter/:chapterName/level/:difficultyLevel",async (req, res) => {

        try {
            const {
                subjectName,
                chapterName,
                difficultyLevel
            } = req.params;


            const questions = await Question.find({
                    subjectName,
                    chapterName,
                    difficultyLevel
            });
            return res.json({
                status: true,
                message: "Filtered questions fetched successfully",
                data: questions
            });
        } catch (err) {
            return res.status(500).json({
                status: false,
                message: "Server error: " +err.message
            });
        }
    }
);

router.get("/type/:questionType",async (req, res) => {
        try {
            const questions = await Question.find({
                    questionType: req.params.questionType
            });

            return res.json({
                status: true,
                message:"Questions by type fetched",
                data: questions
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                message:"Server error: " +err.message
            });
        }
    }
);

router.post("/random",async (req, res) => {
        try {
            const {
                subjectName,
                chapterName,
                noOfquestions,
                questionType,
                difficultyLevel
            } = req.body;


            if ( !subjectName || !chapterName || !noOfquestions) {

                return res.status(400).json({
                    status: false,
                    message:"subjectName, chapterName and noOfquestions are required"
                });
            }

            const numberOfQuestions = parseInt(noOfquestions);

            if (isNaN(numberOfQuestions) || numberOfQuestions <= 0) {
                return res.status(400).json({
                    status: false,
                    message:"noOfquestions must be a valid positive number"
                });
            }

            const match = {
                subjectName,
                chapterName
            };
            if (questionType) {
                match.questionType = questionType;
            }
            if (difficultyLevel) {
                match.difficultyLevel = difficultyLevel;
            }

            const questions = await Question.aggregate([
                    {
                        $match: match
                    },
                    {
                        $sample: {
                            size: numberOfQuestions
                        }
                    }
            ]);

            return res.json({
              status: true,
              message:"Random questions fetched successfully",
              data: questions
            });

        } catch (error) {
            console.error("Random Questions Error:",error);

            return res.status(500).json({
                status: false,
                message:"Internal Server Error"
            });
        }
    }
);


router.post("/random/coding",async (req, res) => {
        try {
            const {
                subjectName,
                chapterName,
                noOfquestions,
                difficultyLevel
            } = req.body;


            if ( !subjectName || !chapterName || !noOfquestions) {

                return res.status(400).json({
                    status: false,
                    message: "subjectName, chapterName and noOfquestions are required"
                });
            }

            const match = {
                subjectName,
                chapterName,
                questionType: "CODING"
            };


            if (difficultyLevel) {
                match.difficultyLevel = difficultyLevel;
            }


            const questions = await Question.aggregate([
                    {
                        $match: match
                    },
                    {
                        $sample: {
                            size:
                                parseInt(noOfquestions)
                        }
                    }
            ]);

            return res.json({
                status: true,
                message: "Random coding questions fetched successfully",
                data: questions
            });
        } catch (error) {
              console.error("Random Coding Questions Error:",error);

            return res.status(500).json({
                status: false,
                message: "Internal Server Error"
            });
        }
    }
  );

router.get("/:id", async (req, res) => {
        try {
            const question = await Question.findById( req.params.id);
            if (!question) {
                return res.status(404).json({
                    status: false,
                    message:"Question not found"
                });
            }
            return res.json({
                status: true,
                message:"Question fetched successfully",
                data: question
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                message:"Server error: " +error.message
            });
        }
    }
);


router.put("/:id",async (req, res) => {
        try {

            const question = await Question.findById(req.params.id);

            if (!question) {
                return res.status(404).json({
                    status: false,
                    message:"Question not found"
                });
            }

            Object.assign(question,req.body);
            const updatedQuestion = await question.save();

            return res.json({
                status: true,
                message: "Question updated successfully",
                data: updatedQuestion
            });

        } catch (error) {
            console.error("Update Question Error:",error);

            if (error.code === 11000) {
                return res.status(409).json({
                    status: false,
                    message:"Duplicate question for this subject and chapter."
                });
            }

            if (error.name ==="ValidationError") {
                return res.status(400).json({
                    status: false,
                    message:"Validation failed",
                    errors:
                        Object.values(
                            error.errors
                        ).map(
                            e => e.message
                        )
                });

            }
            return res.status(500).json({
                status: false,
                message:"Server error: " +error.message
            });
        }
    }
);



router.delete("/:id",async (req, res) => {
        try {
            const question = await Question.findByIdAndDelete(req.params.id);

            if (!question) {
                return res.status(404).json({
                    status: false,
                    message:"Question not found"
                });
            }

            return res.json({
                status: true,
                message:"Question deleted successfully"
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                message:"Server error: " +error.message
            });
        }
    }
);


module.exports = router;