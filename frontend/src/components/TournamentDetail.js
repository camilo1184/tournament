import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function TournamentDetail({ tournament, teams, onBack, onUpdate, authenticatedFetch }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(tournament);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(tournament.name);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [showTeamsSection, setShowTeamsSection] = useState(false);
  const [showGroupsSection, setShowGroupsSection] = useState(false);
  const [groups, setGroups] = useState(tournament.groups || []);
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroupIndex, setExpandedGroupIndex] = useState(null);
  const [showTournamentInfo, setShowTournamentInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'matches', o 'standings'
  const [selectedTeamStats, setSelectedTeamStats] = useState(null);
  const [showTeamStatsModal, setShowTeamStatsModal] = useState(false);
  const [tournamentInfo, setTournamentInfo] = useState({
    description: tournament.description || '',
    registrationFee: tournament.registrationFee || '',
    startDate: tournament.startDate || '',
    prizes: tournament.prizes || ''
  });

  // Sincronizar cuando cambia el prop tournament (al entrar/volver a entrar)
  useEffect(() => {
    if (tournament) {
      setCurrentTournament(tournament);
      setGroups(tournament.groups || []);
      setTournamentInfo({
        description: tournament.description || '',
        registrationFee: tournament.registrationFee || '',
        startDate: tournament.startDate || '',
        prizes: tournament.prizes || ''
      });
    }
  }, [tournament]);

  useEffect(() => {
    if (currentTournament && currentTournament.status !== 'pending') {
      fetchMatches();
    }
  }, [currentTournament?.status]);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${API_URL}/tournaments/${currentTournament.id}/matches`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const handleAddTeam = async () => {
    if (!selectedTeamId) return;
    
    try {
      const response = await authenticatedFetch(`${API_URL}/tournaments/${currentTournament.id}/teams`, {
        method: 'POST',
        body: JSON.stringify({ teamId: selectedTeamId })
      });
      const updatedTournament = await response.json();
      setCurrentTournament(updatedTournament);
      setSelectedTeamId('');
      onUpdate();
    } catch (error) {
      console.error('Error adding team:', error);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    // Verificar si el equipo está en algún grupo
    const teamInGroups = groups.some(group => group.teams.includes(teamId));
    
    if (teamInGroups) {
      const teamName = getTeamName(teamId);
      alert(`No se puede eliminar el equipo "${teamName}" porque está asignado a uno o más grupos. Por favor, quítalo de los grupos primero.`);
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este equipo del torneo?')) return;

    try {
      const response = await authenticatedFetch(`${API_URL}/tournaments/${currentTournament.id}/teams/${teamId}`, {
        method: 'DELETE'
      });
      const updatedTournament = await response.json();
      setCurrentTournament(updatedTournament);
      onUpdate();
    } catch (error) {
      console.error('Error removing team:', error);
    }
  };

  const handleUpdateTournament = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/tournaments/${currentTournament.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editedName })
      });
      const updatedTournament = await response.json();
      setCurrentTournament(updatedTournament);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating tournament:', error);
      alert('Error al actualizar el torneo');
    }
  };

  const handleSaveTournamentInfo = async () => {
    try {
      console.log('Guardando información del torneo:', tournamentInfo);
      const response = await authenticatedFetch(`${API_URL}/tournaments/${currentTournament.id}`, {
        method: 'PUT',
        body: JSON.stringify(tournamentInfo)
      });
      const updatedTournament = await response.json();
      console.log('Respuesta del servidor:', updatedTournament);
      setCurrentTournament(updatedTournament);
      onUpdate();
      alert('Información del torneo guardada exitosamente');
    } catch (error) {
      console.error('Error saving tournament info:', error);
      alert('Error al guardar la información del torneo');
    }
  };

  const handleDeleteTournament = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este torneo? Esta acción no se puede deshacer.')) return;

    try {
      await authenticatedFetch(`${API_URL}/tournaments/${currentTournament.id}`, {
        method: 'DELETE'
      });
      onUpdate();
      onBack();
    } catch (error) {
      console.error('Error deleting tournament:', error);
    }
  };

  const handleStartTournament = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/tournaments/${currentTournament.id}/start`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar el torneo');
      }
      
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (data.tournament && data.matches) {
        setCurrentTournament(data.tournament);
        setMatches(data.matches);
        onUpdate();
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error starting tournament:', error);
      alert(error.message || 'Error al iniciar el torneo. Asegúrate de tener al menos 2 equipos.');
    }
  };

  const handleRegenerateMatches = async () => {
    if (!window.confirm('¿Deseas generar partidos para los nuevos equipos/grupos? Los partidos existentes se mantendrán.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_URL}/tournaments/${currentTournament.id}/regenerate-matches`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al regenerar partidos');
      }
      
      const data = await response.json();
      console.log('Resultado de regeneración:', data);
      
      alert(data.message);
      fetchMatches(); // Recargar la lista de partidos
    } catch (error) {
      console.error('Error regenerating matches:', error);
      alert(error.message || 'Error al regenerar partidos.');
    }
  };

  const handleUpdateMatch = async (matchId, matchData) => {
    try {
      console.log('Enviando datos del partido:', matchData);
      await authenticatedFetch(`${API_URL}/matches/${matchId}`, {
        method: 'PUT',
        body: JSON.stringify(matchData)
      });
      fetchMatches();
    } catch (error) {
      console.error('Error updating match:', error);
    }
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'TBD';
  };

  const toggleTeamExpansion = (teamId) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  const toggleGroupExpansion = (groupIndex) => {
    setExpandedGroupIndex(expandedGroupIndex === groupIndex ? null : groupIndex);
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const newGroup = {
        name: newGroupName,
        teams: []
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
    }
  };

  const handleAddTeamToGroup = (groupIndex, teamId) => {
    const updatedGroups = [...groups];
    if (!updatedGroups[groupIndex].teams.includes(teamId)) {
      updatedGroups[groupIndex].teams.push(teamId);
      setGroups(updatedGroups);
    }
  };

  const handleRemoveTeamFromGroup = (groupIndex, teamId) => {
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].teams = updatedGroups[groupIndex].teams.filter(id => id !== teamId);
    setGroups(updatedGroups);
  };

  const handleDeleteGroup = (groupIndex) => {
    if (window.confirm('¿Eliminar este grupo?')) {
      setGroups(groups.filter((_, i) => i !== groupIndex));
    }
  };

  const handleSaveGroups = async () => {
    try {
      console.log('Guardando grupos:', groups);
      const response = await authenticatedFetch(`${API_URL}/tournaments/${currentTournament.id}`, {
        method: 'PUT',
        body: JSON.stringify({ groups })
      });
      const updatedTournament = await response.json();
      console.log('Respuesta del servidor:', updatedTournament);
      setCurrentTournament(updatedTournament);
      onUpdate();
      alert('Grupos guardados exitosamente');
    } catch (error) {
      console.error('Error saving groups:', error);
      alert('Error al guardar los grupos');
    }
  };

  const getTeamsInGroups = () => {
    const teamsInGroups = new Set();
    groups.forEach(group => {
      group.teams.forEach(teamId => teamsInGroups.add(teamId));
    });
    return teamsInGroups;
  };

  // Calcular estadísticas para tabla de posiciones
  const calculateStandings = (groupTeams) => {
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
        points: 0
      };
    });

    // Calcular estadísticas desde los partidos
    matches.forEach(match => {
      if (match.status === 'completed' && groupTeams.includes(match.team1) && groupTeams.includes(match.team2)) {
        const team1Score = match.team1Score || 0;
        const team2Score = match.team2Score || 0;

        // Actualizar estadísticas del equipo 1
        stats[match.team1].played++;
        stats[match.team1].goalsFor += team1Score;
        stats[match.team1].goalsAgainst += team2Score;

        // Actualizar estadísticas del equipo 2
        stats[match.team2].played++;
        stats[match.team2].goalsFor += team2Score;
        stats[match.team2].goalsAgainst += team1Score;

        // Determinar resultado
        if (team1Score > team2Score) {
          stats[match.team1].won++;
          stats[match.team1].points += 3;
          stats[match.team2].lost++;
        } else if (team1Score < team2Score) {
          stats[match.team2].won++;
          stats[match.team2].points += 3;
          stats[match.team1].lost++;
        } else {
          stats[match.team1].drawn++;
          stats[match.team2].drawn++;
          stats[match.team1].points += 1;
          stats[match.team2].points += 1;
        }
      }
    });

    // Calcular diferencia de goles
    Object.values(stats).forEach(stat => {
      stat.goalDifference = stat.goalsFor - stat.goalsAgainst;
    });

    // Ordenar por puntos, diferencia de goles, goles a favor
    return Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  };

  // Obtener estadísticas detalladas de un equipo
  const getTeamDetailedStats = (teamId) => {
    const teamMatches = matches.filter(m => m.team1 === teamId || m.team2 === teamId);
    
    // Partidos completados y pendientes
    const completedMatches = teamMatches.filter(m => m.status === 'completed');
    const pendingMatches = teamMatches.filter(m => m.status === 'pending');
    
    // Goleadores del equipo
    const scorersMap = {};
    completedMatches.forEach(match => {
      const isTeam1 = match.team1 === teamId;
      const scorers = isTeam1 ? match.team1Scorers : match.team2Scorers;
      
      if (scorers && Array.isArray(scorers) && scorers.length > 0) {
        scorers.forEach((scorer) => {
          const key = (scorer.playerId || scorer.playerName || '').toString().trim().toLowerCase();
          const displayName = scorer.playerName || scorer.playerId;
          
          if (key) {
            if (!scorersMap[key]) {
              scorersMap[key] = {
                playerId: scorer.playerId || scorer.playerName,
                playerName: displayName,
                goals: 0
              };
            }
            scorersMap[key].goals++;
          }
        });
      }
    });
    
    const topScorers = Object.values(scorersMap).sort((a, b) => b.goals - a.goals);
    
    // Goles recibidos por partido
    const goalsReceived = completedMatches.map(match => {
      const isTeam1 = match.team1 === teamId;
      return {
        opponent: isTeam1 ? match.team2 : match.team1,
        goals: isTeam1 ? (match.team2Score || 0) : (match.team1Score || 0),
        round: match.round,
        groupName: match.groupName
      };
    });
    
    // Tarjetas del equipo
    const cardsMap = {};
    completedMatches.forEach(match => {
      const isTeam1 = match.team1 === teamId;
      const cards = isTeam1 ? match.team1Cards : match.team2Cards;
      
      if (cards && cards.length > 0) {
        cards.forEach(card => {
          if (card.playerId) {
            if (!cardsMap[card.playerId]) {
              cardsMap[card.playerId] = {
                playerId: card.playerId,
                playerName: card.playerName,
                yellow: 0,
                red: 0,
                blue: 0
              };
            }
            if (card.cardType === 'yellow') cardsMap[card.playerId].yellow++;
            if (card.cardType === 'red') cardsMap[card.playerId].red++;
            if (card.cardType === 'blue') cardsMap[card.playerId].blue++;
          }
        });
      }
    });
    
    const playerCards = Object.values(cardsMap);
    
    return {
      completedMatches,
      pendingMatches,
      topScorers,
      goalsReceived,
      playerCards
    };
  };

  const handleTeamClick = (teamId) => {
    const stats = getTeamDetailedStats(teamId);
    setSelectedTeamStats({ teamId, ...stats });
    setShowTeamStatsModal(true);
  };

  const availableTeams = teams.filter(t => !currentTournament.teams.includes(t.id));

  // Validación de seguridad
  if (!currentTournament) {
    return (
      <div className="tournament-detail">
        <button className="back-button" onClick={onBack}>← Volver</button>
        <p>Cargando torneo...</p>
      </div>
    );
  }

  return (
    <div className="tournament-detail">
      <div style={{ overflow: 'auto', marginBottom: '20px' }}>
        <button className="back-button" onClick={onBack}>← Volver</button>
      </div>
      
      {!isEditing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <h2 className="section-title" style={{ margin: 0, paddingBottom: 0, border: 'none' }}>
            🏆 {currentTournament.name}
          </h2>
          <span className={`status-badge-inline ${currentTournament.status}`}>
            {currentTournament.status === 'pending' ? '⏳ Pendiente' : 
             currentTournament.status === 'in-progress' ? '🔥 En Curso' : '🏆 Finalizado'}
          </span>
        </div>
      )}
      
      <div className="tournament-header">
        {isEditing ? (
          <div className="edit-tournament">
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea' }}>✏️ Editar nombre del torneo</h3>
            <input 
              type="text" 
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="edit-input"
            />
            <button className="save-button" onClick={handleUpdateTournament} title="Guardar cambios">✅</button>
            <button className="cancel-button" onClick={() => {
              setIsEditing(false);
              setEditedName(currentTournament.name);
            }} title="Cancelar edición">⛔</button>
          </div>
        ) : (
          <div className="tournament-title">
            <button className="edit-button" onClick={() => setIsEditing(true)}>✏️ Editar</button>
          </div>
        )}
      </div>

      {/* Tabs para torneos en curso */}
      {currentTournament.status === 'in-progress' && (
        <div className="tournament-tabs">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 Información del Torneo
          </button>
          <button 
            className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            ⚽ Partidos
          </button>
          <button 
            className={`tab-button ${activeTab === 'standings' ? 'active' : ''}`}
            onClick={() => setActiveTab('standings')}
          >
            🏆 Tabla de Posiciones
          </button>
        </div>
      )}

      {/* Contenido cuando el torneo está pendiente o cuando está en curso y el tab es 'info' */}
      {(currentTournament.status === 'pending' || (currentTournament.status === 'in-progress' && activeTab === 'info')) && (
        <>
      <div className="tournament-info-section">
        <div 
          className="tournament-info-header" 
          onClick={() => setShowTournamentInfo(!showTournamentInfo)}
          style={{ cursor: 'pointer' }}
        >
          <h3>
            <span style={{ marginRight: '10px' }}>{showTournamentInfo ? '🔽' : '▶️'}</span>
            📝 Información del Torneo
          </h3>
        </div>

        {showTournamentInfo && (
          <div className="tournament-info-content">
            <div className="info-form-group">
              <label>Descripción</label>
              <textarea
                placeholder="Descripción del torneo..."
                value={tournamentInfo.description}
                onChange={(e) => setTournamentInfo({...tournamentInfo, description: e.target.value})}
                rows="3"
              />
            </div>
            <div className="info-form-row">
              <div className="info-form-group">
                <label>Valor de Inscripción</label>
                <input
                  type="text"
                  placeholder="$50.000"
                  value={tournamentInfo.registrationFee}
                  onChange={(e) => setTournamentInfo({...tournamentInfo, registrationFee: e.target.value})}
                />
              </div>
              <div className="info-form-group">
                <label>Fecha de Inicio</label>
                <input
                  type="date"
                  value={tournamentInfo.startDate}
                  onChange={(e) => setTournamentInfo({...tournamentInfo, startDate: e.target.value})}
                />
              </div>
            </div>
            <div className="info-form-group">
              <label>Plan de Premios</label>
              <textarea
                placeholder="1er lugar: $500.000\n2do lugar: $300.000\n3er lugar: $150.000"
                value={tournamentInfo.prizes}
                onChange={(e) => setTournamentInfo({...tournamentInfo, prizes: e.target.value})}
                rows="3"
              />
            </div>
            <button className="save-info-btn" onClick={handleSaveTournamentInfo}>
              💾 Guardar Información
            </button>
          </div>
        )}
      </div>
      
      <div className="teams-main-section">
        <div 
          className="teams-header-section" 
          onClick={() => setShowTeamsSection(!showTeamsSection)}
          style={{ cursor: 'pointer' }}
        >
          <h3>
            <span style={{ marginRight: '10px' }}>{showTeamsSection ? '🔽' : '▶️'}</span>
            ⚽ Equipos Participantes ({currentTournament.teams.length})
          </h3>
        </div>

        {showTeamsSection && (
          <div className="teams-content">
            <div className="teams-list-vertical">
          {currentTournament.teams.map(teamId => {
            const team = teams.find(t => t.id === teamId);
            const isExpanded = expandedTeamId === teamId;
            return (
              <div key={teamId} className={`team-list-item ${isExpanded ? 'expanded' : ''}`}>
                <div 
                  className="team-list-item-header"
                  onClick={() => toggleTeamExpansion(teamId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="team-list-item-info">
                    <span className="expand-icon">{isExpanded ? '🔽' : '▶️'}</span>
                    {team && team.logo ? (
                      <img src={team.logo} alt={team.name} className="team-icon-list-logo" />
                    ) : (
                      <span className="team-icon-list">⚽</span>
                    )}
                    <h4 className="team-list-name">{getTeamName(teamId)}</h4>
                    {team && team.players && (
                      <span className="players-badge">{team.players.length} jugadores</span>
                    )}
                  </div>
                  <button 
                    className="remove-team-btn-list"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTeam(teamId);
                    }}
                    title="Eliminar equipo"
                  >
                    🗑️
                  </button>
                </div>
                
                {isExpanded && team && team.players && team.players.length > 0 && (
                  <div className="players-list-detail">
                    <div className="players-count">👥 {team.players.length} jugadores</div>
                    {team.players.map((player, index) => (
                      <div key={index} className="player-item">
                        {player.photo && (
                          <img src={player.photo} alt={player.name} className="player-item-photo" />
                        )}
                        <div className="player-item-info">
                          <div className="player-item-name">
                            {player.name}
                          </div>
                          <div className="player-item-details">
                            <span className="player-number">#{player.number}</span>
                            {player.age && <span>• {player.age} años</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {isExpanded && (!team || !team.players || team.players.length === 0) && (
                  <div className="no-players">Sin jugadores registrados</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="add-team-section">
          <select 
            value={selectedTeamId} 
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="team-select"
          >
            <option value="">Seleccionar equipo...</option>
            {availableTeams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <button onClick={handleAddTeam} className="add-team-button">➕ Agregar Equipo</button>
        </div>
          </div>
        )}
      </div>

      <div className="groups-main-section">
        <div 
          className="groups-header-section" 
          onClick={() => setShowGroupsSection(!showGroupsSection)}
          style={{ cursor: 'pointer' }}
        >
          <h3>
            <span style={{ marginRight: '10px' }}>{showGroupsSection ? '🔽' : '▶️'}</span>
            📋 Grupos del Torneo ({groups.length})
          </h3>
        </div>

        {showGroupsSection && (
          <div className="groups-section">
            <div className="create-group-section">
              <input
                type="text"
                placeholder="Nombre del grupo (ej: Grupo A)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
              <button onClick={handleCreateGroup} className="add-group-btn">
                ➕ Crear Grupo
              </button>
            </div>

              <div className="groups-list">
                {groups.map((group, groupIndex) => {
                  const isExpanded = expandedGroupIndex === groupIndex;
                  const availableTeamsForGroup = currentTournament.teams.filter(teamId => !group.teams.includes(teamId));
                  
                  return (
                  <div key={groupIndex} className="group-card-enhanced">
                    <div 
                      className="group-card-header" 
                      onClick={() => toggleGroupExpansion(groupIndex)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="group-title-section">
                        <span>{isExpanded ? '🔽' : '▶️'}</span>
                        <span className="group-icon">👥</span>
                        <h4>{group.name}</h4>
                        <span className="teams-count-badge">{group.teams.length} equipos</span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <>
                      <div className="group-body">
                        <div className="group-teams-section">
                          <h5>Equipos asignados</h5>
                          {group.teams.length === 0 ? (
                            <div className="empty-teams-box">
                              <span className="empty-icon">📭</span>
                              <p>Aún no hay equipos en este grupo</p>
                            </div>
                          ) : (
                            <div className="teams-list">
                              {group.teams.map(teamId => {
                                const team = teams.find(t => t.id === teamId);
                                return team ? (
                                  <div key={teamId} className="team-item-enhanced">
                                    <span className="team-icon">⚽</span>
                                    <span className="team-name">{team.name}</span>
                                    <button 
                                      onClick={() => handleRemoveTeamFromGroup(groupIndex, teamId)}
                                      className="remove-team-btn"
                                      title="Quitar del grupo"
                                    >
                                      ✖
                                    </button>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>

                        <div className="add-team-section">
                          <h5>Agregar equipo al grupo</h5>
                          <div className="select-team-wrapper">
                            <select 
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddTeamToGroup(groupIndex, e.target.value);
                                }
                              }}
                              className="team-select"
                            >
                              <option value="">Seleccionar equipo...</option>
                              {currentTournament.teams
                                .filter(teamId => {
                                  // Verificar que el equipo no esté en ningún grupo
                                  const isInAnyGroup = groups.some(g => g.teams.includes(teamId));
                                  return !isInAnyGroup;
                                })
                                .map(teamId => {
                                  const team = teams.find(t => t.id === teamId);
                                  return team ? (
                                    <option key={teamId} value={teamId}>{team.name}</option>
                                  ) : null;
                                })}
                            </select>
                            {availableTeamsForGroup.length === 0 && (
                              <p className="no-available-teams">Todos los equipos están asignados</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="group-card-footer">
                        <button 
                          onClick={() => handleDeleteGroup(groupIndex)}
                          className="delete-group-btn-footer"
                        >
                          🗑️ Eliminar Grupo
                        </button>
                      </div>
                      </>
                    )}
                  </div>
                  );
                })}
                
                {groups.length === 0 && (
                  <div className="empty-groups">
                    <p>No hay grupos creados. Crea tu primer grupo para organizar los equipos.</p>
                  </div>
                )}
              </div>

              <div className="groups-actions">
                <button onClick={handleSaveGroups} className="save-groups-btn">
                  💾 Guardar Grupos
                </button>
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* Contenido de partidos cuando el torneo está en curso y el tab es 'matches' */}
      {currentTournament.status === 'in-progress' && activeTab === 'matches' && matches.length > 0 && (
        <div className="matches-section">
          <h3>⚽ Partidos del Torneo</h3>
          <MatchBracket 
            matches={matches} 
            teams={teams}
            getTeamName={getTeamName}
            onUpdateMatch={handleUpdateMatch}
          />
        </div>
      )}

      {/* Contenido de tabla de posiciones cuando el tab es 'standings' */}
      {currentTournament.status === 'in-progress' && activeTab === 'standings' && (
        <div className="standings-section">
          <h3>🏆 Tabla de Posiciones</h3>
          {groups.length > 0 ? (
            <div className="standings-groups">
              {groups.map((group, index) => {
                const standings = calculateStandings(group.teams);
                return (
                  <div key={index} className="standings-group">
                    <h4 className="group-title">{group.name}</h4>
                    <div className="standings-table-wrapper">
                      <table className="standings-table">
                        <thead>
                          <tr>
                            <th className="pos-col">#</th>
                            <th className="team-col">Equipo</th>
                            <th>PJ</th>
                            <th>PG</th>
                            <th>PE</th>
                            <th>PP</th>
                            <th>GF</th>
                            <th>GC</th>
                            <th>DG</th>
                            <th className="pts-col">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((stat, pos) => {
                            const team = teams.find(t => t.id === stat.teamId);
                            return (
                              <tr 
                                key={stat.teamId} 
                                className={`${pos < 2 ? 'qualified' : ''} clickable-row`}
                                onClick={() => handleTeamClick(stat.teamId)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td className="pos-col">{pos + 1}</td>
                                <td className="team-col">
                                  <div className="team-info">
                                    {team?.logo && <img src={team.logo} alt={team.name} className="team-logo-small" />}
                                    <span>{team?.name || 'Equipo'}</span>
                                  </div>
                                </td>
                                <td>{stat.played}</td>
                                <td>{stat.won}</td>
                                <td>{stat.drawn}</td>
                                <td>{stat.lost}</td>
                                <td>{stat.goalsFor}</td>
                                <td>{stat.goalsAgainst}</td>
                                <td className={stat.goalDifference > 0 ? 'positive' : stat.goalDifference < 0 ? 'negative' : ''}>
                                  {stat.goalDifference > 0 ? '+' : ''}{stat.goalDifference}
                                </td>
                                <td className="pts-col"><strong>{stat.points}</strong></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-data">No hay grupos configurados para mostrar la tabla de posiciones.</p>
          )}
        </div>
      )}

      {/* Mostrar partidos para torneos finalizados (sin tabs) */}
      {currentTournament.status === 'completed' && matches.length > 0 && (
        <div className="matches-section">
          <h3>Partidos</h3>
          <MatchBracket 
            matches={matches} 
            teams={teams}
            getTeamName={getTeamName}
            onUpdateMatch={handleUpdateMatch}
          />
        </div>
      )}

      {currentTournament.status === 'pending' && (
        <div style={{ marginTop: '40px', padding: '20px', borderTop: '2px solid #ddd', display: 'flex', gap: '15px', justifyContent: 'center' }}>
          {currentTournament.teams.length >= 2 && (
            <button className="start-tournament-button" onClick={handleStartTournament}>
              🚀 Iniciar Torneo
            </button>
          )}
          <button className="delete-tournament-button" onClick={handleDeleteTournament}>
            🗑️ Eliminar Torneo
          </button>
        </div>
      )}

      {currentTournament.status === 'in-progress' && currentTournament.type === 'round-robin' && (
        <div style={{ marginTop: '20px', padding: '15px', display: 'flex', justifyContent: 'center' }}>
          <button className="regenerate-matches-button" onClick={handleRegenerateMatches}>
            ➕ Generar Partidos para Nuevos Equipos
          </button>
        </div>
      )}

      {/* Modal de estadísticas del equipo */}
      {showTeamStatsModal && selectedTeamStats && (
        <TeamStatsModal 
          teamId={selectedTeamStats.teamId}
          team={teams.find(t => t.id === selectedTeamStats.teamId)}
          completedMatches={selectedTeamStats.completedMatches}
          pendingMatches={selectedTeamStats.pendingMatches}
          topScorers={selectedTeamStats.topScorers}
          goalsReceived={selectedTeamStats.goalsReceived}
          playerCards={selectedTeamStats.playerCards}
          teams={teams}
          getTeamName={getTeamName}
          onClose={() => setShowTeamStatsModal(false)}
        />
      )}
    </div>
  );
}

function MatchBracket({ matches, teams, getTeamName, onUpdateMatch }) {
  // Verificar si es un torneo round-robin (tiene groupName o todos los partidos tienen round)
  const hasGroups = matches.some(m => m.groupName);
  
  if (hasGroups) {
    // Torneo por grupos - Mostrar por fecha (round) y grupo
    return <RoundRobinMatches matches={matches} teams={teams} getTeamName={getTeamName} onUpdateMatch={onUpdateMatch} />;
  } else {
    // Torneo de eliminación directa - Mostrar por ronda
    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

    return (
      <div className="match-bracket">
        {rounds.map(round => (
          <div key={round}>
            <h4>Ronda {round}</h4>
            {matches
              .filter(m => m.round === round)
              .map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  teams={teams}
                  getTeamName={getTeamName}
                  onUpdate={onUpdateMatch}
                />
              ))}
          </div>
        ))}
      </div>
    );
  }
}

function RoundRobinMatches({ matches, teams, getTeamName, onUpdateMatch }) {
  const [expandedRounds, setExpandedRounds] = useState(new Set([1])); // Fecha 1 expandida por defecto
  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
  const groups = [...new Set(matches.map(m => m.groupName))];

  const toggleRound = (round) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(round)) {
      newExpanded.delete(round);
    } else {
      newExpanded.add(round);
    }
    setExpandedRounds(newExpanded);
  };

  return (
    <div className="round-robin-container">
      {rounds.map(round => {
        const isExpanded = expandedRounds.has(round);
        return (
          <div key={round} className="round-section">
            <h3 
              className="round-title collapsible" 
              onClick={() => toggleRound(round)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ marginRight: '10px' }}>{isExpanded ? '🔽' : '▶️'}</span>
              📅 Fecha {round}
            </h3>
            
            {isExpanded && groups.map(groupName => {
              const groupMatches = matches.filter(m => m.round === round && m.groupName === groupName);
              if (groupMatches.length === 0) return null;
              
              return (
                <div key={groupName} className="group-matches-section">
                  <h4 className="group-matches-title">👥 Grupo {groupName}</h4>
                  <div className="matches-grid">
                    {groupMatches.map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        teams={teams}
                        getTeamName={getTeamName}
                        onUpdate={onUpdateMatch}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Modal para editar detalles del partido
function MatchEditModal({ match, team1Data, team2Data, onSave, onClose }) {
  // Función para consolidar goleadores (agrupar por jugador y contar cantidad)
  const consolidateScorers = (scorers) => {
    if (!scorers || scorers.length === 0) return [];
    
    const consolidated = [];
    const scorerMap = new Map();
    
    scorers.forEach(scorer => {
      const key = scorer.playerId || scorer.playerName;
      if (scorerMap.has(key)) {
        scorerMap.get(key).quantity++;
      } else {
        scorerMap.set(key, {
          playerId: scorer.playerId,
          playerName: scorer.playerName,
          quantity: 1
        });
      }
    });
    
    return Array.from(scorerMap.values());
  };

  const [score1, setScore1] = useState(match.team1Score || 0);
  const [score2, setScore2] = useState(match.team2Score || 0);
  const [team1Scorers, setTeam1Scorers] = useState(consolidateScorers(match.team1Scorers || []));
  const [team2Scorers, setTeam2Scorers] = useState(consolidateScorers(match.team2Scorers || []));
  const [team1Cards, setTeam1Cards] = useState(match.team1Cards || []);
  const [team2Cards, setTeam2Cards] = useState(match.team2Cards || []);

  const handleAddScorer = (team) => {
    if (team === 1) {
      setTeam1Scorers([...team1Scorers, { playerId: '', playerName: '', quantity: 1 }]);
    } else {
      setTeam2Scorers([...team2Scorers, { playerId: '', playerName: '', quantity: 1 }]);
    }
  };

  const handleRemoveScorer = (team, index) => {
    if (team === 1) {
      setTeam1Scorers(team1Scorers.filter((_, i) => i !== index));
    } else {
      setTeam2Scorers(team2Scorers.filter((_, i) => i !== index));
    }
  };

  const handleScorerChange = (team, index, field, value) => {
    if (team === 1) {
      const updated = [...team1Scorers];
      updated[index][field] = value;
      
      // Si seleccionó un jugador, actualizar el nombre
      if (field === 'playerId' && team1Data) {
        const player = team1Data.players.find(p => p.id === value);
        if (player) {
          updated[index].playerName = player.name;
        }
      }
      setTeam1Scorers(updated);
    } else {
      const updated = [...team2Scorers];
      updated[index][field] = value;
      
      if (field === 'playerId' && team2Data) {
        const player = team2Data.players.find(p => p.id === value);
        if (player) {
          updated[index].playerName = player.name;
        }
      }
      setTeam2Scorers(updated);
    }
  };

  const handleAddCard = (team) => {
    if (team === 1) {
      setTeam1Cards([...team1Cards, { playerId: '', playerName: '', cardType: 'yellow' }]);
    } else {
      setTeam2Cards([...team2Cards, { playerId: '', playerName: '', cardType: 'yellow' }]);
    }
  };

  const handleRemoveCard = (team, index) => {
    if (team === 1) {
      setTeam1Cards(team1Cards.filter((_, i) => i !== index));
    } else {
      setTeam2Cards(team2Cards.filter((_, i) => i !== index));
    }
  };

  const handleCardChange = (team, index, field, value) => {
    if (team === 1) {
      const updated = [...team1Cards];
      updated[index][field] = value;
      
      if (field === 'playerId' && team1Data) {
        const player = team1Data.players.find(p => (p.id || p.name) === value);
        if (player) {
          updated[index].playerName = player.name;
        }
      }
      setTeam1Cards(updated);
    } else {
      const updated = [...team2Cards];
      updated[index][field] = value;
      
      if (field === 'playerId' && team2Data) {
        const player = team2Data.players.find(p => (p.id || p.name) === value);
        if (player) {
          updated[index].playerName = player.name;
        }
      }
      setTeam2Cards(updated);
    }
  };

  const handleSubmit = () => {
    // Expandir goleadores según cantidad
    const expandScorers = (scorers) => {
      const expanded = [];
      scorers.forEach(scorer => {
        const quantity = parseInt(scorer.quantity) || 1;
        for (let i = 0; i < quantity; i++) {
          expanded.push({
            playerId: scorer.playerId,
            playerName: scorer.playerName
          });
        }
      });
      return expanded;
    };

    const matchData = {
      team1Score: parseInt(score1),
      team2Score: parseInt(score2),
      team1Scorers: expandScorers(team1Scorers),
      team2Scorers: expandScorers(team2Scorers),
      team1Cards,
      team2Cards
    };
    onSave(matchData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Resultado del Partido</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Marcador */}
          <div className="match-score-section">
            <div className="team-score-input">
              <div className="team-header">
                {team1Data?.logo && <img src={team1Data.logo} alt={team1Data.name} className="modal-team-logo" />}
                <h3>{team1Data?.name || 'Equipo 1'}</h3>
              </div>
              <input 
                type="number" 
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                min="0"
                className="modal-score-input"
              />
            </div>

            <span className="modal-vs">VS</span>

            <div className="team-score-input">
              <div className="team-header">
                {team2Data?.logo && <img src={team2Data.logo} alt={team2Data.name} className="modal-team-logo" />}
                <h3>{team2Data?.name || 'Equipo 2'}</h3>
              </div>
              <input 
                type="number" 
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                min="0"
                className="modal-score-input"
              />
            </div>
          </div>

          {/* Goleadores y Tarjetas agrupados por equipo */}
          <div className="teams-data-section">
            {/* Equipo 1 */}
            <div className="team-data-column">

              {/* Goleadores Equipo 1 */}
              <h4 className="data-section-title">⚽ Goleadores</h4>
              {team1Scorers.map((scorer, index) => (
                  <div key={index} className="data-row">
                    <select 
                      value={scorer.playerId}
                      onChange={(e) => handleScorerChange(1, index, 'playerId', e.target.value)}
                      className="player-select-compact"
                    >
                      <option value="">Jugador</option>
                      {team1Data?.players.map(player => (
                        <option key={player.id || player.name} value={player.id || player.name}>
                          #{player.number} {player.name}
                        </option>
                      ))}
                    </select>
                    <input 
                      type="number"
                      placeholder="Goles"
                      value={scorer.quantity || 1}
                      onChange={(e) => handleScorerChange(1, index, 'quantity', parseInt(e.target.value) || 1)}
                      className="quantity-input-compact"
                      min="1"
                      max="20"
                      title="Cantidad de goles"
                    />
                    <button 
                      onClick={() => handleRemoveScorer(1, index)}
                      className="remove-btn-compact"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              <button onClick={() => handleAddScorer(1)} className="add-btn-compact">
                + Gol
              </button>

              {/* Tarjetas Equipo 1 */}
              <h4 className="data-section-title">🟨🟥🟦 Tarjetas</h4>
              {team1Cards.map((card, index) => (
                  <div key={index} className="data-row">
                    <select 
                      value={card.playerId}
                      onChange={(e) => handleCardChange(1, index, 'playerId', e.target.value)}
                      className="player-select-compact"
                    >
                      <option value="">Jugador</option>
                      {team1Data?.players.map(player => (
                        <option key={player.id || player.name} value={player.id || player.name}>
                          #{player.number} {player.name}
                        </option>
                      ))}
                    </select>
                    <select 
                      value={card.cardType}
                      onChange={(e) => handleCardChange(1, index, 'cardType', e.target.value)}
                      className="card-type-select-compact"
                    >
                      <option value="yellow">🟨</option>
                      <option value="red">🟥</option>
                      <option value="blue">🟦</option>
                    </select>
                    <button 
                      onClick={() => handleRemoveCard(1, index)}
                      className="remove-btn-compact"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              <button onClick={() => handleAddCard(1)} className="add-btn-compact">
                + Tarjeta
              </button>
            </div>

            {/* Equipo 2 */}
            <div className="team-data-column">

              {/* Goleadores Equipo 2 */}
              <h4 className="data-section-title">⚽ Goleadores</h4>
              {team2Scorers.map((scorer, index) => (
                  <div key={index} className="data-row">
                    <select 
                      value={scorer.playerId}
                      onChange={(e) => handleScorerChange(2, index, 'playerId', e.target.value)}
                      className="player-select-compact"
                    >
                      <option value="">Jugador</option>
                      {team2Data?.players.map(player => (
                        <option key={player.id || player.name} value={player.id || player.name}>
                          #{player.number} {player.name}
                        </option>
                      ))}
                    </select>
                    <input 
                      type="number"
                      placeholder="Goles"
                      value={scorer.quantity || 1}
                      onChange={(e) => handleScorerChange(2, index, 'quantity', parseInt(e.target.value) || 1)}
                      className="quantity-input-compact"
                      min="1"
                      max="20"
                      title="Cantidad de goles"
                    />
                    <button 
                      onClick={() => handleRemoveScorer(2, index)}
                      className="remove-btn-compact"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              <button onClick={() => handleAddScorer(2)} className="add-btn-compact">
                + Gol
              </button>

              {/* Tarjetas Equipo 2 */}
              <h4 className="data-section-title">🟨🟥🟦 Tarjetas</h4>
              {team2Cards.map((card, index) => (
                  <div key={index} className="data-row">
                    <select 
                      value={card.playerId}
                      onChange={(e) => handleCardChange(2, index, 'playerId', e.target.value)}
                      className="player-select-compact"
                    >
                      <option value="">Jugador</option>
                      {team2Data?.players.map(player => (
                        <option key={player.id || player.name} value={player.id || player.name}>
                          #{player.number} {player.name}
                        </option>
                      ))}
                    </select>
                    <select 
                      value={card.cardType}
                      onChange={(e) => handleCardChange(2, index, 'cardType', e.target.value)}
                      className="card-type-select-compact"
                    >
                      <option value="yellow">🟨</option>
                      <option value="red">🟥</option>
                      <option value="blue">🟦</option>
                    </select>
                    <button 
                      onClick={() => handleRemoveCard(2, index)}
                      className="remove-btn-compact"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              <button onClick={() => handleAddCard(2)} className="add-btn-compact">
                + Tarjeta
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">Cancelar</button>
          <button onClick={handleSubmit} className="btn-save">Guardar Resultado</button>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, teams, getTeamName, onUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveMatch = (matchData) => {
    onUpdate(match.id, matchData);
    setIsModalOpen(false);
  };

  const canEdit = match.team1 && match.team2;
  
  const team1Data = teams.find(t => t.id === match.team1);
  const team2Data = teams.find(t => t.id === match.team2);

  return (
    <>
      <div className={`match-card-inline ${match.status === 'completed' ? 'completed' : ''}`}>
        <div className="match-inline-content">
          <div className={`team-inline ${match.winner === match.team1 ? 'winner' : ''}`}>
            {team1Data && team1Data.logo ? (
              <img src={team1Data.logo} alt={getTeamName(match.team1)} className="match-team-logo-inline" />
            ) : (
              <span className="match-team-icon-inline">⚽</span>
            )}
            <span className="team-name-inline">{getTeamName(match.team1)}</span>
            <span className="score-display">{match.team1Score !== null ? match.team1Score : '-'}</span>
          </div>
          
          <span className="vs-text">VS</span>
          
          <div className={`team-inline ${match.winner === match.team2 ? 'winner' : ''}`}>
            <span className="score-display">{match.team2Score !== null ? match.team2Score : '-'}</span>
            {team2Data && team2Data.logo ? (
              <img src={team2Data.logo} alt={getTeamName(match.team2)} className="match-team-logo-inline" />
            ) : (
              <span className="match-team-icon-inline">⚽</span>
            )}
            <span className="team-name-inline">{getTeamName(match.team2)}</span>
          </div>
        </div>
        
        {canEdit && (
          <button className="edit-match-btn" onClick={handleOpenModal} title="Editar resultado">
            ✏️
          </button>
        )}
      </div>

      {isModalOpen && (
        <MatchEditModal
          match={match}
          team1Data={team1Data}
          team2Data={team2Data}
          onSave={handleSaveMatch}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

// Modal de estadísticas del equipo
function TeamStatsModal({ teamId, team, completedMatches, pendingMatches, topScorers, goalsReceived, playerCards, teams, getTeamName, onClose }) {
  const [activeStatsTab, setActiveStatsTab] = useState('matches');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content team-stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {team?.logo && <img src={team.logo} alt={team.name} className="modal-team-logo" />}
            <h2>Estadísticas de {team?.name || 'Equipo'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="team-stats-tabs">
          <button 
            className={`stats-tab-btn ${activeStatsTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveStatsTab('matches')}
          >
            ⚽ Partidos
          </button>
          <button 
            className={`stats-tab-btn ${activeStatsTab === 'scorers' ? 'active' : ''}`}
            onClick={() => setActiveStatsTab('scorers')}
          >
            🎯 Goleadores
          </button>
          <button 
            className={`stats-tab-btn ${activeStatsTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveStatsTab('cards')}
          >
            🟨 Tarjetas
          </button>
          <button 
            className={`stats-tab-btn ${activeStatsTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveStatsTab('players')}
          >
            👥 Jugadores
          </button>
        </div>

        <div className="modal-body team-stats-body">
          {activeStatsTab === 'matches' && (
            <div className="stats-matches">
              <div className="matches-group">
                <h3>✅ Partidos Jugados ({completedMatches.length})</h3>
                {completedMatches.length > 0 ? (
                  <div className="stats-matches-list">
                    {completedMatches.map((match, index) => {
                      const isTeam1 = match.team1 === teamId;
                      const opponent = isTeam1 ? match.team2 : match.team1;
                      const teamScore = isTeam1 ? match.team1Score : match.team2Score;
                      const opponentScore = isTeam1 ? match.team2Score : match.team1Score;
                      const result = teamScore > opponentScore ? 'won' : teamScore < opponentScore ? 'lost' : 'draw';
                      
                      return (
                        <div key={index} className={`stats-match-card ${result}`}>
                          <div className="match-info-header">
                            <span className="match-round">{match.groupName} - Fecha {match.round}</span>
                            <span className={`match-result-badge ${result}`}>
                              {result === 'won' ? 'Victoria' : result === 'lost' ? 'Derrota' : 'Empate'}
                            </span>
                          </div>
                          <div className="match-score-display">
                            <span className="team-name-display">{team?.name}</span>
                            <span className="score-display">
                              <span className={result === 'won' ? 'score-win' : result === 'lost' ? 'score-lose' : ''}>
                                {teamScore}
                              </span>
                              <span className="vs-text">-</span>
                              <span className={result === 'lost' ? 'score-win' : result === 'won' ? 'score-lose' : ''}>
                                {opponentScore}
                              </span>
                            </span>
                            <span className="team-name-display">{getTeamName(opponent)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-data-small">No hay partidos jugados aún.</p>
                )}
              </div>

              <div className="matches-group">
                <h3>⏳ Partidos Pendientes ({pendingMatches.length})</h3>
                {pendingMatches.length > 0 ? (
                  <div className="stats-matches-list">
                    {pendingMatches.map((match, index) => {
                      const isTeam1 = match.team1 === teamId;
                      const opponent = isTeam1 ? match.team2 : match.team1;
                      
                      return (
                        <div key={index} className="stats-match-card pending">
                          <div className="match-info-header">
                            <span className="match-round">{match.groupName} - Fecha {match.round}</span>
                            <span className="match-result-badge pending">Pendiente</span>
                          </div>
                          <div className="match-score-display">
                            <span className="team-name-display">{team?.name}</span>
                            <span className="vs-text">VS</span>
                            <span className="team-name-display">{getTeamName(opponent)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-data-small">No hay partidos pendientes.</p>
                )}
              </div>
            </div>
          )}

          {activeStatsTab === 'scorers' && (
            <div className="stats-scorers">
              <h3>🎯 Tabla de Goleadores</h3>
              {topScorers.length > 0 ? (
                <div className="scorers-table-wrapper">
                  <table className="scorers-table">
                    <thead>
                      <tr>
                        <th className="rank-col">#</th>
                        <th className="player-col">Jugador</th>
                        <th className="goals-col">Goles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topScorers.map((scorer, index) => {
                        const player = team?.players?.find(p => (p.id || p.name) === scorer.playerId);
                        return (
                          <tr key={scorer.playerId}>
                            <td className="rank-col">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </td>
                            <td className="player-col">
                              <div className="player-info-row">
                                {player?.photo && (
                                  <img src={player.photo} alt={player.name} className="player-photo-small" />
                                )}
                                <div className="player-details">
                                  <span className="player-name">{player?.name || scorer.playerName}</span>
                                  {player?.number && <span className="player-number-badge">#{player.number}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="goals-col"><strong>{scorer.goals}</strong></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data-small">No hay goleadores registrados.</p>
              )}
            </div>
          )}

          {activeStatsTab === 'cards' && (
            <div className="stats-cards">
              <h3>🟨🟥🟦 Tarjetas</h3>
              {playerCards.length > 0 ? (
                <div className="cards-table-wrapper">
                  <table className="cards-table">
                    <thead>
                      <tr>
                        <th className="player-col">Jugador</th>
                        <th className="card-col">🟨</th>
                        <th className="card-col">🟥</th>
                        <th className="card-col">🟦</th>
                        <th className="total-col">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerCards.map((card) => {
                        const player = team?.players?.find(p => (p.id || p.name) === card.playerId);
                        return (
                          <tr key={card.playerId}>
                            <td className="player-col">
                              <div className="player-info-row">
                                {player?.photo && (
                                  <img src={player.photo} alt={player.name} className="player-photo-small" />
                                )}
                                <div className="player-details">
                                  <span className="player-name">{player?.name || card.playerName}</span>
                                  {player?.number && <span className="player-number-badge">#{player.number}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="card-col">{card.yellow > 0 ? card.yellow : '-'}</td>
                            <td className="card-col">{card.red > 0 ? card.red : '-'}</td>
                            <td className="card-col">{card.blue > 0 ? card.blue : '-'}</td>
                            <td className="total-col"><strong>{card.yellow + card.red + card.blue}</strong></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data-small">No hay tarjetas registradas.</p>
              )}
            </div>
          )}

          {activeStatsTab === 'players' && (
            <div className="stats-players">
              <h3>👥 Plantilla del Equipo ({team?.players?.length || 0})</h3>
              {team?.players && team.players.length > 0 ? (
                <div className="players-list-stats">
                  {team.players.map((player, index) => (
                    <div key={index} className="player-list-item-stats">
                      <div className="player-list-photo">
                        {player.photo ? (
                          <img src={player.photo} alt={player.name} className="player-photo-list" />
                        ) : (
                          <div className="player-photo-placeholder-list">👤</div>
                        )}
                      </div>
                      <div className="player-list-info">
                        <h4 className="player-list-name">{player.name}</h4>
                        <p className="player-list-position">{player.position || 'Posición no definida'}</p>
                      </div>
                      <div className="player-list-number">#{player.number}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data-small">No hay jugadores registrados en este equipo.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TournamentDetail;
