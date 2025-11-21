const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  homeScore: {
    type: Number,
    default: null
  },
  awayScore: {
    type: Number,
    default: null
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'finished', 'cancelled'],
    default: 'scheduled'
  },
  round: {
    type: String,
    default: ''
  },
  group: {
    type: String,
    default: ''
  },
  homeScorers: [{
    playerId: String,
    playerName: String,
    minute: Number
  }],
  awayScorers: [{
    playerId: String,
    playerName: String,
    minute: Number
  }],
  homeCards: [{
    playerId: String,
    playerName: String,
    cardType: {
      type: String,
      enum: ['yellow', 'red', 'blue']
    },
    minute: Number
  }],
  awayCards: [{
    playerId: String,
    playerName: String,
    cardType: {
      type: String,
      enum: ['yellow', 'red', 'blue']
    },
    minute: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);
