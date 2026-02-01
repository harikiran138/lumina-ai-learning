const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing!");
    process.exit(1);
  }

  console.log("Fetching available models...");

  // Note: The SDK might not expose listModels directly on the main class in all versions.
  // We'll try to use the REST API via fetch if SDK fails, but let's try a direct approach first
  // or just use fetch since we know the API key.

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("API Error:", data.error);
      return;
    }

    if (data.models) {
      console.log("✅ Available Models:");
      data.models.forEach((m) => {
        console.log(
          `- ${m.name} (Supported methods: ${m.supportedGenerationMethods})`,
        );
      });
    } else {
      console.log("No models found in response:", data);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

listModels();
