import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from "node:url";
import { join } from 'node:path';

import discord from "discord.js";
const { REST, Routes } = discord;

const { token, clientId, guildId } = JSON.parse(await readFile("./config.json"));

const commands = [];

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Grab all the command files from the commands directory you created earlier
const foldersPath = join(__dirname, 'commands');
const commandFolders = await readdir(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = join(foldersPath, folder);
  const commandFilesRaw = await readdir(commandsPath);
  const commandFiles = commandFilesRaw.filter((file) => file.endsWith('.js') || file.endsWith('.mjs'));
  
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
