import { GoogleGenAI } from "@google/genai";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 3000;
const MAX_ASSISTANT_MESSAGE_LENGTH = 12000;
const MAX_CONVERSATION_LENGTH = 40000;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const messages = request.body?.messages;
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages[messages.length - 1]?.role !== "user" ||
    messages.some(
      (message) =>
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" ||
        !message.content.trim() ||
        message.content.length >
          (message.role === "user" ? MAX_MESSAGE_LENGTH : MAX_ASSISTANT_MESSAGE_LENGTH),
    ) ||
    messages.reduce((total, message) => total + message.content.length, 0) >
      MAX_CONVERSATION_LENGTH
  ) {
    return response.status(400).json({ error: "Invalid chat messages." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return response.status(500).json({ error: "The chat service is not configured." });
  }

  const input = messages
    .map(({ role, content }) => `${role === "assistant" ? "Assistant" : "User"}: ${content.trim()}`)
    .join("\n\n");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: `${input}\n\nAssistant:`,
    });
    const reply = interaction.output_text?.trim();

    if (!reply) {
      console.error("Gemini returned an empty response.");
      return response.status(502).json({ error: "The model returned an empty response." });
    }

    return response.status(200).json({ reply });
  } catch (error) {
    console.error("Gemini request failed:", error);
    return response.status(502).json({ error: "The chat request failed. Please try again." });
  }
}
