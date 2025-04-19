const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const moduleSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  moduleName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Compound unique index to ensure unique moduleName per courseName
moduleSchema.index({ courseName: 1, moduleName: 1 }, { unique: true });

// Auto-increment srNo
moduleSchema.plugin(AutoIncrement, { inc_field: 'srNo' });

module.exports = mongoose.model('Module', moduleSchema);
