// Require the necessary discord.js classes
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const __dirname = fileURLToPath(new URL('.', import.meta.url));

import discord from "discord.js";
const { Client, Events, Partials, GatewayIntentBits, Collection } = discord;

const { token } = JSON.parse(await readFile("./config.json"));

import { PheonixLLM } from "./libs/pheonixllm/index.mjs";
import { chatbot, chatbotLoader } from "./Chatbot.mjs";

import { getInstances, search } from "./libs/searxScraper/index.mjs";

const LLM = new PheonixLLM({
  path: "/home/meow/Downloads/open_llama_3b_v2",
  type: "llama"  
});

console.log("Fetching list of SearX instances...");
const instanceList = await getInstances(true);
const chosenInstance = Object.keys(instanceList.clearWeb)[0];

console.log("Using '%s'", chosenInstance);

const uidChatlogs = [];
LLM.startInit();

// While the LLM is initializing (the promise will never resolve) we create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel
  ] 
});

client.commands = new Collection();

const foldersPath = join(__dirname, 'commands');
const commandFolders = await readdir(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = join(foldersPath, folder);
  const commandFilesRaw = await readdir(commandsPath); // I love JS.
  const commandFiles = commandFilesRaw.filter((file) => file.endsWith('.js') || file.endsWith('.mjs'));
  
  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(`<EeveeBot> Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async(interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, uidChatlogs);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.on(Events.MessageCreate, async(message) => {
  if (message.content == "" || message.author.id == client.user.id) return;
  if (!uidChatlogs[message.author.id]) uidChatlogs[message.author.id] = chatbotLoader;
  
  // We send the typing indicator to give an illusion of this AI being more human than what it actually is.
  message.channel.sendTyping();

  const messageAtted = message.content.replace(`<@${client.user.id}> `, "");
  const aiSynthesized = await chatbot(LLM, messageAtted, uidChatlogs[message.author.id]);
  
  if (aiSynthesized.answer.startsWith("search_web")) {
    const query = aiSynthesized.answer.replace("search_web ", "").replaceAll("\n", "");
    const ogMsg = await message.reply("*Searching on the web for '" + query + "'*");
    
    const webSearch = await search(chosenInstance, query);
    message.channel.sendTyping();
    
    const aiSynthesizedNew = await chatbot(LLM, `Summarize the following: ${webSearch[0].summary}`, aiSynthesized.raw);
    if (aiSynthesizedNew.answer.startsWith("search_web")) {
      await ogMsg.edit("**ERROR** [CRITICAL]: Caught loop. FORCING ABORT...");
      uidChatlogs[message.author.id] = chatbotLoader;

      message.channel.send("*Message logs have been reset successfully.*");
      return;
    }

    await ogMsg.edit(aiSynthesizedNew.answer);
    uidChatlogs[message.author.id] = aiSynthesizedNew.raw;

    return;
  }

  message.reply(aiSynthesized.answer);
  uidChatlogs[message.author.id] = aiSynthesized.raw;
});

client.login(token);
