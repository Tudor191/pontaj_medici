const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("detox")
    .setDescription("Adaugă o nouă persoană în arhiva pentru administrarea injectiei DETOX")
    .addStringOption(option =>
      option.setName("nume")
        .setDescription("Numele persoanei")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("varsta")
        .setDescription("Vârsta persoanei")
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName("poza")
        .setDescription("Poză cu buletinul")
        .setRequired(true)
    ),

  async execute(interaction) {
    const nume = interaction.options.getString("nume");
    const varsta = interaction.options.getString("varsta");
    const poza = interaction.options.getAttachment("poza");

    const data = new Date().toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" });
    const responsabil = `<@${interaction.user.id}>`;

    const embed = new EmbedBuilder()
      .setTitle("📋 ADMINISTRAREA INJECTIEI DETOX")
      .addFields(
        { name: "👤 Nume", value: nume, inline: false },
        { name: "📝 Vârsta", value: varsta, inline: false },
        { name: "📅 Data", value: data, inline: false },
        { name: "👨🏻‍⚕️ Responsabil de DETOX", value: responsabil, inline: false }
      )
      .setColor(0x4f8d46)
      .setTimestamp();

    if (poza) {
      embed.setImage(poza.url);
    }

    await interaction.reply({ embeds: [embed] }); // mesaj public
  }
};
