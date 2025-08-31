const express = require('express')
const router = express.Router()
const Chapter = require('../models/CodingChapters')
const CodingCompletion = require('../models/CodingCompletion');

router.get('/user-chapter-status', async (req, res) => {
    const { userName, batchName } = req.query;

    if (!userName || !batchName) {
        return res.json({
            success: false,
            message: "Both userName and batchName query parameters are required"
        });
    }

    try {
        // Get all chapters assigned to this batch/user
        const chapters = await Chapter.find({ chapterAssignedTo: batchName });

        if (!chapters || chapters.length === 0) {
            return res.json({
                success: false,
                message: "No chapters found for this batch"
            });
        }

        const result = [];

        for (const chapter of chapters) {
            const totalQuestions = chapter.questions.length;

            // Get how many questions this user has solved in this chapter
            const userCompletions = await CodingCompletion.find({
                userName,
                chapterName: chapter.chapterName
            });

            const solved = userCompletions.length;
            const unsolved = totalQuestions - solved;
            const percentage = totalQuestions === 0 ? 0 : Math.round((solved / totalQuestions) * 100);

            result.push({
                chapterName: chapter.chapterName,
                totalQuestions,
                solvedQuestions: solved,
                unsolvedQuestions: unsolved,
                percentage
            });
        }

        return res.json({
            success: true,
            userName,
            data: result
        });

    } catch (err) {
        console.error(err);
        return res.json({
            success: false,
            message: "Something went wrong!"
        });
    }
});



// GET /chapters?batchName=...
router.get('/chapters', async (req, res) => {
  try {
    const { batchName } = req.query;

    if (!batchName) {
      return res.json({ status: false, message: "batchName query parameter is required", data: null });
    }

    // Find chapters where the batchName exists in chapterAssignedTo array
    const chapters = await Chapter.find({ chapterAssignedTo: batchName });

    if (!chapters || chapters.length === 0) {
      return res.json({ status: false, message: "No chapters found for this batch", data: [] });
    }

    // Map chapters to include question stats
    const chaptersWithStats = chapters.map((chapter) => {
      const totalQuestions = chapter.questions.length;
      
      // Here, you can replace this with real "solved" logic
      const solvedQuestions = 3; // example static value
      const percentage = totalQuestions > 0 ? Math.round((solvedQuestions / totalQuestions) * 100) : 0;

      return {
        _id: chapter._id,
        chapterName: chapter.chapterName,
        tags: chapter.tags,
        category: chapter.category,
        chapterAssignedTo: chapter.chapterAssignedTo,
        totalQuestions,
        solvedQuestions,
        percentage,
        questions: chapter.questions,
      };
    });

    res.json({ status: true, message: "Chapters fetched successfully", data: chaptersWithStats });
  } catch (err) {
    console.error(err.message);
    res.json({ status: false, message: "Something went wrong !!", data: null });
  }
});

// GET /chapters/questions?chapterName=...
router.get('/chapters/questions', async (req, res) => {
  try {
    const { chapterName, userName } = req.query;

    if (!chapterName || !userName) {
      return res.json({ 
        status: false, 
        message: "chapterName and userName query parameters are required", 
        data: null 
      });
    }

    // Find chapter by name
    const chapter = await Chapter.findOne({ chapterName });
    if (!chapter) {
      return res.json({ status: false, message: "Chapter not found", data: null });
    }

    // Fetch all completions by this user for this chapter
    const userCompletions = await CodingCompletion.find({
      userName,
      chapterName
    });

    // Map completions for quick lookup
    const completionMap = {};
    userCompletions.forEach(c => {
      completionMap[c.problemTitle] = c.solution; // store solution
    });

    // Map questions to custom response format
    const formattedQuestions = chapter.questions.map((q) => {
      const solved = completionMap[q.title] !== undefined;
      return {
        id: q.questionNo,
        title: q.title,
        solved,
        solution: solved ? completionMap[q.title] : null, // return solution if solved
        tags: q.tags,
        description: q.description,
        input: q.inputFormat || "",
        output: q.outputFormat || "",
        sampleCases: q.sampleTestCases.map(sc => ({
          input: sc.input,
          output: sc.output,
          explanation: sc.explanation || ""
        })),
        hiddenTestCases: q.hiddenTestCases.map(htc => ({
          input: htc.input,
          output: htc.output
        }))
      };
    });

    res.json({
      status: true,
      message: "Questions fetched successfully",
      data: formattedQuestions
    });

  } catch (err) {
    console.error(err.message);
    res.json({ status: false, message: "Something went wrong !!", data: null });
  }
});




router.post('/chapters', async (req, res) => {
  try {
    const { questions, ...chapterData } = req.body;    
    const newChapter = new Chapter(chapterData);    
    const savedChapter = await newChapter.save();    
    res.json({status:true,message:'Chapter added successfully !!'});
  } catch (err) {
    console.error(err.message);
    res.json({status:false,message:'Something went wrong !!'});
  }
});

router.get('/get-chapters', async (req, res) => {
  try {
    const chapters = await Chapter.find();    
    res.json({status:true,data:chapters});
  } catch (err) {
    console.error(err.message);
    res.json({status:false,message:'Something went wrong !!'});
  }
});

router.get('/chapters/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.json({status:false, message: 'Chapter not found' });
    }    
    res.json({status:true,data:chapter});
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.json({status:false,message:'Something went wrong !!'});
    }
    res.json({status:false,message:'Something went wrong !!'});
  }
});

router.put('/chapters/:id', async (req, res) => {
  try {
    const updatedChapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedChapter) {
      return res.json({status:false, message: 'Chapter not found' });
    }
    
    res.json({status:true,message:'Chapter updated successfully !!',data:updatedChapter});
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.json({status:false,message:'Something went wrong !!'});
    }
    res.json({status:false,message:'Something went wrong !!'});
  }
});

router.post('/chapters/:id/question', async (req, res) => {
  try {
    const { question } = req.body;

    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.json({ status: false, message: "Chapter not found" });
    }

    // assign questionNo
    question.questionNo = chapter.questions.length + 1;

    // Map test cases to match schema
    if (question.sampleTestCases) {
      question.sampleTestCases = question.sampleTestCases.map(tc => ({
        input: tc.input,
        output: tc.expectedOutput,
        explanation: tc.explanation || ''
      }));
    }

    if (question.hiddenTestCases) {
      question.hiddenTestCases = question.hiddenTestCases.map(tc => ({
        input: tc.input,
        output: tc.expectedOutput
      }));
    }

    chapter.questions.push(question);
    await chapter.save();

    res.json({ status: true, message: "Chapter updated successfully !!", data: chapter });
  } catch (err) {
    console.error(err.message);
    res.json({ status: false, message: "Something went wrong !!" });
  }
});


router.post('/chapters/:id/question', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.json({ status:false,message: 'A single question object is required' });
    }
    
    const updatedChapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { $push: { questions: question } },
      { new: true, runValidators: true }
    );
    
    if (!updatedChapter) {
      return res.json({status:false, message: 'Chapter not found' });
    }
    
    res.json({status:true,message:'Question added successfully !!',data:updatedChapter});
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      res.json({status:false,message:'Something went wrong !!'});
    }
    res.json({status:false,message:'Something went wrong !!'});
  }
});
router.delete('/chapters/:id', async (req, res) => {
  try {
    const deletedChapter = await Chapter.findByIdAndDelete(req.params.id);
    
    if (!deletedChapter) {
      return res.json({ status:false,message: 'Chapter not found' });
    }
    
    res.json({status:true, message: 'Chapter successfully deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid chapter ID format' });
    }
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

module.exports = router
