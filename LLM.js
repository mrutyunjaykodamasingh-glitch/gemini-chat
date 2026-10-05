import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Set the GEMINI_API_KEY environment variable before running this script.");
}

const ai = new GoogleGenAI({ apiKey });
const interaction = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: "what is array, explain with example",
});

console.log(interaction.output_text);