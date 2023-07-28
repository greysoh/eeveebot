import discord from "discord.js";
const { SlashCommandBuilder } = discord;

import { getAllPrompts } from "../../prompts/index.mjs";

const data = new SlashCommandBuilder()
  .setName("reset")
  .setDescription("Reset chatlogs")
  .addStringOption((option) =>
    option
      .setName('prompt')
      .setDescription('The prompt to change to'));

export async function execute(interaction, uidChatlogs) {
  const chosenPromptName = interaction.options.getString("prompt") ?? "Eevee";
  const promptList = await getAllPrompts();
  const promptElement = promptList.find((i) => i.name == chosenPromptName);

  if (!promptElement) return await interaction.reply("Prompt not found!");
  
  uidChatlogs[interaction.author] = promptElement.prompt;
  await interaction.reply("*Message logs have been reset successfully.*");
}

export { data };
