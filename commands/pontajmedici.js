const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { readJsonFile } = require("../utils/safeJson.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pontajmedici")
    .setDescription("Afișează meniul de pontaj pentru medici."),
    
  async execute(interaction) {

     // 🔹 ștergem mesajul slash command ca să nu apară „/pontajmedici”
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
    await interaction.deleteReply().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setTitle("PONTAJ MEDICI")
      .setDescription(
        "Click **`DESCHIDERE/INCHIDERE PONTAJ`** pentru a porni/opri pontajul.\n" +
        "Pentru a vedea dacă ai pontajul pornit/oprit, apasă ❓\n" +
        "Pentru a vedea pontajul total, apasă 🕒"
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("onduty_button")
        .setLabel("DESCHIDERE/INCHIDERE PONTAJ")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("statuspontaj_button")
        .setEmoji("❓")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("pontajtotal_button")
        .setEmoji("🕒")
        .setStyle(ButtonStyle.Secondary)
    );

    const settings = readJsonFile(path.join(__dirname, "../ephemeral.json"), { ephemeral: false });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
