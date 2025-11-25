require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Importar modelos
const User = require('./models/User');
const Team = require('./models/Team');
const Tournament = require('./models/Tournament');
const Match = require('./models/Match');

// Importar funciones auxiliares
const {
  generateSingleEliminationBracket,
  generateRoundRobinFixture,
  generateRoundRobinForTeams
} = require('./utils/tournamentHelpers');

const app = express();
const PORT = process.env.PORT || 3001;

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tournament';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✓ Conectado a MongoDB');
  
  // Crear usuarios por defecto si no existen
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create([
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'user', password: 'user123', role: 'user' }
    ]);
    console.log('✓ Usuarios por defecto creados: admin/admin123 y user/user123');
  }
})
.catch(err => {
  console.error('✗ Error conectando a MongoDB:', err.message);
  console.log('\n⚠️  IMPORTANTE: Necesitas configurar MongoDB Atlas');
  console.log('📖 Sigue las instrucciones en: backend/MONGODB_SETUP.md');
  console.log('🌐 O visita: https://www.mongodb.com/cloud/atlas\n');
  console.log('⏳ El servidor continuará funcionando pero SIN base de datos...\n');
});

// Almacenar tokens de sesión (en producción usar Redis o similar)
const activeSessions = new Map();

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  if (!activeSessions.has(token)) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }

  req.user = activeSessions.get(token);
  next();
}

