const mongoose = require('mongoose');

// Define the chapter content sub-schemas
const chapterVideoSchema = new mongoose.Schema({
  videoTitle: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  videoURL: {
    type: String,
    required: true
  }
}, { _id: false });

const chapterTestSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  chapter: {
    type: String,
    required: true
  },
  numberOfQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  passingScore: {
    type: Number,
    default: 70 // percentage
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30
  }
}, { _id: false });

// Define the chapter schema
const chapterSchema = new mongoose.Schema({
  chapterNo: {
    type: Number,
    required: true,
    min: 1
  },
  chapterName: {
    type: String,
    required: true,
    trim: true
  },
  chapterType: {
    type: String,
    required: true,
    enum: ['video', 'test','youtube'],
    default: 'video'
  },
  chapterContent: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(content) {
        if (this.chapterType === 'video') {
          return content.videoTitle && content.videoURL;
        } else if (this.chapterType === 'test') {
          return content.subject && content.chapter && content.numberOfQuestions;
        } else if (this.chapterType === 'youtube') {
          return content.videoTitle && content.videoURL;
        }
        return false;
      },
      message: 'Chapter content must match the chapter type'
    }
  }
}, { _id: false });

// Main LearningCourse schema
const learningCourseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  tags: {
    type: String,
    default: ""
  },
  learningIcon: {
    type: String,
    default: 'default-course-icon.png'
  },
  category: {
    type: String,
    required: true,
    enum: ['popular', 'new'],
    default: 'popular'
  },
  coursesAssigned: {
    type: [String], // Array of user IDs or course IDs
    default: []
  },
  chapters: {
    type: [chapterSchema],
    default: [],
    validate: {
      validator: function(chapters) {
        // Validate chapter numbers are sequential and unique
        const chapterNumbers = chapters.map(ch => ch.chapterNo);
        const expectedNumbers = Array.from({ length: chapters.length }, (_, i) => i + 1);
        return JSON.stringify(chapterNumbers) === JSON.stringify(expectedNumbers);
      },
      message: 'Chapter numbers must be sequential starting from 1'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Update the updatedAt field before saving
learningCourseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add a method to get the next chapter number
learningCourseSchema.methods.getNextChapterNumber = function() {
  return this.chapters.length + 1;
};

// Add a method to add a new chapter
learningCourseSchema.methods.addChapter = function(chapterData) {
  const nextChapterNo = this.getNextChapterNumber();

  const newChapter = {
    chapterNo: nextChapterNo,
    chapterName: chapterData.chapterName,
    chapterType: chapterData.chapterType,
    chapterContent: chapterData.chapterContent
  };

  if (
    newChapter.chapterType === 'video' &&
    (!newChapter.chapterContent?.videoTitle || !newChapter.chapterContent?.videoURL)
  ) {
    throw new Error('Invalid video chapter content');
  }

  if (
    newChapter.chapterType === 'test' &&
    (!newChapter.chapterContent?.subject ||
     !newChapter.chapterContent?.chapter ||
     typeof newChapter.chapterContent?.numberOfQuestions !== 'number')
  ) {
    throw new Error('Invalid test chapter content');
  }

  if (
    newChapter.chapterType === 'youtube' &&
    (!newChapter.chapterContent?.videoTitle || !newChapter.chapterContent?.videoURL)
  ) {
    throw new Error('Invalid YouTube chapter content');
  }

  this.chapters.push(newChapter);
  return this.save();
};


// Add a method to remove a chapter and renumber remaining chapters
learningCourseSchema.methods.removeChapter = function(chapterNo) {
  // Remove the chapter
  this.chapters = this.chapters.filter(ch => ch.chapterNo !== chapterNo);
  
  // Renumber remaining chapters
  this.chapters = this.chapters.map((ch, index) => {
    ch.chapterNo = index + 1;
    return ch;
  });
  
  return this.save();
};

// Create the model
const LearningCourse = mongoose.model('LearningCourse', learningCourseSchema);

module.exports = LearningCourse;