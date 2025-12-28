
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const askNomExpert = async (prompt: string, useThinking: boolean = false) => {
  try {
    const config: any = {
      systemInstruction: `Eres un experto senior en la norma oficial mexicana NOM-001-SEDE-2012 (Instalaciones Eléctricas).
      Tu objetivo es ayudar a ingenieros con cálculos precisos, interpretaciones normativas y mejores prácticas.
      Responde siempre basándote en el contenido de la NOM-001-SEDE-2012 y el Código Nacional de Electricidad.
      Si el usuario te pide un cálculo complejo, usa el modo de pensamiento profundo.
      Incluye referencias a artículos específicos cuando sea posible.`,
      tools: [{ googleSearch: {} }]
    };

    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: config,
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
