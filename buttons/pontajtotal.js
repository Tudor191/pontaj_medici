const fs = require("fs");
const path = require("path");
const { MessageFlags } = require("discord.js");
const { parsePontajLine } = require("../utils/pontajTime.js");
const { readJsonFile } = require("../utils/safeJson.js");

const csvPath = path.join(__dirname, "../pontaj.csv");

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

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

module.exports = {
  customId: "pontajtotal_button",
  async execute(interaction) {
    const username = interaction.user.username;
    const pontaj = loadPontaj();

    let totalSec = pontaj[username] || 0;

let message;
if (totalSec > 0) {
  message = `📊 ${interaction.user}, pontajul tău total este: **\`${formatTime(totalSec)}\`**`;
} else {
  message = `ℹ️ ${interaction.user}, nu ai încă timp pontat.`;
}

    const settings = readJsonFile(path.join(__dirname, "../ephemeral.json"), { ephemeral: false });
    await interaction.reply({ content: message, flags: settings.ephemeral ? MessageFlags.Ephemeral : undefined });
  },
};
