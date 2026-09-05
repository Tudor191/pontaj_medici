const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("operatietatuaje")
    .setDescription("Adaugă o nouă persoană în arhiva operațiilor")
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
      .setTitle("📋 OPERAȚIE PENTRU SCOS TATUAJE")
      .addFields(
        { name: "👤 Nume", value: nume, inline: false },
        { name: "📝 Vârsta", value: varsta, inline: false },
        { name: "📅 Data", value: data, inline: false },
        { name: "👨🏻‍⚕️ Responsabil de Operație", value: responsabil, inline: false }
      )
      .setColor(0x00908b)
      .setTimestamp();

    if (poza) {
      embed.setImage(poza.url);
    }

    await interaction.reply({ embeds: [embed] }); // mesaj public
  }
};
