
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
// Using singleton pattern implicitly by module caching
// Safely check for process.env to avoid crashes in raw browser environments
const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

export const ai = new GoogleGenAI({ apiKey });
