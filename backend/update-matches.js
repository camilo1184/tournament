const fs = require('fs');
const path = require('path');

const MATCHES_FILE = path.join(__dirname, 'data', 'matches.json');

// Leer matches
const matches = JSON.parse(fs.readFileSync(MATCHES_FILE, 'utf-8'));

// Agregar campos faltantes a cada partido
const updatedMatches = matches.map(match => ({
  ...match,
  team1Scorers: match.team1Scorers || [],
  team2Scorers: match.team2Scorers || [],
  team1Cards: match.team1Cards || [],
  team2Cards: match.team2Cards || []
}));

// Guardar
fs.writeFileSync(MATCHES_FILE, JSON.stringify(updatedMatches, null, 2));

console.log('✅ Partidos actualizados correctamente');
console.log(`Total de partidos actualizados: ${updatedMatches.length}`);
