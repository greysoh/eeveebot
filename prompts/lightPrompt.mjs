import * as main from "./mainPrompt.mjs";

const name = "Lighter Eevee";
const prompt = main.prompt.split("Q:")[0].trim();

export { name, prompt }