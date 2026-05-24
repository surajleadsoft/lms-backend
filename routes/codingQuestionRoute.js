const express = require("express");

const router = express.Router();

const CodingQuestion =
    require("../models/CodingQuestions");

router.post(
    "/create",
    async (req, res) => {

        try {

            const {
                subjectName,
                chapterName,
                questionTitle
            } = req.body;

            if (
                !subjectName ||
                !chapterName ||
                !questionTitle
            ) {

                return res.status(400).json({
                    status: false,
                    message:
                        "Subject name, chapter name and question title are required"
                });
            }


            const existingQuestion =
                await CodingQuestion.findOne({
                    subjectName,
                    chapterName,
                    questionTitle
                });

            if (existingQuestion) {

                return res.status(409).json({
                    status: false,
                    message:
                        "Coding question already exists"
                });
            }

            const codingQuestion =
                await CodingQuestion.create(
                    req.body
                );

            return res.status(201).json({
                status: true,
                message:
                    "Coding question created successfully",
                data: codingQuestion
            });

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                status: false,
                message: "Internal server error"
            });
        }
    }
);

router.get(
    "/get-all",
    async (req, res) => {

        try {

            const {
                page = 1,
                limit = 10,
                subjectName,
                chapterName,
                difficultyLevel,
                search
            } = req.query;


            const filter = {};

            if (subjectName) {
                filter.subjectName =
                    subjectName;
            }

            if (chapterName) {
                filter.chapterName =
                    chapterName;
            }

            if (difficultyLevel) {
                filter.difficultyLevel =
                    difficultyLevel;
            }


            if (search) {

                filter.$or = [
                    {
                        questionTitle: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        description: {
                            $regex: search,
                            $options: "i"
                        }
                    }
                ];
            }

            const questions =
                await CodingQuestion.find(
                    filter
                )
                    .sort({
                        createdAt: -1
                    })
                    .skip(
                        (Number(page) - 1) *
                        Number(limit)
                    )
                    .limit(Number(limit))
                    .lean();

            const totalQuestions =
                await CodingQuestion.countDocuments(
                    filter
                );

            return res.status(200).json({
                status: true,
                message:
                    "Coding questions fetched successfully",
                totalQuestions,
                currentPage:
                    Number(page),
                totalPages:
                    Math.ceil(
                        totalQuestions /
                        Number(limit)
                    ),
                data: questions
            });

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                status: false,
                message:
                    "Internal server error"
            });
        }
    }
);

router.get(
    "/get-single/:id",
    async (req, res) => {

        try {

            const { id } = req.params;

            const question =
                await CodingQuestion.findById(
                    id
                ).lean();

            if (!question) {

                return res.status(404).json({
                    status: false,
                    message:
                        "Coding question not found"
                });
            }

            return res.status(200).json({
                status: true,
                message:
                    "Coding question fetched successfully",
                data: question
            });

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                status: false,
                message:
                    "Internal server error"
            });
        }
    }
);


router.put(
    "/update/:id",
    async (req, res) => {

        try {

            const { id } = req.params;

            const existingQuestion =
                await CodingQuestion.findById(
                    id
                );

            if (!existingQuestion) {

                return res.status(404).json({
                    status: false,
                    message:
                        "Coding question not found"
                });
            }


            const updatedQuestion =
                await CodingQuestion.findByIdAndUpdate(
                    id,
                    req.body,
                    {
                        new: true,
                        runValidators: true
                    }
                );

            return res.status(200).json({
                status: true,
                message:
                    "Coding question updated successfully",
                data: updatedQuestion
            });

        } catch (error) {

            console.log(error);
            return res.status(500).json({
                status: false,
                message:
                    "Internal server error"
            });
        }
    }
);


router.delete(
    "/delete/:id",
    async (req, res) => {

        try {

            const { id } = req.params;

            const existingQuestion =
                await CodingQuestion.findById(
                    id
                );

            if (!existingQuestion) {

                return res.status(404).json({
                    status: false,
                    message:
                        "Coding question not found"
                });
            }
            await CodingQuestion.findByIdAndDelete(
                id
            );

            return res.status(200).json({
                status: true,
                message:
                    "Coding question deleted successfully"
            });

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                status: false,
                message:
                    "Internal server error"
            });
        }
    }
);

module.exports = router;