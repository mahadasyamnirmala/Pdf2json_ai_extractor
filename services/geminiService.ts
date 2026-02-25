
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please ensure it is set in the environment.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const processDocument = async (
  base64Data: string,
  mimeType: string
): Promise<ExtractionResult> => {
  const ai = getAI();
  
  const prompt = `
    Analyze the provided document image or PDF. 
    1. Extract all readable text into 'rawText'.
    2. Identify key entities (names, dates, amounts) and put them in 'entities' as category/value pairs.
    3. Extract explicit key-value pairs (like 'Date: 2024-01-01') into 'keyValues'.
    4. Provide a high-level summary and detailed context-specific attributes in 'structuredData'.
    
    If it is a mathematical or technical problem, use the 'details' array to outline steps or parameters.
    Format everything strictly into the provided JSON structure.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          metadata: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
              detectedLanguage: { type: Type.STRING },
              documentType: { type: Type.STRING },
            },
            required: ["title", "documentType", "confidenceScore", "detectedLanguage"]
          },
          content: {
            type: Type.OBJECT,
            properties: {
              rawText: { type: Type.STRING },
              entities: { 
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["category", "value"]
                }
              },
              keyValues: { 
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["key", "value"]
                }
              },
            },
            required: ["rawText", "entities", "keyValues"]
          },
          structuredData: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              details: { 
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["label", "value"]
                }
              }
            },
            required: ["summary", "details"]
          }
        },
        required: ["metadata", "content", "structuredData"]
      }
    }
  });

  const jsonStr = response.text || "";
  try {
    return JSON.parse(jsonStr) as ExtractionResult;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonStr);
    throw new Error("The AI response was not valid JSON. Please try again.");
  }
};
