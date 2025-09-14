const mongoose = require('mongoose');

const openUserSchema = new mongoose.Schema(
  {
    emailAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNo: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
    },
    instituteName: {
      type: String,
      required: true,
      trim: true,
    },
    examName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Indexes
openUserSchema.index(
  { emailAddress: 1, examName: 1, instituteName: 1 },
  { unique: true }
);

openUserSchema.index(
  { mobileNo: 1, examName: 1, instituteName: 1 },
  { unique: true }
);

const OpenUser = mongoose.model('open-user', openUserSchema);

module.exports = OpenUser;
