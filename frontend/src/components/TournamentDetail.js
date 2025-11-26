import React, { useState, useEffect } from 'react';
import CreateTeam from './CreateTeam';

// URL del backend - forzar /api al final
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : 'https://tournament-backend-x9nj.onrender.com';
const API_URL = `${API_BASE}/api`;

// Función para formatear valores monetarios
const formatCurrency = (value) => {
  if (!value) return '';
  // Eliminar todo excepto números
  const numbers = value.toString().replace(/\D/g, '');
  if (!numbers) return '';
  // Formatear con separadores de miles
  const formatted = Number(numbers).toLocaleString('es-CO');
  return `$ ${formatted}`;
};

// Función para extraer números de un valor formateado
const parseCurrency = (value) => {
  if (!value) return '';
  return value.toString().replace(/\D/g, '');
};

function TournamentDetail({ tournament, teams, onBack, onUpdate, authenticatedFetch }) {
  // Estados del componente
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
  const [activeTab, setActiveTab] = useState(
    (tournament.status === 'in-progress' || tournament.status === 'active') ? 'matches' : 'info'
  ); // 'info', 'matches', o 'standings'
  const [selectedTeamStats, setSelectedTeamStats] = useState(null);
  const [showTeamStatsModal, setShowTeamStatsModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [tournamentInfo, setTournamentInfo] = useState({
    description: tournament.description || '',
    registrationFee: tournament.registrationFee || '',
    startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
    prizes: tournament.prizes || ''
  });
  const [registrationFeeDisplay, setRegistrationFeeDisplay] = useState(
    tournament.registrationFee ? formatCurrency(tournament.registrationFee) : ''
  );
  
  // Estados para manejo de rondas
  const [showCreateRoundModal, setShowCreateRoundModal] = useState(false);
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundMatchCount, setNewRoundMatchCount] = useState(1);
  const [newRoundMatches, setNewRoundMatches] = useState([]);
  const [expandedRounds, setExpandedRounds] = useState(new Set([1])); // Ronda 1 expandida por defecto
  
  // Estados para ganadores
  const [winners, setWinners] = useState(tournament.winners || []);
  const [showAddWinnerModal, setShowAddWinnerModal] = useState(false);
  const [newWinner, setNewWinner] = useState({ position: 1, teamId: '', prize: '' });
  const [prizeInputValue, setPrizeInputValue] = useState('');

  // Crear equipo y asociar al torneo
  const handleCreateTeam = async (name, players, logo, tournamentId) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/teams`, {
        method: 'POST',
        body: JSON.stringify({ name, players, logo, tournamentId })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el equipo');
      }
      const newTeam = await response.json();
      // Actualizar torneo
      const tournamentRes = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`);
      const updatedTournament = await tournamentRes.json();
      setCurrentTournament(updatedTournament);
      alert('Equipo creado y asociado al torneo');
    } catch (error) {
      console.error('Error creando equipo:', error);
      alert(error.message || 'Error al crear el equipo');
    }
  };
  
  // Declarar variables globales para el componente
  // Si currentTournament.teams contiene solo IDs, poblar con objetos completos
  let tournamentTeams = [];
  if (currentTournament.teams && currentTournament.teams.length > 0) {
    if (typeof currentTournament.teams[0] === 'object' && currentTournament.teams[0].name) {
      tournamentTeams = currentTournament.teams;
    } else {
      const tournamentTeamIds = currentTournament.teams.map(t => t._id || t.id || t);
      tournamentTeams = teams.filter(t => tournamentTeamIds.includes(t._id || t.id));
    }
  }

  // Sincronizar cuando cambia el prop tournament (al entrar/volver a entrar)
  useEffect(() => {
    if (tournament) {
      setCurrentTournament(prev => {
        // Si ya tenemos un torneo cargado con el mismo ID, solo actualizar campos específicos
        if (prev && (prev._id || prev.id) === (tournament._id || tournament.id)) {
          return {
            ...prev,
            ...tournament
          };
        }
        // Si es un torneo diferente o primera carga, reemplazar todo
        return { ...tournament };
      });
      
      setGroups(tournament.groups || []);
      
      // Solo resetear tournamentInfo si es un torneo diferente
      setTournamentInfo(prev => {
        const isSameTournament = currentTournament && 
          (currentTournament._id || currentTournament.id) === (tournament._id || tournament.id);
        
        if (isSameTournament) {
          return prev; // Mantener los valores actuales
        }
        
        return {
          description: tournament.description || '',
          registrationFee: tournament.registrationFee || '',
          startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
          prizes: tournament.prizes || ''
        };
      });
      
      // Solo actualizar registrationFeeDisplay si cambió
      if (tournament.registrationFee && tournament.registrationFee !== currentTournament?.registrationFee) {
        setRegistrationFeeDisplay(formatCurrency(tournament.registrationFee));
      }
      
      // Solo resetear matches si es un torneo diferente
      const isSameTournament = currentTournament && 
        (currentTournament._id || currentTournament.id) === (tournament._id || tournament.id);
      if (!isSameTournament) {
        setMatches([]);
      }
    }
  }, [tournament]);

  // Actualizar tournamentTeams cada vez que cambian los equipos del torneo

  useEffect(() => {
    // Forzar re-render cuando cambian los equipos del torneo
    setCurrentTournament(prev => ({ ...prev, teams: tournamentTeams }));
  }, [tournamentTeams.length]);

  useEffect(() => {
    if (currentTournament && currentTournament.status !== 'pending' && currentTournament.status !== 'upcoming') {
      fetchMatches();
    }
  }, [currentTournament?.status]);

  // Actualizar expandedRounds cuando cambien los matches
  useEffect(() => {
    if (matches.length > 0) {
      const rounds = [...new Set(matches.map(m => m.round))];
      const customRounds = rounds.filter(r => !String(r).includes('Jornada'));
      
      if (customRounds.length > 0) {
        // Ordenar descendentemente y tomar la primera (más reciente)
        customRounds.sort((a, b) => {
          const numA = typeof a === 'string' ? (parseInt(a) || 0) : a;
          const numB = typeof b === 'string' ? (parseInt(b) || 0) : b;
          return numB - numA;
        });
        
        const latestRound = customRounds[0];
        const parsedRound = typeof latestRound === 'string' ? parseInt(latestRound) : latestRound;
        const normalizedRound = !isNaN(parsedRound) ? parsedRound : latestRound;
        
        setExpandedRounds(new Set([normalizedRound]));
      }
    }
  }, [matches.length]);

  const fetchMatches = async () => {
    if (!currentTournament) return;
    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}/matches`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const handleAddTeam = async () => {
    if (!selectedTeamId) return;
    if (!currentTournament) return;
    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ teamId: selectedTeamId })
      });
      // Consultar solo el torneo actualizado
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`);
      const updatedTournament = await response.json();
      setCurrentTournament(updatedTournament);
      setSelectedTeamId('');
      onUpdate(tournamentId); // Pasar el ID del torneo para actualización específica
    } catch (error) {
      console.error('Error adding team:', error);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    if (!currentTournament) return;
    // Verificar si el equipo está en algún grupo
    const teamInGroups = groups.some(group => group.teams?.includes(teamId));
    if (teamInGroups) {
      const teamName = getTeamName(teamId);
      alert(`No se puede eliminar el equipo "${teamName}" porque está asignado a uno o más grupos. Por favor, quítalo de los grupos primero.`);
      return;
    }
    if (!window.confirm('¿Estás seguro de eliminar este equipo del torneo?')) return;
    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}/teams/${teamId}`, {
        method: 'DELETE'
      });
      // Fetch torneo actualizado con equipos poblados
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`);
      const updatedTournament = await response.json();
      setCurrentTournament(updatedTournament);
      onUpdate(tournamentId); // Pasar el ID del torneo para actualización específica
    } catch (error) {
      console.error('Error removing team:', error);
    }
  };

  const handleUpdateTournament = async () => {
    if (!currentTournament) return;
    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editedName })
      });
      const updatedTournament = await response.json();
      
      // Actualizar el estado local
      setCurrentTournament(updatedTournament);
      setIsEditing(false);
      
      // Actualizar el torneo en el componente padre con el ID específico
      onUpdate(tournamentId);
    } catch (error) {
      console.error('Error updating tournament:', error);
      alert('Error al actualizar el torneo');
    }
  };

  const handleFinishTournament = async () => {
    if (!currentTournament) return;
    
    if (!window.confirm('¿Estás seguro de que deseas finalizar este torneo? No podrás agregar más información después de finalizarlo.')) {
      return;
    }
    
    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      });
      const updatedTournament = await response.json();
      
      
      // Actualizar el estado local
      setCurrentTournament(updatedTournament);
      
      // Actualizar el torneo en el componente padre
      onUpdate(tournamentId);
      
      alert('Torneo finalizado exitosamente');
    } catch (error) {
      console.error('Error finalizando torneo:', error);
      alert('Error al finalizar el torneo');
    }
  };

  const handleSaveTournamentInfo = async () => {
    if (!currentTournament) return;
    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify(tournamentInfo)
      });
      const updatedTournament = await response.json();
      setCurrentTournament(updatedTournament);
      setTournamentInfo({
        description: updatedTournament.description || '',
        registrationFee: updatedTournament.registrationFee || '',
        startDate: updatedTournament.startDate ? new Date(updatedTournament.startDate).toISOString().split('T')[0] : '',
        prizes: updatedTournament.prizes || ''
      });
      onUpdate(tournamentId); // Pasar el ID del torneo para actualización específica
      alert('Información del torneo guardada exitosamente');
    } catch (error) {
      console.error('Error saving tournament info:', error);
      alert('Error al guardar la información del torneo');
    }
  };

  const handleDeleteTournament = async () => {
    if (!currentTournament) return;
    if (!window.confirm('¿Estás seguro de eliminar este torneo? Esta acción no se puede deshacer.')) return;

    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'DELETE'
      });
      onUpdate();
      onBack();
    } catch (error) {
      console.error('Error deleting tournament:', error);
    }
  };

  const handleStartTournament = async () => {
    if (!currentTournament) return;
    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}/start`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar el torneo');
      }
      
      const data = await response.json();
      
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
    if (!currentTournament) return;
    if (!window.confirm('¿Deseas generar partidos para los nuevos equipos/grupos? Los partidos existentes se mantendrán.')) {
      return;
    }

    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}/regenerate-matches`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al regenerar partidos');
      }
      
      const data = await response.json();
      
      alert(data.message);
      fetchMatches(); // Recargar la lista de partidos
    } catch (error) {
      console.error('Error regenerating matches:', error);
      alert(error.message || 'Error al regenerar partidos.');
    }
  };

  const handleUpdateMatch = async (matchId, matchData) => {
    try {
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
    const team = teams.find(t => (t._id || t.id) === teamId);
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
    if (!updatedGroups[groupIndex].teams?.includes(teamId)) {
      if (!updatedGroups[groupIndex].teams) {
        updatedGroups[groupIndex].teams = [];
      }
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

  // Funciones para manejo de rondas personalizadas
  const handleOpenCreateRoundModal = () => {
    setNewRoundName('');
    setNewRoundMatchCount(1);
    // Inicializar con un partido vacío por defecto
    setNewRoundMatches([{
      id: `temp-${Date.now()}-0`,
      team1: '',
      team2: ''
    }]);
    setShowCreateRoundModal(true);
  };

  const handleRoundMatchCountChange = (count) => {
    const matchCount = parseInt(count) || 1;
    setNewRoundMatchCount(matchCount);
    
    // Crear array de partidos vacíos
    const emptyMatches = Array(matchCount).fill(null).map((_, index) => ({
      id: `temp-${Date.now()}-${index}`,
      team1: '',
      team2: ''
    }));
    setNewRoundMatches(emptyMatches);
  };

  const handleRoundMatchChange = (index, field, value) => {
    const updated = [...newRoundMatches];
    updated[index][field] = value;
    setNewRoundMatches(updated);
  };

  const handleCreateRound = async () => {

    if (!newRoundName.trim()) {
      alert('Por favor ingresa un nombre para la ronda');
      return;
    }

    // Validar que todos los partidos tengan ambos equipos seleccionados
    const invalidMatches = newRoundMatches.filter(m => !m.team1 || !m.team2);
    if (invalidMatches.length > 0) {
      alert('Por favor selecciona ambos equipos para todos los partidos');
      return;
    }

    // Validar que no haya equipos duplicados en el mismo partido
    const selfMatches = newRoundMatches.filter(m => m.team1 === m.team2);
    if (selfMatches.length > 0) {
      alert('Un equipo no puede jugar contra sí mismo');
      return;
    }

    try {
      // Obtener el número de ronda más alto actual
      // Los matches pueden tener round como número o string
      let maxRound = 0;
      if (matches.length > 0) {
        matches.forEach(m => {
          const roundNum = typeof m.round === 'number' ? m.round : parseInt(m.round) || 0;
          if (roundNum > maxRound) {
            maxRound = roundNum;
          }
        });
      }
      const nextRound = maxRound + 1;

      // Crear los partidos en el backend
      const createdMatches = [];
      for (const match of newRoundMatches) {
        const matchData = {
          tournamentId: currentTournament._id || currentTournament.id,
          team1: match.team1,
          team2: match.team2,
          round: nextRound,
          roundName: newRoundName,
          status: 'pending',
          team1Score: null,
          team2Score: null
        };

        const response = await authenticatedFetch(`${API_URL}/matches`, {
          method: 'POST',
          body: JSON.stringify(matchData)
        });

        if (response.ok) {
          const createdMatch = await response.json();
          createdMatches.push(createdMatch);
        } else {
          console.error('Error al crear partido:', await response.text());
        }
      }

      // Cerrar modal primero
      setShowCreateRoundModal(false);
      setNewRoundName('');
      setNewRoundMatchCount(1);
      setNewRoundMatches([]);

      // Actualizar la lista de partidos después de cerrar el modal
      await fetchMatches();
      
      // Colapsar todas las rondas y expandir solo la nueva
      // Usar setTimeout para asegurar que el estado de matches se haya actualizado
      setTimeout(() => {
        setExpandedRounds(new Set([nextRound]));
      }, 100);
      
      alert(`Ronda "${newRoundName}" creada exitosamente con ${createdMatches.length} partidos`);
    } catch (error) {
      console.error('Error creando ronda:', error);
      alert('Error al crear la ronda: ' + error.message);
    }
  };

  // Funciones para manejar ganadores
  const handleAddWinner = () => {
    if (!newWinner.teamId || !newWinner.position || isNaN(newWinner.position)) {
      alert('Por favor selecciona un equipo y una posición válida');
      return;
    }

    // Asegurar que position es un número válido
    const winnerToAdd = {
      ...newWinner,
      position: parseInt(newWinner.position) || 1
    };

    const updatedWinners = [...winners, winnerToAdd];
    setWinners(updatedWinners);
    saveWinners(updatedWinners);
    setNewWinner({ position: 1, teamId: '', prize: '' });
    setPrizeInputValue('');
    setShowAddWinnerModal(false);
  };

  const handleRemoveWinner = (index) => {
    const updatedWinners = winners.filter((_, i) => i !== index);
    setWinners(updatedWinners);
    saveWinners(updatedWinners);
  };

  const saveWinners = async (winnersData) => {
    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify({ winners: winnersData })
      });
      onUpdate();
    } catch (error) {
      console.error('Error guardando ganadores:', error);
      alert('Error al guardar los ganadores');
    }
  };

  // Función para eliminar una ronda completa
  const handleDeleteRound = async (round) => {
    const roundMatches = matches.filter(m => m.round === round);
    const roundName = (roundMatches[0]?.roundName && roundMatches[0]?.roundName.trim()) || `Ronda ${round}`;
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la ronda "${roundName}" con ${roundMatches.length} partido(s)?`)) {
      return;
    }

    try {
      // Eliminar todos los partidos de esta ronda
      const deletePromises = roundMatches.map(match => 
        authenticatedFetch(`${API_URL}/matches/${match.id}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(deletePromises);
      
      // Actualizar la lista de partidos
      await fetchMatches();
      
      alert(`Ronda "${roundName}" eliminada exitosamente`);
    } catch (error) {
      console.error('Error eliminando ronda:', error);
      alert('Error al eliminar la ronda: ' + error.message);
    }
  };

  const handleSaveGroups = async () => {
    if (!currentTournament) return;
    try {
      const tournamentId = currentTournament._id || currentTournament.id;
      if (!tournamentId) return;
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify({ groups })
      });
      const updatedTournament = await response.json();
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
      const matchTeam1 = match.team1?._id || match.team1;
      const matchTeam2 = match.team2?._id || match.team2;
      
      // Aceptar tanto 'completed' como 'finished' como estados válidos
      const isCompleted = match.status === 'completed' || match.status === 'finished';
      
      // Solo contar partidos de la fase de grupos (Jornadas), no rondas personalizadas (Cuartos, Semifinal, etc.)
      const isGroupStageMatch = match.round && String(match.round).includes('Jornada');
      
      if (isCompleted && isGroupStageMatch && groupTeams.includes(matchTeam1) && groupTeams.includes(matchTeam2)) {
        const team1Score = match.team1Score || 0;
        const team2Score = match.team2Score || 0;

        // Actualizar estadísticas del equipo 1
        stats[matchTeam1].played++;
        stats[matchTeam1].goalsFor += team1Score;
        stats[matchTeam1].goalsAgainst += team2Score;

        // Actualizar estadísticas del equipo 2
        stats[matchTeam2].played++;
        stats[matchTeam2].goalsFor += team2Score;
        stats[matchTeam2].goalsAgainst += team1Score;

        // Determinar resultado
        if (team1Score > team2Score) {
          stats[matchTeam1].won++;
          stats[matchTeam1].points += 3;
          stats[matchTeam2].lost++;
        } else if (team1Score < team2Score) {
          stats[matchTeam2].won++;
          stats[matchTeam2].points += 3;
          stats[matchTeam1].lost++;
        } else {
          stats[matchTeam1].drawn++;
          stats[matchTeam2].drawn++;
          stats[matchTeam1].points += 1;
          stats[matchTeam2].points += 1;
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
    
    const teamMatches = matches.filter(m => {
      const matchTeam1 = m.team1?._id || m.team1?.id || m.team1;
      const matchTeam2 = m.team2?._id || m.team2?.id || m.team2;
      return matchTeam1 === teamId || matchTeam2 === teamId;
    });
    
    
    // Partidos completados y pendientes
    const completedMatches = teamMatches.filter(m => m.status === 'completed' || m.status === 'finished');
    const pendingMatches = teamMatches.filter(m => m.status === 'pending' || m.status === 'scheduled');
    
    
    
    // Goleadores del equipo
    const scorersMap = {};
    completedMatches.forEach(match => {
      const matchTeam1 = match.team1?._id || match.team1?.id || match.team1;
      const isTeam1 = matchTeam1 === teamId;
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
      const matchTeam1 = match.team1?._id || match.team1?.id || match.team1;
      const matchTeam2 = match.team2?._id || match.team2?.id || match.team2;
      const isTeam1 = matchTeam1 === teamId;
      return {
        opponent: isTeam1 ? matchTeam2 : matchTeam1,
        goals: isTeam1 ? (match.team2Score || 0) : (match.team1Score || 0),
        round: match.round,
        groupName: match.groupName
      };
    });
    
    // Tarjetas del equipo
    const cardsMap = {};
    completedMatches.forEach(match => {
      const matchTeam1 = match.team1?._id || match.team1?.id || match.team1;
      const isTeam1 = matchTeam1 === teamId;
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

  // Calcular goleadores del torneo
  const calculateTopScorers = () => {
    const scorersMap = {};
    
    matches.forEach(match => {
      if (match.status === 'completed' || match.status === 'finished') {
        // Procesar goleadores del equipo 1
        if (match.team1Scorers && Array.isArray(match.team1Scorers)) {
          match.team1Scorers.forEach(scorer => {
            const key = (scorer.playerId || scorer.playerName || '').toString().trim().toLowerCase();
            const displayName = scorer.playerName || scorer.playerId;
            
            if (key) {
              if (!scorersMap[key]) {
                const team = teams.find(t => (t._id || t.id) === (match.team1?._id || match.team1?.id || match.team1));
                
                
                // Buscar la foto del jugador en el equipo
                // El playerId puede contener el nombre del jugador o un ID real
                const searchName = scorer.playerName || scorer.playerId;
                const normalizedSearchName = searchName?.toLowerCase().trim();
                
                const player = team?.players?.find(p => {
                  const normalizedPlayerName = p.name?.toLowerCase().trim();
                  
                  // Comparar por nombre
                  if (normalizedPlayerName === normalizedSearchName) {
                    return true;
                  }
                  
                  // Comparar por ID si existe y no es un nombre
                  if (scorer.playerId && (p._id === scorer.playerId || p.id === scorer.playerId)) {
                    return true;
                  }
                  
                  return false;
                });
                
                
                scorersMap[key] = {
                  playerId: scorer.playerId || scorer.playerName,
                  playerName: displayName,
                  teamName: team?.name || 'Desconocido',
                  photo: player?.photo || null,
                  goals: 0
                };
              }
              scorersMap[key].goals++;
            }
          });
        }
        
        // Procesar goleadores del equipo 2
        if (match.team2Scorers && Array.isArray(match.team2Scorers)) {
          match.team2Scorers.forEach(scorer => {
            const key = (scorer.playerId || scorer.playerName || '').toString().trim().toLowerCase();
            const displayName = scorer.playerName || scorer.playerId;
            
            if (key) {
              if (!scorersMap[key]) {
                const team = teams.find(t => (t._id || t.id) === (match.team2?._id || match.team2?.id || match.team2));
                
                
                // Buscar la foto del jugador en el equipo
                // El playerId puede contener el nombre del jugador o un ID real
                const searchName = scorer.playerName || scorer.playerId;
                const normalizedSearchName = searchName?.toLowerCase().trim();
                
                const player = team?.players?.find(p => {
                  const normalizedPlayerName = p.name?.toLowerCase().trim();
                  
                  // Comparar por nombre
                  if (normalizedPlayerName === normalizedSearchName) {
                    return true;
                  }
                  
                  // Comparar por ID si existe y no es un nombre
                  if (scorer.playerId && (p._id === scorer.playerId || p.id === scorer.playerId)) {
                    return true;
                  }
                  
                  return false;
                });
                
                
                scorersMap[key] = {
                  playerId: scorer.playerId || scorer.playerName,
                  playerName: displayName,
                  teamName: team?.name || 'Desconocido',
                  photo: player?.photo || null,
                  goals: 0
                };
              }
              scorersMap[key].goals++;
            }
          });
        }
      }
    });
    
    const result = Object.values(scorersMap).sort((a, b) => b.goals - a.goals).slice(0, 20);
    return result;
  };

  // Calcular valla menos vencida
  const calculateGoalkeepers = () => {
    const teamsStats = {};
    
    // Inicializar estadísticas para todos los equipos del torneo
    tournamentTeams.forEach(team => {
      const teamId = team._id || team.id;
      teamsStats[teamId] = {
        teamId,
        teamName: team.name,
        logo: team.logo,
        matchesPlayed: 0,
        goalsAgainst: 0,
        average: 0
      };
    });
    
    // Calcular goles en contra de partidos completados
    matches.forEach(match => {
      if (match.status === 'completed' || match.status === 'finished') {
        const team1Id = match.team1?._id || match.team1?.id || match.team1;
        const team2Id = match.team2?._id || match.team2?.id || match.team2;
        const score1 = match.team1Score || 0;
        const score2 = match.team2Score || 0;
        
        // Actualizar estadísticas del equipo 1
        if (teamsStats[team1Id]) {
          teamsStats[team1Id].matchesPlayed++;
          teamsStats[team1Id].goalsAgainst += score2;
        }
        
        // Actualizar estadísticas del equipo 2
        if (teamsStats[team2Id]) {
          teamsStats[team2Id].matchesPlayed++;
          teamsStats[team2Id].goalsAgainst += score1;
        }
      }
    });
    
    // Calcular promedio y filtrar equipos que han jugado
    return Object.values(teamsStats)
      .filter(stat => stat.matchesPlayed > 0)
      .map(stat => ({
        ...stat,
        average: (stat.goalsAgainst / stat.matchesPlayed).toFixed(2)
      }))
      .sort((a, b) => {
        if (a.average !== b.average) return a.average - b.average;
        if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
        return b.matchesPlayed - a.matchesPlayed;
      });
  };

  // Solo mostrar equipos asignados al torneo actual
  const availableTeams = teams.filter(t => {
    const teamId = t._id || t.id;
    // Recalcular los IDs de equipos del torneo actual
    let ids = [];
    if (currentTournament.teams && currentTournament.teams.length > 0) {
      if (typeof currentTournament.teams[0] === 'object' && currentTournament.teams[0].name) {
        ids = currentTournament.teams.map(t => t._id || t.id);
      } else {
        ids = currentTournament.teams.map(t => t._id || t.id || t);
      }
    }
    return !ids.includes(teamId);
  });

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
          <span 
            onClick={() => setIsEditing(true)}
            style={{ 
              cursor: 'pointer', 
              fontSize: '20px',
              padding: '5px 8px',
              borderRadius: '5px',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              color: '#667eea'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.1)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.transform = 'scale(1)';
            }}
            title="Editar nombre del torneo"
          >
            ✏️
          </span>
          <span className={`status-badge-inline ${currentTournament.status}`}>
            {(currentTournament.status === 'pending' || currentTournament.status === 'upcoming') ? '⏳ Pendiente' : 
             (currentTournament.status === 'in-progress' || currentTournament.status === 'active') ? '🔥 En Curso' : '🏆 Finalizado'}
          </span>
          {(currentTournament.status === 'in-progress' || currentTournament.status === 'active') && (
            <button 
              onClick={handleFinishTournament}
              style={{
                padding: '8px 16px',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b71c1c';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#d32f2f';
                e.target.style.transform = 'scale(1)';
              }}
              title="Finalizar torneo permanentemente"
            >
              🏁 Finalizar Torneo
            </button>
          )}
        </div>
      )}
      
      <div className="tournament-header">
        {isEditing && (
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
        )}
      </div>

      {/* Tabs para torneos en curso */}
      {(currentTournament.status === 'in-progress' || currentTournament.status === 'active') && (
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
          <button 
            className={`tab-button ${activeTab === 'scorers' ? 'active' : ''}`}
            onClick={() => setActiveTab('scorers')}
          >
            ⚽ Goleadores
          </button>
          <button 
            className={`tab-button ${activeTab === 'goalkeepers' ? 'active' : ''}`}
            onClick={() => setActiveTab('goalkeepers')}
          >
            🧤 Valla Menos Vencida
          </button>
          <button 
            className={`tab-button ${activeTab === 'winners' ? 'active' : ''}`}
            onClick={() => setActiveTab('winners')}
          >
            🏅 Ganadores
          </button>
        </div>
      )}

      {/* Mensaje para torneos finalizados */}
      {currentTournament.status === 'completed' && (
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          margin: '20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#856404'
        }}>
          <span style={{ fontSize: '24px' }}>🏆</span>
          <div>
            <strong>Torneo Finalizado</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              Este torneo ha sido finalizado y no se pueden realizar más modificaciones. Puedes consultar toda la información pero no editar.
            </p>
          </div>
        </div>
      )}

      {/* Contenido cuando el torneo está pendiente o cuando está en curso y el tab es 'info' */}
      {((currentTournament.status === 'pending' || currentTournament.status === 'upcoming') || ((currentTournament.status === 'in-progress' || currentTournament.status === 'active') && activeTab === 'info')) && (
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
                  placeholder="Ej: 50000"
                  value={registrationFeeDisplay}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setRegistrationFeeDisplay(formatted);
                    setTournamentInfo({...tournamentInfo, registrationFee: formatted});
                  }}
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
            {currentTournament.status !== 'completed' && (
              <button className="save-info-btn" onClick={handleSaveTournamentInfo}>
                💾 Guardar Información
              </button>
            )}
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
            ⚽ Equipos Participantes ({(currentTournament.teams || []).length})
          </h3>
        </div>

        {showTeamsSection && (
          <div className="teams-content">
            {/* Formulario para crear equipo y asociar al torneo */}
            {availableTeams.length > 0 && (
              <div className="add-team-section">
                <>
                  <select 
                    value={selectedTeamId} 
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="team-select"
                  >
                    <option value="">Seleccionar equipo...</option>
                    {availableTeams.map(team => (
                      <option key={team._id || team.id} value={team._id || team.id}>{team.name}</option>
                    ))}
                  </select>
                  {currentTournament.status !== 'completed' && (
                    <button onClick={handleAddTeam} className="add-team-button">➕ Agregar Equipo</button>
                  )}
                </>
              </div>
            )}

            <div className="teams-list-vertical">
              {tournamentTeams.length === 0 ? (
                <div className="no-teams">No hay equipos asignados a este torneo.</div>
              ) : (
                tournamentTeams.map(team => {
                  const teamId = team._id || team.id;
                  const isExpanded = expandedTeamId === teamId;
                  return (
                    <div key={teamId} className={`team-list-item ${isExpanded ? 'expanded' : ''}`}>
                      <div 
                        className="team-list-item-header"
                        onClick={() => toggleTeamExpansion(teamId)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="team-list-item-info">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="team-icon-list-logo" />
                          ) : (
                            <span className="team-icon-list">⚽</span>
                          )}
                          <h4 className="team-list-name">{team.name}</h4>
                          {team.players && (
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
                
                      {isExpanded && team.players && team.players.length > 0 && (
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
                                  {player.position && (
                                    <span className="player-position"> — {player.position}</span>
                                  )}
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
                
                      {isExpanded && (!team.players || team.players.length === 0) && (
                        <div className="no-players">Sin jugadores registrados</div>
                      )}
                    </div>
                  );
                })
              )}
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
                  const availableTeamsForGroup = (currentTournament.teams || []).filter(tournamentTeam => {
                    // El equipo puede venir como objeto poblado o como ID string
                    const tournamentTeamId = typeof tournamentTeam === 'object' 
                      ? (tournamentTeam._id || tournamentTeam.id) 
                      : tournamentTeam;
                    return !(group.teams || []).includes(tournamentTeamId);
                  });
                  
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
                                // Buscar el equipo en la lista de teams usando _id o id
                                const team = teams.find(t => (t._id || t.id) === teamId);
                                return team ? (
                                  <div key={teamId} className="team-item-enhanced">
                                    {team.logo ? (
                                      <img src={team.logo} alt={team.name} className="team-icon-logo" />
                                    ) : (
                                      <span className="team-icon">⚽</span>
                                    )}
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
                              {(currentTournament.teams || [])
                                .filter(tournamentTeam => {
                                  // El equipo puede venir como objeto poblado o como ID string
                                  const teamId = typeof tournamentTeam === 'object' 
                                    ? (tournamentTeam._id || tournamentTeam.id) 
                                    : tournamentTeam;
                                  // Verificar que el equipo no esté en ningún grupo
                                  const isInAnyGroup = groups.some(g => (g.teams || []).includes(teamId));
                                  return !isInAnyGroup;
                                })
                                .map(tournamentTeam => {
                                  // Si ya es un objeto poblado, usarlo directamente
                                  const team = typeof tournamentTeam === 'object' && tournamentTeam.name
                                    ? tournamentTeam
                                    : teams.find(t => {
                                        const teamId = typeof tournamentTeam === 'object' 
                                          ? (tournamentTeam._id || tournamentTeam.id) 
                                          : tournamentTeam;
                                        return (t._id || t.id) === teamId;
                                      });
                                  
                                  if (!team) return null;
                                  
                                  const teamId = typeof tournamentTeam === 'object' 
                                    ? (tournamentTeam._id || tournamentTeam.id) 
                                    : tournamentTeam;
                                    
                                  return (
                                    <option key={teamId} value={teamId}>{team.name}</option>
                                  );
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

              {currentTournament.status !== 'completed' && (
                <div className="groups-actions">
                  <button onClick={handleSaveGroups} className="save-groups-btn">
                    💾 Guardar Grupos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </>
      )}

      {/* Contenido de partidos cuando el torneo está en curso y el tab es 'matches' */}
      {(currentTournament.status === 'in-progress' || currentTournament.status === 'active') && activeTab === 'matches' && (
        <div className="matches-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>⚽ Partidos del Torneo</h3>
            {currentTournament.status !== 'completed' && (
              <button 
                className="create-round-button"
                onClick={handleOpenCreateRoundModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                ➕ Crear Nueva Ronda
              </button>
            )}
          </div>
          
          {matches.length > 0 ? (
            <MatchBracket 
              matches={matches} 
              teams={teams}
              getTeamName={getTeamName}
              onUpdateMatch={handleUpdateMatch}
              expandedRounds={expandedRounds}
              setExpandedRounds={setExpandedRounds}
              onDeleteRound={handleDeleteRound}
              isCompleted={currentTournament.status === 'completed'}
            />
          ) : (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              backgroundColor: '#f7fafc', 
              borderRadius: '12px',
              border: '2px dashed #cbd5e0'
            }}>
              <p style={{ fontSize: '18px', color: '#718096', marginBottom: '15px' }}>
                No hay partidos creados aún
              </p>
              <p style={{ fontSize: '14px', color: '#a0aec0' }}>
                Haz clic en "Crear Nueva Ronda" para empezar
              </p>
            </div>
          )}
        </div>
      )}

      {/* Contenido de tabla de posiciones cuando el tab es 'standings' */}
      {(currentTournament.status === 'in-progress' || currentTournament.status === 'active') && activeTab === 'standings' && (
        <div className="standings-section">
          <h3>🏆 Tabla de Posiciones</h3>
          {groups.length > 0 ? (
            <div className="standings-groups">
              {groups.map((group, index) => {
                const standings = calculateStandings(group.teams);
                return (
                  <div key={index} className="standings-group">
                    <h4 className="group-title">Grupo {group.name}</h4>
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
                            const team = teams.find(t => (t._id || t.id) === stat.teamId);
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

      {/* Contenido de goleadores cuando el tab es 'scorers' */}
      {(currentTournament.status === 'in-progress' || currentTournament.status === 'active') && activeTab === 'scorers' && (
        <div className="scorers-section">
          <h3>⚽ Tabla de Goleadores</h3>
          {(() => {
            const topScorers = calculateTopScorers();
            return topScorers.length > 0 ? (
              <div className="standings-table-wrapper">
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th className="pos-col">#</th>
                      <th className="team-col">Jugador</th>
                      <th>Equipo</th>
                      <th className="pts-col">⚽ Goles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topScorers.map((scorer, index) => (
                      <tr key={`${scorer.playerId}-${index}`} className={index < 3 ? 'qualified' : ''}>
                        <td className="pos-col">{index + 1}</td>
                        <td className="team-col">
                          <div className="team-info">
                            {scorer.photo && (
                              <img 
                                src={scorer.photo} 
                                alt={scorer.playerName} 
                                className="player-item-photo scorer-photo no-zoom" 
                                onClick={() => {
                                  setSelectedImage(scorer.photo);
                                  setShowImageModal(true);
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                            )}
                            <span>{scorer.playerName}</span>
                          </div>
                        </td>
                        <td>{scorer.teamName}</td>
                        <td className="pts-col"><strong>{scorer.goals}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No hay goleadores registrados aún.</p>
            );
          })()}
        </div>
      )}

      {/* Contenido de valla menos vencida cuando el tab es 'goalkeepers' */}
      {(currentTournament.status === 'in-progress' || currentTournament.status === 'active') && activeTab === 'goalkeepers' && (
        <div className="goalkeepers-section">
          <h3>🧤 Valla Menos Vencida</h3>
          {(() => {
            const goalkeepers = calculateGoalkeepers();
            return goalkeepers.length > 0 ? (
              <div className="standings-table-wrapper">
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th className="pos-col">#</th>
                      <th className="team-col">Equipo</th>
                      <th>PJ</th>
                      <th>GC</th>
                      <th className="pts-col">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalkeepers.map((gk, index) => (
                      <tr key={gk.teamId} className={index < 3 ? 'qualified' : ''}>
                        <td className="pos-col">{index + 1}</td>
                        <td className="team-col">
                          <div className="team-info">
                            {gk.logo && <img src={gk.logo} alt={gk.teamName} className="team-logo-small" />}
                            <span>{gk.teamName}</span>
                          </div>
                        </td>
                        <td>{gk.matchesPlayed}</td>
                        <td>{gk.goalsAgainst}</td>
                        <td className="pts-col"><strong>{gk.average}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '15px', padding: '10px', background: '#f3f4f6', borderRadius: '8px', fontSize: '0.9em', color: '#6b7280' }}>
                  <strong>PJ = </strong>Partidos Jugados | <strong>GC = </strong>Goles en Contra
                </div>
              </div>
            ) : (
              <p className="no-data">No hay datos de valla menos vencida aún.</p>
            );
          })()}
        </div>
      )}

      {/* Contenido de ganadores cuando el tab es 'winners' */}
      {(currentTournament.status === 'in-progress' || currentTournament.status === 'active') && activeTab === 'winners' && (
        <div className="winners-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>🏅 Ganadores del Torneo</h3>
            {currentTournament.status !== 'completed' && (
              <button
                onClick={() => setShowAddWinnerModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                ➕ Agregar Ganador
              </button>
            )}
          </div>

          {winners.length > 0 ? (
            <div className="winners-list" style={{ display: 'grid', gap: '15px' }}>
              {winners
                .sort((a, b) => a.position - b.position)
                .map((winner, index) => {
                  const team = teams.find(t => (t._id || t.id) === winner.teamId);
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: winner.position === 1 ? '3px solid #ffd700' : winner.position === 2 ? '3px solid #c0c0c0' : winner.position === 3 ? '3px solid #cd7f32' : '2px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                        <div
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: winner.position === 1 ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' : winner.position === 2 ? 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)' : winner.position === 3 ? 'linear-gradient(135deg, #cd7f32 0%, #d4a574 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                        >
                          {winner.position}°
                        </div>
                        {team?.logo && (
                          <img
                            src={team.logo}
                            alt={team.name}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'contain',
                              borderRadius: '8px'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1f2937' }}>
                            {team?.name || 'Equipo Desconocido'}
                          </h4>
                          {winner.prize && (
                            <p style={{ margin: 0, color: '#10b981', fontWeight: '600', fontSize: '16px' }}>
                              💰 {winner.prize}
                            </p>
                          )}
                        </div>
                      </div>
                      {currentTournament.status !== 'completed' && (
                        <button
                          onClick={() => handleRemoveWinner(index)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="no-data">No hay ganadores registrados aún.</p>
          )}
        </div>
      )}

      {/* Mostrar partidos para torneos finalizados (sin tabs) */}
      {currentTournament.status === 'completed' && (
        <>
          {matches.length > 0 && (
            <div className="matches-section">
              <h3>⚽ Partidos</h3>
              <MatchBracket 
                matches={matches} 
                teams={teams}
                getTeamName={getTeamName}
                onUpdateMatch={handleUpdateMatch}
                expandedRounds={expandedRounds}
                setExpandedRounds={setExpandedRounds}
                onDeleteRound={handleDeleteRound}
                isCompleted={true}
              />
            </div>
          )}

          {/* Tabla de posiciones para torneos finalizados */}
          <div className="standings-section" style={{ marginTop: '30px' }}>
            <h3>🏆 Tabla de Posiciones</h3>
            {groups.length > 0 ? (
              <div className="standings-groups">
                {groups.map(group => {
                  const groupName = group.name;
                  const groupTeams = group.teams || [];
                  const standings = calculateStandings(groupTeams);
                  
                  return (
                    <div key={groupName} className="standings-group">
                      <h4 className="group-title">👥 Grupo {groupName}</h4>
                      <table className="standings-table">
                        <thead>
                          <tr>
                            <th>Pos</th>
                            <th>Equipo</th>
                            <th>PJ</th>
                            <th>G</th>
                            <th>E</th>
                            <th>P</th>
                            <th>GF</th>
                            <th>GC</th>
                            <th>DG</th>
                            <th>Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((team, index) => {
                            const teamData = teams.find(t => (t._id || t.id) === team.teamId);
                            return (
                              <tr 
                                key={team.teamId} 
                                className={`${index < 2 ? 'qualified' : ''} clickable-row`}
                                onClick={() => handleTeamClick(team.teamId)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td className="position">{index + 1}</td>
                                <td className="team-cell">
                                  <div className="team-info">
                                    {teamData?.logo && (
                                      <img src={teamData.logo} alt={teamData?.name} className="team-logo-mini" />
                                    )}
                                    <span>{teamData?.name || 'Equipo'}</span>
                                  </div>
                                </td>
                                <td>{team.played}</td>
                                <td>{team.won}</td>
                                <td>{team.drawn}</td>
                                <td>{team.lost}</td>
                                <td>{team.goalsFor}</td>
                                <td>{team.goalsAgainst}</td>
                                <td className={team.goalDifference >= 0 ? 'positive' : 'negative'}>
                                  {team.goalDifference >= 0 ? '+' : ''}{team.goalDifference}
                                </td>
                                <td className="points">{team.points}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            ) : (
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Equipo</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                    <th>GF</th>
                    <th>GC</th>
                    <th>DG</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateStandings(currentTournament.teams || []).map((stat, index) => {
                    const teamData = teams.find(t => (t._id || t.id) === stat.teamId);
                    return (
                      <tr 
                        key={stat.teamId}
                        className="clickable-row"
                        onClick={() => handleTeamClick(stat.teamId)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="position">{index + 1}</td>
                        <td className="team-cell">
                          <div className="team-info">
                            {teamData?.logo && (
                              <img src={teamData.logo} alt={teamData?.name} className="team-logo-mini" />
                            )}
                            <span>{teamData?.name || 'Equipo'}</span>
                          </div>
                        </td>
                        <td>{stat.played}</td>
                        <td>{stat.won}</td>
                        <td>{stat.drawn}</td>
                        <td>{stat.lost}</td>
                        <td>{stat.goalsFor}</td>
                        <td>{stat.goalsAgainst}</td>
                        <td className={stat.goalDifference >= 0 ? 'positive' : 'negative'}>
                          {stat.goalDifference >= 0 ? '+' : ''}{stat.goalDifference}
                        </td>
                        <td className="points">{stat.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Goleadores para torneos finalizados */}
          <div className="scorers-section" style={{ marginTop: '30px' }}>
            <h3>⚽ Goleadores</h3>
            {(() => {
              const topScorers = calculateTopScorers();
              return topScorers.length > 0 ? (
                <div className="standings-table-wrapper">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th className="pos-col">#</th>
                        <th className="team-col">Jugador</th>
                        <th>Equipo</th>
                        <th className="pts-col">⚽ Goles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topScorers.map((scorer, index) => (
                        <tr key={`${scorer.playerId}-${index}`} className={index < 3 ? 'qualified' : ''}>
                          <td className="pos-col">{index + 1}</td>
                          <td className="team-col">
                            <div className="team-info">
                              {scorer.photo && (
                                <img 
                                  src={scorer.photo} 
                                  alt={scorer.playerName} 
                                  className="player-item-photo scorer-photo no-zoom"
                                />
                              )}
                              <span>{scorer.playerName}</span>
                            </div>
                          </td>
                          <td>{scorer.teamName}</td>
                          <td className="pts-col"><strong>{scorer.goals}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No hay goleadores registrados.</p>
              );
            })()}
          </div>

          {/* Porteros para torneos finalizados */}
          <div className="goalkeepers-section" style={{ marginTop: '30px' }}>
            <h3>🧤 Valla Menos Vencida</h3>
            {(() => {
              const goalkeepers = calculateGoalkeepers();
              return goalkeepers.length > 0 ? (
                <div className="standings-table-wrapper">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th className="pos-col">#</th>
                        <th className="team-col">Equipo</th>
                        <th>PJ</th>
                        <th>GC</th>
                        <th className="pts-col">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goalkeepers.map((gk, index) => (
                        <tr key={gk.teamId} className={index < 3 ? 'qualified' : ''}>
                          <td className="pos-col">{index + 1}</td>
                          <td className="team-col">
                            <div className="team-info">
                              {gk.logo && <img src={gk.logo} alt={gk.teamName} className="team-logo-small" />}
                              <span>{gk.teamName}</span>
                            </div>
                          </td>
                          <td>{gk.matchesPlayed}</td>
                          <td>{gk.goalsAgainst}</td>
                          <td className="pts-col"><strong>{gk.average}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No hay estadísticas de porteros disponibles.</p>
              );
            })()}
          </div>

          {/* Ganadores para torneos finalizados */}
          {winners.length > 0 && (
            <div className="winners-section" style={{ marginTop: '30px' }}>
              <h3>🏅 Ganadores del Torneo</h3>
              <div className="winners-list" style={{ display: 'grid', gap: '15px' }}>
                {winners
                  .sort((a, b) => a.position - b.position)
                  .map((winner, index) => {
                    const team = teams.find(t => (t._id || t.id) === winner.teamId);
                    return (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: winner.position === 1 ? '3px solid #ffd700' : 
                               winner.position === 2 ? '3px solid #c0c0c0' : 
                               winner.position === 3 ? '3px solid #cd7f32' : '2px solid #e8eaf6',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{
                            fontSize: '40px',
                            fontWeight: 'bold',
                            width: '60px',
                            textAlign: 'center'
                          }}>
                            {winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : `${winner.position}°`}
                          </div>
                          {team?.logo && (
                            <img src={team.logo} alt={team.name} style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'contain',
                              borderRadius: '8px'
                            }} />
                          )}
                          <div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1f2937' }}>
                              {team?.name || 'Equipo Desconocido'}
                            </h4>
                            {winner.prize && (
                              <p style={{ margin: 0, color: '#10b981', fontWeight: '600', fontSize: '16px' }}>
                                💰 {winner.prize}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {(currentTournament.status === 'pending' || currentTournament.status === 'upcoming') && (
        <div style={{ marginTop: '40px', padding: '20px', borderTop: '2px solid #ddd', display: 'flex', gap: '15px', justifyContent: 'center' }}>
          {(currentTournament.teams || []).length >= 2 && (
            <button className="start-tournament-button" onClick={handleStartTournament}>
              🚀 Iniciar Torneo
            </button>
          )}
          <button className="delete-tournament-button" onClick={handleDeleteTournament}>
            🗑️ Eliminar Torneo
          </button>
        </div>
      )}

      {(currentTournament.status === 'in-progress' || currentTournament.status === 'active') && currentTournament.type === 'round-robin' && (
        <div style={{ marginTop: '20px', padding: '15px', display: 'flex', justifyContent: 'center' }}>
          <button className="regenerate-matches-button" onClick={handleRegenerateMatches}>
            ➕ Generar Partidos para Nuevos Equipos
          </button>
        </div>
      )}

      {/* Modal para agregar ganador */}
      {showAddWinnerModal && (
        <div className="modal-overlay" onClick={() => setShowAddWinnerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>🏆 Agregar Ganador</h2>
              <button className="modal-close" onClick={() => setShowAddWinnerModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Posición
                </label>
                <input
                  type="number"
                  min="1"
                  value={newWinner.position}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                    setNewWinner({ ...newWinner, position: value });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="Ej: 1, 2, 3..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Equipo
                </label>
                <select
                  value={newWinner.teamId}
                  onChange={(e) => setNewWinner({ ...newWinner, teamId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Seleccionar equipo...</option>
                  {tournamentTeams.map(team => (
                    <option key={team._id || team.id} value={team._id || team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Premio (opcional)
                </label>
                <input
                  type="text"
                  value={prizeInputValue}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setPrizeInputValue(formatted);
                    setNewWinner({ ...newWinner, prize: formatted });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="Ej: 1000000"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddWinnerModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddWinner}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nueva ronda */}
      {showCreateRoundModal && (
        <div className="modal-overlay" onClick={() => setShowCreateRoundModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>➕ Crear Nueva Ronda</h2>
              <button className="modal-close" onClick={() => setShowCreateRoundModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Nombre de la Ronda
                </label>
                <input
                  type="text"
                  value={newRoundName}
                  onChange={(e) => setNewRoundName(e.target.value)}
                  placeholder="Ej: Semifinal, Final, Ronda 2, etc."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Número de Partidos
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={newRoundMatchCount}
                  onChange={(e) => handleRoundMatchCountChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {newRoundMatches.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '15px', color: '#333' }}>Enfrentamientos</h4>
                  {newRoundMatches.map((match, index) => {
                    // Obtener todos los equipos ya seleccionados en otros partidos
                    const selectedTeamsInOtherMatches = newRoundMatches
                      .filter((_, i) => i !== index) // Excluir el partido actual
                      .flatMap(m => [m.team1, m.team2])
                      .filter(teamId => teamId); // Eliminar valores vacíos
                    
                    // Filtrar equipos disponibles para team1 (excluir los ya usados y el team2 actual)
                    const availableForTeam1 = tournamentTeams.filter(team => {
                      const teamId = team._id || team.id;
                      return !selectedTeamsInOtherMatches.includes(teamId) && teamId !== match.team2;
                    });
                    
                    // Filtrar equipos disponibles para team2 (excluir los ya usados y el team1 actual)
                    const availableForTeam2 = tournamentTeams.filter(team => {
                      const teamId = team._id || team.id;
                      return !selectedTeamsInOtherMatches.includes(teamId) && teamId !== match.team1;
                    });
                    
                    return (
                      <div key={match.id} style={{
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor: '#f7fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ marginBottom: '8px', fontWeight: '600', color: '#667eea' }}>
                          Partido {index + 1}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>
                          <select
                            value={match.team1}
                            onChange={(e) => handleRoundMatchChange(index, 'team1', e.target.value)}
                            style={{
                              padding: '8px',
                              border: '1px solid #cbd5e0',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}
                          >
                            <option value="">Seleccionar equipo...</option>
                            {availableForTeam1.map(team => (
                              <option key={team._id || team.id} value={team._id || team.id}>
                                {team.name}
                              </option>
                            ))}
                            {/* Mantener el equipo seleccionado visible aunque esté usado */}
                            {match.team1 && !availableForTeam1.find(t => (t._id || t.id) === match.team1) && (
                              <option value={match.team1}>
                                {tournamentTeams.find(t => (t._id || t.id) === match.team1)?.name}
                              </option>
                            )}
                          </select>
                          
                          <span style={{ fontWeight: 'bold', color: '#718096' }}>VS</span>
                          
                          <select
                            value={match.team2}
                            onChange={(e) => handleRoundMatchChange(index, 'team2', e.target.value)}
                            style={{
                              padding: '8px',
                              border: '1px solid #cbd5e0',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}
                          >
                            <option value="">Seleccionar equipo...</option>
                            {availableForTeam2.map(team => (
                              <option key={team._id || team.id} value={team._id || team.id}>
                                {team.name}
                              </option>
                            ))}
                            {/* Mantener el equipo seleccionado visible aunque esté usado */}
                            {match.team2 && !availableForTeam2.find(t => (t._id || t.id) === match.team2) && (
                              <option value={match.team2}>
                                {tournamentTeams.find(t => (t._id || t.id) === match.team2)?.name}
                              </option>
                            )}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowCreateRoundModal(false)} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={handleCreateRound} className="btn-save">
                Crear Ronda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de estadísticas del equipo */}
      {showTeamStatsModal && selectedTeamStats && (
        <TeamStatsModal 
          teamId={selectedTeamStats.teamId}
          team={teams.find(t => (t._id || t.id) === selectedTeamStats.teamId)}
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

      {/* Modal para ampliar imagen */}
      {showImageModal && selectedImage && (
        <div 
          className="image-modal-overlay" 
          onClick={() => {
            setShowImageModal(false);
            setSelectedImage(null);
          }}
        >
          <img 
            src={selectedImage} 
            alt="Imagen ampliada" 
            className="enlarged-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function MatchBracket({ matches, teams, getTeamName, onUpdateMatch, expandedRounds, setExpandedRounds, onDeleteRound, isCompleted }) {
  // Verificar si es un torneo round-robin (tiene groupName o todos los partidos tienen round)
  const hasGroups = matches.some(m => m.groupName);
  
  if (hasGroups) {
    // Torneo por grupos - Mostrar por fecha (round) y grupo
    return <RoundRobinMatches matches={matches} teams={teams} getTeamName={getTeamName} onUpdateMatch={onUpdateMatch} expandedRounds={expandedRounds} setExpandedRounds={setExpandedRounds} onDeleteRound={onDeleteRound} isCompleted={isCompleted} />;
  } else {
    // Torneo de eliminación directa o rondas personalizadas - Mostrar por ronda
    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => {
      // Convertir a números para comparación correcta
      const numA = typeof a === 'string' ? (parseInt(a) || 0) : a;
      const numB = typeof b === 'string' ? (parseInt(b) || 0) : b;
      return numB - numA; // Descendente: mayor primero
    });

    return (
      <div className="match-bracket">
        {rounds.map(round => {
          const roundMatches = matches.filter(m => m.round === round);
          // Obtener el nombre de la ronda del primer partido (si existe)
          const roundName = (roundMatches[0]?.roundName && roundMatches[0]?.roundName.trim()) || `Ronda ${round}`;
          
          return (
            <div key={round} style={{ marginBottom: '30px' }}>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#2d3748',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '3px solid #667eea'
              }}>
                {roundName}
              </h4>
              {roundMatches.map(match => (
                <MatchCard 
                  key={match.id || match._id || `${round}-${match.team1}-${match.team2}`} 
                  match={match} 
                  teams={teams}
                  getTeamName={getTeamName}
                  onUpdate={onUpdateMatch}
                  isCompleted={isCompleted}
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  }
}

function RoundRobinMatches({ matches, teams, getTeamName, onUpdateMatch, expandedRounds, setExpandedRounds, onDeleteRound, isCompleted }) {
  const [showJornadas, setShowJornadas] = useState(false);
  
  const rounds = [...new Set(matches.map(m => m.round))];
  const groups = [...new Set(matches.map(m => m.groupName))];

  // Separar las jornadas (que contienen "Jornada" en su nombre) de las rondas personalizadas
  const jornadasRounds = rounds.filter(r => String(r).includes('Jornada'));
  const customRounds = rounds.filter(r => !String(r).includes('Jornada'));
  
  // Ordenar rondas personalizadas descendentemente (mayor primero)
  customRounds.sort((a, b) => {
    const numA = typeof a === 'string' ? (parseInt(a) || 0) : a;
    const numB = typeof b === 'string' ? (parseInt(b) || 0) : b;
    return numB - numA;
  });

  const toggleRound = (round) => {
    const newExpanded = new Set(expandedRounds);
    // Normalizar round para comparación - convertir a número si la cadena es un número válido
    const parsedRound = typeof round === 'string' ? parseInt(round) : round;
    const normalizedRound = !isNaN(parsedRound) ? parsedRound : round;
    
    // Buscar y eliminar cualquier forma del round (string o número)
    newExpanded.delete(round);
    newExpanded.delete(String(round));
    newExpanded.delete(normalizedRound);
    newExpanded.delete(String(normalizedRound));
    
    // Si no estaba expandido, agregarlo
    if (!expandedRounds.has(round) && !expandedRounds.has(normalizedRound)) {
      newExpanded.add(normalizedRound);
    }
    
    setExpandedRounds(newExpanded);
  };

  return (
    <div className="round-robin-container">
      {/* Rondas personalizadas primero (ordenadas descendentemente) */}
      {customRounds.map(round => {
        // Normalizar comparación - convertir a número si la cadena es un número válido
        const parsedRound = typeof round === 'string' ? parseInt(round) : round;
        const normalizedRound = !isNaN(parsedRound) ? parsedRound : round;
        const isExpanded = expandedRounds.has(round) || expandedRounds.has(normalizedRound);
        
        // Obtener el roundName del primer partido de esta ronda
        const roundMatches = matches.filter(m => m.round === round);
        const roundName = (roundMatches[0]?.roundName && roundMatches[0]?.roundName.trim()) || `Ronda ${round}`;
        
        return (
          <div key={round} className={`round-section ${isExpanded ? 'expanded' : ''}`}>
            <h3 
              className="round-title collapsible" 
              style={{ 
                cursor: 'pointer',
                background: isExpanded ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: isExpanded ? 'white' : '#667eea',
                padding: isExpanded ? '12px 15px' : '0',
                borderRadius: isExpanded ? '8px' : '0',
                borderBottom: isExpanded ? 'none' : '2px solid #e8eaf6',
                marginBottom: isExpanded ? '15px' : '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div onClick={() => toggleRound(round)} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px' }}>{isExpanded ? '🔽' : '▶️'}</span>
                {roundName}
              </div>
              {!isCompleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRound(round);
                  }}
                  style={{
                    background: 'rgba(255, 82, 82, 0.2)',
                    border: 'none',
                    color: isExpanded ? 'white' : '#ff5252',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontWeight: '600'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255, 82, 82, 0.3)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255, 82, 82, 0.2)'}
                  title="Eliminar ronda"
                >
                  🗑️ Eliminar
                </button>
              )}
            </h3>
            
            {isExpanded && (
              <div className="matches-grid">
                {matches
                  .filter(m => m.round === round)
                  .map(match => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      teams={teams}
                      getTeamName={getTeamName}
                      onUpdate={onUpdateMatch}
                      isCompleted={isCompleted}
                    />
                  ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Sección de Jornadas agrupadas al final */}
      {jornadasRounds.length > 0 && (
        <div className="jornadas-group" style={{ marginBottom: '30px' }}>
          <h3 
            className="round-title collapsible" 
            onClick={() => setShowJornadas(!showJornadas)}
            style={{ 
              cursor: 'pointer',
              background: showJornadas ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f7fafc',
              color: showJornadas ? 'white' : '#667eea',
              padding: '15px 20px',
              borderRadius: '8px',
              border: showJornadas ? 'none' : '2px solid #e2e8f0'
            }}
          >
            <span style={{ marginRight: '10px' }}>{showJornadas ? '🔽' : '▶️'}</span>
            📅 Fase de Grupos
          </h3>
          
          {showJornadas && jornadasRounds.map(round => {
            // Normalizar comparación - convertir a número si la cadena es un número válido
            const parsedRound = typeof round === 'string' ? parseInt(round) : round;
            const normalizedRound = !isNaN(parsedRound) ? parsedRound : round;
            const isExpanded = expandedRounds.has(round) || expandedRounds.has(normalizedRound);
            
            return (
              <div key={round} className={`round-section ${isExpanded ? 'expanded' : ''}`} style={{ marginLeft: '20px', marginTop: '15px' }}>
                <h4 
                  className="round-title collapsible" 
                  onClick={() => toggleRound(round)}
                  style={{ 
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '10px 15px',
                    background: isExpanded ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#edf2f7',
                    color: isExpanded ? 'white' : '#667eea',
                    borderRadius: '6px',
                    borderBottom: 'none'
                  }}
                >
                  <span style={{ marginRight: '10px' }}>{isExpanded ? '🔽' : '▶️'}</span>
                  📅 {round}
                </h4>
                
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
                            isCompleted={isCompleted}
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
      )}
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
      team2Cards,
      status: 'finished' // Cambiar automáticamente a finished cuando se guardan resultados
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
                      <option key="yellow" value="yellow">🟨</option>
                      <option key="red" value="red">🟥</option>
                      <option key="blue" value="blue">🟦</option>
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
                      <option key="yellow" value="yellow">🟨</option>
                      <option key="red" value="red">🟥</option>
                      <option key="blue" value="blue">🟦</option>
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

function MatchCard({ match, teams, getTeamName, onUpdate, isCompleted }) {
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

  const canEdit = match.team1 && match.team2 && !isCompleted;
  
  // Support both id and _id, and populated objects
  const team1Id = match.team1?._id || match.team1?.id || match.team1;
  const team2Id = match.team2?._id || match.team2?.id || match.team2;
  const team1Data = teams.find(t => (t._id || t.id) === team1Id);
  const team2Data = teams.find(t => (t._id || t.id) === team2Id);

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

  // Agrupar partidos completados por ronda

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
                  (() => {
                    // Agrupar partidos por ronda
                    const matchesByRound = {};
                    completedMatches.forEach(match => {
                      const roundKey = match.round || 'sin-ronda';
                      if (!matchesByRound[roundKey]) {
                        matchesByRound[roundKey] = {
                          matches: [],
                          roundName: match.roundName || (match.groupName ? `${match.groupName} - Jornada ${match.round}` : `Ronda ${match.round}`)
                        };
                      }
                      matchesByRound[roundKey].matches.push(match);
                    });

                    // Ordenar las rondas de forma descendente (más recientes primero)
                    const sortedRounds = Object.entries(matchesByRound).sort((a, b) => {
                      // Extraer número de la ronda
                      const getRoundNumber = (roundKey) => {
                        const match = roundKey.match(/\d+/);
                        return match ? parseInt(match[0]) : 0;
                      };
                      return getRoundNumber(b[0]) - getRoundNumber(a[0]);
                    });

                    return sortedRounds.map(([roundKey, roundData]) => (
                      <div key={roundKey} style={{ marginBottom: '25px' }}>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#4a5568',
                          marginBottom: '12px',
                          paddingBottom: '8px',
                          borderBottom: '2px solid #e2e8f0'
                        }}>
                          {roundData.roundName}
                        </h4>
                        <div className="stats-matches-list">
                          {roundData.matches.map((match, index) => {
                            const matchTeam1 = match.team1?._id || match.team1?.id || match.team1;
                            const matchTeam2 = match.team2?._id || match.team2?.id || match.team2;
                            const isTeam1 = matchTeam1 === teamId;
                            const opponent = isTeam1 ? matchTeam2 : matchTeam1;
                            const teamScore = isTeam1 ? match.team1Score : match.team2Score;
                            const opponentScore = isTeam1 ? match.team2Score : match.team1Score;
                            const result = teamScore > opponentScore ? 'won' : teamScore < opponentScore ? 'lost' : 'draw';
                            
                            return (
                              <div key={index} className={`stats-match-card ${result}`}>
                                <div className="match-info-header">
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
                      </div>
                    ));
                  })()
                ) : (
                  <p className="no-data-small">No hay partidos jugados aún.</p>
                )}
              </div>

              <div className="matches-group">
                <h3>⏳ Partidos Pendientes ({pendingMatches.length})</h3>
                {pendingMatches.length > 0 ? (
                  (() => {
                    // Agrupar partidos por ronda
                    const matchesByRound = {};
                    pendingMatches.forEach(match => {
                      const roundKey = match.round || 'sin-ronda';
                      if (!matchesByRound[roundKey]) {
                        matchesByRound[roundKey] = {
                          matches: [],
                          roundName: match.roundName || (match.groupName ? `${match.groupName} - Jornada ${match.round}` : `Ronda ${match.round}`)
                        };
                      }
                      matchesByRound[roundKey].matches.push(match);
                    });

                    // Ordenar las rondas de forma descendente (más recientes primero)
                    const sortedRounds = Object.entries(matchesByRound).sort((a, b) => {
                      // Extraer número de la ronda
                      const getRoundNumber = (roundKey) => {
                        const match = roundKey.match(/\d+/);
                        return match ? parseInt(match[0]) : 0;
                      };
                      return getRoundNumber(b[0]) - getRoundNumber(a[0]);
                    });

                    return sortedRounds.map(([roundKey, roundData]) => (
                      <div key={roundKey} style={{ marginBottom: '25px' }}>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#4a5568',
                          marginBottom: '12px',
                          paddingBottom: '8px',
                          borderBottom: '2px solid #e2e8f0'
                        }}>
                          {roundData.roundName}
                        </h4>
                        <div className="stats-matches-list">
                          {roundData.matches.map((match, index) => {
                            const matchTeam1 = match.team1?._id || match.team1?.id || match.team1;
                            const matchTeam2 = match.team2?._id || match.team2?.id || match.team2;
                            const isTeam1 = matchTeam1 === teamId;
                            const opponent = isTeam1 ? matchTeam2 : matchTeam1;
                            
                            return (
                              <div key={index} className="stats-match-card pending">
                                <div className="match-info-header">
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
                      </div>
                    ));
                  })()
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
