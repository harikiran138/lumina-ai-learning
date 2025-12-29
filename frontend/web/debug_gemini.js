const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testModel(modelName) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing!");
        process.exit(1);
    }

    console.log(`Testing model: "${modelName}"...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent("Hello, are you there?");
        const response = result.response.text();
        console.log(`✅ SUCCESS for "${modelName}"! Response: ${response}`);
        return true;
    } catch (error) {
        console.error(`❌ FAILED for "${modelName}": ${error.message}`);
        return false;
    }
}

async function run() {
    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-pro",
        "models/gemini-1.5-flash"
    ];

    for (const m of modelsToTest) {
        await testModel(m);
        console.log("---");
    }
}

run();
