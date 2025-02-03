const mongoose = require('mongoose');

const hotlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  candidates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hotlist', hotlistSchema); 