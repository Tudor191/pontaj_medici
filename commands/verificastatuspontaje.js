const { SlashCommandBuilder } = require("discord.js");
const { statusMessages, buildStatusLines } = require("../statusUpdater.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verificastatuspontaje")
    .setDescription("Afișează statusul live pentru membrii cu callsign [M-xxx]."),
  async execute(interaction) {
    await interaction.deferReply();

    // folosim doar cache-ul, fără fetch
    const members = interaction.guild.members.cache;
    const lines = buildStatusLines(members);
    const content = lines.length > 0
      ? `Am găsit ${lines.length} membri:\n\n${lines.join("\n")}`
      : "Niciun membru pontat momentan.";

    // mesajul se înregistrează pentru actualizări chiar și atunci când lista e goală acum —
    // altfel, dacă cineva pornește pontajul mai târziu, nimic nu s-ar mai actualiza
    const msg = await interaction.editReply({ content });

    // salvăm mesajul pentru actualizări ulterioare
    statusMessages[interaction.guild.id] = {
      channelId: msg.channel.id,
      messageId: msg.id
    };
  }
};
