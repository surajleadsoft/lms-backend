const mongoose = require('mongoose');

const academicSchema = new mongoose.Schema({
  srNo: Number,
  educationLevel: String,
  instituteName: String,
  marksCategory: String,
  Marks: String,
  status: String,
  yearOfCompletion: String,
});

const certificationSchema = new mongoose.Schema({
  srNo: Number,
  certificateName: String,
  certificateDate: Date,
  instituteName: String,
});
const courseSchema = new mongoose.Schema({
  courseName: String
});

const studentSchema = new mongoose.Schema({
  basic: {
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    emailAddress: { type: String, required: true }, // No longer globally unique
    Gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    DateOfBirth: { type: Date, required: true },
    Age: String,
    City: String,
    mobileNo: { type: String, required: true },
    password: { type: String, default: 'LeadSoft@123' },
    isActive: { type: Boolean, default: true },
    courseName: [courseSchema] , // Array of course names
    registrationDate: { type: Date, required: true, default: Date.now }
  },
  parent: {
    motherFullname: String,
    motherOccupation: String,
    motherMobileNo: String,
    fatherFullname: String,
    fatherOccupation: String,
    fatherMobileNo: String
  },
  academic: [academicSchema],
  certification: [certificationSchema],
  social: {
    linkedinProfile: String,
    leetcodeProfile: String,
    instagramProfile: String
  },
  credits: { type: Number, default: 50 }
});

// Index for ensuring no duplicate course per email
studentSchema.index({ "basic.emailAddress": 1, "basic.courseName": 1 }, { pretty: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
