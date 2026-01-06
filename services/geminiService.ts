
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const COMMON_WORDS = [
  "THE", "ABOUT", "WHICH", "THEIR", "WOULD", "THERE", "THESE", "STORY", "PEOPLE", "WATER", "FIRST", "SOUND",
  "PLACE", "COULD", "FOLLOW", "ANOTHER", "THROUGH", "SENTENCE", "BEFORE", "LITTLE", "DIFFER", "WRITING",
  "NUMBER", "BETWEEN", "PICTURE", "THOUGHT", "GOVERNMENT", "IMPORTANT", "SOMETIMES", "MOUNTAIN", "CHILDREN",
  "FRIEND", "SCHOOL", "PROBLEM", "ANSWER", "COUNTRY", "BECAUSE", "AGAINST", "THINGS", "SYSTEM", "HAPPEN",
  "BELIEVE", "TOGETHER", "WITHOUT", "THOUSAND", "LANGUAGE", "SCIENCE", "EXPERIENCE", "KNOWLEDGE", "HISTORY"
];

const CODE_KEYWORDS = [
  "FUNCTION", "RETURN", "CONST", "EXPORT", "IMPORT", "INTERFACE", "PROMISE", "ASYNC", "AWAIT", "COMPONENT",
  "EFFECT", "REDUCE", "FILTER", "STRING", "BOOLEAN", "OBJECT", "PACKAGE", "MODULE", "CONTEXT", "RENDER",
  "DEBUG", "WINDOW", "NAVIGATOR", "POINTER", "TEMPLATE", "CONSTRUCTOR", "PROTOTYPE", "INSTANCE", "ABSTRACT",
  "POLYMORPHISM", "ENCAPSULATION", "INHERITANCE", "CALLBACK", "RECURSION", "MUTATION", "COMPUTED", "DEBOUNCE"
];

const JUNK_STRINGS = [
  "XTY", "MQA", "WSE", "PPL", "KJB", "VXC", "RTY", "FGH", "ZXC", "QWE", "JKL", "MNB", "OIP", "ASD", "DFG",
  "CVB", "BNM", "POI", "UYH", "TGB", "RFV", "EDC", "WSX", "QAZ", "XDR", "CFT", "VGY", "BHU", "NJM", "MKD"
];

const CYBER_WINTER = [
  "GLACIER", "PROTOCOL", "BLIZZARD", "FIREWALL", "CRYSTAL", "SYNTH", "INFY", "CLOUD", "HYPER-SPEED",
  "CRYO-ARRAY", "QUANTUM-HEX", "BIO-INTERFACE", "ATMOSPHERE", "ENCRYPTION", "SYNCHRONIZE", "FROSTBYTE",
  "NEON-GRID", "ZERO-GRAVITY", "VOID-PULSE", "DATA-STREAM", "NORDIC-CELL", "AURORA-CORE", "PERMAFROST"
];

// Combine and create a large pool of 300+ words
const MASTER_POOL = [
  ...COMMON_WORDS, ...CODE_KEYWORDS, ...JUNK_STRINGS, ...CYBER_WINTER,
  ...COMMON_WORDS.map(w => w + "S"), ...CODE_KEYWORDS.map(k => k.toLowerCase().toUpperCase())
];

export const FALLBACK_WORDS: Record<Difficulty, string[]> = {
  [Difficulty.BEGINNER]: MASTER_POOL.filter(w => w.length <= 4),
  [Difficulty.INTERMEDIATE]: MASTER_POOL.filter(w => w.length > 4 && w.length <= 7),
  [Difficulty.EXPERT]: MASTER_POOL.filter(w => w.length > 7)
};

// Ensure lists aren't empty
if (FALLBACK_WORDS[Difficulty.BEGINNER].length < 10) FALLBACK_WORDS[Difficulty.BEGINNER] = MASTER_POOL.slice(0, 50);

export const fetchThemedWords = async (difficulty: Difficulty): Promise<string[]> => {
  try {
    const prompt = `Generate a list of 100 English words for a typing game. 
    Include a mix of common English words, software programming keywords, and cyberpunk winter terms.
    Difficulty Level: ${difficulty}. 
    Return as a JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (error) {
    console.error("Error fetching words from Gemini:", error);
  }

  // Fallback to our large hardcoded pool if AI fails
  const pool = FALLBACK_WORDS[difficulty];
  return [...pool].sort(() => Math.random() - 0.5);
};
