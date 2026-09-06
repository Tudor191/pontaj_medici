const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const { readJsonFile } = require("../utils/safeJson.js");

const counterFile = "./internari.json";

// dacă nu există fișierul, îl creăm cu valoarea de start
if (!fs.existsSync(counterFile)) {
  fs.writeFileSync(counterFile, JSON.stringify({ count: 0 }, null, 2));
}

// funcție pentru a citi contorul din fișier
function getCounter() {
  return readJsonFile(counterFile, { count: 0 }).count || 0;
}

// funcție pentru a salva contorul actualizat
function saveCounter(value) {
  fs.writeFileSync(counterFile, JSON.stringify({ count: value }, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("internare")
    .setDescription("Adaugă o internare nouă")
    .addStringOption(option =>
      option.setName("nume")
        .setDescription("Numele persoanei")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("motiv")
        .setDescription("Motivul internării")
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName("poza")
        .setDescription("Poză cu buletinul")
        .setRequired(true)
    ),

  async execute(interaction) {
    // citim și incrementăm contorul
    let internareCount = getCounter() + 1;
    saveCounter(internareCount);

    const nume = interaction.options.getString("nume");
    const motiv = interaction.options.getString("motiv");
    const poza = interaction.options.getAttachment("poza");

    const data = new Date().toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" });
    const responsabil = `<@${interaction.user.id}>`;

    const embed = new EmbedBuilder()
      .setTitle(`📋 Internare Nouă #${internareCount}`)
      .addFields(
        { name: "👤 Nume", value: nume, inline: false },
        { name: "📅 Data", value: data, inline: false },
        { name: "📝 Motiv", value: motiv, inline: false },
        { name: "👨🏻‍⚕️ Responsabil de Internare", value: responsabil, inline: false }
      )
      .setColor(0xff000d)
      .setTimestamp();

    if (poza) {
      embed.setImage(poza.url);
    }

    await interaction.reply({ embeds: [embed] }); // mesaj public
  }
};
