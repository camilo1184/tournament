// Detectar si estamos en desarrollo o producción
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api'
  : 'https://tournament-backend-x9nj.onrender.com/api';

let currentTournament = null;
let allMatches = [];
let allTeams = [];

// Funcionalidad de tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remover clase active de todos los botones
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Agregar clase active al botón clickeado
            button.classList.add('active');
            
            // Ocultar todos los contenidos
            tabContents.forEach(content => content.classList.remove('active'));
            // Mostrar el contenido del tab seleccionado
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    loadTournaments();
    updateLastUpdateTime();
    initializeTabs();
    
    // Actualizar cada 30 segundos
    setInterval(() => {
        if (currentTournament) {
            loadTournamentData(currentTournament.id);
        }
        updateLastUpdateTime();
    }, 30000);
});

// Actualizar hora de última actualización
function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('es-ES');
}

// Cargar lista de torneos
async function loadTournaments() {
    try {
        const response = await fetch(`${API_URL}/tournaments`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const tournaments = await response.json();
        
        const select = document.getElementById('tournamentSelect');
        select.innerHTML = '<option value="">Selecciona un torneo</option>';
        
        if (tournaments.length === 0) {
            select.innerHTML = '<option value="">No hay torneos disponibles</option>';
            return;
        }
        
        tournaments.forEach(tournament => {
            const option = document.createElement('option');
            option.value = tournament.id;
            option.textContent = `${tournament.name} - ${getStatusText(tournament.status)}`;
            select.appendChild(option);
        });
        
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                const tournament = tournaments.find(t => t.id === e.target.value);
                loadTournamentData(tournament.id);
            }
        });
        
    } catch (error) {
        console.error('Error cargando torneos:', error);
        const select = document.getElementById('tournamentSelect');
        select.innerHTML = '<option value="">Error al cargar torneos</option>';
        showError('No se pudieron cargar los torneos. Verifica que el servidor backend esté corriendo en http://localhost:3001');
    }
}

// Cargar datos del torneo seleccionado
async function loadTournamentData(tournamentId) {
    try {
        // Cargar torneo
        const tournamentResponse = await fetch(`${API_URL}/tournaments/${tournamentId}`);
        currentTournament = await tournamentResponse.json();
        
        // Cargar partidos
        const matchesResponse = await fetch(`${API_URL}/tournaments/${tournamentId}/matches`);
        allMatches = await matchesResponse.json();
        
        // Cargar equipos
        const teamsResponse = await fetch(`${API_URL}/teams`);
        allTeams = await teamsResponse.json();
        
        // Renderizar todo
        renderTournamentInfo();
        renderUpcomingMatches();
        renderPlayedMatches();
        renderStandingsTable();
        renderScorersTable();
        
    } catch (error) {
        console.error('Error cargando datos del torneo:', error);
        showError('Error al cargar los datos del torneo');
    }
}

