const mongoose = require('mongoose');
const Counter = require('./Couter');

const contentSchema = new mongoose.Schema({
  srNo: { type: Number, unique: true },
  courseName: { type: String, required: true },
  moduleName: { type: String, required: true },
  contentName: { type: String, required: true },
  day: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true }
}, { timestamps: true });

// Pre-save hook to auto-increment srNo
contentSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'contentSrNo' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.srNo = counter.seq;
  }
  next();
});

module.exports = mongoose.model('Content', contentSchema);
