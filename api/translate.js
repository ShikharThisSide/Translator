import { createOpenAIClient, translateWithAI } from "../lib/translate-response.js";

async function getJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string") {
    return JSON.parse(request.body);
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = await getJsonBody(request);
    const result = await translateWithAI({
      client: createOpenAIClient(),
      text: body?.text,
      targetLanguage: body?.targetLanguage,
      sourceType: body?.sourceType || "text"
    });

    return response.status(200).json(result);
  } catch (error) {
    console.error("Vercel translate error:", error);

    return response.status(500).json({
      error:
        error?.message ||
        "The AI translation request failed. Please check your API key and try again."
    });
  }
}
