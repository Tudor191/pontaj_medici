const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../credentials.json"), // cheia ta JSON descărcată din Google Cloud
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1x1vECSTh8zk_SIyvN84SdGyz-7vGQacu94wQyN631a8"; // ID-ul tău de spreadsheet
const SHEET_NAME = "LISTA DEPARTAMENT"; // numele sheet-ului

// 🔹 update pentru un callsign
async function updateUserInSheet(callsign, username) {
  try {
    // 1) Luăm toate valorile dintre C10:U104
    const range = `${SHEET_NAME}!C10:U104`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range
    });

    const rows = res.data.values || [];
    let foundRow = null;

    // 2) Găsim rândul unde se află callsignul
    rows.forEach((row, i) => {
      if (row[0] && row[0].includes(callsign)) {
        foundRow = i + 10; // offset pt că începi de la C10
      }
    });

    if (foundRow) {
      // 3) Ștergem username-ul vechi din toată coloana U (dacă există)
      const usernamesInU = rows.map(r => r[18] || ""); // coloana U = index 18 relativ la C
      const idxOldUser = usernamesInU.findIndex(u => u === username);

      if (idxOldUser !== -1) {
        const oldRow = idxOldUser + 10;
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!U${oldRow}`,
          valueInputOption: "RAW",
          requestBody: { values: [[""]] }
        });
      }

      // 4) Adăugăm username-ul pe rândul noului callsign (în U)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!U${foundRow}`,
        valueInputOption: "RAW",
        requestBody: { values: [[username]] }
      });
    }
  } catch (err) {
    console.error("❌ Eroare la updateUserInSheet:", err);
    throw err;
  }
}

// 🔹 listener pt nickname updates
function registerNicknameListener(client) {
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const oldNick = oldMember.nickname || oldMember.user.username;
    const newNick = newMember.nickname || newMember.user.username;

    if (oldNick === newNick) return;

    const match = newNick.match(/\[(?:M-)?(\d+)\]/);
    if (match) {
      const callsign = match[1];
      const username = newMember.user.username;

      try {
        await updateUserInSheet(callsign, username);
        console.log(`✅ Nickname update: ${username} -> callsign ${callsign}`);
      } catch (err) {
        console.error("❌ Eroare la updateUserInSheet:", err);
      }
    }
  });
}

module.exports = { updateUserInSheet, registerNicknameListener };
