import { GoogleGenAI } from "@google/genai";

export async function processClinicalDictation(transcript: string) {
  if (!transcript) {
    throw new Error('Transcript is required');
  }

  // Use a safer way to access environment variables in Vite
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured. Please set it in your environment.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are a medical assistant. Extract structured data from the following clinical dictation in Spanish.
    Return ONLY a JSON object with the following structure (do not include markdown formatting):
    {
      "chiefComplaint": "string (in Spanish)",
      "historyOfPresentIllness": "string (in Spanish)",
      "medications": [{"name": "string", "dosage": "string", "frequency": "string", "active": true}],
      "suggestedAlerts": ["string (in Spanish)"],
      "clinicalScales": [{"name": "string", "score": number, "notes": "string"}]
    }

    Dictation: "${transcript}"
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const text = response.text || '';
  if (!text) {
    throw new Error('No response from Gemini');
  }
  
  // Clean up markdown code blocks if present
  const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON', text);
    throw new Error('Failed to parse structured data');
  }
}
