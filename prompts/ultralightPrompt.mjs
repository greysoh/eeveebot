import * as main from "./mainPrompt.mjs";

const name = "Ultra Light Eevee";
const prompt = main.prompt.split("**")[0].trim();

export { name, prompt }