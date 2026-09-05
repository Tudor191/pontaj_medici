const { SlashCommandBuilder } = require("discord.js");
const { userSessions } = require("../userSessions.js");
const { statusMessages } = require("../statusUpdater.js");

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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verificastatuspontaje")
    .setDescription("Afișează statusul live pentru membrii cu callsign [M-xxx]."),
  async execute(interaction) {
    await interaction.deferReply();

    // folosim doar cache-ul, fără fetch
    const members = interaction.guild.members.cache;
    const lines = buildStatusLines(members);

    if (lines.length === 0) {
      return interaction.editReply("Nu am găsit membri cu nickname de forma [M-123].");
    }

    const msg = await interaction.editReply({
      content: `Am găsit ${lines.length} membri:\n\n${lines.join("\n")}`
    });

    // salvăm mesajul pentru actualizări ulterioare
    statusMessages[interaction.guild.id] = {
      channelId: msg.channel.id,
      messageId: msg.id
    };
  }
};
