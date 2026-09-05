const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "../pontaj.csv");

// 🔹 funcție de citire CSV (în secunde)
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

// 🔹 format frumos pentru embed
function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h} ore, ${m} minute și ${s} secunde`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verificapontaj")
    .setDescription("Verifică pontajul unui utilizator.")
    .addUserOption(option =>
      option
        .setName("utilizator")
        .setDescription("Utilizatorul căruia vrei să îi verifici pontajul")
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("utilizator");
    const username = targetUser.username;
    const pontaj = loadPontaj();

    let totalSec = pontaj[username] || 0;

    const embed = new EmbedBuilder()
      .setColor(totalSec > 0 ? "Blue" : "Grey")
      .setTitle(`Pontajul total lui:`)
      .setDescription(
        totalSec > 0
          ? `${targetUser}:\n **${formatTime(totalSec)}**`
          : `ℹ️ ${targetUser} nu are încă timp pontat.`
      )
      .setTimestamp();

    const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "../ephemeral.json"), "utf8"));
    await interaction.reply({ embeds: [embed], flags: settings.ephemeral ? MessageFlags.Ephemeral : undefined });
  },
};
