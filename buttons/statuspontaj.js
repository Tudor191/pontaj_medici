const { userSessions } = require("../userSessions.js");
const fs = require("fs");
const path = require("path");
const { MessageFlags } = require("discord.js");
const { readJsonFile } = require("../utils/safeJson.js");

module.exports = {
  customId: "statuspontaj_button",
  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;

let message;
if (userSessions[userId]) {
  message = `✅ ${interaction.user}, ai pontajul **PORNIT**.`;
} else {
  message = `🛑 ${interaction.user}, \`NU AI\` pontajul pornit.`;
}

    const settings = readJsonFile(path.join(__dirname, "../ephemeral.json"), { ephemeral: false });
    await interaction.reply({ content: message, flags: settings.ephemeral ? MessageFlags.Ephemeral : undefined });
  },
};
