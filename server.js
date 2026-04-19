import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const languageNames = {
  ar: "Arabic",
  bn: "Bengali",
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  gu: "Gujarati",
  hi: "Hindi",
  it: "Italian",
  ja: "Japanese",
  kn: "Kannada",
  ko: "Korean",
  ml: "Malayalam",
  mr: "Marathi",
  pa: "Punjabi",
  pt: "Portuguese",
  ru: "Russian",
  ta: "Tamil",
  te: "Telugu",
  tr: "Turkish",
  ur: "Urdu",
  vi: "Vietnamese",
  zh: "Chinese"
};

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

app.post("/api/translate", async (request, response) => {
  const { text, targetLanguage, sourceType = "text" } = request.body || {};

  if (!client) {
    return response.status(500).json({
      error:
        "OPENAI_API_KEY is missing. Add it to your environment before starting the backend."
    });
  }

  if (!text || typeof text !== "string") {
    return response.status(400).json({
      error: "Please send text to translate."
    });
  }

  if (!targetLanguage || !languageNames[targetLanguage]) {
    return response.status(400).json({
      error: "Please choose a supported target language."
    });
  }

  try {
    // We ask the model for structured JSON so the frontend gets predictable fields.
    const aiResponse = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: `You are a translation engine for a beginner-friendly web app.
Detect the source language automatically.
Understand mixed-language text such as Hinglish, casual slang, and minor spelling mistakes.
Normalize the text before translating, but keep the original meaning and tone.
When target language is English, produce grammatically correct natural English, never a literal word-by-word transliteration.
Treat Hinglish as spoken Hindi written with English letters and translate the meaning, not the surface words.
If a sentence contains multiple clauses, rewrite it as fluent English sentences.
Return concise, accurate values only.
If the text is already in the target language, keep the translated text natural and polished.

Examples:
- "tum kaha ho bro, kal milte hai?" -> "Bro, where are you? Shall we meet tomorrow?"
- "bhai aaj mast mausam hai" -> "Bro, the weather is great today."
- "aaj ka din boht accha hai" -> "Today is a very good day."`,
      input: `Source type: ${sourceType}
Target language code: ${targetLanguage}
Target language name: ${languageNames[targetLanguage]}
Text to process:
${text}`,
      text: {
        format: {
          type: "json_schema",
          name: "translator_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              detectedLanguageCode: {
                type: "string"
              },
              detectedLanguageName: {
                type: "string"
              },
              normalizedText: {
                type: "string"
              },
              translatedText: {
                type: "string"
              }
            },
            required: [
              "detectedLanguageCode",
              "detectedLanguageName",
              "normalizedText",
              "translatedText"
            ]
          }
        }
      }
    });

    const parsed = JSON.parse(aiResponse.output_text);

    response.json({
      originalText: text.trim(),
      detectedLanguageCode: parsed.detectedLanguageCode,
      detectedLanguageName: parsed.detectedLanguageName,
      normalizedText: parsed.normalizedText,
      translatedText: parsed.translatedText
    });
  } catch (error) {
    console.error("Translation error:", error);

    response.status(500).json({
      error:
        error?.message ||
        "The AI translation request failed. Please check your API key and try again."
    });
  }
});

app.get("*", (_request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`AI translator running at http://localhost:${port}`);
});
