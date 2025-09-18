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
  courseName: { type: String, index: true } // ✅ query filter
});

const studentSchema = new mongoose.Schema({
  basic: {
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    emailAddress: { type: String, required: true, index: true }, // ✅ search often
    Gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    DateOfBirth: { type: Date, required: true },
    Age: String,
    City: { type: String, index: true }, // ✅ filter by location
    mobileNo: { type: String, required: true, unique: true }, // ✅ avoid duplicates
    password: { type: String, default: 'LeadSoft@123' },
    isActive: { type: Boolean, default: true, index: true },
    courseName: [courseSchema],
    registrationDate: { type: Date, required: true, default: Date.now, index: true }
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

// ✅ Index: ensure no duplicate email+course
studentSchema.index({ "basic.emailAddress": 1, "basic.courseName.courseName": 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
