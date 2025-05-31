const mongoose = require('mongoose');

// Sub-schemas
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

const classSchema = new mongoose.Schema({
  className: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, required: true },
  isPaymentRequired:{type:String,default:true},
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



module.exports = mongoose.model('courseRegistration', courseRegistrationSchema);
