const { userSessions, recentlyStopped } = require("./userSessions.js");

const statusMessages = {}; // salvăm mesajele pentru fiecare guild

// cât de des reeditam mesajul ca să prindem cine a mai pornit/oprit pontajul —
// timpul afișat ("PORNIT de ...") ține pasul singur, nativ în Discord (<t:...:R>),
// fără nicio cerere suplimentară — asta doar reîmprospătează lista de membri
const STATUS_REFRESH_MS = 60 * 1000;

// cât timp rămâne cineva vizibil ca "OPRIT" după ce oprește pontajul, înainte
// să dispară din listă ca să nu se umple de nume vechi
const STOPPED_RETENTION_MS = 5 * 60 * 1000;

// regex pentru pattern [M-123]
const pattern = /\[M-(\d{3})\]/;

function getStartTimestampFromSession(session) {
  if (!session) return null;
  if (typeof session === "number") return session;
  if (session.start) return session.start;
  if (session.startedAt) return session.startedAt;
  if (session.timestamp) return session.timestamp;
  return null;
}

function buildStatusLines(members) {
  const arr = [];
  const now = Date.now();

  for (const [, member] of members) {
    const nickname = member.nickname || member.displayName || "";
    if (!pattern.test(nickname)) continue; // ignorăm dacă nu are [M-xxx]

    const session = userSessions[member.id];
    if (session) {
      const start = getStartTimestampFromSession(session);
      if (start) {
        const unix = Math.floor(start / 1000);
        arr.push(`🟢 ${nickname} (<@${member.id}>) — PORNIT de <t:${unix}:R>`);
      } else {
        arr.push(`🟢 ${nickname} (<@${member.id}>) — PORNIT`);
      }
      continue;
    }

    // nu mai are pontajul pornit — rămâne vizibil ca OPRIT doar STOPPED_RETENTION_MS
    // de la oprire, apoi dispare din listă ca să nu ocupe spațiu la nesfârșit
    const stoppedAt = recentlyStopped[member.id];
    if (stoppedAt && now - stoppedAt < STOPPED_RETENTION_MS) {
      arr.push(`⚪ ${nickname} (<@${member.id}>) — OPRIT`);
    }
  }
  return arr;
}

// scoate din memorie intrările "oprit" mai vechi decât fereastra de afișare
function pruneRecentlyStopped() {
  const now = Date.now();
  for (const [userId, stoppedAt] of Object.entries(recentlyStopped)) {
    if (now - stoppedAt >= STOPPED_RETENTION_MS) {
      delete recentlyStopped[userId];
    }
  }
}

async function updateStatusMessage(guild) {
  try {
    const status = statusMessages[guild.id];
    if (!status) return; // nimeni n-a rulat /verificastatuspontaje în acest guild încă

    const channel = guild.channels.cache.get(status.channelId);
    if (!channel) return;

    const msg = await channel.messages.fetch(status.messageId).catch(() => null);
    if (!msg) return;

    const members = guild.members.cache; // doar cache, fără fetch
    const lines = buildStatusLines(members);
    const content = lines.length > 0
      ? `Am găsit ${lines.length} membri:\n\n${lines.join("\n")}`
      : "Niciun membru pontat momentan.";

    await msg.edit({ content });
  } catch (err) {
    console.error("❌ Eroare la updateStatusMessage:", err);
  }
}

function startPontajWatcher(client) {
  setInterval(() => {
    pruneRecentlyStopped();
    client.guilds.cache.forEach(guild => {
      updateStatusMessage(guild).catch(err =>
        console.error(`❌ Eroare în watcher-ul de status pentru guild ${guild.id}:`, err)
      );
    });
  }, STATUS_REFRESH_MS);
}

module.exports = {
  statusMessages,
  startPontajWatcher,
  updateStatusMessage,
  buildStatusLines,
  getStartTimestampFromSession,
  pruneRecentlyStopped
};
