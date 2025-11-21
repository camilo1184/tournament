import React, { useState } from 'react';

// URL del backend - forzar /api al final
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : 'https://tournament-backend-x9nj.onrender.com';
const API_URL = `${API_BASE}/api`;

function TeamList({ teams, onEdit, onCreateNew, authenticatedFetch }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editedTeam, setEditedTeam] = useState({ name: '', logo: '', players: [] });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState({
    name: '',
    number: '',
    age: '',
    eps: '',
    photo: '',
    position: ''
  });

  const handleEditTeam = (team) => {
    console.log('Editing team:', team);
    console.log('Team logo:', team.logo);
    console.log('Has logo?', !!team.logo);
    setSelectedTeam(team);
    const playersCopy = team.players ? team.players.map(p => ({
      name: String(p.name || ''),
      number: String(p.number || ''),
      age: String(p.age || ''),
      eps: String(p.eps || ''),
      photo: p.photo || '',
      position: String(p.position || '')
    })) : [];
    console.log('Players copy:', playersCopy);
    const editedTeamData = { 
      name: team.name || '',
      logo: team.logo || '',
      players: playersCopy
    };
    console.log('EditedTeam data:', editedTeamData);
    setEditedTeam(editedTeamData);
  };

  const handleAddPlayer = () => {
    if (currentPlayer.name.trim() && currentPlayer.number) {
      setEditedTeam({
        ...editedTeam,
        players: [...editedTeam.players, { 
          ...currentPlayer, 
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }]
      });
      setCurrentPlayer({
        name: '',
        number: '',
        age: '',
        eps: '',
        photo: '',
        position: ''
      });
    }
  };

  const handleRemovePlayer = (index) => {
    setEditedTeam({
      ...editedTeam,
      players: editedTeam.players.filter((_, i) => i !== index)
    });
  };

  const handleOpenEditPlayer = (player, index) => {
    setEditingPlayer({ ...player });
    setEditingPlayerIndex(index);
  };

  const handleSaveEditPlayer = () => {
    if (editingPlayer.name.trim() && editingPlayer.number) {
      const updatedPlayers = [...editedTeam.players];
      updatedPlayers[editingPlayerIndex] = { ...editingPlayer };
      setEditedTeam({ ...editedTeam, players: updatedPlayers });
      setEditingPlayer(null);
      setEditingPlayerIndex(null);
    }
  };

  const handleCancelEditPlayer = () => {
    setEditingPlayer(null);
    setEditingPlayerIndex(null);
  };

  const handleEditPlayerPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingPlayer({ ...editingPlayer, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePlayer = (index, field, value) => {
    const updatedPlayers = [...editedTeam.players];
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };
    setEditedTeam({ ...editedTeam, players: updatedPlayers });
  };

  const handlePhotoUpload = (e, index = null) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (index !== null) {
          handleUpdatePlayer(index, 'photo', reader.result);
        } else {
          setCurrentPlayer({ ...currentPlayer, photo: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedTeam({ ...editedTeam, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTeam = async () => {
    try {
      await authenticatedFetch(`${API_URL}/teams/${selectedTeam._id || selectedTeam.id}`, {
        method: 'PUT',
        body: JSON.stringify(editedTeam)
      });
      setSelectedTeam(null);
      onEdit();
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('¿Estás seguro de eliminar este equipo?')) return;
    
    try {
      await authenticatedFetch(`${API_URL}/teams/${teamId}`, {
        method: 'DELETE'
      });
      onEdit();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  if (selectedTeam) {
    return (
      <div className="form-container edit-team-form">
        <h2>✏️ Editar Equipo</h2>
        
        <input
          type="text"
          placeholder="Nombre del equipo"
          value={editedTeam.name}
          onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
        />

        <div className="logo-section">
          <label className="photo-label">
            🖼️ Logo del equipo
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="photo-input"
            />
          </label>
          {editedTeam.logo && (
            <div className="logo-preview-container">
              <img src={editedTeam.logo} alt="Logo del equipo" className="logo-preview" />
            </div>
          )}
        </div>

        <div className="players-section">
          <h3>Jugadores ({editedTeam.players.length})</h3>
          
          <div className="players-list">
            {editedTeam.players.map((player, index) => (
              <div key={index} className="player-item">
                <div className="player-photo-container">
                  {player.photo ? (
                    <img src={player.photo} alt={player.name} className="player-photo" />
                  ) : (
                    <div className="no-photo">📷</div>
                  )}
                </div>
                <div className="player-info">
                  <div className="player-name">
                    {player.name} 
                    <span className="player-number">#{player.number}</span>
                  </div>
                  <div className="player-details">
                    {player.age && <span>🎂 {player.age} años</span>}
                    {player.eps && <span>🏥 {player.eps}</span>}
                  </div>
                </div>
                <div className="player-actions">
                  <button 
                    type="button" 
                    onClick={() => handleOpenEditPlayer(player, index)}
                    className="edit-player-btn"
                    title="Editar jugador"
                  >
                    ✏️
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (window.confirm(`¿Eliminar a ${player.name}?`)) {
                        handleRemovePlayer(index);
                      }
                    }}
                    className="remove-player-btn"
                    title="Eliminar jugador"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="player-form">
            <h4>Agregar Jugador</h4>
            <div className="form-row">
              <input
                type="text"
                placeholder="Nombre del jugador *"
                value={currentPlayer.name}
                onChange={(e) => setCurrentPlayer({...currentPlayer, name: e.target.value})}
              />
              <input
                type="number"
                placeholder="Número *"
                value={currentPlayer.number}
                onChange={(e) => setCurrentPlayer({...currentPlayer, number: e.target.value})}
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Edad"
                value={currentPlayer.age}
                onChange={(e) => setCurrentPlayer({...currentPlayer, age: e.target.value})}
              />
              <input
                type="text"
                placeholder="EPS"
                value={currentPlayer.eps}
                onChange={(e) => setCurrentPlayer({...currentPlayer, eps: e.target.value})}
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="Posición"
                value={currentPlayer.position}
                onChange={(e) => setCurrentPlayer({...currentPlayer, position: e.target.value})}
              />
            </div>
            <div className="form-row">
              <label className="photo-label">
                📷 Foto del jugador
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e)}
                  className="photo-input"
                />
              </label>
              {currentPlayer.photo && (
                <img src={currentPlayer.photo} alt="Preview" className="photo-preview" />
              )}
            </div>
            <button type="button" onClick={handleAddPlayer} className="add-player-btn">
              ➕ Agregar Jugador
            </button>
          </div>
        </div>

        <div className="edit-actions">
          <button onClick={handleSaveTeam} className="save-team-btn">
            💾 Guardar Cambios
          </button>
          <button onClick={() => setSelectedTeam(null)} className="cancel-edit-btn">
            ✖ Cancelar
          </button>
        </div>

        {/* Modal de edición de jugador */}
        {editingPlayer && (
          <div className="modal-overlay" onClick={handleCancelEditPlayer}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>✏️ Editar Jugador</h3>
              
              <div className="modal-photo-section">
                <div className="modal-photo-preview" onClick={() => document.getElementById('modal-photo-input').click()}>
                  {editingPlayer.photo ? (
                    <img src={editingPlayer.photo} alt={editingPlayer.name} />
                  ) : (
                    <div className="no-photo-large">📷</div>
                  )}
                  <div className="photo-overlay">Cambiar Foto</div>
                </div>
                <input
                  id="modal-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleEditPlayerPhotoUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="modal-form">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Número *</label>
                  <input
                    type="text"
                    value={editingPlayer.number}
                    onChange={(e) => setEditingPlayer({...editingPlayer, number: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Edad</label>
                  <input
                    type="text"
                    value={editingPlayer.age}
                    onChange={(e) => setEditingPlayer({...editingPlayer, age: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>EPS</label>
                  <input
                    type="text"
                    value={editingPlayer.eps}
                    onChange={(e) => setEditingPlayer({...editingPlayer, eps: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Posición</label>
                  <input
                    type="text"
                    value={editingPlayer.position || ''}
                    onChange={(e) => setEditingPlayer({...editingPlayer, position: e.target.value})}
                    placeholder="Ej: Delantero, Defensa, Portero"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={handleSaveEditPlayer} className="save-btn">
                  💾 Guardar
                </button>
                <button onClick={handleCancelEditPlayer} className="cancel-btn">
                  ✖ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="teams-list-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>👥 Equipos</h2>
        <button onClick={onCreateNew} className="create-new-btn">
          ➕ Crear Equipo
        </button>
      </div>
      {teams.length === 0 ? (
        <div className="empty-state">
          <h3>No hay equipos creados</h3>
          <p>Crea tu primer equipo para comenzar</p>
        </div>
      ) : (
        <>
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar equipo por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
                title="Limpiar búsqueda"
              >
                ✖
              </button>
            )}
          </div>
          <div className="teams-grid">
            {teams
              .filter(team => 
                team.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(team => (
            <div key={team._id || team.id} className="team-card">
              <div className="team-card-header">
                <h3>{team.name}</h3>
                <div className="team-actions">
                  <button 
                    onClick={() => handleEditTeam(team)}
                    className="edit-team-btn"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteTeam(team._id || team.id)}
                    className="delete-team-btn"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="team-players-preview">
                <p>👥 {team.players?.length || 0} jugadores</p>
                {team.players && team.players.length > 0 && (
                  <div className="players-mini-list">
                    {team.players.slice(0, 3).map((player, i) => (
                      <div key={i} className="player-mini">
                        {player.photo && (
                          <img src={player.photo} alt={player.name} />
                        )}
                        <span>{player.name} #{player.number}</span>
                      </div>
                    ))}
                    {team.players.length > 3 && (
                      <div className="more-players">+{team.players.length - 3} más</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TeamList;
