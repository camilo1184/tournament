import React, { useState } from 'react';

function CreateTeam({ onCreate }) {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState({
    name: '',
    number: '',
    age: '',
    eps: '',
    photo: ''
  });

  const handleAddPlayer = () => {
    if (currentPlayer.name.trim() && currentPlayer.number) {
      setPlayers([...players, { ...currentPlayer }]);
      setCurrentPlayer({
        name: '',
        number: '',
        age: '',
        eps: '',
        photo: ''
      });
    }
  };

  const handleRemovePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPlayer({ ...currentPlayer, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      console.log('CreateTeam - Enviando equipo:', { name, players, logo: logo ? `${logo.substring(0, 50)}...` : 'sin logo' });
      onCreate(name, players, logo);
      setName('');
      setLogo('');
      setPlayers([]);
    }
  };

  return (
    <div className="form-container create-team-form">
      <h2 className="section-title">👥 Crear Nuevo Equipo</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre del equipo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
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
          {logo && (
            <div className="logo-preview-container">
              <img src={logo} alt="Logo del equipo" className="logo-preview" />
            </div>
          )}
        </div>

        <div className="players-section">
          <h3>Jugadores ({players.length})</h3>
          
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
                min="0"
                max="99"
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Edad"
                value={currentPlayer.age}
                onChange={(e) => setCurrentPlayer({...currentPlayer, age: e.target.value})}
                min="0"
              />
              <input
                type="text"
                placeholder="EPS"
                value={currentPlayer.eps}
                onChange={(e) => setCurrentPlayer({...currentPlayer, eps: e.target.value})}
              />
            </div>
            <div className="form-row">
              <label className="photo-label">
                📷 Foto del jugador
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
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

          <div className="players-list">
            {players.map((player, index) => (
              <div key={index} className="player-card">
                {player.photo && (
                  <img src={player.photo} alt={player.name} className="player-photo" />
                )}
                <div className="player-info">
                  <div className="player-name">
                    <strong>{player.name}</strong> #{player.number}
                  </div>
                  {player.age && <div>Edad: {player.age}</div>}
                  {player.eps && <div>EPS: {player.eps}</div>}
                </div>
                <button 
                  type="button" 
                  onClick={() => handleRemovePlayer(index)}
                  className="remove-player-btn"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="submit-btn">Crear Equipo</button>
      </form>
    </div>
  );
}

export default CreateTeam;
