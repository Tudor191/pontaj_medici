// utils/pontajTime.js
// Funcții pure de formatare/parsare pentru formatul de stocare "XhYmZs" din pontaj.csv
// (fără fs, fără rețea) — extrase din buttons/onduty.js pentru a putea fi testate izolat,
// fără să atingă fișierele reale de date.
//
// Notă: acesta e formatul COMPACT folosit la citire/scriere CSV, diferit de formatul
// verbose ("X ore, Y minute și Z secunde") folosit doar în mesajele afișate utilizatorului.

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

// parsează o linie din pontaj.csv ("username,XhYmZs") -> { username, totalSeconds } sau null
function parsePontajLine(line) {
  const [username, timeStr] = line.split(",");
  const parts = timeStr && timeStr.match(/(\d+)h (\d+)m (\d+)s/);
  if (!parts) return null;

  const totalSeconds =
    parseInt(parts[1], 10) * 3600 +
    parseInt(parts[2], 10) * 60 +
    parseInt(parts[3], 10);

  return { username, totalSeconds };
}

// convertește o celulă din Google Sheets (minute simple sau "XhYmZs") în secunde
function cellToSeconds(cell) {
  if (!cell) return 0;
  if (/^\d+$/.test(cell)) return parseInt(cell, 10) * 60;
  const m = cell.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
  if (m) {
    return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
  }
  return 0;
}

module.exports = { formatDuration, parsePontajLine, cellToSeconds };
