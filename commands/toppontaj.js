const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "../pontaj.csv");
const settingsPath = path.join(__dirname, "../ephemeral.json");

// funcție de citire pontaj.csv
function loadPontaj() {
  if (!fs.existsSync(csvPath)) return {};
  const data = fs.readFileSync(csvPath, "utf8").trim();
  if (!data) return {};
  const lines = data.split("\n");
  const pontaj = {};
  for (const line of lines) {
    const [username, timeStr] = line.split(",");
    const parts = timeStr.match(/(\d+)h (\d+)m (\d+)s/);
    if (parts) {
      const totalSeconds =
        parseInt(parts[1]) * 3600 +
        parseInt(parts[2]) * 60 +
        parseInt(parts[3]);
      pontaj[username] = totalSeconds;
    }
  }
  return pontaj;
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("topontaje")
    .setDescription("Afișează top 3 utilizatori după pontajul total"),

  async execute(interaction) {
    const pontaj = loadPontaj();

    // citim setarea ephemeral.json
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    const flags = settings.ephemeral === true ? MessageFlags.Ephemeral : undefined;

    // transformăm obiectul în array și sortăm
    const leaderboard = Object.entries(pontaj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (leaderboard.length === 0) {
      return await interaction.reply({
        content: "⚪ Nu există încă date de pontaj.",
        flags
      });
    }

    let message = "🏆 **Top 3 utilizatori după pontaj:**\n\n";
    for (let i = 0; i < leaderboard.length; i++) {
      const [username, totalSec] = leaderboard[i];
      // mentionăm userul dacă e pe server
      const member = interaction.guild.members.cache.find(m => m.user.username === username);
      const mention = member ? `${member.user}` : `\`${username}\``;

      message += `${i + 1}. ${mention} — **\`${formatTime(totalSec)}\`**\n`;
    }

    await interaction.reply({
      content: message,
      flags
    });
  }
};
