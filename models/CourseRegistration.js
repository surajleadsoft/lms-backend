const mongoose = require('mongoose');

// Sub-schemas for uniqueness enforcement
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

// Main schema
const courseRegistrationSchema = new mongoose.Schema({
  courseName: { type: String, required: true, unique: true },
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
  }
});

module.exports = mongoose.model('courseRegistration', courseRegistrationSchema);
