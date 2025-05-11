const mongoose = require('mongoose');

// Sub-schemas
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const joinerSchema = new mongoose.Schema({
  category: { type: String, required: true }
}, { _id: false });

const learnTopicSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  topic: { type: String, required: true }
}, { _id: false });

const outcomeSchema = new mongoose.Schema({
  outcome: { type: String, required: true }
}, { _id: false });

const trainerDetailSchema = new mongoose.Schema({
  detail: { type: String, required: true }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  courseName: { type: String, required: true },
  emailAddress: { 
    type: String, 
    required: true 
  },
  gender: { type: String, required: true },
  mobileNo: { type: String, required: true },
  education: { type: String, required: true },
  collegeName: { type: String, required: true },
  courseFees: { type: String, required: true }
}, { _id: false });

const courseRegistrationSchema = new mongoose.Schema({
  courseName: { type: String, required: true, unique: true },
  inductionSessionDate: { type: String, required: true },
  inductionSessionLink: { type: String, required: true },
  mainText: { type: String, required: true },
  subText: { type: String, required: true },
  courseDuration: { type: String, required: true },
  courseFees: { type: String, required: true },
  offer: { type: String, required: true },
  courseMode: { type: String, required: true },
  certification: { type: String, required: true },
  endRegistrationDate: { type: String, required: true },
  placement: { type: String, required: true },

  faqs: [faqSchema],

  joiners: {
    type: [joinerSchema],
    validate: {
      validator: arr => new Set(arr.map(j => j.category)).size === arr.length,
      message: 'Duplicate category in joiners is not allowed.'
    }
  },

  learnTopics: {
    type: [learnTopicSchema],
    validate: {
      validator: arr => {
        const seen = new Set();
        return arr.every(item => {
          const key = `${item.domain}_${item.topic}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      },
      message: 'Duplicate domain-topic pair in learnTopics is not allowed.'
    }
  },

  outcomes: {
    type: [outcomeSchema],
    validate: {
      validator: arr => new Set(arr.map(o => o.outcome)).size === arr.length,
      message: 'Duplicate outcomes are not allowed.'
    }
  },

  trainerDetails: {
    type: [trainerDetailSchema],
    validate: {
      validator: arr => new Set(arr.map(t => t.detail)).size === arr.length,
      message: 'Duplicate trainer details are not allowed.'
    }
  },

  students: [studentSchema]
});


// ✅ Pre-save hook to check for duplicate emails within a course
courseRegistrationSchema.pre('save', function (next) {
  const emailSet = new Set();
  for (const student of this.students) {
    const key = student.emailAddress.toLowerCase().trim();
    if (emailSet.has(key)) {
      return next(new Error(`Duplicate emailAddress found: ${key}`));
    }
    emailSet.add(key);
  }
  next();
});

// ✅ Pre-update hook to ensure same during updates
courseRegistrationSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.students) {
    const emailSet = new Set();
    for (const student of update.students) {
      const key = student.emailAddress.toLowerCase().trim();
      if (emailSet.has(key)) {
        return next(new Error(`Duplicate emailAddress found in update: ${key}`));
      }
      emailSet.add(key);
    }
  }
  next();
});

module.exports = mongoose.model('courseRegistration', courseRegistrationSchema);
