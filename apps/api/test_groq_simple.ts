
import { config } from 'dotenv';
config();

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

async function main() {
    console.log("Checking Environment...");
    if (!process.env.GROQ_API_KEY) {
        console.error("❌ GROQ_API_KEY is missing in .env");
        return;
    }
    console.log("Key found:", process.env.GROQ_API_KEY.substring(0, 10) + "...");

    console.log("Initializing Provider...");
    const groq = createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
    });

    // Test simple model first
    const model = groq('llama-3.1-8b-instant');

    console.log("Sending request to Groq...");
    try {
        const start = Date.now();
        const result = await generateText({
            model,
            prompt: 'Reply with "OK" if you can hear me.',
        });
        const duration = Date.now() - start;
        console.log(`✅ Success (${duration}ms):`, result.text);
    } catch (e) {
        console.error("❌ Failed:", e);
    }
}

main();
