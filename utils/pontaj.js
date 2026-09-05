// utils/pontaj.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const SPREADSHEET_ID = "1x1vECSTh8zk_SIyvN84SdGyz-7vGQacu94wQyN631a8";
const DEPT_SHEET = "LISTA DEPARTAMENT";
const ACTIVITY_SHEET = "EVIDENTA ACTIVITATE";

// 🔹 helper pentru autentificare
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "../credentials.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}

// 🔹 parse time HH:MM:SS în minute
function parseTimeToMinutes(time) {
  if (!time) return 0;
  const parts = time.split(":").map(Number);
  if (parts.length === 3) {
    return Math.floor(parts[0] * 60 + parts[1] + parts[2] / 60);
  } else if (parts.length === 2) {
    return Math.floor(parts[0] * 60 + parts[1]);
  }
  return Number(time) || 0;
}

// 🔹 conversie sigură din celulă în minute
function safeToMinutes(val) {
  if (!val || val === "-") return 0;
  return Number(val) || 0;
}

// 🔹 update pontaj zilnic
async function updateDailyPontaj() {
  try {
    const sheets = getSheetsClient();

    const csvPath = path.join(__dirname, "../pontaj.csv");
    if (!fs.existsSync(csvPath)) return;

    const data = fs.readFileSync(csvPath, "utf8").trim();
    if (!data) return;

    const totals = {};
    data.split("\n").forEach(line => {
      const [username, time] = line.split(",");
      totals[username] = parseTimeToSeconds(time);
    });

    const resDept = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${DEPT_SHEET}!C10:U200`
    });
    const deptRows = resDept.data.values || [];

    const resActivity = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ACTIVITY_SHEET}!C10:L300`
    });
    const activityRows = resActivity.data.values || [];

    const today = new Date();
    const dayIndex = today.getDay(); // 0=duminică ... 6=sâmbătă

    // mapare zi → coloană
    const dayToColumn = ["L", "F", "G", "H", "I", "J", "K"];
    const dayToColIndex = { 0: 9, 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8 };

    const colLetter = dayToColumn[dayIndex];
    let updates = 0;

    for (const [username, totalSeconds] of Object.entries(totals)) {
      const rowDept = deptRows.find(r => r[18] === username);
      if (!rowDept) continue;

      const callSign = rowDept[0];
      const idxActivity = activityRows.findIndex(r => r[0] === callSign);
      if (idxActivity === -1) continue;

      const rowActivity = activityRows[idxActivity] || [];

      // 🔹 DEBUG – vezi exact ce primim
      console.log("============");
      console.log("USER:", username, "| CallSign:", callSign);
      console.log("Row index:", idxActivity + 10); // +10 pt că începe la C10
      console.log("Raw rowActivity:", JSON.stringify(rowActivity));

      // total minute deja trecute până azi
      let totalMinutesSheet = 0;
      for (let j = 0; j < dayIndex; j++) {
        const colIdx = dayToColIndex[j];
        const val = rowActivity[colIdx] || "0";
        console.log(`Zi ${j} → colIdx ${colIdx} → val='${val}'`);
        totalMinutesSheet += parseTimeToSeconds(val);
      }

      console.log("TotalSeconds din CSV:", totalSeconds);
      console.log("TotalMinutesSheet calculat:", totalMinutesSheet);

      const valoareAzi = totalSeconds - totalMinutesSheet;
      console.log("VALOARE AZI (diferență):", valoareAzi);

      if (valoareAzi < 0) continue;

      const rowNumber = idxActivity + 10;
      const range = `${ACTIVITY_SHEET}!${colLetter}${rowNumber}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: "RAW",
        requestBody: {
          values: [[secondsToMinutes(valoareAzi)]]
        }
      });

      console.log(`✅ ${username} (${callSign}) → ${range}: ${secondsToMinutes(valoareAzi)} minute`);
      updates++;
    }

    console.log(`📊 Pontaj zilnic actualizat pentru ${updates} persoane`);
  } catch (err) {
    console.error("❌ Eroare la updateDailyPontaj:", err);
  }
}

module.exports = { updateDailyPontaj, parseTimeToMinutes };
