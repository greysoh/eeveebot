import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function getAllPrompts() {
  const prompts = [];

  const promptListUnfiltered = await readdir(__dirname);
  const promptList = promptListUnfiltered.filter((i) => i != "index.mjs"); //  || !(i.endsWith(".js") && i.endsWith(".mjs"))

  for (const promptItem of promptList) {
    const { name, prompt } = await import(__dirname + "/" + promptItem);

    prompts.push({
      name,
      prompt
    })
  }

  return prompts;
}