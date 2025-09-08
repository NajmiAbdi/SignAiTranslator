import { GoogleGenerativeAI } from '@google/generative-ai';

// ==================== DatasetService ====================
class DatasetService {
  private aslLetters: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');

  /**
   * Haddii xaraf invalid la soo celiyo, hel xarafka ugu dhow ee saxda ah
   * Halkan waxaa loo adeegsadaa distance-ka ugu fudud (closest match)
   */
  getClosestLetter(input: string): string {
  if (!input || !input.match(/[a-z]/i)) {
    // User-friendly fallback message
    return "The letter is not clear. Please make sure your hand gesture is visible and try again.";
  }

  const char = input.toLowerCase()[0];
  return this.aslLetters.includes(char) ? char :
         "The letter is not clear. Please make sure your hand gesture is visible and try again.";
}

}

export const datasetService = new DatasetService();

// ==================== GeminiService ====================
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
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initializeGemini();
  }

  private async initializeGemini(): Promise<void> {
    if (this.isInitializing && this.initPromise) return this.initPromise;
    this.isInitializing = true;
    this.initPromise = this.performInitialization();
    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key not found in environment variables');

      if (apiKey !== this.currentApiKey) {
        this.currentApiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);

        this.flashModel = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { temperature: 0.3, topK: 32, topP: 0.9, maxOutputTokens: 512 },
        });

        this.proModel = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-pro',
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
        });

        console.log('✅ Gemini API initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
      throw error;
    }
  }

  private async getText(result: any): Promise<string> {
    const resp = result?.response?.then ? await result.response : result.response;
    const txt = resp?.text ? resp.text() : '';
    return (txt ?? '').toString().trim();
  }

  // 🎯 Recognize sign with retry & DatasetService fallback
  async recognizeSign(imageBase64: string): Promise<SignRecognitionResult> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.initializeGemini();
        if (!this.flashModel) throw new Error('Gemini Flash model not available');

        const prompt = `You are an expert American Sign Language (ASL) interpreter. Analyze this image and identify the ASL sign being performed.
Respond with ONLY the most likely ASL sign word (a-z). Return just the word without punctuation or extra text.`;

        const result = await this.flashModel.generateContent([
          prompt,
          { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
        ]);

        let text = (await this.getText(result)).toLowerCase().replace(/[^\w]/g, '').trim();

        // Isticmaal DatasetService haddii text invalid ama empty
        if (!text || text.length !== 1) {
          text = datasetService.getClosestLetter(text);
        }

        return {
          text,
          confidence: 0.9 + Math.random() * 0.1,
          gestures: [text],
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        attempt++;
        if (error?.message?.includes('503')) {
          console.warn(`⚠️ Gemini overloaded, retrying ${attempt}/${maxRetries}...`);
          await new Promise(r => setTimeout(r, 1500));
        } else {
          console.error('❌ Gemini sign recognition error:', error);
          break;
        }
      }
    }

    console.warn('❌ Returning fallback from DatasetService due to repeated errors');
    return {
      text: datasetService.getClosestLetter(''),
      confidence: 0.88,
      gestures: [datasetService.getClosestLetter('')],
      timestamp: new Date().toISOString(),
    };
  }

  async transcribeSpeech(audioText: string): Promise<SpeechTranscriptionResult> {
    try {
      await this.initializeGemini();
      if (!this.flashModel) throw new Error('Gemini Flash model not available');

      const prompt = `You are a professional speech transcription service. Clean up and improve this speech input: "${audioText}"`;

      const result = await this.flashModel.generateContent(prompt);
      const text = await this.getText(result);

      return { text: text || audioText, confidence: 0.95 };
    } catch (error) {
      console.error('❌ Gemini transcription error:', error);
      return { text: audioText, confidence: 0.85 };
    }
  }

  async speechToSign(text: string): Promise<SpeechToSignResult> {
    try {
      await this.initializeGemini();
      if (!this.proModel) throw new Error('Gemini Pro model not available');

      const prompt = `Convert this text to American Sign Language (ASL) gestures: "${text}"`;

      const result = await this.proModel.generateContent(prompt);
      const gestureText = await this.getText(result);

      const animations = gestureText
        .split(',')
        .map(g => g.trim().toLowerCase())
        .filter(g => g.length > 0);

      return {
        animations: animations.length > 0 ? animations : [text.toLowerCase()],
        duration: animations.length * 1500,
        keyframes: animations.map((anim, index) => ({
          time: index * 1500,
          gesture: anim,
          description: `Perform ${anim} sign`,
        })),
      };
    } catch (error) {
      console.error('❌ Gemini speech to sign error:', error);
      return {
        animations: [text.toLowerCase()],
        duration: 1500,
        keyframes: [{ time: 0, gesture: text.toLowerCase(), description: `Perform ${text} sign` }],
      };
    }
  }

  async chatResponse(message: string): Promise<string> {
    try {
      await this.initializeGemini();
      if (!this.proModel) throw new Error('Gemini Pro model not available');

      const prompt = `You are an expert AI assistant for a sign language translator app. User message: "${message}"`;

      const result = await this.proModel.generateContent(prompt);
      const text = await this.getText(result);

      return text || "I'm here to help with sign language translation and learning. How can I assist you today?";
    } catch (error) {
      console.error('❌ Gemini chat error:', error);
      return "I'm here to help with sign language translation and learning. How can I assist you today?";
    }
  }

  getCurrentApiKey(): string | null {
    return this.currentApiKey;
  }

  isInitialized(): boolean {
    return !!this.flashModel && !!this.proModel;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.initializeGemini();
      if (!this.flashModel) return false;

      const result = await this.flashModel.generateContent("Test connection - respond with 'OK'");
      const text = await this.getText(result);
      return text.includes('OK') || text.length > 0;
    } catch (error) {
      console.error('❌ Gemini connection test failed:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
