import React, { useState } from 'react';

function CreateTournament({ onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('single-elimination');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name, type);
      setName('');
    }
  };

  return (
    <div className="form-container">
      <h2 className="section-title">📝 Crear Nuevo Torneo</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre del torneo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="single-elimination">Eliminación Directa</option>
          <option value="round-robin">Todos contra Todos</option>
        </select>
        <button type="submit">Crear Torneo</button>
      </form>
    </div>
  );
}

export default CreateTournament;
