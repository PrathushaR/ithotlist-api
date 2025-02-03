const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  website: String,
  logo: String
});

const salarySchema = new mongoose.Schema({
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  period: {
    type: String,
    enum: ['yearly', 'monthly', 'weekly', 'hourly'],
    default: 'yearly'
  }
});

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: companySchema,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: [String],
    default: []
  },
  responsibilities: {
    type: [String],
    default: []
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  remote: {
    type: Boolean,
    default: false
  },
  salary: {
    type: salarySchema,
    required: true
  },
  primaryTechnology: {
    type: String,
    required: true
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  benefits: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'draft'
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  }
});

// Update the updatedAt timestamp before saving
jobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Job', jobSchema); 