// Funciones auxiliares para generación de fixtures de torneos

// Función para generar bracket de eliminación directa
function generateSingleEliminationBracket(teamIds, tournamentId) {
  const numTeams = teamIds.length;
  const numRounds = Math.ceil(Math.log2(numTeams));
  
  const bracket = [];
  let matchId = 1;

  // Primera ronda
  const firstRoundMatches = Math.ceil(numTeams / 2);
  for (let i = 0; i < firstRoundMatches; i++) {
    const team1 = teamIds[i * 2];
    const team2 = teamIds[i * 2 + 1] || null;
    
    bracket.push({
      tournament: tournamentId,
      homeTeam: team1,
      awayTeam: team2,
      round: `Ronda 1`,
      status: team2 === null ? 'finished' : 'scheduled',
      homeScore: team2 === null ? 1 : null,
      awayScore: team2 === null ? 0 : null,
      date: new Date(),
      homeScorers: [],
      awayScorers: []
    });
    matchId++;
  }

  // Rondas siguientes
  let previousRoundMatches = firstRoundMatches;
  for (let round = 2; round <= numRounds; round++) {
    const roundMatches = Math.ceil(previousRoundMatches / 2);
    for (let i = 0; i < roundMatches; i++) {
      bracket.push({
        tournament: tournamentId,
        homeTeam: null,
        awayTeam: null,
        round: `Ronda ${round}`,
        status: 'scheduled',
        homeScore: null,
        awayScore: null,
        date: new Date(),
        homeScorers: [],
        awayScorers: []
      });
      matchId++;
    }
    previousRoundMatches = roundMatches;
  }

  return bracket;
}

// Función para generar fixture todos contra todos (Round Robin) por grupos
function generateRoundRobinFixture(tournament, tournamentId) {
  const allMatches = [];
  
  // Si hay grupos definidos, generar fixture por grupo
  if (tournament.groups && tournament.groups.length > 0) {
    tournament.groups.forEach((group) => {
      if (group.teams && group.teams.length >= 2) {
        const groupMatches = generateRoundRobinForTeams(
          group.teams, 
          tournamentId,
          group.name
        );
        allMatches.push(...groupMatches);
      }
    });
  } else {
    // Si no hay grupos, todos contra todos con todos los equipos
    const generalMatches = generateRoundRobinForTeams(
      tournament.teams,
      tournamentId,
      'General'
    );
    allMatches.push(...generalMatches);
  }
  
  return allMatches;
}

// Algoritmo Round Robin para un conjunto de equipos
function generateRoundRobinForTeams(teamIds, tournamentId, groupName) {
  const teams = [...teamIds];
  const numTeams = teams.length;
  const matches = [];
  
  // Si hay número impar de equipos, agregar un "bye" (descanso)
  if (numTeams % 2 !== 0) {
    teams.push(null); // null representa "descanso"
  }
  
  const totalTeams = teams.length;
  const numRounds = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;
  
  // Algoritmo de rotación circular para Round Robin
  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = teams[match];
      const away = teams[totalTeams - 1 - match];
      
      // Solo crear partido si ambos equipos existen (no hay "bye")
      if (home !== null && away !== null) {
        matches.push({
          tournament: tournamentId,
          homeTeam: home,
          awayTeam: away,
          group: groupName,
          round: `Jornada ${round + 1}`,
          homeScore: null,
          awayScore: null,
          status: 'scheduled',
          date: new Date(),
          homeScorers: [],
          awayScorers: []
        });
      }
    }
    
    // Rotar equipos (el primero se mantiene fijo)
    const fixed = teams[0];
    const rotating = teams.slice(1);
    rotating.unshift(rotating.pop());
    teams.splice(0, teams.length, fixed, ...rotating);
  }
  
  return matches;
}

module.exports = {
  generateSingleEliminationBracket,
  generateRoundRobinFixture,
  generateRoundRobinForTeams
};
