const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  logo: {
    type: String,
    default: ''
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  format: {
    type: String,
    enum: ['league', 'knockout', 'groups'],
    default: 'league'
  },
  groupCount: {
    type: Number,
    default: 1
  },
  groups: [{
    name: String,
    teams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }]
  }],
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  description: {
    type: String,
    default: ''
  },
  registrationFee: {
    type: String,
    default: ''
  },
  prizes: {
    type: String,
    default: ''
  },
  winners: [{
    position: {
      type: Number,
      required: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    prize: {
      type: String,
      default: ''
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Tournament', tournamentSchema);
