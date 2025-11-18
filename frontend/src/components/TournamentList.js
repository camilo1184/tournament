import React from 'react';

function TournamentList({ tournaments, onSelectTournament, onCreateNew }) {
  if (tournaments.length === 0) {
    return (
      <div className="empty-state">
        <h3>🏆 No hay torneos creados</h3>
        <p>Crea tu primer torneo para comenzar</p>
        <button onClick={onCreateNew} className="create-new-btn" style={{ marginTop: '20px' }}>
          ➕ Crear Torneo
        </button>
      </div>
    );
  }

  return (
    <div className="tournament-list-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>🏆 Torneos</h2>
        <button onClick={onCreateNew} className="create-new-btn">
          ➕ Crear Torneo
        </button>
      </div>
      <div className="tournament-list">
        {tournaments.map(tournament => (
        <div 
          key={tournament.id} 
          className="tournament-card"
          onClick={() => onSelectTournament(tournament)}
        >
          <div className="tournament-card-header">
            <div className="tournament-card-icon">🏆</div>
          </div>
          <div className="tournament-card-body">
            <h3>{tournament.name}</h3>
            <p>📋 Tipo: {tournament.type === 'single-elimination' ? 'Eliminación Directa' : tournament.type}</p>
            <p>👥 Equipos: {tournament.teams.length}</p>
            <span className={`status ${tournament.status}`}>
              {tournament.status === 'pending' ? '⏳ Pendiente' : 
               tournament.status === 'in-progress' ? '🎮 En Curso' : '✅ Finalizado'}
            </span>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

export default TournamentList;
