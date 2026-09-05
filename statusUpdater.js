const { userSessions } = require("./userSessions.js");

const statusMessages = {}; // salvăm mesajele pentru fiecare guild

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
    } else {
      arr.push(`⚪ ${nickname} (<@${member.id}>) — OPRIT`);
    }
  }
  return arr;
}

async function updateStatusMessage(guild) {
  try {
    const members = guild.members.cache; // doar cache, fără fetch
    const lines = buildStatusLines(members);

    if (lines.length === 0) return;

    const status = statusMessages[guild.id];
    if (!status) return;

    const channel = guild.channels.cache.get(status.channelId);
    if (!channel) return;

    const msg = await channel.messages.fetch(status.messageId).catch(() => null);
    if (!msg) return;

    await msg.edit({
      content: `Am găsit ${lines.length} membri:\n\n${lines.join("\n")}`
    });
  } catch (err) {
    console.error("❌ Eroare la updateStatusMessage:", err);
  }
}

function startPontajWatcher(client) {
  // actualizează statusul la fiecare 60 secunde
  setInterval(() => {
    client.guilds.cache.forEach(guild => {
      updateStatusMessage(guild).catch(err =>
        console.error(`❌ Eroare în watcher-ul de status pentru guild ${guild.id}:`, err)
      );
    });
  }, 60 * 1000);
}

module.exports = {
  statusMessages,
  startPontajWatcher,
  updateStatusMessage,
  buildStatusLines,
  getStartTimestampFromSession
};
