const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  yearsOfExp: {
    type: Number,
    required: true,
    default: 0
  },
  technology: {
    type: String,
    required: true,
    default: 'Not Specified'
  },
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: 'https://example.com/default-avatar.jpg'
  },
  resumeFile: {
    filename: {
      type: String,
      default: null
    },
    path: {
      type: String,
      default: null
    },
    mimetype: {
      type: String,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
candidateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Candidate', candidateSchema); 