const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { userSessions } = require("../userSessions.js");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("verificastatuspontajbackup")
    .setDescription("Verifică dacă un utilizator are pontajul pornit.")
    .addUserOption(option =>
      option
        .setName("utilizator")
        .setDescription("Utilizatorul pe care vrei să-l verifici")
        .setRequired(true)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("utilizator");
    const isActive = !!userSessions[user.id];
    const targetUser = interaction.options.getUser("utilizator");

    if (isActive) {
      await interaction.reply({
        content: `🟢 <@${targetUser.id}> are pontajul **PORNIT**.`,
        flags: MessageFlags.Ephemeral
      });
    } else {
      await interaction.reply({
        content: `⚪ <@${targetUser.id}> **NU** are pontajul pornit.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
