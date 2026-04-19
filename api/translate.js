import { createOpenAIClient, translateWithAI } from "../lib/translate-response.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const result = await translateWithAI({
      client: createOpenAIClient(),
      text: request.body?.text,
      targetLanguage: request.body?.targetLanguage,
      sourceType: request.body?.sourceType || "text"
    });

    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({
      error:
        error?.message ||
        "The AI translation request failed. Please check your API key and try again."
    });
  }
}
