const mongoose = require('mongoose');

// Sub-schemas (as before)
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const joinerSchema = new mongoose.Schema({ category: { type: String, required: true } }, { _id: false });
const learnTopicSchema = new mongoose.Schema({ domain: String, topic: String }, { _id: false });
const outcomeSchema = new mongoose.Schema({ outcome: String }, { _id: false });
const trainerDetailSchema = new mongoose.Schema({ detail: String }, { _id: false });
const studentSchema = new mongoose.Schema({
  fullName: String,
  courseName: String,
  emailAddress: String,
  gender: String,
  mobileNo: String,
  education: String,
  collegeName: String,
  courseFees: String
}, { _id: false });

// ✅ Classes schema
const classSchema = new mongoose.Schema({
  className: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, required: true },
  sessionLink: { type: String, required: true }
}, { _id: false });

const courseRegistrationSchema = new mongoose.Schema({
  courseName: { type: String, required: true, unique: true },
  inductionSessionDate: String,
  inductionSessionLink: String,
  mainText: String,
  subText: String,
  courseDuration: String,
  courseFees: String,
  offer: String,
  courseMode: String,
  certification: String,
  endRegistrationDate: String,
  placement: String,

  faqs: [faqSchema],
  joiners: [joinerSchema],
  learnTopics: [learnTopicSchema],
  outcomes: [outcomeSchema],
  trainerDetails: [trainerDetailSchema],
  students: [studentSchema],

  classes: {
    type: [classSchema],
    validate: {
      validator: function (arr) {
        const classSet = new Set();
        return arr.every(item => {
          const key = item.className.toLowerCase().trim();
          if (classSet.has(key)) return false;
          classSet.add(key);
          return true;
        });
      },
      message: 'Duplicate className is not allowed in classes.'
    }
  }
});

// Duplicate email check in students
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
