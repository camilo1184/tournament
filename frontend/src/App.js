import React, { useState, useEffect } from 'react';
import './App.css';
import TournamentList from './components/TournamentList';
import TournamentDetail from './components/TournamentDetail';
import CreateTournament from './components/CreateTournament';
import CreateTeam from './components/CreateTeam';
import TeamList from './components/TeamList';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [view, setView] = useState('tournaments');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch(`${API_URL}/tournaments`);
      const data = await response.json();
      setTournaments(data);
      
      // Si hay un torneo seleccionado, actualizarlo con los nuevos datos
      if (selectedTournament) {
        const updatedTournament = data.find(t => t.id === selectedTournament.id);
        if (updatedTournament) {
          setSelectedTournament(updatedTournament);
        }
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_URL}/teams`);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleCreateTournament = async (name, type) => {
    try {
      const response = await fetch(`${API_URL}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type })
      });
      await response.json();
      fetchTournaments();
      setView('tournaments');
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

    const handleCreateTeam = async (name, players, logo) => {
    try {
      console.log('App.js - Creando equipo:', { name, playersCount: players.length, hasLogo: !!logo });
      const teamData = { name, players, logo };
      console.log('App.js - Datos a enviar:', teamData);
      
      const response = await fetch(`${API_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
      
      console.log('App.js - Respuesta del servidor:', response.status);
      
      if (response.ok) {
        const createdTeam = await response.json();
        console.log('App.js - Equipo creado:', createdTeam);
        fetchTeams();
        setView('tournaments');
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleSelectTournament = async (tournament) => {
    try {
      // Obtener los datos más recientes del torneo desde el backend
      const response = await fetch(`${API_URL}/tournaments/${tournament.id}`);
      const freshTournament = await response.json();
      setSelectedTournament(freshTournament);
      setView('tournamentDetail');
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      // Si falla, usar los datos que tenemos
      setSelectedTournament(tournament);
      setView('tournamentDetail');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏆 Sistema de Gestión de Torneos</h1>
        <nav>
          <button onClick={() => setView('tournaments')}>Torneos</button>
          <button onClick={() => setView('teams')}>Equipos</button>
        </nav>
      </header>
      
      <main className="App-main">
        {view === 'tournaments' && (
          <TournamentList 
            tournaments={tournaments} 
            onSelectTournament={handleSelectTournament}
            onCreateNew={() => setView('createTournament')}
          />
        )}

        {view === 'teams' && (
          <TeamList 
            teams={teams}
            onEdit={fetchTeams}
            onCreateNew={() => setView('createTeam')}
          />
        )}
        
        {view === 'createTournament' && (
          <CreateTournament onCreate={handleCreateTournament} />
        )}
        
        {view === 'createTeam' && (
          <CreateTeam onCreate={handleCreateTeam} />
        )}
        
        {view === 'tournamentDetail' && selectedTournament && (
          <TournamentDetail 
            tournament={selectedTournament} 
            teams={teams}
            onBack={() => setView('tournaments')}
            onUpdate={fetchTournaments}
          />
        )}
      </main>
    </div>
  );
}

export default App;
