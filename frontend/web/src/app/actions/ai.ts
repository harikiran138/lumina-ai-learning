"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const createGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return null;
  }
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: "gemini-1.5-flash" });
};

export async function chatWithAI(messages: any[]) {
  try {
    const model = createGeminiModel();
    if (!model) {
      return {
        id: "error",
        role: "assistant",
        content:
          "I'm sorry, my AI brain is currently disconnected (API Key missing). Please check the system configuration.",
      };
    }

    const prompt = messages
      .map((message) => {
        const content =
          typeof message?.content === "string"
            ? message.content
            : JSON.stringify(message?.content ?? "");
        return `${message?.role || "user"}: ${content}`;
      })
      .join("\n");
    const response = await model.generateContent(prompt);

    return {
      id: Date.now().toString(),
      role: "assistant",
      content: response.response.text(),
    };
  } catch (e: any) {
    console.error("Chat AI Error:", e);
    return {
      id: "error",
      role: "assistant",
      content: "I'm having trouble thinking right now. Please try again later.",
    };
  }
}
