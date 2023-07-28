import discord from "discord.js";
const { SlashCommandBuilder } = discord;

import { getAllPrompts } from "../../prompts/index.mjs";

const data = new SlashCommandBuilder()
  .setName("get_prompt_list")
  .setDescription("Get the list of prompts");

export async function execute(interaction) {
  const promptList = await getAllPrompts();
  await interaction.reply(`Below are a list of prompts:\n\n${promptList.map((i) => i.name).join("\n")}`);
}

export { data };
