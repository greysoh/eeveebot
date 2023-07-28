import { prompt } from "./prompts/mainPrompt.mjs";

const chatbotLoader = prompt; // FIXME: is there a better way to do this?
export { chatbotLoader };

console.log(
  "<Chatbot> Running Discord modifications v0.0.1, chatbotLoader v0.1.1"
);

const hardTokenLimit = 128;

export async function chatbot(pheonix, question = "", history = chatbotLoader) {
  let futureDerivedHistory = history + "\nQ: " + question + "\nA:";

  for (var i = 0; i < hardTokenLimit; i++) {
    console.log("INFO: Currently generating %s/%s tokens.", i, hardTokenLimit);

    if (i == hardTokenLimit) {
      console.error("ERROR: Reached hard token limit. Abandoning!");
      break;
    }

    futureDerivedHistory = await pheonix.ask(futureDerivedHistory, 0);

    // FIXME: This check could be improved, but it's fine *for now*.
    if (futureDerivedHistory.trim().endsWith("Q:") && i > 2) {
      futureDerivedHistory = futureDerivedHistory.substring(
        0,
        futureDerivedHistory.lastIndexOf("\n")
      );
      break;
    }
  }

  return {
    raw: futureDerivedHistory,
    answer: futureDerivedHistory
      .replace(history, "")
      .replace("\nQ: " + question + "\nA: ", "")
      .trim(""),
  };
}