// Configurar CORS para permitir requests desde los frontends
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://public-view.onrender.com',
    'https://tournament-frontend-0t24.onrender.com',
    // Permitir cualquier subdominio de onrender.com en producción
    /\.onrender\.com$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' })); // Aumentar límite para fotos
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ========== RUTAS DE AUTENTICACIÓN ==========
// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token simple (en producción usar JWT)
    const token = `${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Guardar sesión
    activeSessions.set(token, {
      id: user._id.toString(),
      username: user.username,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    activeSessions.delete(token);
  }
  
  res.json({ message: 'Sesión cerrada exitosamente' });
});

// Rutas para Torneos
app.get('/api/tournaments', authenticateToken, async (req, res) => {
  try {
    const tournaments = await Tournament.find({ userId: req.user.id }).populate('teams');
    res.json(tournaments);
  } catch (error) {
    console.error('Error obteniendo torneos:', error);
    res.status(500).json({ error: 'Error obteniendo torneos' });
  }
});

app.post('/api/tournaments', authenticateToken, async (req, res) => {
  try {

    
    // Mapear tipos del frontend a formatos del modelo
    let format = 'league';
    if (req.body.type === 'single-elimination') {
      format = 'knockout';
    } else if (req.body.type === 'round-robin') {
      format = 'league';
    } else if (req.body.format) {
      format = req.body.format;
    }
    
    const tournament = new Tournament({
      userId: req.user.id,
      name: req.body.name,
      startDate: req.body.startDate || new Date(),
      endDate: req.body.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días después
      logo: req.body.logo || '',
      format: format,
      groupCount: req.body.groups || 1,
      status: 'upcoming',
      teams: [],
      groups: []
    });
    
    await tournament.save();

    res.status(201).json(tournament);
  } catch (error) {
    console.error('Error creando torneo:', error);
    res.status(500).json({ error: 'Error creando torneo' });
  }
});

app.get('/api/tournaments/:id', authenticateToken, async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.user.id }).populate('teams');
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }
    res.json(tournament);
  } catch (error) {
    console.error('Error obteniendo torneo:', error);
    res.status(500).json({ error: 'Error obteniendo torneo' });
  }
});

// Editar torneo
app.put('/api/tournaments/:id', authenticateToken, async (req, res) => {
  try {

    
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.type) updateData.format = req.body.type;
    if (req.body.groups !== undefined) {
      // Si es un array, son los grupos configurados, si es número es groupCount
      if (Array.isArray(req.body.groups)) {
        updateData.groups = req.body.groups;
      } else {
        updateData.groupCount = req.body.groups;
      }
    }
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.registrationFee !== undefined) updateData.registrationFee = req.body.registrationFee;
    if (req.body.startDate !== undefined) updateData.startDate = req.body.startDate;
    if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate;
    if (req.body.logo !== undefined) updateData.logo = req.body.logo;
    if (req.body.prizes !== undefined) updateData.prizes = req.body.prizes;
    if (req.body.winners !== undefined) updateData.winners = req.body.winners;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const tournament = await Tournament.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('teams');

    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }


    res.json(tournament);
  } catch (error) {
    console.error('Error actualizando torneo:', error);
    res.status(500).json({ error: 'Error actualizando torneo' });
  }
});

// Eliminar torneo
app.delete('/api/tournaments/:id', authenticateToken, async (req, res) => {
  try {
    const tournament = await Tournament.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    // Eliminar partidos asociados
    await Match.deleteMany({ tournament: req.params.id });
    
    res.json({ message: 'Torneo eliminado' });
  } catch (error) {
    console.error('Error eliminando torneo:', error);
    res.status(500).json({ error: 'Error eliminando torneo' });
  }
});

// Rutas para Equipos
app.get('/api/teams', authenticateToken, async (req, res) => {
  try {

    const teams = await Team.find({ userId: req.user.id });
    res.json(teams);
  } catch (error) {
    console.error('Error obteniendo equipos:', error);
    res.status(500).json({ error: 'Error obteniendo equipos' });
  }
});

app.post('/api/teams', authenticateToken, async (req, res) => {
  try {
    
    const teamData = {
      userId: req.user.id,
      name: req.body.name,
      logo: req.body.logo || '',
      players: req.body.players || []
    };
    
    // Solo agregar tournamentId si se proporciona
    if (req.body.tournamentId) {
      teamData.tournamentId = req.body.tournamentId;
    }
    
    const team = new Team(teamData);
    await team.save();
    
    // Si hay tournamentId, agregar el equipo al torneo
    if (req.body.tournamentId) {
      await Tournament.findByIdAndUpdate(
        req.body.tournamentId,
        { $push: { teams: team._id } }
      );
    }
    
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creando equipo:', error);
    res.status(500).json({ error: 'Error creando equipo' });
  }
});

// Editar equipo
app.put('/api/teams/:id', authenticateToken, async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.logo !== undefined) updateData.logo = req.body.logo;
    if (req.body.players) updateData.players = req.body.players;

    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json(team);
  } catch (error) {
    console.error('Error actualizando equipo:', error);
    res.status(500).json({ error: 'Error actualizando equipo' });
  }
});

// Eliminar equipo
app.delete('/api/teams/:id', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;
    
    // Verificar que el equipo existe y pertenece al usuario
    const team = await Team.findOne({ _id: teamId, userId: req.user.id });
    if (!team) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // 1. Eliminar el equipo de todos los torneos del usuario
    await Tournament.updateMany(
      { userId: req.user.id, teams: teamId },
      { $pull: { teams: teamId } }
    );

    // 2. Eliminar todos los partidos donde participa este equipo
    await Match.deleteMany({
      $or: [
        { homeTeam: teamId },
        { awayTeam: teamId }
      ]
    });

    // 3. Eliminar el equipo
    await Team.findByIdAndDelete(teamId);

    res.json({ 
      message: 'Equipo eliminado exitosamente',
      deletedTeam: team.name
    });
  } catch (error) {
    console.error('Error eliminando equipo:', error);
    res.status(500).json({ error: 'Error eliminando equipo' });
  }
});

// Agregar equipo a torneo
app.post('/api/tournaments/:id/teams', authenticateToken, async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.user.id });
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }
    
    const teamId = req.body.teamId;
    // Verificar que el equipo pertenece al usuario
    const team = await Team.findOne({ _id: teamId, userId: req.user.id });
    if (!team) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    
    if (!tournament.teams.includes(teamId)) {
      tournament.teams.push(teamId);
      await tournament.save();
    }
    
    await tournament.populate('teams');
    res.json(tournament);
  } catch (error) {
    console.error('Error agregando equipo al torneo:', error);
    res.status(500).json({ error: 'Error agregando equipo al torneo' });
  }
});

// Eliminar equipo de torneo
app.delete('/api/tournaments/:id/teams/:teamId', authenticateToken, async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.user.id });
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    tournament.teams = tournament.teams.filter(id => id.toString() !== req.params.teamId);
    await tournament.save();
    await tournament.populate('teams');
    res.json(tournament);
  } catch (error) {
    console.error('Error eliminando equipo del torneo:', error);
    res.status(500).json({ error: 'Error eliminando equipo del torneo' });
  }
});

// Iniciar torneo (generar partidos)
app.post('/api/tournaments/:id/start', authenticateToken, async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.user.id }).populate('teams');
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    if (tournament.teams.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 equipos' });
    }

    const teamIds = tournament.teams.map(t => t._id);
    let newMatches = [];

    // Generar partidos según el formato del torneo
    if (tournament.format === 'knockout') {
      const bracket = generateSingleEliminationBracket(teamIds, tournament._id);
      newMatches = await Match.insertMany(bracket);
    } else if (tournament.format === 'league' || tournament.format === 'groups') {
      const roundRobinMatches = generateRoundRobinFixture(tournament, tournament._id);
      newMatches = await Match.insertMany(roundRobinMatches);
    } else {
      return res.status(400).json({ error: 'Formato de torneo no soportado' });
    }

    tournament.status = 'active';
    await tournament.save();
    
    // Transformar los partidos al formato esperado por el frontend
    const transformedMatches = newMatches.map(match => ({
      id: match._id.toString(),
      _id: match._id,
      team1: match.homeTeam,
      team2: match.awayTeam,
      team1Score: match.homeScore,
      team2Score: match.awayScore,
      team1Scorers: match.homeScorers || [],
      team2Scorers: match.awayScorers || [],
      team1Cards: [],
      team2Cards: [],
      date: match.date,
      location: match.location,
      status: match.status,
      round: match.round,
      groupName: match.group,
      winner: match.homeScore !== null && match.awayScore !== null
        ? (match.homeScore > match.awayScore ? match.homeTeam : 
           match.awayScore > match.homeScore ? match.awayTeam : null)
        : null
    }));
    
    res.json({ tournament, matches: transformedMatches });
  } catch (error) {
    console.error('Error iniciando torneo:', error);
    res.status(500).json({ error: 'Error iniciando torneo' });
  }
});

// Regenerar partidos (agregar nuevos sin borrar existentes)
app.post('/api/tournaments/:id/regenerate-matches', authenticateToken, async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.user.id }).populate('teams');
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    if (tournament.teams.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 equipos' });
    }

    // Obtener partidos existentes del torneo
    const existingMatches = await Match.find({ tournament: req.params.id });
    const existingMatchPairs = new Set();
    
    // Crear un conjunto de pares de equipos que ya tienen partidos
    existingMatches.forEach(match => {
      const pair1 = `${match.homeTeam}-${match.awayTeam}`;
      const pair2 = `${match.awayTeam}-${match.homeTeam}`;
      existingMatchPairs.add(pair1);
      existingMatchPairs.add(pair2);
    });

    // Generar nuevos partidos según el formato del torneo
    if (tournament.format === 'knockout') {
      return res.status(400).json({ 
        error: 'No se puede regenerar partidos en torneos de eliminación directa.' 
      });
    }

    let newMatchesData = [];
    const teamIds = tournament.teams.map(t => t._id);
    
    if (tournament.format === 'league' || tournament.format === 'groups') {
      const allMatches = generateRoundRobinForTeams(teamIds, tournament._id, 'General');
      
      // Filtrar solo los partidos que no existen
      newMatchesData = allMatches.filter(match => {
        const pair = `${match.homeTeam}-${match.awayTeam}`;
        return !existingMatchPairs.has(pair);
      });
    }

    if (newMatchesData.length === 0) {
      return res.json({ 
        message: 'No hay nuevos partidos para generar. Todos los enfrentamientos ya existen.',
        newMatches: [],
        totalMatches: existingMatches.length
      });
    }

    // Agregar los nuevos partidos
    const newMatches = await Match.insertMany(newMatchesData);
    
    res.json({ 
      message: `Se generaron ${newMatches.length} nuevos partidos`,
      newMatches,
      totalMatches: existingMatches.length + newMatches.length
    });
  } catch (error) {
    console.error('Error regenerando partidos:', error);
    res.status(500).json({ error: 'Error regenerando partidos' });
  }
});

// Obtener partidos de un torneo
app.get('/api/tournaments/:id/matches', authenticateToken, async (req, res) => {
  try {
    // Verificar que el torneo pertenece al usuario
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.user.id });
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }
    
    const matches = await Match.find({ tournament: req.params.id })
      .populate('homeTeam')
      .populate('awayTeam');
    
    // Transformar los datos para que coincidan con el formato esperado por el frontend
    const transformedMatches = matches.map(match => ({
      id: match._id.toString(),
      _id: match._id,
      team1: match.homeTeam?._id || match.homeTeam,
      team2: match.awayTeam?._id || match.awayTeam,
      team1Score: match.homeScore,
      team2Score: match.awayScore,
      team1Scorers: match.homeScorers || [],
      team2Scorers: match.awayScorers || [],
      team1Cards: match.homeCards || [],
      team2Cards: match.awayCards || [],
      date: match.date,
      location: match.location,
      status: match.status,
      round: match.round,
      roundName: match.roundName,
      groupName: match.group,
      winner: match.status === 'finished' && match.homeScore !== null && match.awayScore !== null
        ? (match.homeScore > match.awayScore ? match.homeTeam?._id : 
           match.awayScore > match.homeScore ? match.awayTeam?._id : null)
        : null
    }));
    
    res.json(transformedMatches);
  } catch (error) {
    console.error('Error obteniendo partidos:', error);
    res.status(500).json({ error: 'Error obteniendo partidos' });
  }
});

// Actualizar resultado de un partido
// Crear un nuevo partido (match)
app.post('/api/matches', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, team1, team2, round, roundName, status } = req.body;

    // Verificar que el torneo pertenece al usuario
    const tournament = await Tournament.findOne({ _id: tournamentId, userId: req.user.id });
    if (!tournament) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Crear el nuevo partido
    const newMatch = new Match({
      tournament: tournamentId,
      homeTeam: team1,
      awayTeam: team2,
      round: round ? round.toString() : '1',
      roundName: roundName || '',
      status: status === 'pending' ? 'scheduled' : (status || 'scheduled'), // Convertir pending a scheduled
      date: new Date(), // Fecha actual por defecto
      homeScore: null,
      awayScore: null,
      homeScorers: [],
      awayScorers: [],
      homeCards: [],
      awayCards: []
    });

    await newMatch.save();
    
    // Poblar los equipos para la respuesta
    await newMatch.populate('homeTeam');
    await newMatch.populate('awayTeam');

    // Transformar al formato del frontend
    const transformedMatch = {
      id: newMatch._id.toString(),
      _id: newMatch._id,
      team1: newMatch.homeTeam?._id,
      team2: newMatch.awayTeam?._id,
      team1Score: newMatch.homeScore,
      team2Score: newMatch.awayScore,
      round: newMatch.round,
      roundName: newMatch.roundName,
      status: newMatch.status,
      team1Scorers: newMatch.homeScorers || [],
      team2Scorers: newMatch.awayScorers || [],
      team1Cards: newMatch.homeCards || [],
      team2Cards: newMatch.awayCards || []
    };

    res.status(201).json(transformedMatch);
  } catch (error) {
    console.error('Error creando partido:', error);
    res.status(500).json({ error: 'Error al crear el partido' });
  }
});

app.put('/api/matches/:id', authenticateToken, async (req, res) => {
  try {

    // Primero verificar que el partido pertenece a un torneo del usuario
    const match = await Match.findById(req.params.id).populate('tournament');
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    
    const tournament = await Tournament.findOne({ _id: match.tournament, userId: req.user.id });
    if (!tournament) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const updateData = {
      homeScore: req.body.team1Score !== undefined ? req.body.team1Score : req.body.homeScore,
      awayScore: req.body.team2Score !== undefined ? req.body.team2Score : req.body.awayScore,
      status: 'finished',
      homeScorers: req.body.team1Scorers || req.body.homeScorers || [],
      awayScorers: req.body.team2Scorers || req.body.awayScorers || [],
      homeCards: req.body.team1Cards || req.body.homeCards || [],
      awayCards: req.body.team2Cards || req.body.awayCards || []
    };

    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('homeTeam').populate('awayTeam');

    if (!updatedMatch) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    // Transformar la respuesta al formato esperado por el frontend
    const transformedMatch = {
      id: updatedMatch._id.toString(),
      _id: updatedMatch._id,
      team1: updatedMatch.homeTeam?._id || updatedMatch.homeTeam,
      team2: updatedMatch.awayTeam?._id || updatedMatch.awayTeam,
      team1Score: updatedMatch.homeScore,
      team2Score: updatedMatch.awayScore,
      team1Scorers: updatedMatch.homeScorers || [],
      team2Scorers: updatedMatch.awayScorers || [],
      team1Cards: updatedMatch.homeCards || [],
      team2Cards: updatedMatch.awayCards || [],
      date: updatedMatch.date,
      location: updatedMatch.location,
      status: updatedMatch.status,
      round: updatedMatch.round,
      groupName: updatedMatch.group,
      winner: updatedMatch.homeScore !== null && updatedMatch.awayScore !== null
        ? (updatedMatch.homeScore > updatedMatch.awayScore ? updatedMatch.homeTeam?._id : 
           updatedMatch.awayScore > updatedMatch.homeScore ? updatedMatch.awayTeam?._id : null)
        : null
    };

    res.json(transformedMatch);
  } catch (error) {
    console.error('Error actualizando partido:', error);
    res.status(500).json({ error: 'Error actualizando partido' });
  }
});

// Eliminar un partido
app.delete('/api/matches/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar que el partido pertenece a un torneo del usuario
    const match = await Match.findById(req.params.id).populate('tournament');
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    
    const tournament = await Tournament.findOne({ _id: match.tournament, userId: req.user.id });
    if (!tournament) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await Match.findByIdAndDelete(req.params.id);
    res.json({ message: 'Partido eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando partido:', error);
    res.status(500).json({ error: 'Error eliminando partido' });
  }
});

// ========== RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ==========
// Estas rutas están diseñadas para el proyecto public-view

// Obtener todos los torneos públicos
// Soporta filtro por userId: /api/public/tournaments?userId=xxx
app.get('/api/public/tournaments', async (req, res) => {
  try {
    const filter = {};
    
    // Filtrar por userId si se proporciona
    if (req.query.userId) {
      // Validar que el userId tenga formato de ObjectId válido (24 caracteres hexadecimales)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(req.query.userId)) {
        return res.json([]); // Retornar array vacío si el userId no es válido
      }
      
      // Convertir a ObjectId para búsqueda exacta
      filter.userId = new mongoose.Types.ObjectId(req.query.userId);
    }
    
    const tournaments = await Tournament.find(filter)
      .populate('teams', 'name logo players')
      .sort({ createdAt: -1 });
    
    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching public tournaments:', error);
    res.status(500).json({ error: 'Error al obtener torneos' });
  }
});

// Obtener detalles de un torneo público específico
app.get('/api/public/tournaments/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('teams', 'name logo players');
    
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Error fetching public tournament:', error);
    res.status(500).json({ error: 'Error al obtener el torneo' });
  }
});

// Obtener partidos de un torneo público
app.get('/api/public/tournaments/:id/matches', async (req, res) => {
  try {
    const matches = await Match.find({ tournament: req.params.id })
      .populate('homeTeam', 'name logo players')
      .populate('awayTeam', 'name logo players')
      .sort({ round: 1, group: 1 });

    // Transformar los datos al formato esperado por el frontend
    const transformedMatches = matches.map(match => ({
      id: match._id,
      team1: match.homeTeam?._id || match.homeTeam,
      team2: match.awayTeam?._id || match.awayTeam,
      team1Score: match.homeScore,
      team2Score: match.awayScore,
      team1Scorers: match.homeScorers || [],
      team2Scorers: match.awayScorers || [],
      team1Cards: match.homeCards || [],
      team2Cards: match.awayCards || [],
      date: match.date,
      location: match.location,
      status: match.status,
      round: match.round,
      roundName: match.roundName,
      groupName: match.group
    }));

    res.json(transformedMatches);
  } catch (error) {
    console.error('Error fetching public matches:', error);
    res.status(500).json({ error: 'Error al obtener partidos' });
  }
});

// Obtener todos los equipos públicos
app.get('/api/public/teams', async (req, res) => {
  try {
    const teams = await Team.find()
      .select('name logo players')
      .sort({ name: 1 });
    res.json(teams);
  } catch (error) {
    console.error('Error fetching public teams:', error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
});

// Obtener equipos de un torneo específico
app.get('/api/public/tournaments/:id/teams', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('teams', 'name logo players');
    
    if (!tournament) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }
    
    res.json(tournament.teams);
  } catch (error) {
    console.error('Error fetching tournament teams:', error);
    res.status(500).json({ error: 'Error al obtener equipos del torneo' });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});
