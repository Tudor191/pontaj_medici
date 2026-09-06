const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { MessageFlags } = require("discord.js");

const { userSessions, recentlyStopped } = require("../userSessions.js");
const { formatDuration, parsePontajLine, cellToSeconds } = require("../utils/pontajTime.js");
const { updateStatusMessage } = require("../statusUpdater.js");
const csvPath = path.join(__dirname, "../pontaj.csv");
const sessionsPath = path.join(__dirname, "../sessions.json");

// === Google Sheets setup ===
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});
const sheets = google.sheets({ version: "v4", auth });

// === Constante Sheet ===
const SPREADSHEET_ID = "1x1vECSTh8zk_SIyvN84SdGyz-7vGQacu94wQyN631a8";
const DEPT_SHEET = "LISTA DEPARTAMENT";
const ACTIVITY_SHEET = "EVIDENTA ACTIVITATE";

// ---------- Utilitare CSV ----------
if (!fs.existsSync(csvPath)) {
  fs.writeFileSync(csvPath, "", "utf8");
}

function loadPontaj() {
  if (!fs.existsSync(csvPath)) return {};
  const data = fs.readFileSync(csvPath, "utf8").trim();
  if (!data) return {};
  const lines = data.split("\n");
  const pontaj = {};
  for (const line of lines) {
    const parsed = parsePontajLine(line);
    if (parsed) pontaj[parsed.username] = parsed.totalSeconds;
  }
  return pontaj;
}

function savePontaj(pontaj) {
  const lines = Object.entries(pontaj).map(([username, totalSec]) => `${username},${formatDuration(totalSec)}`);
  fs.writeFileSync(csvPath, lines.join("\n"), "utf8");
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h} ore, ${m} minute și ${s} secunde`;
}

// ---------- Utilitare sessions ----------
function loadSessions() {
  if (!fs.existsSync(sessionsPath)) return {};
  return JSON.parse(fs.readFileSync(sessionsPath, "utf8"));
}

function saveSessions(sessions) {
  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2), "utf8");
}

async function updateTodayMinutesInSheet(username, totalSeconds) {
  try {
    const resDept = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${DEPT_SHEET}!C10:U200`
    });
    const deptRows = resDept.data.values || [];
    const deptRow = deptRows.find(r => (r[18] || "") === username);
    if (!deptRow) return;

    const callSign = deptRow[0];
    const resActivity = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ACTIVITY_SHEET}!C10:L400`
    });
    const activityRows = resActivity.data.values || [];
    const idxActivity = activityRows.findIndex(r => (r[0] || "") === callSign);
    if (idxActivity === -1) return;

    const rowActivity = activityRows[idxActivity] || [];
    const day = new Date().getDay();
    const dayIndex = day === 0 ? 6 : day - 1;
    const colLetters = ["F", "G", "H", "I", "J", "K", "L"];
    const colLetter = colLetters[dayIndex];

    let sumaZileAnterioareSec = 0;
    for (let j = 0; j < dayIndex; j++) {
      const cell = rowActivity[3 + j];
      sumaZileAnterioareSec += cellToSeconds(cell);
    }

    const todaySec = Math.max(0, totalSeconds - sumaZileAnterioareSec);
    const todayMinutes = Math.floor(todaySec / 60);

    const rowNumber = idxActivity + 10;
    const writeRange = `${ACTIVITY_SHEET}!${colLetter}${rowNumber}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: writeRange,
      valueInputOption: "RAW",
      requestBody: { values: [[todayMinutes]] }
    });
  } catch (err) {
    console.error("❌ [Sheets] Eroare:", err);
  }
}

// ---------- Salvare periodică (la 1 minut) ----------
setInterval(() => {
  try {
    const sessions = loadSessions();
    const pontaj = loadPontaj();

    for (const [userId, session] of Object.entries(sessions)) {
      const elapsedSec = Math.floor((Date.now() - session.startTime) / 1000);
      pontaj[session.username] = (session.baseSeconds || 0) + elapsedSec;
    }

    savePontaj(pontaj);
  } catch (err) {
    console.error("❌ Eroare la salvarea periodică a pontajului:", err);
  }
}, 60 * 1000);

// ---------- Comanda butonului ----------
module.exports = {
  customId: "onduty_button",
  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "../ephemeral.json"), "utf8"));

    const sessions = loadSessions();
    const pontaj = loadPontaj();

    if (sessions[userId]) {
      // === OPRIRE PONTAJ ===
      const startTime = sessions[userId].startTime;
      const baseSeconds = sessions[userId].baseSeconds || 0;
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);

      const total = baseSeconds + elapsedSec;
      pontaj[username] = total;
      savePontaj(pontaj);

      delete sessions[userId];
      saveSessions(sessions);
      delete userSessions[userId];
      recentlyStopped[userId] = Date.now();

      await interaction.reply({
        content: `🛑 **Pontaj oprit**\nAi adăugat **\`${formatTime(elapsedSec)}\`** la total.`,
        flags: settings.ephemeral ? MessageFlags.Ephemeral : undefined
      });

      if (interaction.guild) {
        updateStatusMessage(interaction.guild).catch(err =>
          console.error("❌ Eroare la actualizarea listei de status după oprire pontaj:", err)
        );
      }

      await updateTodayMinutesInSheet(username, total);

    } else {
      // === PORNIRE PONTAJ ===
      userSessions[userId] = Date.now();
      delete recentlyStopped[userId];
      sessions[userId] = {
        username,
        startTime: Date.now(),
        baseSeconds: pontaj[username] || 0
      };
      saveSessions(sessions);

      await interaction.reply({
        content: `✅ **Pontaj pornit**\nAi pornit pontajul în medici.`,
        flags: settings.ephemeral ? MessageFlags.Ephemeral : undefined
      });

      if (interaction.guild) {
        updateStatusMessage(interaction.guild).catch(err =>
          console.error("❌ Eroare la actualizarea listei de status după pornire pontaj:", err)
        );
      }
    }
  }
};
