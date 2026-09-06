// utils/safeJson.js
const fs = require("fs");

// citește un fișier JSON simplu; dacă lipsește, e gol sau conține JSON invalid
// (ex: editat manual și lăsat pe jumătate), întoarce valoarea implicită în loc
// să arunce o eroare care ar pica interacțiunea care încearcă să-l citească
function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Fișierul ${filePath} conține JSON invalid, folosesc valoarea implicită:`, err);
    return fallback;
  }
}

module.exports = { readJsonFile };
