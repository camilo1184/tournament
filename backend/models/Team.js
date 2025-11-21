const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: false, // Opcional - solo se usa cuando se crea desde un torneo
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  players: [{
    name: String,
    number: String,
    position: String,
    age: String,
    eps: String,
    photo: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
