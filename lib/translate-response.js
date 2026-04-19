import OpenAI from "openai";

export const languageNames = {
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

export function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function translateWithAI({ client, text, targetLanguage, sourceType = "text" }) {
  if (!client) {
    throw new Error("OPENAI_API_KEY is missing. Add it to your environment before starting the backend.");
  }

  if (!text || typeof text !== "string") {
    throw new Error("Please send text to translate.");
  }

  if (!targetLanguage || !languageNames[targetLanguage]) {
    throw new Error("Please choose a supported target language.");
  }

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
            detectedLanguageCode: { type: "string" },
            detectedLanguageName: { type: "string" },
            normalizedText: { type: "string" },
            translatedText: { type: "string" }
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

  return {
    originalText: text.trim(),
    detectedLanguageCode: parsed.detectedLanguageCode,
    detectedLanguageName: parsed.detectedLanguageName,
    normalizedText: parsed.normalizedText,
    translatedText: parsed.translatedText
  };
}
