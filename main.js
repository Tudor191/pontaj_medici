require("dotenv").config({ quiet: true });

const { Client, Collection, GatewayIntentBits, REST, Routes, MessageFlags } = require("discord.js");
const fs = require("fs");
const { registerNicknameListener } = require("./events/nicknameUpdate");
const { startPontajWatcher } = require("./statusUpdater.js");
const { isNetworkError } = require("./utils/errors.js");

// timestamp explicit pe erori — utile ca să vezi dacă problemele de rețea au un
// tipar (aceeași oră, des/rar) și ca să ai ce arăta suportului găzduirii
function logError(message, error) {
  console.error(`[${new Date().toISOString()}] ${message}`, error);
}

function logWarn(message, error) {
  console.warn(`[${new Date().toISOString()}] ${message}`, error);
}

// === Siguranțe la nivel de proces: o eroare necapturată NU mai oprește botul ===
// (le înregistrăm primele, înainte de orice altceva, ca să prindem chiar și erori la încărcare)
process.on("unhandledRejection", reason => {
  logError("❌ [unhandledRejection] Promise respinsă și necapturată:", reason);
});

process.on("uncaughtException", error => {
  logError("❌ [uncaughtException] Eroare necapturată:", error);
});

const config = {
  TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID
};

for (const key of ["TOKEN", "CLIENT_ID", "GUILD_ID"]) {
  if (!config[key]) {
    console.error(`❌ Lipsește variabila de mediu pentru ${key === "TOKEN" ? "DISCORD_TOKEN" : key}. Verifică fișierul .env (vezi .env.example).`);
    process.exit(1);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers // necesar pentru nickname update & role checks
  ]
});

// erori la nivel de client/gateway (REST, WebSocket) — logăm, nu oprim botul
client.on("error", error => {
  logError("❌ [client.error] Eroare Client (gateway/REST):", error);
});

client.on("shardError", error => {
  logError("❌ [client.shardError] Eroare pe conexiunea WebSocket cu Discord:", error);
});

// colecții
client.commands = new Collection();
client.buttons = new Collection();

// încarcă comenzile
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
const commands = [];
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

// încarcă butoanele
const buttonFiles = fs.existsSync("./buttons")
  ? fs.readdirSync("./buttons").filter(file => file.endsWith(".js"))
  : [];
for (const file of buttonFiles) {
  const button = require(`./buttons/${file}`);
  client.buttons.set(button.customId, button);
}

// înregistrează comenzile slash
const rest = new REST({ version: "10" }).setToken(config.TOKEN);
(async () => {
  try {
    console.log("🔄 Înregistrez comenzile slash...");
    await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      { body: commands }
    );
    console.log("✅ Comenzile au fost înregistrate.");
  } catch (error) {
    logError("❌ Eroare la înregistrarea comenzilor slash:", error);
  }
})();

// când botul e online
client.once("clientReady", async () => {
  console.log(`🤖 ${client.user.tag} este online!`);
  startPontajWatcher(client);

  // setează status-ul botului
  client.user.setActivity("cu membrii serverului", { type: 0 });

  // înregistrăm listener-ul pentru nickname updates
  registerNicknameListener(client);
});

// descrie o interacțiune pentru logging (fără date sensibile)
function describeInteraction(interaction) {
  const parts = [];
  if (interaction.commandName) parts.push(`comandă=/${interaction.commandName}`);
  if (interaction.customId) parts.push(`buton=${interaction.customId}`);
  parts.push(`interactionId=${interaction.id}`);
  parts.push(`user=${interaction.user?.tag ?? "necunoscut"} (${interaction.user?.id ?? "?"})`);
  parts.push(`guildId=${interaction.guildId ?? "DM"}`);
  return parts.join(" | ");
}

// trimite mesajul de eroare către utilizator, fără să arunce mai departe
// dacă interaction-ul a expirat deja (ex: DiscordAPIError[10062] Unknown interaction)
async function reportInteractionError(interaction, error, publicMessage) {
  logError(`❌ Eroare la procesarea interacțiunii [${describeInteraction(interaction)}]:`, error);

  if (isNetworkError(error)) {
    // eroarea inițială a fost deja o problemă de conectivitate (nu de la Discord) —
    // o a doua încercare de reply ar eșua garantat din același motiv, așa că n-o mai facem
    logWarn(
      `⚠️ Eroarea de mai sus pentru [${describeInteraction(interaction)}] e o problemă de rețea (${error.code}) — ` +
        `nu mai încerc să trimit mesajul de eroare, ar eșua din același motiv.`
    );
    return;
  }

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: publicMessage, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: publicMessage, flags: MessageFlags.Ephemeral });
    }
  } catch (notifyError) {
    logError(
      `⚠️ Nu am putut trimite mesajul de eroare pentru [${describeInteraction(interaction)}] ` +
        `(interaction-ul este probabil expirat sau Discord a fost temporar inaccesibil):`,
      notifyError
    );
  }
}

// handler pentru interacțiuni (comenzi și butoane)
client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      await reportInteractionError(interaction, error, "❌ Eroare la executarea comenzii.");
    }
  } else if (interaction.isButton()) {
    const button = client.buttons.get(interaction.customId);
    if (!button) return;
    try {
      await button.execute(interaction);
    } catch (error) {
      await reportInteractionError(interaction, error, "❌ Eroare la executarea butonului.");
    }
  }
});

// pornește botul
client.login(config.TOKEN).catch(error => {
  logError("❌ Nu m-am putut conecta la Discord (login eșuat):", error);
  process.exit(1);
});
