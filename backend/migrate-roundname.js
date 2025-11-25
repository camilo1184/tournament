require('dotenv').config();
const mongoose = require('mongoose');

// Definir el esquema del Match
const matchSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  homeScore: Number,
  awayScore: Number,
  date: Date,
  location: String,
  status: { type: String, default: 'scheduled' },
  round: String,
  roundName: String,
  group: String,
  homeScorers: [{ 
    playerId: mongoose.Schema.Types.ObjectId,
    playerName: String,
    minute: Number 
  }],
  awayScorers: [{ 
    playerId: mongoose.Schema.Types.ObjectId,
    playerName: String,
    minute: Number 
  }],
  homeCards: [{
    playerId: mongoose.Schema.Types.ObjectId,
    playerName: String,
    type: String,
    minute: Number
  }],
  awayCards: [{
    playerId: mongoose.Schema.Types.ObjectId,
    playerName: String,
    type: String,
    minute: Number
  }]
});

const Match = mongoose.model('Match', matchSchema);

async function migrateRoundNames() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:2bYq66ysR56gdKDQ@mi-cluster.ixqmq.mongodb.net/gestion-torneos', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✓ Conectado a MongoDB');

    // Buscar todos los partidos que no tienen roundName o tienen roundName vacío
    const matchesWithoutRoundName = await Match.find({
      $or: [
        { roundName: { $exists: false } },
        { roundName: '' },
        { roundName: null }
      ]
    });

    console.log(`📊 Encontrados ${matchesWithoutRoundName.length} partidos sin roundName`);

    // Función para generar roundName basado en el round y contexto del torneo
    async function generateRoundName(match) {
      if (!match.round) return '';
      
      const roundStr = match.round.toString().toLowerCase();
      
      // Jornadas (fase de grupos)
      if (roundStr.includes('jornada')) {
        return ''; // Las jornadas no tienen nombre especial, se usa el formato "Grupo X - Fecha Jornada Y"
      }
      
      // Octavos de final
      if (roundStr.includes('octavos') || roundStr === '16' || roundStr.includes('round of 16')) {
        const matchNum = roundStr.match(/(\d+)/);
        return matchNum ? `Octavos de Final ${matchNum[1]}` : 'Octavos de Final';
      }
      
      // Cuartos de final
      if (roundStr.includes('cuartos') || roundStr === '8' || roundStr.includes('quarter')) {
        const matchNum = roundStr.match(/(\d+)/);
        return matchNum ? `Cuartos de Final ${matchNum[1]}` : 'Cuartos de Final';
      }
      
      // Semifinales
      if (roundStr.includes('semi') || roundStr === '4') {
        const matchNum = roundStr.match(/(\d+)/);
        return matchNum ? `Semifinal ${matchNum[1]}` : 'Semifinal';
      }
      
      // Final
      if (roundStr.includes('final') && !roundStr.includes('semi')) {
        return 'Final';
      }
      
      // Tercer puesto
      if (roundStr.includes('tercer') || roundStr.includes('third')) {
        return 'Tercer Puesto';
      }
      
      // Para rondas numéricas (1, 2, 3...), intentar deducir del contexto
      // Contar cuántos partidos hay en esta ronda del mismo torneo
      if (/^\d+$/.test(roundStr)) {
        const matchesInRound = await Match.countDocuments({
          tournament: match.tournament,
          round: match.round
        });
        
        // Heurística basada en número de partidos
        if (matchesInRound === 1) {
          return 'Final';
        } else if (matchesInRound === 2) {
          return 'Semifinal';
        } else if (matchesInRound === 4) {
          return 'Cuartos de Final';
        } else if (matchesInRound === 8) {
          return 'Octavos de Final';
        }
      }
      
      return ''; // Por defecto vacío
    }

    let updatedCount = 0;

    // Actualizar cada partido
    for (const match of matchesWithoutRoundName) {
      const newRoundName = await generateRoundName(match);
      
      await Match.updateOne(
        { _id: match._id },
        { $set: { roundName: newRoundName } }
      );
      
      updatedCount++;
      console.log(`✓ Actualizado partido ${match._id}: round="${match.round}" -> roundName="${newRoundName}"`);
    }

    console.log(`\n✅ Migración completada: ${updatedCount} partidos actualizados`);
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('✓ Conexión cerrada');
  }
}

// Ejecutar la migración
migrateRoundNames();