// Renderizar información del torneo
function renderTournamentInfo() {
    document.getElementById('tournamentName').textContent = currentTournament.name;
    
    const details = document.getElementById('tournamentDetails');
    const totalMatches = allMatches.length;
    const completedMatches = allMatches.filter(m => m.status === 'completed').length;
    const pendingMatches = allMatches.filter(m => m.status === 'pending').length;
    
    details.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Estado</div>
            <div class="detail-value">${getStatusText(currentTournament.status)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Equipos</div>
            <div class="detail-value">${currentTournament.teams.length}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Partidos Jugados</div>
            <div class="detail-value">${completedMatches}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Partidos Pendientes</div>
            <div class="detail-value">${pendingMatches}</div>
        </div>
    `;
}

// Renderizar próximos partidos (solo pendientes)
function renderUpcomingMatches() {
    const container = document.getElementById('upcomingMatches');
    
    // Filtrar solo partidos pendientes
    const upcomingMatches = allMatches.filter(match => match.status === 'pending' || match.status === 'scheduled');
    
    if (upcomingMatches.length === 0) {
        container.innerHTML = '<p class="no-data">No hay partidos próximos</p>';
        return;
    }
    
    // Agrupar partidos por grupo
    const matchesByGroup = {};
    const matchesWithoutGroup = [];
    
    upcomingMatches.forEach(match => {
        if (match.groupName) {
            if (!matchesByGroup[match.groupName]) {
                matchesByGroup[match.groupName] = [];
            }
            matchesByGroup[match.groupName].push(match);
        } else {
            matchesWithoutGroup.push(match);
        }
    });
    
    let html = '';
    
    // Renderizar partidos por grupo
    const sortedGroups = Object.keys(matchesByGroup).sort();
    sortedGroups.forEach(groupName => {
        const matches = matchesByGroup[groupName];
        
        // Ordenar por ronda y número de partido
        matches.sort((a, b) => {
            if (a.round !== b.round) return a.round - b.round;
            return (a.matchNumber || 0) - (b.matchNumber || 0);
        });
        
        // Agrupar por fecha dentro del grupo
        const matchesByRound = {};
        matches.forEach(match => {
            const round = match.round || 1;
            if (!matchesByRound[round]) {
                matchesByRound[round] = [];
            }
            matchesByRound[round].push(match);
        });
        
        html += `
            <div class="group-section">
                <div class="group-header">
                    <span class="group-badge">Grupo ${groupName}</span>
                </div>
        `;
        
        // Renderizar cada fecha
        Object.keys(matchesByRound).sort((a, b) => a - b).forEach(round => {
            const roundMatches = matchesByRound[round];
            const roundId = `upcoming-round-${groupName}-${round}`;
            html += `
                <div class="round-section">
                    <div class="round-header collapsible" onclick="toggleRound('${roundId}')">
                        <span class="round-title">Fecha ${round}</span>
                        <span class="round-count">(${roundMatches.length} partidos)</span>
                        <span class="collapse-icon">▼</span>
                    </div>
                    <div class="matches-list-compact" id="${roundId}">
                        ${roundMatches.map(match => renderMatchRowCompact(match)).join('')}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    // Renderizar partidos sin grupo (fase eliminatoria)
    if (matchesWithoutGroup.length > 0) {
        // Agrupar por ronda
        const matchesByRound = {};
        matchesWithoutGroup.forEach(match => {
            const round = match.round || 'Sin ronda';
            if (!matchesByRound[round]) {
                matchesByRound[round] = [];
            }
            matchesByRound[round].push(match);
        });
        
        Object.keys(matchesByRound).sort().forEach(round => {
            const matches = matchesByRound[round];
            matches.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
            const roundId = `upcoming-round-elim-${round}`;
            
            html += `
                <div class="group-section">
                    <div class="group-header">
                        <span class="group-badge">Ronda ${round}</span>
                    </div>
                    <div class="round-section">
                        <div class="round-header collapsible" onclick="toggleRound('${roundId}')">
                            <span class="round-title">Partidos</span>
                            <span class="round-count">(${matches.length})</span>
                            <span class="collapse-icon">▼</span>
                        </div>
                        <div class="matches-list-compact" id="${roundId}">
                            ${matches.map(match => renderMatchRowCompact(match)).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html || '<p class="no-data">No hay partidos próximos</p>';
}

// Renderizar partidos jugados (completados)
function renderPlayedMatches() {
    const container = document.getElementById('playedMatches');
    
    // Filtrar solo partidos completados
    const playedMatches = allMatches.filter(match => match.status === 'completed');
    
    if (playedMatches.length === 0) {
        container.innerHTML = '<p class="no-data">No hay partidos jugados</p>';
        return;
    }
    
    // Agrupar partidos por grupo
    const matchesByGroup = {};
    const matchesWithoutGroup = [];
    
    playedMatches.forEach(match => {
        if (match.groupName) {
            if (!matchesByGroup[match.groupName]) {
                matchesByGroup[match.groupName] = [];
            }
            matchesByGroup[match.groupName].push(match);
        } else {
            matchesWithoutGroup.push(match);
        }
    });
    
    let html = '';
    
    // Renderizar partidos por grupo
    const sortedGroups = Object.keys(matchesByGroup).sort();
    sortedGroups.forEach(groupName => {
        const matches = matchesByGroup[groupName];
        
        // Ordenar por ronda y número de partido
        matches.sort((a, b) => {
            if (a.round !== b.round) return a.round - b.round;
            return (a.matchNumber || 0) - (b.matchNumber || 0);
        });
        
        // Agrupar por fecha dentro del grupo
        const matchesByRound = {};
        matches.forEach(match => {
            const round = match.round || 1;
            if (!matchesByRound[round]) {
                matchesByRound[round] = [];
            }
            matchesByRound[round].push(match);
        });
        
        html += `
            <div class="group-section">
                <div class="group-header">
                    <span class="group-badge">Grupo ${groupName}</span>
                </div>
        `;
        
        // Renderizar cada fecha
        Object.keys(matchesByRound).sort((a, b) => a - b).forEach(round => {
            const roundMatches = matchesByRound[round];
            const roundId = `played-round-${groupName}-${round}`;
            html += `
                <div class="round-section">
                    <div class="round-header collapsible" onclick="toggleRound('${roundId}')">
                        <span class="round-title">Fecha ${round}</span>
                        <span class="round-count">(${roundMatches.length} partidos)</span>
                        <span class="collapse-icon">▼</span>
                    </div>
                    <div class="matches-list-compact" id="${roundId}">
                        ${roundMatches.map(match => renderMatchRowCompact(match)).join('')}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    // Renderizar partidos sin grupo (fase eliminatoria)
    if (matchesWithoutGroup.length > 0) {
        // Agrupar por ronda
        const matchesByRound = {};
        matchesWithoutGroup.forEach(match => {
            const round = match.round || 'Sin ronda';
            if (!matchesByRound[round]) {
                matchesByRound[round] = [];
            }
            matchesByRound[round].push(match);
        });
        
        Object.keys(matchesByRound).sort().forEach(round => {
            const matches = matchesByRound[round];
            matches.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
            const roundId = `played-round-elim-${round}`;
            
            html += `
                <div class="group-section">
                    <div class="group-header">
                        <span class="group-badge">Ronda ${round}</span>
                    </div>
                    <div class="round-section">
                        <div class="round-header collapsible" onclick="toggleRound('${roundId}')">
                            <span class="round-title">Partidos</span>
                            <span class="round-count">(${matches.length})</span>
                            <span class="collapse-icon">▼</span>
                        </div>
                        <div class="matches-list-compact" id="${roundId}">
                            ${matches.map(match => renderMatchRowCompact(match)).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html || '<p class="no-data">No hay partidos jugados</p>';
}

// Renderizar una fila de partido compacta (sin fecha)
function renderMatchRowCompact(match) {
    const team1Id = match.team1Id || match.team1;
    const team2Id = match.team2Id || match.team2;
    const team1 = getTeamById(team1Id);
    const team2 = getTeamById(team2Id);
    const score1 = match.score1 !== undefined ? match.score1 : match.team1Score;
    const score2 = match.score2 !== undefined ? match.score2 : match.team2Score;
    const hasScore = match.status === 'completed';
    
    return `
        <div class="match-row-compact clickable-match" onclick="showMatchModal('${match.id}')">
            <div class="match-teams-compact">
                <div class="team-compact">
                    <img src="${team1?.logo || 'images/default-team-logo.svg'}" alt="${team1?.name}" class="team-logo-compact">
                    <span class="team-name-compact">${team1?.name || 'TBD'}</span>
                </div>
                
                <div class="match-score-compact ${hasScore ? 'completed' : ''}">
                    ${hasScore ? `<span class="score">${score1 || 0} - ${score2 || 0}</span>` : '<span class="vs">VS</span>'}
                </div>
                
                <div class="team-compact">
                    <img src="${team2?.logo || 'images/default-team-logo.svg'}" alt="${team2?.name}" class="team-logo-compact">
                    <span class="team-name-compact">${team2?.name || 'TBD'}</span>
                </div>
            </div>
            <span class="status-badge-compact ${match.status}">${getMatchStatusText(match.status)}</span>
        </div>
    `;
}

// Renderizar una fila de partido (legacy - mantener por compatibilidad)
function renderMatchRow(match, number) {
    const team1Id = match.team1Id || match.team1;
    const team2Id = match.team2Id || match.team2;
    const team1 = getTeamById(team1Id);
    const team2 = getTeamById(team2Id);
    const score1 = match.score1 !== undefined ? match.score1 : match.team1Score;
    const score2 = match.score2 !== undefined ? match.score2 : match.team2Score;
    const hasScore = match.status === 'completed';
    
    return `
        <div class="match-row-compact clickable-match" onclick="showMatchModal('${match.id}')" style="cursor: pointer;">
            <div class="match-info-compact">
                <span class="match-round-compact">Fecha ${match.round || 1}</span>
                <span class="status-badge-compact ${match.status}">${getMatchStatusText(match.status)}</span>
            </div>
            
            <div class="match-teams-compact">
                <div class="team-compact">
                    <img src="${team1?.logo || 'images/default-team-logo.svg'}" alt="${team1?.name}" class="team-logo-compact">
                    <span class="team-name-compact">${team1?.name || 'TBD'}</span>
                </div>
                
                <div class="match-score-compact ${hasScore ? 'completed' : ''}">
                    ${hasScore ? `<span class="score">${score1 || 0} - ${score2 || 0}</span>` : '<span class="vs">VS</span>'}
                </div>
                
                <div class="team-compact">
                    <img src="${team2?.logo || 'images/default-team-logo.svg'}" alt="${team2?.name}" class="team-logo-compact">
                    <span class="team-name-compact">${team2?.name || 'TBD'}</span>
                </div>
            </div>
        </div>
    `;
}

// Renderizar tabla de posiciones
function renderStandingsTable() {
    const container = document.getElementById('standingsTable');
    
    if (!currentTournament.teams || currentTournament.teams.length === 0) {
        container.innerHTML = '<p class="no-data">No hay equipos en este torneo</p>';
        return;
    }
    
    // Verificar si hay grupos configurados
    const groups = currentTournament.groups || [];
    
    if (groups.length === 0) {
        container.innerHTML = '<p class="no-data">No hay grupos configurados para mostrar la tabla de posiciones.</p>';
        return;
    }
    
    let html = '<div class="standings-groups">';
    
    // Renderizar tabla para cada grupo
    groups.forEach((group, index) => {
        const standings = calculateGroupStandings(group.teams);
        
        html += `
            <div class="standings-group">
                <h4 class="group-title">${group.name}</h4>
                <div class="standings-table-wrapper">
                    <table class="standings-table">
                        <thead>
                            <tr>
                                <th class="pos-col">#</th>
                                <th class="team-col">Equipo</th>
                                <th>PJ</th>
                                <th>PG</th>
                                <th>PE</th>
                                <th>PP</th>
                                <th>GF</th>
                                <th>GC</th>
                                <th>DG</th>
                                <th>Últimos 5</th>
                                <th class="pts-col">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${standings.map((stat, pos) => {
                                const team = getTeamById(stat.teamId);
                                return `
                                    <tr class="${pos < 2 ? 'qualified' : ''} clickable-row team-row" 
                                        data-team-id="${stat.teamId}"
                                        style="cursor: pointer;">
                                        <td class="pos-col">${pos + 1}</td>
                                        <td class="team-col">
                                            <div class="team-info">
                                                <img src="${team?.logo || 'images/default-team-logo.svg'}" alt="${team?.name || 'Equipo'}" class="team-logo-small">
                                                <span>${team?.name || 'Equipo'}</span>
                                            </div>
                                        </td>
                                        <td>${stat.played}</td>
                                        <td>${stat.won}</td>
                                        <td>${stat.drawn}</td>
                                        <td>${stat.lost}</td>
                                        <td>${stat.goalsFor}</td>
                                        <td>${stat.goalsAgainst}</td>
                                        <td class="${stat.goalDifference > 0 ? 'positive' : stat.goalDifference < 0 ? 'negative' : ''}">
                                            ${stat.goalDifference > 0 ? '+' : ''}${stat.goalDifference}
                                        </td>
                                        <td>${renderLastFiveResults(stat.lastFiveMatches)}</td>
                                        <td class="pts-col"><strong>${stat.points}</strong></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Agregar event listeners a las filas de equipos
    attachTeamClickListeners();
}

// Función para renderizar los últimos 5 resultados como círculos
function renderLastFiveResults(lastFiveMatches) {
    if (!lastFiveMatches || lastFiveMatches.length === 0) {
        return '<div class="last-five-results">-</div>';
    }
    
    // Rellenar con espacios vacíos si hay menos de 5 partidos
    const results = [...lastFiveMatches];
    while (results.length < 5) {
        results.unshift(''); // Agregar al inicio para que los más recientes queden a la derecha
    }
    
    const circles = results.map(result => {
        if (result === 'W') {
            return '<span class="result-circle win" title="Victoria">✓</span>';
        } else if (result === 'L') {
            return '<span class="result-circle loss" title="Derrota">✗</span>';
        } else if (result === 'D') {
            return '<span class="result-circle draw" title="Empate">−</span>';
        } else {
            return '<span class="result-circle empty"></span>';
        }
    }).join('');
    
    return `<div class="last-five-results">${circles}</div>`;
}

// Calcular estadísticas de un grupo específico
function calculateGroupStandings(groupTeams) {
    const stats = {};
    
    // Inicializar estadísticas para cada equipo del grupo
    groupTeams.forEach(teamId => {
        stats[teamId] = {
            teamId,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            lastFiveMatches: [] // Array para guardar los últimos 5 resultados
        };
    });

    // Obtener todos los partidos completados del grupo ordenados por fecha/round
    const completedMatches = allMatches
        .filter(match => match.status === 'completed' && 
                groupTeams.includes(match.team1 || match.team1Id) && 
                groupTeams.includes(match.team2 || match.team2Id))
        .sort((a, b) => (a.round || 0) - (b.round || 0)); // Ordenar por ronda

    // Calcular estadísticas desde los partidos completados
    completedMatches.forEach(match => {
        const team1Id = match.team1 || match.team1Id;
        const team2Id = match.team2 || match.team2Id;
        const team1Score = match.score1 !== undefined ? match.score1 : match.team1Score || 0;
        const team2Score = match.score2 !== undefined ? match.score2 : match.team2Score || 0;

        // Actualizar estadísticas del equipo 1
        stats[team1Id].played++;
        stats[team1Id].goalsFor += team1Score;
        stats[team1Id].goalsAgainst += team2Score;

        // Actualizar estadísticas del equipo 2
        stats[team2Id].played++;
        stats[team2Id].goalsFor += team2Score;
        stats[team2Id].goalsAgainst += team1Score;

        // Determinar resultado y guardar en últimos 5 partidos
        if (team1Score > team2Score) {
            stats[team1Id].won++;
            stats[team1Id].points += 3;
            stats[team1Id].lastFiveMatches.push('W'); // Win
            stats[team2Id].lost++;
            stats[team2Id].lastFiveMatches.push('L'); // Loss
        } else if (team1Score < team2Score) {
            stats[team2Id].won++;
            stats[team2Id].points += 3;
            stats[team2Id].lastFiveMatches.push('W'); // Win
            stats[team1Id].lost++;
            stats[team1Id].lastFiveMatches.push('L'); // Loss
        } else {
            stats[team1Id].drawn++;
            stats[team2Id].drawn++;
            stats[team1Id].points += 1;
            stats[team2Id].points += 1;
            stats[team1Id].lastFiveMatches.push('D'); // Draw
            stats[team2Id].lastFiveMatches.push('D'); // Draw
        }
    });

    // Calcular diferencia de goles y tomar solo últimos 5 resultados
    Object.values(stats).forEach(stat => {
        stat.goalDifference = stat.goalsFor - stat.goalsAgainst;
        // Mantener solo los últimos 5 resultados
        stat.lastFiveMatches = stat.lastFiveMatches.slice(-5);
    });

    // Ordenar por puntos, diferencia de goles, goles a favor
    return Object.values(stats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });
}

// Renderizar tabla de goleadores
function renderScorersTable() {
    const container = document.getElementById('scorersTable');
    const scorers = calculateScorers();
    
    if (scorers.length === 0) {
        container.innerHTML = '<p class="no-data">No hay goleadores registrados</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Jugador</th>
                    <th>Equipo</th>
                    <th style="text-align: center;">⚽ Goles</th>
                </tr>
            </thead>
            <tbody>
                ${scorers.map((scorer, index) => `
                    <tr>
                        <td class="position ${index < 3 ? 'top-3' : ''}">${index + 1}</td>
                        <td>
                            <div class="team-cell">
                                ${scorer.photo ? `<img src="${scorer.photo}" alt="${scorer.name}" class="team-logo-small">` : ''}
                                <span>${scorer.name}</span>
                            </div>
                        </td>
                        <td>${scorer.teamName}</td>
                        <td class="stat-value"><span class="stat-highlight">${scorer.goals}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Calcular goleadores
function calculateScorers() {
    const scorersMap = new Map();
    
    allMatches.forEach(match => {
        if (match.status === 'completed') {
            const team1Id = match.team1Id || match.team1;
            const team2Id = match.team2Id || match.team2;
            
            // Procesar goleadores del equipo 1
            if (match.team1Scorers && Array.isArray(match.team1Scorers)) {
                match.team1Scorers.forEach(scorer => {
                    // Verificar si hay playerId o playerName (puede estar en cualquiera)
                    const scorerId = scorer.playerId || scorer.playerName;
                    if (scorerId && scorerId.trim() !== '') {
                        const key = `${scorerId}-${team1Id}`;
                        if (!scorersMap.has(key)) {
                            const team = getTeamById(team1Id);
                            const player = getPlayerById(team1Id, scorerId);
                            scorersMap.set(key, {
                                playerId: scorerId,
                                name: scorer.playerName || player?.name || scorerId,
                                teamId: team1Id,
                                teamName: team?.name || 'Desconocido',
                                photo: player?.photo,
                                goals: 0
                            });
                        }
                        // Contar la cantidad de goles (quantity si existe, sino 1)
                        const goals = scorer.quantity || 1;
                        scorersMap.get(key).goals += goals;
                    }
                });
            }
            
            // Procesar goleadores del equipo 2
            if (match.team2Scorers && Array.isArray(match.team2Scorers)) {
                match.team2Scorers.forEach(scorer => {
                    // Verificar si hay playerId o playerName (puede estar en cualquiera)
                    const scorerId = scorer.playerId || scorer.playerName;
                    if (scorerId && scorerId.trim() !== '') {
                        const key = `${scorerId}-${team2Id}`;
                        if (!scorersMap.has(key)) {
                            const team = getTeamById(team2Id);
                            const player = getPlayerById(team2Id, scorerId);
                            scorersMap.set(key, {
                                playerId: scorerId,
                                name: scorer.playerName || player?.name || scorerId,
                                teamId: team2Id,
                                teamName: team?.name || 'Desconocido',
                                photo: player?.photo,
                                goals: 0
                            });
                        }
                        // Contar la cantidad de goles (quantity si existe, sino 1)
                        const goals = scorer.quantity || 1;
                        scorersMap.get(key).goals += goals;
                    }
                });
            }
            
            // Soportar formato antiguo con events
            if (match.events && Array.isArray(match.events)) {
                match.events.forEach(event => {
                    if (event.type === 'goal' && event.playerId) {
                        const key = `${event.playerId}-${event.teamId}`;
                        if (!scorersMap.has(key)) {
                            const team = getTeamById(event.teamId);
                            const player = getPlayerById(event.teamId, event.playerId);
                            scorersMap.set(key, {
                                playerId: event.playerId,
                                name: event.playerName || player?.name || 'Desconocido',
                                teamId: event.teamId,
                                teamName: team?.name || 'Desconocido',
                                photo: player?.photo,
                                goals: 0
                            });
                        }
                        scorersMap.get(key).goals++;
                    }
                });
            }
        }
    });
    
    return Array.from(scorersMap.values())
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 20); // Top 20 goleadores
}

// Funciones auxiliares
function getTeamById(teamId) {
    // Comparar tanto por número como por string para mayor compatibilidad
    return allTeams.find(t => t.id == teamId || t.id === teamId);
}

function getPlayerById(teamId, playerId) {
    const team = getTeamById(teamId);
    // Buscar por id o por nombre ya que playerId puede contener cualquiera de los dos
    return team?.players?.find(p => p.id === playerId || p.name === playerId);
}

// Funciones para el modal de información del partido
function showMatchModal(matchId) {
    const match = allMatches.find(m => m.id === matchId);
    if (!match) {
        console.error('Match not found:', matchId);
        return;
    }

    const team1Id = match.team1Id || match.team1;
    const team2Id = match.team2Id || match.team2;
    const team1 = getTeamById(team1Id);
    const team2 = getTeamById(team2Id);

    if (!team1 || !team2) {
        console.error('Teams not found');
        return;
    }

    const modal = document.getElementById('matchModal');
    const modalContent = document.getElementById('matchModalContent');

    const score1 = match.score1 !== undefined ? match.score1 : match.team1Score;
    const score2 = match.score2 !== undefined ? match.score2 : match.team2Score;
    const hasScore = match.status === 'completed';

    // Obtener goleadores y tarjetas del partido si está completado
    let team1Goals = [];
    let team2Goals = [];
    let team1Cards = [];
    let team2Cards = [];

    if (hasScore) {
        // Goles equipo 1
        if (match.team1Scorers && Array.isArray(match.team1Scorers)) {
            team1Goals = match.team1Scorers
                .map(scorer => {
                    const player = scorer.playerId ? getPlayerById(team1Id, scorer.playerId) : null;
                    return {
                        playerName: scorer.playerName || scorer.name || player?.name || 'Desconocido',
                        minute: scorer.minute || '?'
                    };
                })
                .filter(goal => goal.playerName && goal.playerName !== 'Desconocido');
        }
        
        // Goles equipo 2
        if (match.team2Scorers && Array.isArray(match.team2Scorers)) {
            team2Goals = match.team2Scorers
                .map(scorer => {
                    const player = scorer.playerId ? getPlayerById(team2Id, scorer.playerId) : null;
                    return {
                        playerName: scorer.playerName || scorer.name || player?.name || 'Desconocido',
                        minute: scorer.minute || '?'
                    };
                })
                .filter(goal => goal.playerName && goal.playerName !== 'Desconocido');
        }
        
        // Tarjetas equipo 1
        if (match.team1Cards && Array.isArray(match.team1Cards)) {
            team1Cards = match.team1Cards
                .map(card => {
                    const player = card.playerId ? getPlayerById(team1Id, card.playerId) : null;
                    return {
                        playerName: card.playerName || card.name || player?.name || 'Desconocido',
                        type: card.type || card.cardType || 'yellow',
                        minute: card.minute || '?'
                    };
                })
                .filter(card => card.playerName && card.playerName !== 'Desconocido');
        }
        
        // Tarjetas equipo 2
        if (match.team2Cards && Array.isArray(match.team2Cards)) {
            team2Cards = match.team2Cards
                .map(card => {
                    const player = card.playerId ? getPlayerById(team2Id, card.playerId) : null;
                    return {
                        playerName: card.playerName || card.name || player?.name || 'Desconocido',
                        type: card.type || card.cardType || 'yellow',
                        minute: card.minute || '?'
                    };
                })
                .filter(card => card.playerName && card.playerName !== 'Desconocido');
        }
    }

    let html = `
        <h2 style="text-align: center; margin-bottom: 30px;">Información del Partido</h2>
        
        <!-- Información de los equipos -->
        <div style="display: flex; justify-content: space-around; align-items: flex-start; margin-bottom: 30px; gap: 20px;">
            <div style="flex: 1; text-align: center;">
                <img src="${team1.logo || 'images/default-team-logo.svg'}" alt="${team1.name}" style="width: 120px; height: 120px; object-fit: contain; margin-bottom: 15px;">
                <h3 style="color: var(--dark); margin: 10px 0;">${team1.name}</h3>
                
                ${hasScore && (team1Goals.length > 0 || team1Cards.length > 0) ? `
                    <div style="margin-top: 20px; text-align: left; background: #f9fafb; padding: 15px; border-radius: 8px;">
                        ${team1Goals.length > 0 ? team1Goals.map(goal => `<div style="display: flex; align-items: center; padding: 8px 0; font-size: 0.9em; border-bottom: 1px solid #e5e7eb;"><span style="font-size: 1.2em; margin-right: 8px;">⚽</span><span style="font-weight: 600; flex: 1;">${goal.playerName}</span></div>`).join('') : ''}
                        
                        ${team1Cards.length > 0 ? team1Cards.map(card => `<div style="display: flex; align-items: center; padding: 8px 0; font-size: 0.9em; border-bottom: 1px solid #e5e7eb;"><span style="font-size: 1.2em; margin-right: 8px;">${card.type === 'red' || card.type === 'red_card' ? '🟥' : '🟨'}</span><span style="font-weight: 600; flex: 1;">${card.playerName}</span></div>`).join('') : ''}
                    </div>
                ` : ''}
            </div>
            
            <div style="text-align: center; min-width: 150px;">
                <div style="font-size: 2.5em; font-weight: bold; color: var(--primary-color);">
                    ${hasScore ? `${score1 || 0} - ${score2 || 0}` : 'VS'}
                </div>
                <div style="margin-top: 10px;">
                    <span class="status-badge ${match.status}" style="padding: 8px 16px; font-size: 0.9em;">
                        ${getMatchStatusText(match.status)}
                    </span>
                </div>
                ${match.groupName ? `<div style="margin-top: 10px; color: #666;">Grupo ${match.groupName} - Fecha ${match.round}</div>` : ''}
            </div>
            
            <div style="flex: 1; text-align: center;">
                <img src="${team2.logo || 'images/default-team-logo.svg'}" alt="${team2.name}" style="width: 120px; height: 120px; object-fit: contain; margin-bottom: 15px;">
                <h3 style="color: var(--dark); margin: 10px 0;">${team2.name}</h3>
                
                ${hasScore && (team2Goals.length > 0 || team2Cards.length > 0) ? `
                    <div style="margin-top: 20px; text-align: left; background: #f9fafb; padding: 15px; border-radius: 8px;">
                        ${team2Goals.length > 0 ? team2Goals.map(goal => `<div style="display: flex; align-items: center; padding: 8px 0; font-size: 0.9em; border-bottom: 1px solid #e5e7eb;"><span style="font-size: 1.2em; margin-right: 8px;">⚽</span><span style="font-weight: 600; flex: 1;">${goal.playerName}</span></div>`).join('') : ''}
                        
                        ${team2Cards.length > 0 ? team2Cards.map(card => `<div style="display: flex; align-items: center; padding: 8px 0; font-size: 0.9em; border-bottom: 1px solid #e5e7eb;"><span style="font-size: 1.2em; margin-right: 8px;">${card.type === 'red' || card.type === 'red_card' ? '🟥' : '🟨'}</span><span style="font-weight: 600; flex: 1;">${card.playerName}</span></div>`).join('') : ''}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Si el partido tiene grupo, mostrar la tabla de posiciones del grupo
    if (match.groupName) {
        const groupStandings = calculateGroupStandingsForMatch(match.groupName, team1Id, team2Id);
        if (groupStandings && groupStandings.length > 0) {
            html += `
                <div style="margin-top: 30px;">
                    <h3 style="text-align: center; color: var(--dark); margin-bottom: 20px;">
                        📊 Posiciones del Grupo ${match.groupName}
                    </h3>
                    <table class="standings-table" style="width: 100%;">
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Equipo</th>
                                <th>PJ</th>
                                <th>PG</th>
                                <th>PE</th>
                                <th>PP</th>
                                <th>GF</th>
                                <th>GC</th>
                                <th>DG</th>
                                <th>Últimos 5</th>
                                <th>Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${groupStandings.map((standing, index) => {
                                const isMatchTeam = standing.teamId === team1Id || standing.teamId === team2Id;
                                const teamInfo = getTeamById(standing.teamId);
                                return `
                                    <tr class="team-row clickable ${isMatchTeam ? 'highlight-team' : ''}" 
                                        data-team-id="${standing.teamId}"
                                        style="cursor: pointer; ${isMatchTeam ? 'background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15)); font-weight: bold;' : ''}">
                                        <td style="text-align: center;">${index + 1}</td>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <img src="${teamInfo?.logo || 'images/default-team-logo.svg'}" alt="${teamInfo?.name || 'Desconocido'}" style="width: 30px; height: 30px; object-fit: contain;">
                                                <span>${teamInfo?.name || 'Desconocido'}</span>
                                            </div>
                                        </td>
                                        <td style="text-align: center;">${standing.played}</td>
                                        <td style="text-align: center;">${standing.won}</td>
                                        <td style="text-align: center;">${standing.drawn}</td>
                                        <td style="text-align: center;">${standing.lost}</td>
                                        <td style="text-align: center;">${standing.goalsFor}</td>
                                        <td style="text-align: center;">${standing.goalsAgainst}</td>
                                        <td style="text-align: center;">${standing.goalDifference >= 0 ? '+' : ''}${standing.goalDifference}</td>
                                        <td style="text-align: center;">${renderLastFiveResults(standing.lastFiveMatches)}</td>
                                        <td style="text-align: center; font-weight: bold;">${standing.points}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    modalContent.innerHTML = html;
    modal.style.display = 'block';

    // Agregar event listeners a las filas de equipos en la tabla de posiciones
    const teamRows = modal.querySelectorAll('.team-row.clickable');
    console.log('Filas encontradas en modal:', teamRows.length);
    teamRows.forEach(row => {
        row.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevenir que se cierre el modal
            const teamId = this.getAttribute('data-team-id');
            console.log('Click en equipo ID:', teamId);
            if (teamId) {
                // Cerrar el modal del partido primero
                closeMatchModal();
                // Pequeño delay para que se cierre suavemente antes de abrir el otro
                setTimeout(() => {
                    showTeamModal(teamId);
                }, 100);
            }
        });
    });

    // Cerrar modal al hacer clic fuera
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeMatchModal();
        }
    };
}

function calculateGroupStandingsForMatch(groupName, team1Id, team2Id) {
    // Obtener el grupo del torneo
    const groups = currentTournament.groups || [];
    const group = groups.find(g => g.name === groupName);
    
    if (!group || !group.teams || group.teams.length === 0) {
        console.log('No se encontró el grupo o no tiene equipos:', groupName);
        return [];
    }

    console.log('Grupo encontrado:', group);
    return calculateGroupStandings(group.teams);
}

function closeMatchModal() {
    const modal = document.getElementById('matchModal');
    modal.style.display = 'none';
}

// Funciones para el modal de información del equipo
function attachTeamClickListeners() {
    const teamRows = document.querySelectorAll('.standings-table .clickable-row');
    console.log('Attached click listeners to', teamRows.length, 'rows');
    teamRows.forEach(row => {
        row.addEventListener('click', (e) => {
            e.preventDefault();
            const teamId = row.getAttribute('data-team-id');
            console.log('Team clicked:', teamId);
            showTeamModal(teamId);
        });
    });
}

function showTeamModal(teamId) {
    const team = getTeamById(teamId);
    if (!team) {
        console.error('Team not found:', teamId);
        return;
    }
    
    console.log('Showing modal for team:', team.name);
    
    const modal = document.getElementById('teamModal');
    const content = document.getElementById('teamModalContent');
    
    // Encontrar el grupo del equipo
    const teamGroup = currentTournament.groups?.find(g => g.teams.includes(teamId));
    
    // Obtener estadísticas del equipo calculando solo para su grupo
    let teamStats = null;
    if (teamGroup) {
        const groupStandings = calculateGroupStandings(teamGroup.teams);
        teamStats = groupStandings.find(s => s.teamId === teamId);
    }
    
    // Obtener partidos del equipo
    const teamMatches = allMatches.filter(m => {
        const team1 = m.team1Id || m.team1;
        const team2 = m.team2Id || m.team2;
        return team1 === teamId || team2 === teamId;
    });
    
    // Separar partidos completados y pendientes
    const completedMatches = teamMatches.filter(m => m.status === 'completed');
    const pendingMatches = teamMatches.filter(m => m.status === 'pending' || m.status === 'in-progress');
    
    // Calcular goleadores del equipo
    const scorersMap = new Map();
    completedMatches.forEach(match => {
        const team1 = match.team1Id || match.team1;
        const isTeam1 = team1 === teamId;
        const scorers = isTeam1 ? match.team1Scorers : match.team2Scorers;
        
        if (scorers && Array.isArray(scorers)) {
            scorers.forEach(scorer => {
                if (scorer.playerId) {
                    if (!scorersMap.has(scorer.playerId)) {
                        scorersMap.set(scorer.playerId, {
                            playerId: scorer.playerId,
                            playerName: scorer.playerName,
                            goals: 0
                        });
                    }
                    scorersMap.get(scorer.playerId).goals++;
                }
            });
        }
    });
    
    const topScorers = Array.from(scorersMap.values()).sort((a, b) => b.goals - a.goals);
    
    // Calcular tarjetas del equipo
    const cardsMap = new Map();
    completedMatches.forEach(match => {
        const team1 = match.team1Id || match.team1;
        const isTeam1 = team1 === teamId;
        const cards = isTeam1 ? match.team1Cards : match.team2Cards;
        
        if (cards && Array.isArray(cards)) {
            cards.forEach(card => {
                if (card.playerId) {
                    if (!cardsMap.has(card.playerId)) {
                        cardsMap.set(card.playerId, {
                            playerId: card.playerId,
                            playerName: card.playerName,
                            yellow: 0,
                            red: 0,
                            blue: 0
                        });
                    }
                    const playerCard = cardsMap.get(card.playerId);
                    if (card.cardType === 'yellow') playerCard.yellow++;
                    else if (card.cardType === 'red') playerCard.red++;
                    else if (card.cardType === 'blue') playerCard.blue++;
                }
            });
        }
    });
    
    const playerCards = Array.from(cardsMap.values()).filter(c => c.yellow > 0 || c.red > 0 || c.blue > 0);
    
    content.innerHTML = `
        <div class="team-stats-modal">
            <div class="modal-header team-stats-header">
                <div class="team-header-content">
                    <img src="${team.logo || 'images/default-team-logo.svg'}" alt="${team.name}" class="team-logo-header">
                    <div class="team-header-info">
                        <h2>${team.name}</h2>
                        ${team.group ? `<span class="group-badge-header">${team.group}</span>` : ''}
                        <div class="team-stats-summary">
                            <span><strong>${teamStats?.played || 0}</strong> PJ</span>
                            <span><strong>${teamStats?.won || 0}</strong> PG</span>
                            <span><strong>${teamStats?.drawn || 0}</strong> PE</span>
                            <span><strong>${teamStats?.lost || 0}</strong> PP</span>
                            <span><strong>${teamStats?.points || 0}</strong> PTS</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stats-tabs-nav">
                <button class="stats-tab-btn active" data-tab="matches">📅 Partidos</button>
                <button class="stats-tab-btn" data-tab="scorers">⚽ Goleadores</button>
                <button class="stats-tab-btn" data-tab="cards">🟨 Tarjetas</button>
                <button class="stats-tab-btn" data-tab="players">👥 Jugadores</button>
            </div>
            
            <div class="modal-body team-stats-body">
                <!-- Tab Partidos -->
                <div class="stats-tab-content active" data-tab-content="matches">
                    <div class="stats-matches">
                        <div class="matches-group">
                            <h3>✅ Partidos Jugados (${completedMatches.length})</h3>
                            ${completedMatches.length > 0 ? `
                                <div class="stats-matches-list">
                                    ${completedMatches.map(match => {
                                        const team1 = match.team1Id || match.team1;
                                        const team2 = match.team2Id || match.team2;
                                        const isTeam1 = team1 === teamId;
                                        const opponent = isTeam1 ? team2 : team1;
                                        const teamScore = isTeam1 ? (match.score1 !== undefined ? match.score1 : match.team1Score || 0) : (match.score2 !== undefined ? match.score2 : match.team2Score || 0);
                                        const opponentScore = isTeam1 ? (match.score2 !== undefined ? match.score2 : match.team2Score || 0) : (match.score1 !== undefined ? match.score1 : match.team1Score || 0);
                                        const result = teamScore > opponentScore ? 'won' : teamScore < opponentScore ? 'lost' : 'draw';
                                        
                                        return `
                                            <div class="stats-match-card ${result}">
                                                <div class="match-info-header">
                                                    <span class="match-round">${match.groupName || 'General'} - Fecha ${match.round || 1}</span>
                                                    <span class="match-result-badge ${result}">
                                                        ${result === 'won' ? 'Victoria' : result === 'lost' ? 'Derrota' : 'Empate'}
                                                    </span>
                                                </div>
                                                <div class="match-score-display">
                                                    <span class="team-name-display">${team.name}</span>
                                                    <span class="score-display">
                                                        <span class="${result === 'won' ? 'score-win' : result === 'lost' ? 'score-lose' : ''}">${teamScore}</span>
                                                        <span class="vs-text">-</span>
                                                        <span class="${result === 'lost' ? 'score-win' : result === 'won' ? 'score-lose' : ''}">${opponentScore}</span>
                                                    </span>
                                                    <span class="team-name-display">${getTeamById(opponent)?.name || 'TBD'}</span>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            ` : '<p class="no-data-small">No hay partidos jugados aún.</p>'}
                        </div>
                        
                        <div class="matches-group">
                            <h3>⏳ Partidos Pendientes (${pendingMatches.length})</h3>
                            ${pendingMatches.length > 0 ? `
                                <div class="stats-matches-list">
                                    ${pendingMatches.map(match => {
                                        const team1 = match.team1Id || match.team1;
                                        const team2 = match.team2Id || match.team2;
                                        const isTeam1 = team1 === teamId;
                                        const opponent = isTeam1 ? team2 : team1;
                                        
                                        return `
                                            <div class="stats-match-card pending">
                                                <div class="match-info-header">
                                                    <span class="match-round">${match.groupName || 'General'} - Fecha ${match.round || 1}</span>
                                                    <span class="match-result-badge pending">Pendiente</span>
                                                </div>
                                                <div class="match-score-display">
                                                    <span class="team-name-display">${team.name}</span>
                                                    <span class="vs-text">VS</span>
                                                    <span class="team-name-display">${getTeamById(opponent)?.name || 'TBD'}</span>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            ` : '<p class="no-data-small">No hay partidos pendientes.</p>'}
                        </div>
                    </div>
                </div>
                
                <!-- Tab Goleadores -->
                <div class="stats-tab-content" data-tab-content="scorers">
                    <div class="stats-scorers">
                        <h3>🎯 Tabla de Goleadores</h3>
                        ${topScorers.length > 0 ? `
                            <div class="scorers-table-wrapper">
                                <table class="scorers-table">
                                    <thead>
                                        <tr>
                                            <th class="rank-col">#</th>
                                            <th class="player-col">Jugador</th>
                                            <th class="goals-col">Goles</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${topScorers.map((scorer, index) => {
                                            const player = team.players?.find(p => (p.id || p.name) === scorer.playerId);
                                            return `
                                                <tr>
                                                    <td class="rank-col">
                                                        ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                                    </td>
                                                    <td class="player-col">
                                                        <div class="player-info-row">
                                                            ${player?.photo ? `<img src="${player.photo}" alt="${player.name}" class="player-photo-small">` : ''}
                                                            <div class="player-details">
                                                                <span class="player-name">${player?.name || scorer.playerName}</span>
                                                                ${player?.number ? `<span class="player-number-badge">#${player.number}</span>` : ''}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="goals-col"><strong>${scorer.goals}</strong></td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p class="no-data-small">No hay goleadores registrados.</p>'}
                    </div>
                </div>
                
                <!-- Tab Tarjetas -->
                <div class="stats-tab-content" data-tab-content="cards">
                    <div class="stats-cards">
                        <h3>🟨🟥🟦 Tarjetas</h3>
                        ${playerCards.length > 0 ? `
                            <div class="cards-table-wrapper">
                                <table class="cards-table">
                                    <thead>
                                        <tr>
                                            <th class="player-col">Jugador</th>
                                            <th class="card-col">🟨</th>
                                            <th class="card-col">🟥</th>
                                            <th class="card-col">🟦</th>
                                            <th class="total-col">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${playerCards.map(card => {
                                            const player = team.players?.find(p => (p.id || p.name) === card.playerId);
                                            return `
                                                <tr>
                                                    <td class="player-col">
                                                        <div class="player-info-row">
                                                            ${player?.photo ? `<img src="${player.photo}" alt="${player.name}" class="player-photo-small">` : ''}
                                                            <div class="player-details">
                                                                <span class="player-name">${player?.name || card.playerName}</span>
                                                                ${player?.number ? `<span class="player-number-badge">#${player.number}</span>` : ''}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="card-col">${card.yellow > 0 ? card.yellow : '-'}</td>
                                                    <td class="card-col">${card.red > 0 ? card.red : '-'}</td>
                                                    <td class="card-col">${card.blue > 0 ? card.blue : '-'}</td>
                                                    <td class="total-col"><strong>${card.yellow + card.red + card.blue}</strong></td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p class="no-data-small">No hay tarjetas registradas.</p>'}
                    </div>
                </div>
                
                <!-- Tab Jugadores -->
                <div class="stats-tab-content" data-tab-content="players">
                    <div class="stats-players">
                        <h3>👥 Plantilla del Equipo (${team.players?.length || 0})</h3>
                        ${team.players && team.players.length > 0 ? `
                            <div class="players-list-stats">
                                ${team.players.map(player => `
                                    <div class="player-list-item-stats">
                                        <div class="player-list-photo">
                                            ${player.photo ? `
                                                <img src="${player.photo}" alt="${player.name}" class="player-photo-list">
                                            ` : '<div class="player-photo-placeholder-list">👤</div>'}
                                        </div>
                                        <div class="player-list-info">
                                            <h4 class="player-list-name">${player.name}</h4>
                                            <p class="player-list-position">${player.position || 'Posición no definida'}</p>
                                        </div>
                                        <div class="player-list-number">#${player.number || '-'}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p class="no-data-small">No hay jugadores registrados en este equipo.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // Agregar funcionalidad a las pestañas
    setupTabNavigation();
}

// Cerrar modal
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('teamModal');
    const closeBtn = document.querySelector('.modal-close');
    
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});

// Función para configurar la navegación por pestañas
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.stats-tab-btn');
    const tabContents = document.querySelectorAll('.stats-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón y contenido seleccionado
            button.classList.add('active');
            const activeContent = document.querySelector(`[data-tab-content="${tabName}"]`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
}

function getStatusText(status) {
    const statuses = {
        'pending': '⏳ Pendiente',
        'in-progress': '🎮 En Curso',
        'completed': '✅ Finalizado'
    };
    return statuses[status] || status;
}

function getMatchStatusText(status) {
    const statuses = {
        'pending': 'Por Jugar',
        'in-progress': 'En Juego',
        'completed': 'Finalizado'
    };
    return statuses[status] || status;
}

// Función para colapsar/expandir secciones de fecha
function toggleRound(roundId) {
    const roundContent = document.getElementById(roundId);
    const header = roundContent.previousElementSibling;
    const icon = header.querySelector('.collapse-icon');
    
    if (roundContent.style.display === 'none') {
        roundContent.style.display = 'flex';
        icon.textContent = '▼';
        header.classList.remove('collapsed');
    } else {
        roundContent.style.display = 'none';
        icon.textContent = '▶';
        header.classList.add('collapsed');
    }
}

function showError(message) {
    // Crear un div de error si no existe
    let errorDiv = document.getElementById('error-notification');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
        <strong>⚠️ Error</strong>
        <p style="margin: 10px 0 0 0;">${message}</p>
    `;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (errorDiv && errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }
    }, 5000);
}

