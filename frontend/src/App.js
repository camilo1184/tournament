import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import TournamentList from './components/TournamentList';
import TournamentDetail from './components/TournamentDetail';
import CreateTournament from './components/CreateTournament';
import CreateTeam from './components/CreateTeam';
import TeamList from './components/TeamList';

// URL del backend - forzar /api al final
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : 'https://tournament-backend-x9nj.onrender.com';
const API_URL = `${API_BASE}/api`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('tournaments');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      verifyToken(savedToken, JSON.parse(savedUser));
    }

    // Funcionalidad de zoom de imágenes
    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG' && !e.target.classList.contains('no-zoom')) {
        const modal = document.getElementById('imageZoomModal');
        const zoomedImage = document.getElementById('zoomedImage');
        if (modal && zoomedImage) {
          modal.style.display = 'block';
          zoomedImage.src = e.target.src;
          zoomedImage.alt = e.target.alt || '';
        }
      }
    };

    document.addEventListener('click', handleImageClick);

    return () => {
      document.removeEventListener('click', handleImageClick);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTournaments();
      fetchTeams();
    }
  }, [isAuthenticated]);

  const verifyToken = async (savedToken, savedUser) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      if (response.ok) {
        setToken(savedToken);
        setUser(savedUser);
        setIsAuthenticated(true);
      } else {
        // Token inválido, limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }

    // Limpiar estado y localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setView('tournaments');
  };

  // Función auxiliar para hacer peticiones autenticadas
  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    return fetch(url, { ...options, headers });
  };

  const fetchTournaments = async (tournamentId = null) => {
    if (!isAuthenticated || !token) return;
    try {
      // Si se proporciona un ID, actualizar solo ese torneo
      if (tournamentId) {
        const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`);
        const updatedTournament = await response.json();
        
        // Actualizar el torneo en la lista
        setTournaments(prevTournaments => 
          prevTournaments.map(t => 
            (t._id || t.id) === tournamentId ? updatedTournament : t
          )
        );
        
        // Si es el torneo seleccionado, actualizarlo también
        if (selectedTournament && (selectedTournament._id || selectedTournament.id) === tournamentId) {
          setSelectedTournament(updatedTournament);
        }
      } else {
        // Sin ID, cargar todos los torneos (comportamiento original)
        const response = await authenticatedFetch(`${API_URL}/tournaments`);
        const data = await response.json();
        setTournaments(data);
        
        // Si hay un torneo seleccionado, actualizarlo con los nuevos datos
        if (selectedTournament) {
          const updatedTournament = data.find(t => (t._id || t.id) === (selectedTournament._id || selectedTournament.id));
          if (updatedTournament) {
            setSelectedTournament(updatedTournament);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchTeams = async () => {
    if (!isAuthenticated || !token) return;
    try {
      const response = await authenticatedFetch(`${API_URL}/teams`);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleCreateTournament = async (name, type) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/tournaments`, {
        method: 'POST',
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
      
      const response = await authenticatedFetch(`${API_URL}/teams`, {
        method: 'POST',
        body: JSON.stringify(teamData)
      });
      
      console.log('App.js - Respuesta del servidor:', response.status);
      
      if (response.ok) {
        const createdTeam = await response.json();
        console.log('App.js - Equipo creado:', createdTeam);
        fetchTeams();
        setView('teams');
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleSelectTournament = async (tournament) => {
    try {
      // Obtener los datos más recientes del torneo desde el backend
      const tournamentId = tournament._id || tournament.id;
      const response = await authenticatedFetch(`${API_URL}/tournaments/${tournamentId}`);
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
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <header className="App-header">
            <h1>🏆 Sistema de Gestión de Torneos</h1>
            <nav>
              <button onClick={() => setView('tournaments')}>Torneos</button>
              <button onClick={() => setView('teams')}>Equipos</button>
              <div className="user-info">
                <span>👤 {user?.name || user?.username}</span>
                <button onClick={handleLogout} className="logout-btn">🚪 Salir</button>
              </div>
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
                authenticatedFetch={authenticatedFetch}
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
                token={token}
                authenticatedFetch={authenticatedFetch}
              />
            )}
          </main>

          {/* Modal de Zoom de Imagen */}
          <div id="imageZoomModal" className="image-zoom-modal" onClick={(e) => {
            if (e.target.id === 'imageZoomModal') {
              e.target.style.display = 'none';
            }
          }}>
            <span className="image-zoom-close" onClick={() => {
              document.getElementById('imageZoomModal').style.display = 'none';
            }}>&times;</span>
            <img className="image-zoom-content no-zoom" id="zoomedImage" alt="" />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
