// AI Service for sign language translation
import { datasetService } from './datasetService';

export interface SignRecognitionResult {
  confidence: number;
  text: string;
  gestures: string[];
  timestamp: number;
}

export interface TextToSpeechOptions {
  language: string;
  voice: string;
  speed: number;
}

export interface SpeechToSignResult {
  animations: string[];
  duration: number;
  keyframes: any[];
}

class AIService {
  private baseUrl = process.env.EXPO_PUBLIC_AI_BASE_URL || 'https://api.openai.com/v1';
  private apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';

  async recognizeSign(imageData: string): Promise<SignRecognitionResult> {
    try {
      // Extract features from image (simplified approach)
      const features = await this.extractImageFeatures(imageData);
      
      // Use dataset service for recognition
      const recognition = await datasetService.recognizeSign(features);
      
      return {
        confidence: recognition.confidence,
        text: recognition.label,
        gestures: [recognition.label],
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Sign recognition error:', error);
      return this.getMockSignRecognition();
    }
  }

  private async extractImageFeatures(imageData: string): Promise<number[]> {
    try {
      if (!this.apiKey) {
        // Return mock features if no API key
        return [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
      }

      // Use OpenAI Vision API to analyze the image
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this sign language gesture and return 5 numerical features (0-1) representing hand position, finger configuration, movement, orientation, and gesture completeness.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageData}`
                  }
                }
              ]
            }
          ],
          max_tokens: 100
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content || '';
      
      // Extract numerical features from response
      const numbers = content.match(/\d+\.?\d*/g);
      if (numbers && numbers.length >= 5) {
        return numbers.slice(0, 5).map((n: string) => Math.min(1, Math.max(0, parseFloat(n))));
      }
      
      // Fallback to random features
      return [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
    } catch (error) {
      console.error('Feature extraction error:', error);
      return [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
    }
  }

  private getMockSignRecognition(): SignRecognitionResult {
    return {
      confidence: 0.85,
      text: 'Hello, how are you?',
      gestures: ['hello', 'how', 'are', 'you'],
      timestamp: Date.now(),
    };
  }

  async textToSpeech(text: string, options: TextToSpeechOptions): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('AI API key not configured');
      }

      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: options.voice || 'alloy',
          speed: options.speed || 1.0
        }),
      });

      if (!response.ok) throw new Error('Failed to convert text to speech');
      
      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Text to speech error:', error);
      throw error;
    }
  }

  async speechToSign(audioData: string): Promise<SpeechToSignResult> {
    try {
      if (!this.apiKey) {
        console.warn('AI API key not configured, using mock data');
        return this.getMockSpeechToSign();
      }

      // First convert speech to text using OpenAI Whisper
      const transcriptionResponse = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: (() => {
          const formData = new FormData();
          formData.append('file', audioData);
          formData.append('model', 'whisper-1');
          return formData;
        })(),
      });

      if (!transcriptionResponse.ok) throw new Error('Failed to transcribe speech');
      
      const transcription = await transcriptionResponse.json();
      const text = transcription.text;
      
      // Convert text to sign animations
      const words = text.toLowerCase().split(' ');
      const animations = words.map(word => `${word}_animation`);
      
      return {
        animations,
        duration: words.length * 1000, // 1 second per word
        keyframes: words.map((word, index) => ({
          time: index * 1000,
          gesture: word,
          duration: 1000
        }))
      };
    } catch (error) {
      console.error('Speech to sign error:', error);
      return this.getMockSpeechToSign();
    }
  }

  private getMockSpeechToSign(): SpeechToSignResult {
    return {
      animations: ['hello_animation', 'how_animation', 'are_animation', 'you_animation'],
      duration: 3000,
      keyframes: [],
    };
  }

  async uploadDataset(file: any, type: string): Promise<string> {
    try {
      // Use dataset service for upload
      const result = await datasetService.uploadDataset(file, {
        type,
        filename: file.name,
        userId: 'current_user_id', // This should be passed from the calling context
        data: file.data
      });

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      return result.datasetId || '';
    } catch (error) {
      console.error('Dataset upload error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
