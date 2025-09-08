import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';

export interface SignRecognitionResult {
  text: string;
  confidence: number;
  gestures: string[];
  timestamp: string;
}

export interface SpeechTranscriptionResult {
  text: string;
  confidence: number;
}

export interface SpeechToSignResult {
  animations: string[];
  duration: number;
  keyframes: any[];
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private flashModel: any = null;
  private proModel: any = null;
  private currentApiKey: string | null = null;

  constructor() {
    this.initializeGemini();
  }

  private async initializeGemini(): Promise<void> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || null;

      if (!apiKey) {
        throw new Error(
          '🚨 Gemini API key not found. Please add EXPO_PUBLIC_AI_API_KEY in your .env file'
        );
      }

      if (apiKey !== this.currentApiKey) {
        this.currentApiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);

        this.flashModel = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
        });

        this.proModel = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-pro',
        });

        console.log('✅ Gemini API initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
    }
  }

  private async getText(result: any): Promise<string> {
    const resp =
      result?.response && typeof result.response.then === 'function'
        ? await result.response
        : result.response;

    const txt = typeof resp?.text === 'function' ? resp.text() : '';
    return (txt ?? '').toString().trim();
  }

  async recognizeSign(imageBase64: string): Promise<SignRecognitionResult> {
    try {
      await this.initializeGemini();
      if (!this.flashModel) throw new Error('Flash model not available');

      const prompt =
        'You are an ASL interpreter. Identify the sign in this image. Return only one word.';

      const result = await this.flashModel.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
      ]);

      const text = (await this.getText(result)).toLowerCase().trim() || 'a';

      return {
        text,
        confidence: 0.9,
        gestures: [text],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Gemini sign recognition error:', error);
      return {
        text: 'a',
        confidence: 0.8,
        gestures: ['a'],
        timestamp: new Date().toISOString(),
      };
    }
  }

  async transcribeSpeech(audioText: string): Promise<SpeechTranscriptionResult> {
    try {
      await this.initializeGemini();
      if (!this.flashModel) throw new Error('Flash model not available');

      const result = await this.flashModel.generateContent(audioText);
      const text = await this.getText(result);

      return { text: text || audioText, confidence: 0.95 };
    } catch (error) {
      console.error('❌ Gemini transcription error:', error);
      return { text: audioText, confidence: 0.8 };
    }
  }

  async speechToSign(text: string): Promise<SpeechToSignResult> {
    try {
      await this.initializeGemini();
      if (!this.proModel) throw new Error('Pro model not available');

      const result = await this.proModel.generateContent(text);
      const gestures = (await this.getText(result))
        .split(',')
        .map((g) => g.trim().toLowerCase());

      return {
        animations: gestures,
        duration: gestures.length * 1500,
        keyframes: gestures.map((g, i) => ({
          time: i * 1500,
          gesture: g,
          description: `Perform ${g}`,
        })),
      };
    } catch (error) {
      console.error('❌ Gemini speech to sign error:', error);
      return {
        animations: [text.toLowerCase()],
        duration: 1500,
        keyframes: [{ time: 0, gesture: text.toLowerCase(), description: text }],
      };
    }
  }
}

export const geminiService = new GeminiService();
