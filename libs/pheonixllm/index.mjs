// TODO: rename.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import * as url from 'node:url';

import axios from "axios";

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const supportedLLMTypes = ["llama"];
const port = 56796; // Generated using RNG

export class PheonixLLM {
  constructor(llmMeta) {
    // Some basic checks
    if (typeof llmMeta != "object") throw new Error("LLM metadata is not an object!");
    if (Array.isArray(llmMeta)) throw new Error("LLM must not be an array!");
    
    if (!existsSync(llmMeta.path)) throw new Error("LLM does not exist!");
    if (!supportedLLMTypes.includes(llmMeta.type)) throw new Error("Unsupported LLM type!");
    
    this.llmMetadata = llmMeta;
    
    this.hasStarted = false;
    this.messageQueue = [];
    this.childPython = spawn("echo", ["1"]);
  }

  async startInit(progressCallback = () => "") {
    if (this.hasStarted) throw new Error("Already initialized!");
    if (typeof progressCallback != "function") throw new Error("Progress callback is not a function!");

    this.childPython = spawn("flask", ["run", "-h", "127.0.0.1", "-p", "56796"], {
      env: {
        ...process.env,
        "FLASK_APP": __dirname + "backend/app.py",
        "PYTHONUNBUFFERED": "true",
        "LLM_TYPE": this.llmMetadata.type,
        "LLM_PATH": this.llmMetadata.path
      }
    });

    this.childPython.stderr.on("data", (stream) => {
      console.error(stream.toString());
    });

    this.childPython.stdout.on("data", (stream) => {
      const stdout = stream.toString();
      if (stdout.trim().startsWith("*")) return;

      try {
        JSON.parse(stdout);
      } catch (e) {
        console.error("ERROR: Failed to parse stdout!");
        console.error("Data: " + stdout);
        console.error("Trace: " + e);

        return;
      }

      const stdoutParsed = JSON.parse(stdout);

      if (stdoutParsed.type == "init") {
        if (stdoutParsed.message == "Ready") this.hasStarted = true;
        progressCallback(stdoutParsed.message);
      }

      console.log(`<PheonixLLM> ${stdoutParsed.type.toUpperCase()}: ${stdoutParsed.message}`);
    });

    while (true) {
      await new Promise((i) => setTimeout(i, 100));
      if (!this.hasStarted) continue;

      for (var i = 0; i < this.messageQueue.length; i++) {
        const messageRequest = this.messageQueue[0]; // Yes, this will always be 0. Bite me owo
        const { message, callback, maxNewTokens } = messageRequest;
        let modifiedMessage = message;

        for (var i = 0; i <= maxNewTokens; i++) {      
          const { data } = await axios.post(`http://127.0.0.1:${port}/send`, {
            message: modifiedMessage
          })
  
          modifiedMessage = data.message.replace("<s>", ""); // FIXME: what the fuck?  
        }

        callback(modifiedMessage);
        this.messageQueue.splice(0, 1);
      }
    }
  }

  // FIXME: is there a better way to do this or something
  async waitUntilInitialized() {
    while (!this.hasStarted) await new Promise((i) => setTimeout(i, 100));
  }

  async ask(message, maxTokens = 32) {
    return new Promise((resolve) => {
      if (typeof message != "string") throw new Error("Message given is not a string.")
      
      this.messageQueue.push({
        message,
        maxNewTokens: maxTokens,
        callback: resolve 
      })
    });
  }
}