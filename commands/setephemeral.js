const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { readJsonFile } = require("../utils/safeJson.js");

const settingsPath = path.join(__dirname, "../ephemeral.json");

// citește setările
function loadSettings() {
  return readJsonFile(settingsPath, { ephemeral: false });
}

// salvează setările
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setephemeral")
    .setDescription("Configurează preferințe globale")
    .addStringOption(option =>
      option.setName("tip")
        .setDescription("Setare pe care vrei să o modifici")
        .setRequired(true)
        .addChoices(
          { name: "ephemeral", value: "ephemeral" }
        )
    ),
  
  async execute(interaction) {
    const settings = loadSettings();

    if (interaction.options.getString("tip") === "ephemeral") {
      settings.ephemeral = !settings.ephemeral;
      saveSettings(settings);

      const embed = new EmbedBuilder()
        .setColor(settings.ephemeral ? "Blue" : "Grey")
        .setTitle("Setare globală modificată")
        .setDescription(settings.ephemeral 
          ? "🔒 Toate răspunsurile botului vor fi **ephemeral** (doar cel care rulează comanda le vede)." 
          : "🌍 Toate răspunsurile botului vor fi **publice**.")
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
};
