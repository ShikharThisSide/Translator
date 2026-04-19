const languageList = {
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

const speechLanguageMap = {
  ar: "ar-SA",
  bn: "bn-BD",
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  gu: "gu-IN",
  hi: "hi-IN",
  it: "it-IT",
  ja: "ja-JP",
  kn: "kn-IN",
  ko: "ko-KR",
  ml: "ml-IN",
  mr: "mr-IN",
  pa: "pa-IN",
  pt: "pt-PT",
  ru: "ru-RU",
  ta: "ta-IN",
  te: "te-IN",
  tr: "tr-TR",
  ur: "ur-PK",
  vi: "vi-VN",
  zh: "zh-CN"
};

const API_BASE_URL = window.TRANSLATOR_API_BASE || "";

const targetLanguage = document.getElementById("targetLanguage");
const inputText = document.getElementById("inputText");
const translateButton = document.getElementById("translateButton");
const pasteButton = document.getElementById("pasteButton");
const clearButton = document.getElementById("clearButton");
const copyTextButton = document.getElementById("copyTextButton");
const themeSwitch = document.getElementById("themeSwitch");
const statusMessage = document.getElementById("statusMessage");
const textLoader = document.getElementById("textLoader");

const imageInput = document.getElementById("imageInput");
const uploadZone = document.getElementById("uploadZone");
const imagePreview = document.getElementById("imagePreview");
const imagePlaceholder = document.getElementById("imagePlaceholder");
const extractButton = document.getElementById("extractButton");
const translateImageButton = document.getElementById("translateImageButton");
const removeImageButton = document.getElementById("removeImageButton");
const copyImageButton = document.getElementById("copyImageButton");
const speakImageButton = document.getElementById("speakImageButton");
const ocrStatusMessage = document.getElementById("ocrStatusMessage");
const ocrLoader = document.getElementById("ocrLoader");
const ocrProgressShell = document.getElementById("ocrProgressShell");
const ocrProgressBar = document.getElementById("ocrProgressBar");
const ocrProgressLabel = document.getElementById("ocrProgressLabel");

const translatedTextResult = document.getElementById("translatedTextResult");
const extractedTextResult = document.getElementById("extractedTextResult");
const imageDetectedLanguageResult = document.getElementById("imageDetectedLanguageResult");
const imageTranslatedTextResult = document.getElementById("imageTranslatedTextResult");

const state = {
  imageFile: null,
  imagePreviewUrl: "",
  extractedText: "",
  textTranslation: "",
  imageTranslation: "",
  textTargetLanguage: "en"
};

const romanHindiDictionary = {
  aaj: "today",
  acha: "good",
  achha: "good",
  apna: "my",
  bhai: "bro",
  baat: "thing",
  bahut: "very",
  bro: "bro",
  boht: "very",
  dhoondh: "find",
  hai: "is",
  hain: "are",
  kal: "tomorrow",
  kaha: "where",
  kaafi: "quite",
  kar: "do",
  karna: "to do",
  main: "I",
  mast: "great",
  mausam: "weather",
  milte: "meet",
  project: "project",
  raha: "am",
  rha: "am",
  soch: "thinking",
  subah: "morning",
  tum: "you",
  user: "user",
  yaar: "friend"
};

function populateLanguages() {
  Object.entries(languageList).forEach(([code, name]) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    targetLanguage.appendChild(option);
  });

  targetLanguage.value = state.textTargetLanguage;
}

function setMessage(element, message, type = "neutral") {
  element.textContent = message;
  element.classList.remove("error", "success");

  if (type === "error") {
    element.classList.add("error");
  }

  if (type === "success") {
    element.classList.add("success");
  }
}

function toggleLoader(loader, shouldShow) {
  loader.classList.toggle("hidden", !shouldShow);
}

function setButtonBusy(button, isBusy, busyLabel, idleLabel) {
  button.disabled = isBusy;
  button.textContent = isBusy ? busyLabel : idleLabel;
}

function updateResult(element, value, fallback) {
  element.textContent = value || fallback;
  element.classList.toggle("muted-result", !value);
}

function resetTextResults() {
  updateResult(translatedTextResult, "", "Final translation will appear here.");
  state.textTranslation = "";
}

function resetImageResults() {
  updateResult(extractedTextResult, "", "OCR text will appear here.");
  updateResult(imageDetectedLanguageResult, "", "Waiting for OCR translation...");
  updateResult(imageTranslatedTextResult, "", "Image translation will appear here.");
  state.extractedText = "";
  state.imageTranslation = "";
}

