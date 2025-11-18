const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
// Usar el puerto de la variable de entorno, o 3001 por defecto (para desarrollo local)
const PORT = process.env.PORT || 3001;

// Rutas de archivos de datos
const DATA_DIR = path.join(__dirname, 'data');
const TOURNAMENTS_FILE = path.join(DATA_DIR, 'tournaments.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Crear directorio de datos si no existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Funciones para leer y escribir datos
function readData(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error);
  }
  return defaultValue;
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error escribiendo ${filePath}:`, error);
  }
}

// Cargar datos al iniciar
let tournaments = readData(TOURNAMENTS_FILE);
let teams = readData(TEAMS_FILE);
let matches = readData(MATCHES_FILE);
let users = readData(USERS_FILE);

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
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Generar token simple (en producción usar JWT)
  const token = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Guardar sesión
  activeSessions.set(token, {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    }
  });
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
app.get('/api/tournaments', (req, res) => {
  res.json(tournaments);
});

app.post('/api/tournaments', authenticateToken, (req, res) => {
  console.log('POST /api/tournaments - Body recibido:', req.body);
  const tournament = {
    id: Date.now().toString(),
    name: req.body.name,
    type: req.body.type, // 'single-elimination', 'round-robin'
    status: 'pending',
    teams: [],
    createdAt: new Date()
  };
  console.log('Torneo creado:', tournament);
  tournaments.push(tournament);
  writeData(TOURNAMENTS_FILE, tournaments);
  res.status(201).json(tournament);
});

app.get('/api/tournaments/:id', (req, res) => {
  const tournament = tournaments.find(t => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: 'Torneo no encontrado' });
  }
  res.json(tournament);
});

// Editar torneo
app.put('/api/tournaments/:id', authenticateToken, (req, res) => {
  console.log('PUT /api/tournaments/:id - Body recibido:', req.body);
  
  const tournament = tournaments.find(t => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: 'Torneo no encontrado' });
  }

  if (req.body.name) {
    tournament.name = req.body.name;
  }
  if (req.body.type) {
    tournament.type = req.body.type;
  }
  if (req.body.groups !== undefined) {
    tournament.groups = req.body.groups;
  }
  if (req.body.description !== undefined) {
    tournament.description = req.body.description;
  }
  if (req.body.registrationFee !== undefined) {
    tournament.registrationFee = req.body.registrationFee;
  }
  if (req.body.startDate !== undefined) {
    tournament.startDate = req.body.startDate;
  }
  if (req.body.prizes !== undefined) {
    tournament.prizes = req.body.prizes;
  }

  console.log('Torneo después de actualizar:', tournament);
  writeData(TOURNAMENTS_FILE, tournaments);
  console.log('Datos guardados en archivo');
  res.json(tournament);
});

// Eliminar torneo
app.delete('/api/tournaments/:id', authenticateToken, (req, res) => {
  const index = tournaments.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Torneo no encontrado' });
  }

  // Eliminar partidos asociados
  matches = matches.filter(m => m.tournamentId !== req.params.id);
  
  tournaments.splice(index, 1);
  writeData(TOURNAMENTS_FILE, tournaments);
  writeData(MATCHES_FILE, matches);
  res.json({ message: 'Torneo eliminado' });
});

// Rutas para Equipos
app.get('/api/teams', (req, res) => {
  res.json(teams);
});

app.post('/api/teams', authenticateToken, (req, res) => {
  console.log('POST /api/teams - Body recibido:', {
    name: req.body.name,
    hasLogo: !!req.body.logo,
    logoLength: req.body.logo ? req.body.logo.length : 0,
    playersCount: req.body.players?.length || 0
  });
  
  const team = {
    id: Date.now().toString(),
    name: req.body.name,
    logo: req.body.logo || '',
    players: req.body.players || [], // Array de objetos: {name, number, age, eps, photo}
    createdAt: new Date()
  };
  
  console.log('Equipo a guardar:', {
    id: team.id,
    name: team.name,
    hasLogo: !!team.logo,
    playersCount: team.players.length
  });
  
  teams.push(team);
  writeData(TEAMS_FILE, teams);
  console.log('Equipo guardado correctamente');
  res.status(201).json(team);
});

// Editar equipo
app.put('/api/teams/:id', authenticateToken, (req, res) => {
  const team = teams.find(t => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado' });
  }

  if (req.body.name) {
    team.name = req.body.name;
  }
  if (req.body.logo !== undefined) {
    team.logo = req.body.logo;
  }
  if (req.body.players) {
    team.players = req.body.players;
  }

  writeData(TEAMS_FILE, teams);
  res.json(team);
});

// Eliminar equipo
app.delete('/api/teams/:id', authenticateToken, (req, res) => {
  const index = teams.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Equipo no encontrado' });
  }

  teams.splice(index, 1);
  writeData(TEAMS_FILE, teams);
  res.json({ message: 'Equipo eliminado' });
});

// Agregar equipo a torneo
app.post('/api/tournaments/:id/teams', authenticateToken, (req, res) => {
  const tournament = tournaments.find(t => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: 'Torneo no encontrado' });
  }
  
  const teamId = req.body.teamId;
  if (!tournament.teams.includes(teamId)) {
    tournament.teams.push(teamId);
  }
  
  writeData(TOURNAMENTS_FILE, tournaments);
  res.json(tournament);
});

// Eliminar equipo de torneo
app.delete('/api/tournaments/:id/teams/:teamId', authenticateToken, (req, res) => {
  const tournament = tournaments.find(t => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: 'Torneo no encontrado' });
  }

  tournament.teams = tournament.teams.filter(id => id !== req.params.teamId);
  writeData(TOURNAMENTS_FILE, tournaments);
  res.json(tournament);
});

// Iniciar torneo (generar partidos)
app.post('/api/tournaments/:id/start', authenticateToken, (req, res) => {
  const tournament = tournaments.find(t => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: 'Torneo no encontrado' });
  }

  console.log('Iniciando torneo:', tournament);
  console.log('Tipo de torneo:', tournament.type);

  if (tournament.teams.length < 2) {
    return res.status(400).json({ error: 'Se necesitan al menos 2 equipos' });
  }

  // Si el torneo no tiene tipo definido, usar 'single-elimination' por defecto
  if (!tournament.type) {
    console.log('Torneo sin tipo, usando single-elimination por defecto');
    tournament.type = 'single-elimination';
  }

  // Generar partidos según el tipo de torneo
  if (tournament.type === 'single-elimination') {
    console.log('Generando bracket de eliminación directa');
    const bracket = generateSingleEliminationBracket(tournament.teams, tournament.id);
    matches.push(...bracket);
    tournament.status = 'in-progress';
    writeData(TOURNAMENTS_FILE, tournaments);
    writeData(MATCHES_FILE, matches);
    res.json({ tournament, matches: bracket });
  } else if (tournament.type === 'round-robin') {
    console.log('Generando fixture round-robin');
    const roundRobinMatches = generateRoundRobinFixture(tournament, tournament.id);
    matches.push(...roundRobinMatches);
    tournament.status = 'in-progress';
    writeData(TOURNAMENTS_FILE, tournaments);
    writeData(MATCHES_FILE, matches);
    res.json({ tournament, matches: roundRobinMatches });
  } else {
    console.log('Tipo de torneo no soportado:', tournament.type);
    res.status(400).json({ error: 'Tipo de torneo no soportado aún' });
  }
});

// Regenerar partidos (agregar nuevos sin borrar existentes)
app.post('/api/tournaments/:id/regenerate-matches', authenticateToken, (req, res) => {
  const tournament = tournaments.find(t => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: 'Torneo no encontrado' });
  }

  console.log('Regenerando partidos para el torneo:', tournament.name);

  if (tournament.teams.length < 2) {
    return res.status(400).json({ error: 'Se necesitan al menos 2 equipos' });
  }

  // Obtener partidos existentes del torneo
  const existingMatches = matches.filter(m => m.tournamentId === req.params.id);
  const existingMatchPairs = new Set();
  
  // Crear un conjunto de pares de equipos que ya tienen partidos
  existingMatches.forEach(match => {
    const pair1 = `${match.team1}-${match.team2}`;
    const pair2 = `${match.team2}-${match.team1}`;
    existingMatchPairs.add(pair1);
    existingMatchPairs.add(pair2);
  });

  let newMatches = [];
  let nextMatchId = existingMatches.length > 0 
    ? Math.max(...existingMatches.map(m => parseInt(m.id.split('-match-')[1]) || 0)) + 1 
    : 1;

  // Generar nuevos partidos según el tipo de torneo
  if (tournament.type === 'round-robin') {
    console.log('Generando nuevos partidos round-robin');
    
    // Si hay grupos definidos, generar por grupo
    if (tournament.groups && tournament.groups.length > 0) {
      tournament.groups.forEach(group => {
        if (group.teams && group.teams.length >= 2) {
          const groupMatches = generateRoundRobinForTeams(
            group.teams,
            tournament.id,
            nextMatchId,
            group.name
          );
          
          // Filtrar solo los partidos que no existen
          const filteredMatches = groupMatches.filter(match => {
            const pair = `${match.team1}-${match.team2}`;
            return !existingMatchPairs.has(pair);
          });
          
          newMatches.push(...filteredMatches);
          nextMatchId += filteredMatches.length;
        }
      });
    } else {
      // Si no hay grupos, todos contra todos
      const allMatches = generateRoundRobinForTeams(
        tournament.teams,
        tournament.id,
        nextMatchId,
        'General'
      );
      
      // Filtrar solo los partidos que no existen
      const filteredMatches = allMatches.filter(match => {
        const pair = `${match.team1}-${match.team2}`;
        return !existingMatchPairs.has(pair);
      });
      
      newMatches.push(...filteredMatches);
    }
  } else if (tournament.type === 'single-elimination') {
    return res.status(400).json({ 
      error: 'No se puede regenerar partidos en torneos de eliminación directa. Debe crear un nuevo torneo.' 
    });
  }

  if (newMatches.length === 0) {
    return res.json({ 
      message: 'No hay nuevos partidos para generar. Todos los enfrentamientos ya existen.',
      newMatches: [],
      totalMatches: existingMatches.length
    });
  }

  // Agregar los nuevos partidos
  matches.push(...newMatches);
  writeData(MATCHES_FILE, matches);
  
  console.log(`Se generaron ${newMatches.length} nuevos partidos`);
  res.json({ 
    message: `Se generaron ${newMatches.length} nuevos partidos`,
    newMatches,
    totalMatches: existingMatches.length + newMatches.length
  });
});

// Obtener partidos de un torneo
app.get('/api/tournaments/:id/matches', (req, res) => {
  const tournamentMatches = matches.filter(m => m.tournamentId === req.params.id);
  res.json(tournamentMatches);
});

// Actualizar resultado de un partido
app.put('/api/matches/:id', authenticateToken, (req, res) => {
  const match = matches.find(m => m.id === req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Partido no encontrado' });
  }

  console.log('Datos recibidos para actualizar partido:', {
    matchId: req.params.id,
    team1Score: req.body.team1Score,
    team2Score: req.body.team2Score,
    team1Scorers: req.body.team1Scorers,
    team2Scorers: req.body.team2Scorers,
    team1Cards: req.body.team1Cards,
    team2Cards: req.body.team2Cards
  });

  match.team1Score = req.body.team1Score;
  match.team2Score = req.body.team2Score;
  match.status = 'completed';
  match.winner = req.body.team1Score > req.body.team2Score ? match.team1 : match.team2;
  
  // Guardar goleadores y tarjetas
  match.team1Scorers = req.body.team1Scorers || [];
  match.team2Scorers = req.body.team2Scorers || [];
  match.team1Cards = req.body.team1Cards || [];
  match.team2Cards = req.body.team2Cards || [];

  // Avanzar al ganador a la siguiente ronda
  if (match.nextMatchId) {
    const nextMatch = matches.find(m => m.id === match.nextMatchId);
    if (nextMatch) {
      if (!nextMatch.team1) {
        nextMatch.team1 = match.winner;
      } else if (!nextMatch.team2) {
        nextMatch.team2 = match.winner;
      }
    }
  }

  writeData(MATCHES_FILE, matches);
  res.json(match);
});

// Función para generar bracket de eliminación directa
function generateSingleEliminationBracket(teamIds, tournamentId) {
  const numTeams = teamIds.length;
  const numRounds = Math.ceil(Math.log2(numTeams));
  const totalMatches = Math.pow(2, numRounds) - 1;
  
  const bracket = [];
  let matchId = 1;

  // Primera ronda
  const firstRoundMatches = Math.ceil(numTeams / 2);
  for (let i = 0; i < firstRoundMatches; i++) {
    const team1 = teamIds[i * 2];
    const team2 = teamIds[i * 2 + 1] || null;
    
    bracket.push({
      id: `${tournamentId}-match-${matchId}`,
      tournamentId,
      round: 1,
      matchNumber: i + 1,
      team1,
      team2,
      team1Score: null,
      team2Score: null,
      winner: team2 === null ? team1 : null,
      status: team2 === null ? 'completed' : 'pending',
      nextMatchId: null,
      team1Scorers: [],
      team2Scorers: [],
      team1YellowCards: [],
      team2YellowCards: []
    });
    matchId++;
  }

  // Rondas siguientes
  let previousRoundMatches = firstRoundMatches;
  for (let round = 2; round <= numRounds; round++) {
    const roundMatches = Math.ceil(previousRoundMatches / 2);
    for (let i = 0; i < roundMatches; i++) {
      bracket.push({
        id: `${tournamentId}-match-${matchId}`,
        tournamentId,
        round,
        matchNumber: i + 1,
        team1: null,
        team2: null,
        team1Score: null,
        team2Score: null,
        winner: null,
        status: 'pending',
        nextMatchId: null,
        team1Scorers: [],
        team2Scorers: [],
        team1Cards: [],
        team2Cards: []
      });
      matchId++;
    }
    previousRoundMatches = roundMatches;
  }

  // Conectar partidos con nextMatchId
  for (let i = 0; i < bracket.length; i++) {
    const match = bracket[i];
    if (match.round < numRounds) {
      const nextRoundStartIndex = bracket.findIndex(m => m.round === match.round + 1);
      const positionInNextRound = Math.floor((match.matchNumber - 1) / 2);
      match.nextMatchId = bracket[nextRoundStartIndex + positionInNextRound].id;
    }
  }

  return bracket;
}

// Función para generar fixture todos contra todos (Round Robin) por grupos
function generateRoundRobinFixture(tournament, tournamentId) {
  const allMatches = [];
  let globalMatchId = 1;
  
  // Si hay grupos definidos, generar fixture por grupo
  if (tournament.groups && tournament.groups.length > 0) {
    tournament.groups.forEach((group, groupIndex) => {
      if (group.teams && group.teams.length >= 2) {
        const groupMatches = generateRoundRobinForTeams(
          group.teams, 
          tournamentId, 
          globalMatchId,
          group.name
        );
        allMatches.push(...groupMatches);
        globalMatchId += groupMatches.length;
      }
    });
  } else {
    // Si no hay grupos, todos contra todos con todos los equipos
    const generalMatches = generateRoundRobinForTeams(
      tournament.teams,
      tournamentId,
      globalMatchId,
      'General'
    );
    allMatches.push(...generalMatches);
  }
  
  return allMatches;
}

// Algoritmo Round Robin para un conjunto de equipos
function generateRoundRobinForTeams(teamIds, tournamentId, startMatchId, groupName) {
  const teams = [...teamIds];
  const numTeams = teams.length;
  const matches = [];
  let matchId = startMatchId;
  
  // Si hay número impar de equipos, agregar un "bye" (descanso)
  if (numTeams % 2 !== 0) {
    teams.push(null); // null representa "descanso"
  }
  
  const totalTeams = teams.length;
  const numRounds = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;
  
  // Algoritmo de rotación circular para Round Robin
  for (let round = 0; round < numRounds; round++) {
    const roundMatches = [];
    
    for (let match = 0; match < matchesPerRound; match++) {
      const home = teams[match];
      const away = teams[totalTeams - 1 - match];
      
      // Solo crear partido si ambos equipos existen (no hay "bye")
      if (home !== null && away !== null) {
        roundMatches.push({
          id: `${tournamentId}-match-${matchId}`,
          tournamentId,
          groupName: groupName,
          round: round + 1,
          matchNumber: matchId,
          team1: home,
          team2: away,
          team1Score: null,
          team2Score: null,
          winner: null,
          status: 'pending',
          date: null,
          team1Scorers: [],
          team2Scorers: [],
          team1Cards: [],
          team2Cards: []
        });
        matchId++;
      }
    }
    
    matches.push(...roundMatches);
    
    // Rotar equipos (el primero se mantiene fijo)
    const fixed = teams[0];
    const rotating = teams.slice(1);
    rotating.unshift(rotating.pop());
    teams.splice(0, teams.length, fixed, ...rotating);
  }
  
  return matches;
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});
