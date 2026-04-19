import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createOpenAIClient, translateWithAI } from "./lib/translate-response.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const client = createOpenAIClient();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

app.post("/api/translate", async (request, response) => {
  try {
    const result = await translateWithAI({
      client,
      text: request.body?.text,
      targetLanguage: request.body?.targetLanguage,
      sourceType: request.body?.sourceType || "text"
    });
    response.json(result);
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