function getSpeechLanguage(code) {
  return speechLanguageMap[code] || "en-US";
}

function getApiBaseCandidates() {
  const candidates = [];

  if (API_BASE_URL) {
    candidates.push(API_BASE_URL.replace(/\/$/, ""));
  } else {
    candidates.push("");
  }

  if (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
  ) {
    const localBackend = `${window.location.protocol}//${window.location.hostname}:3000`;

    if (!candidates.includes(localBackend)) {
      candidates.push(localBackend);
    }
  }

  return candidates;
}

async function requestTranslation(text, targetCode, sourceType) {
  const apiBases = getApiBaseCandidates();
  let lastError = null;

  for (const baseUrl of apiBases) {
    try {
      const response = await fetch(`${baseUrl}/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          targetLanguage: targetCode,
          sourceType
        })
      });

      const responseType = response.headers.get("content-type") || "";

      if (!responseType.includes("application/json")) {
        throw new Error("Backend unavailable");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Translation request failed.");
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  const detectedLanguage = detectLanguageHeuristically(text);

  if (detectedLanguage.code === "hi-Latn") {
    throw new Error(
      "For accurate Hinglish translation, start the backend with npm install and npm start, then open http://localhost:3000."
    );
  }

  if (lastError) {
    return translateInBrowser(text, targetCode, sourceType);
  }

  throw new Error("Translation service is unavailable right now.");
}

function detectLanguageHeuristically(text) {
  const lowered = text.toLowerCase().trim();

  if (/[\u0900-\u097f]/.test(text)) {
    return { code: "hi", name: "Hindi" };
  }

  const romanHindiHits = Object.keys(romanHindiDictionary).filter((word) =>
    lowered.includes(word)
  ).length;

  if (romanHindiHits >= 2) {
    return { code: "hi-Latn", name: "Hinglish / Roman Hindi" };
  }

  if (/\b(merci|bonjour|beaucoup|comment|salut)\b/.test(lowered)) {
    return { code: "fr", name: "French" };
  }

  if (/\b(hola|gracias|amigo|donde|buenos)\b/.test(lowered)) {
    return { code: "es", name: "Spanish" };
  }

  if (/\b(hallo|danke|guten|bitte)\b/.test(lowered)) {
    return { code: "de", name: "German" };
  }

  return { code: "en", name: "English" };
}

function normalizeInputHeuristically(text, detectedLanguage) {
  let normalized = text.trim().replace(/\s+/g, " ");

  if (detectedLanguage.code === "hi-Latn") {
    normalized = normalized
      .split(" ")
      .map((word) => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
        return romanHindiDictionary[cleanWord] || word;
      })
      .join(" ");
  }

  return normalized;
}

function toSentenceCase(text) {
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function translateRomanHindiClause(clause) {
  const cleanedClause = clause
    .toLowerCase()
    .replace(/[^\w\s?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanedClause) {
    return "";
  }

  const directPatterns = [
    {
      pattern: /^(tum|tu|aap) kaha ho$/,
      output: "where are you"
    },
    {
      pattern: /^(tum|tu|aap) kaha ho bro$/,
      output: "bro, where are you"
    },
    {
      pattern: /^kaha ho$/,
      output: "where are you"
    },
    {
      pattern: /^kal milte (hai|hain|h)$/
      ,
      output: "shall we meet tomorrow"
    },
    {
      pattern: /^(tum|hum) kal milte (hai|hain|h)$/,
      output: "shall we meet tomorrow"
    },
    {
      pattern: /^kya kar raha hai$/,
      output: "what are you doing"
    },
    {
      pattern: /^kya kar rha hai$/,
      output: "what are you doing"
    },
    {
      pattern: /^sab theek hai$/,
      output: "everything is fine"
    },
    {
      pattern: /^mai theek hu$/,
      output: "I am fine"
    },
    {
      pattern: /^main theek hu$/,
      output: "I am fine"
    },
    {
      pattern: /^aaj mast mausam hai$/,
      output: "the weather is great today"
    },
    {
      pattern: /^aaj ka din boht achha hai$/,
      output: "today is a very good day"
    }
  ];

  for (const { pattern, output } of directPatterns) {
    if (pattern.test(cleanedClause)) {
      return output;
    }
  }

  let translatedClause = cleanedClause
    .replace(/\btum kaha ho\b/g, "where are you")
    .replace(/\baap kaha ho\b/g, "where are you")
    .replace(/\btu kaha ho\b/g, "where are you")
    .replace(/\bkal milte (hai|hain|h)\b/g, "shall we meet tomorrow")
    .replace(/\bkya kar raha hai\b/g, "what are you doing")
    .replace(/\bkya kar rha hai\b/g, "what are you doing")
    .replace(/\baaj\b/g, "today")
    .replace(/\bboht\b/g, "very")
    .replace(/\bbahut\b/g, "very")
    .replace(/\bachha\b/g, "good")
    .replace(/\bacha\b/g, "good")
    .replace(/\bmast\b/g, "great")
    .replace(/\bmausam\b/g, "weather")
    .replace(/\bbhai\b/g, "bro")
    .replace(/\bbro\b/g, "bro")
    .replace(/\bhai\b/g, "is")
    .replace(/\bhain\b/g, "are");

  translatedClause = translatedClause.replace(/\s+/g, " ").trim();

  return translatedClause;
}

function translateRomanHindiToEnglish(text) {
  const clauses = text
    .split(/[,.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (clauses.length === 0) {
    return "";
  }

  const translatedClauses = clauses.map((clause) => translateRomanHindiClause(clause));
  const meaningfulClauses = translatedClauses.filter(Boolean);

  if (meaningfulClauses.length === 0) {
    return polishEnglishText(text);
  }

  if (meaningfulClauses.length === 1) {
    return polishEnglishText(meaningfulClauses[0]);
  }

  const combined = meaningfulClauses
    .map((clause) => toSentenceCase(clause))
    .map((clause, index) => {
      if (index === 0 && clause.toLowerCase().startsWith("bro,")) {
        return `${clause}?`;
      }

      return `${clause}?`;
    })
    .join(" ");

  return combined.trim();
}
function polishEnglishText(text) {
  let polished = text.trim().replace(/\s+/g, " ");

  const sentencePatterns = [
    {
      pattern: /\bbhai today great weather is\b/i,
      replacement: "Bro, the weather is great today."
    },
    {
      pattern: /\bbro today great weather is\b/i,
      replacement: "Bro, the weather is great today."
    },
    {
      pattern: /\btoday very good day is\b/i,
      replacement: "Today is a very good day."
    },
    {
      pattern: /\btoday the day is very good\b/i,
      replacement: "Today is a very good day."
    },
    {
      pattern: /\bwhere are you bro\b/i,
      replacement: "Bro, where are you?"
    },
    {
      pattern: /\bbro where are you\b/i,
      replacement: "Bro, where are you?"
    },
    {
      pattern: /\bwhere are you shall we meet tomorrow\b/i,
      replacement: "Where are you? Shall we meet tomorrow?"
    },
    {
      pattern: /\bbro where are you shall we meet tomorrow\b/i,
      replacement: "Bro, where are you? Shall we meet tomorrow?"
    }
  ];

  sentencePatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(polished)) {
      polished = replacement;
    }
  });

  if (!/[.!?]$/.test(polished)) {
    polished = `${polished}.`;
  }

  return polished.charAt(0).toUpperCase() + polished.slice(1);
}

function getBestTranslation(data, originalText) {
  const directTranslation = data.responseData?.translatedText?.trim();

  if (directTranslation && directTranslation.toLowerCase() !== originalText.trim().toLowerCase()) {
    return directTranslation;
  }

  if (!Array.isArray(data.matches)) {
    return "";
  }

  const normalizedOriginal = originalText.trim().toLowerCase();

  const bestMatch = data.matches
    .filter((match) => typeof match.translation === "string" && match.translation.trim())
    .sort((firstMatch, secondMatch) => {
      const firstScore = Number(firstMatch.match) || 0;
      const secondScore = Number(secondMatch.match) || 0;
      return secondScore - firstScore;
    })
    .find((match) => match.translation.trim().toLowerCase() !== normalizedOriginal);

  return bestMatch?.translation?.trim() || "";
}

async function translateWithMyMemory(text, sourceCode, targetCode) {
  const safeSourceCode = sourceCode === "hi-Latn" ? "en" : sourceCode;

  if (safeSourceCode === targetCode) {
    return text;
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${safeSourceCode}|${targetCode}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Browser translation fallback is unavailable right now.");
  }

  const data = await response.json();
  const translatedText = getBestTranslation(data, text);

  if (!translatedText) {
    throw new Error("No translation was returned in fallback mode.");
  }

  return translatedText;
}

async function translateInBrowser(text, targetCode, sourceType) {
  const detectedLanguage = detectLanguageHeuristically(text);
  const normalizedText = normalizeInputHeuristically(text, detectedLanguage);
  const translationSource =
    detectedLanguage.code === "hi-Latn" ? normalizedText : text.trim();
  let translatedText = "";

  if (detectedLanguage.code === "hi-Latn" && targetCode === "en") {
    translatedText = translateRomanHindiToEnglish(text);
  } else {
    translatedText = await translateWithMyMemory(
      translationSource,
      detectedLanguage.code,
      targetCode
    );
  }

  return {
    originalText: text.trim(),
    detectedLanguageCode: detectedLanguage.code,
    detectedLanguageName: `${detectedLanguage.name} (browser fallback)`,
    normalizedText:
      sourceType === "image"
        ? normalizedText
        : normalizedText || text.trim(),
    translatedText
  };
}

async function handleTextTranslation() {
  const text = inputText.value.trim();
  const targetCode = targetLanguage.value;

  if (!text) {
    setMessage(statusMessage, "Please enter some text before translating.", "error");
    resetTextResults();
    return;
  }

  toggleLoader(textLoader, true);
  setButtonBusy(translateButton, true, "Translating...", "Translate text");
  setMessage(statusMessage, "Sending text to the AI translator...");

  try {
    const result = await requestTranslation(text, targetCode, "text");

    updateResult(translatedTextResult, result.translatedText, "Final translation will appear here.");

    state.textTranslation = result.translatedText || "";
    state.textTargetLanguage = targetCode;
    setMessage(statusMessage, "Text translated successfully.", "success");
  } catch (error) {
    resetTextResults();
    setMessage(
      statusMessage,
      error.message || "Text translation could not be completed.",
      "error"
    );
  } finally {
    toggleLoader(textLoader, false);
    setButtonBusy(translateButton, false, "Translating...", "Translate text");
  }
}

function updateOcrProgress(progress) {
  const progressValue = Math.max(0, Math.min(100, Math.round(progress * 100)));
  ocrProgressBar.style.width = `${progressValue}%`;
  ocrProgressLabel.textContent = `OCR progress: ${progressValue}%`;
}

async function extractTextFromImage() {
  if (!state.imageFile) {
    setMessage(ocrStatusMessage, "Please choose an image first.", "error");
    return "";
  }

  toggleLoader(ocrLoader, true);
  ocrProgressShell.classList.remove("hidden");
  setButtonBusy(extractButton, true, "Extracting...", "Extract text");
  setMessage(ocrStatusMessage, "Running OCR in your browser...");
  updateOcrProgress(0);

  try {
    // OCR runs fully in the browser, which makes the feature easy to try.
    const result = await Tesseract.recognize(state.imageFile, "eng+hin", {
      logger(message) {
        if (message.status === "recognizing text") {
          updateOcrProgress(message.progress);
        }
      }
    });

    const extractedText = result.data.text.trim();

    if (!extractedText) {
      throw new Error("No readable text was found in the image.");
    }

    state.extractedText = extractedText;
    updateResult(extractedTextResult, extractedText, "OCR text will appear here.");
    setMessage(ocrStatusMessage, "OCR completed successfully.", "success");
    return extractedText;
  } catch (error) {
    state.extractedText = "";
    updateResult(extractedTextResult, "", "OCR text will appear here.");
    setMessage(ocrStatusMessage, error.message || "OCR failed.", "error");
    return "";
  } finally {
    toggleLoader(ocrLoader, false);
    setButtonBusy(extractButton, false, "Extracting...", "Extract text");
  }
}

async function handleImageTranslation() {
  if (!state.imageFile) {
    setMessage(ocrStatusMessage, "Please choose an image before translating.", "error");
    return;
  }

  let extractedText = state.extractedText;

  if (!extractedText) {
    extractedText = await extractTextFromImage();
  }

  if (!extractedText) {
    return;
  }

  toggleLoader(ocrLoader, true);
  setButtonBusy(translateImageButton, true, "Translating...", "Translate image");
  setMessage(ocrStatusMessage, "Sending extracted text to the AI translator...");

  try {
    const result = await requestTranslation(extractedText, targetLanguage.value, "image");

    updateResult(
      imageDetectedLanguageResult,
      `${result.detectedLanguageName} (${result.detectedLanguageCode})`,
      "Waiting for OCR translation..."
    );
    updateResult(
      imageTranslatedTextResult,
      result.translatedText,
      "Image translation will appear here."
    );

    state.imageTranslation = result.translatedText || "";
    setMessage(ocrStatusMessage, "Image translated successfully.", "success");
  } catch (error) {
    updateResult(imageDetectedLanguageResult, "", "Waiting for OCR translation...");
    updateResult(imageTranslatedTextResult, "", "Image translation will appear here.");
    state.imageTranslation = "";
    setMessage(
      ocrStatusMessage,
      error.message || "Image translation could not be completed.",
      "error"
    );
  } finally {
    toggleLoader(ocrLoader, false);
    setButtonBusy(translateImageButton, false, "Translating...", "Translate image");
  }
}

async function copyText(value, emptyMessage, successMessage, messageElement) {
  if (!value) {
    setMessage(messageElement, emptyMessage, "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setMessage(messageElement, successMessage, "success");
  } catch (error) {
    setMessage(messageElement, "Clipboard access was blocked by the browser.", "error");
  }
}

function speakText(value, languageCode, messageElement) {
  if (!value) {
    setMessage(messageElement, "There is no translated text to speak yet.", "error");
    return;
  }

  if (!("speechSynthesis" in window)) {
    setMessage(messageElement, "Speech is not supported in this browser.", "error");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = getSpeechLanguage(languageCode);
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  setMessage(messageElement, "Speaking translated text now.", "success");
}

function clearTextSection() {
  inputText.value = "";
  resetTextResults();
  setMessage(statusMessage, "Text input cleared.");
}

function removeImage() {
  if (state.imagePreviewUrl) {
    URL.revokeObjectURL(state.imagePreviewUrl);
  }

  state.imageFile = null;
  state.imagePreviewUrl = "";
  imageInput.value = "";
  imagePreview.src = "";
  imagePreview.classList.add("hidden");
  imagePlaceholder.classList.remove("hidden");
  ocrProgressShell.classList.add("hidden");
  updateOcrProgress(0);
  resetImageResults();
  setMessage(ocrStatusMessage, "Image removed.");
}

function showImagePreview(file) {
  if (state.imagePreviewUrl) {
    URL.revokeObjectURL(state.imagePreviewUrl);
  }

  state.imageFile = file;
  state.imagePreviewUrl = URL.createObjectURL(file);
  imagePreview.src = state.imagePreviewUrl;
  imagePreview.classList.remove("hidden");
  imagePlaceholder.classList.add("hidden");
  resetImageResults();
  setMessage(ocrStatusMessage, "Image selected. You can extract or translate it.");
}

function handleFileSelection(file) {
  if (!file || !file.type.startsWith("image/")) {
    setMessage(ocrStatusMessage, "Please choose a valid image file.", "error");
    return;
  }

  showImagePreview(file);
}

async function pasteFromClipboard() {
  try {
    const clipboardText = await navigator.clipboard.readText();

    if (!clipboardText) {
      setMessage(statusMessage, "Clipboard is empty.", "error");
      return;
    }

    inputText.value = clipboardText;
    setMessage(statusMessage, "Text pasted from clipboard.", "success");
  } catch (error) {
    setMessage(
      statusMessage,
      "Clipboard paste needs browser permission or HTTPS in some browsers.",
      "error"
    );
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark", themeSwitch.checked);
  localStorage.setItem("translator-theme", themeSwitch.checked ? "dark" : "light");
}

function loadThemePreference() {
  const savedTheme = localStorage.getItem("translator-theme");

  if (savedTheme === "dark") {
    themeSwitch.checked = true;
    document.body.classList.add("dark");
  }
}

function registerUploadZoneEvents() {
  ["dragenter", "dragover"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.remove("dragging");
    });
  });

  uploadZone.addEventListener("drop", (event) => {
    const droppedFile = event.dataTransfer?.files?.[0];
    handleFileSelection(droppedFile);
  });
}

translateButton.addEventListener("click", handleTextTranslation);
pasteButton.addEventListener("click", pasteFromClipboard);
clearButton.addEventListener("click", clearTextSection);
copyTextButton.addEventListener("click", () => {
  copyText(
    state.textTranslation,
    "Translate some text before copying.",
    "Translated text copied to clipboard.",
    statusMessage
  );
});
extractButton.addEventListener("click", extractTextFromImage);
translateImageButton.addEventListener("click", handleImageTranslation);
removeImageButton.addEventListener("click", removeImage);
copyImageButton.addEventListener("click", () => {
  copyText(
    state.imageTranslation,
    "Translate an image before copying.",
    "Image translation copied to clipboard.",
    ocrStatusMessage
  );
});
speakImageButton.addEventListener("click", () => {
  speakText(state.imageTranslation, targetLanguage.value, ocrStatusMessage);
});
themeSwitch.addEventListener("change", toggleTheme);

imageInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  handleFileSelection(file);
});

inputText.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    handleTextTranslation();
  }
});

populateLanguages();
loadThemePreference();
registerUploadZoneEvents();
resetTextResults();
resetImageResults();
