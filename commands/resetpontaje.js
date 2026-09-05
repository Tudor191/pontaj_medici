const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetpontaj")
    .setDescription("Resetează toate pontajele din sistem."),
  
  async execute(interaction) {
    try {
      // ✅ confirmăm imediat interacțiunea
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // 1. Golim fișierul CSV (nu îl ștergem, doar îl curățăm)
      const csvPath = path.join(__dirname, "../pontaj.csv");
      fs.writeFileSync(csvPath, "", "utf8");

      // 2. Golim și coloanele F-L din "EVIDENTA ACTIVITATE"
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "../credentials.json"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      const sheets = google.sheets({ version: "v4", auth });

      const spreadsheetId = "1x1vECSTh8zk_SIyvN84SdGyz-7vGQacu94wQyN631a8";

      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: "EVIDENTA ACTIVITATE!F10:L", // coloanele zilelor
      });

      // ✅ trimitem mesajul final
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("!! Pontajele au fost **RESETATE** !!");

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("❌ Eroare la resetpontaj:", error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "❌ Eroare la resetpontaj." });
      } else {
        await interaction.reply({ content: "❌ Eroare la resetpontaj.", flags: MessageFlags.Ephemeral });
      }
    }
  }
};
