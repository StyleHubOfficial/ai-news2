import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Type, LiveServerMessage } from "@google/genai";
import { SearchResult, ChatMessage, AudioLanguage } from '../types';

if (!process.env.API_KEY) {
    // In a real app, you'd want to handle this more gracefully.
    // For this environment, we assume the key is present.
    console.warn("API_KEY environment variable not set. App may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Text Generation Services ---

export async function searchWithGoogle(query: string): Promise<SearchResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources };
  } catch (error) {
    console.error("Error with Google Search grounding:", error);
    throw new Error("Failed to fetch search results from Gemini API.");
  }
}

export async function getShortSummary(content: string): Promise<string> {
    const prompt = `Summarize the following article in 2-3 concise sentences for a news feed preview:\n\n---\n${content}`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text;
}

export async function getFastSummary(content: string): Promise<string> {
    const prompt = `Create a bullet-point summary of the key takeaways from this article:\n\n---\n${content}`;
    // FIX: Updated model name to conform to the latest guidelines.
    const response = await ai.models.generateContent({ model: "gemini-flash-lite-latest", contents: prompt });
    return response.text;
}

export async function getDeepAnalysis(content: string): Promise<string> {
    const prompt = `Provide a deep, insightful analysis of this article. Identify key themes, potential biases, and the broader implications of the events or technologies described. Structure your analysis clearly.\n\n---\n${content}`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
}

export async function generateNewsBroadcastScript(topic: string): Promise<string> {
    const prompt = `Create a conversational news broadcast script about the following topic: "${topic}". The script should be for two anchors, Orion and Celeste. Make it engaging, informative, and slightly futuristic in tone.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text;
}

// --- Chat Services ---

let chat: Chat | null = null;
export function getChat(): Chat {
  if (!chat) {
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
    });
  }
  return chat;
}


// --- Image Services ---

export async function generateImageFromPrompt(prompt: string, aspectRatio: string): Promise<string> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
          outputMimeType: 'image/png'
        },
    });
    return response.generatedImages[0].image.imageBytes;
}

export async function analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
    const imagePart = {
        inlineData: { data: imageBase64, mimeType },
    };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] }
    });
    return response.text;
}

export async function editImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
     const imagePart = {
        inlineData: { data: imageBase64, mimeType },
    };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    const generatedPart = response.candidates?.[0]?.content.parts.find(part => part.inlineData);
    if (generatedPart?.inlineData) {
        return generatedPart.inlineData.data;
    }
    throw new Error("Image editing failed to produce an image.");
}


// --- Audio Services ---

function getVoiceConfigForLanguage(voiceName: 'Orion' | 'Celeste', lang: AudioLanguage) {
    // This is a creative mapping as the API has specific voice names.
    // We'll map Orion and Celeste to different voices for variety.
    // In a real app, you might choose voices based on language support.
    const voiceMap = {
        Orion: { english: 'Kore', hindi: 'Kore', hinglish: 'Kore' },
        Celeste: { english: 'Puck', hindi: 'Puck', hinglish: 'Puck' }
    };
    return { prebuiltVoiceConfig: { voiceName: voiceMap[voiceName][lang] } };
}

export async function generateSpeech(text: string, lang: AudioLanguage, isBroadcast: boolean): Promise<string> {
    let config;
    if (isBroadcast) {
        config = {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        { speaker: 'Orion', voiceConfig: getVoiceConfigForLanguage('Orion', lang) },
                        { speaker: 'Celeste', voiceConfig: getVoiceConfigForLanguage('Celeste', lang) }
                    ]
                }
            }
        };
    } else {
        config = {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: getVoiceConfigForLanguage('Orion', lang),
            },
        };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config,
    });
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
        throw new Error("Failed to generate audio.");
    }
    return audioData;
}

// --- Live API Service ---

export function connectToLiveAgent(
    callbacks: {
        onopen: () => void;
        onmessage: (message: LiveServerMessage) => void;
        onerror: (e: ErrorEvent) => void;
        onclose: (e: CloseEvent) => void;
    }
) {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: 'You are Cygnus, a friendly, helpful, and slightly futuristic AI assistant for the G-NEWS Hub. Keep your responses concise and informative.',
        },
    });
}