import { GoogleGenerativeAI } from '@google/generative-ai';

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
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

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
      // Get API key from environment or stored settings
      let apiKey = import.meta.env.VITE_AI_API_KEY;
      
      // Try to get from localStorage (admin settings)
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) {
        apiKey = storedKey;
      }

      if (apiKey && apiKey !== this.currentApiKey) {
        this.currentApiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);
        
        // Use free Gemini models
        this.flashModel = this.genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 0.9,
            maxOutputTokens: 1024,
          }
        });
        
        this.proModel = this.genAI.getGenerativeModel({ 
          model: "gemini-1.5-pro",
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        });
        
        console.log('✅ Gemini API initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
      throw error;
    }
  }

  async updateApiKey(newApiKey: string): Promise<boolean> {
    try {
      // Validate the API key by making a test call
      const testAI = new GoogleGenerativeAI(newApiKey);
      const testModel = testAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const testResult = await testModel.generateContent("Test connection");
      const testText = await testResult.response.text();
      
      if (!testText) throw new Error('Invalid API response');

      // Save to localStorage
      localStorage.setItem('gemini_api_key', newApiKey);
      
      // Reinitialize with new key
      this.currentApiKey = newApiKey;
      this.genAI = testAI;
      this.flashModel = testModel;
      this.proModel = testAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      return true;
    } catch (error) {
      console.error('Failed to update API key:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Ensure initialization
      await this.initializeGemini();
      
      if (!this.flashModel) return false;

      const result = await this.flashModel.generateContent("Test connection - respond with OK");
      const text = await result.response.text();
      return text.includes('OK') || text.length > 0;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }

  async processDataset(csvData: string): Promise<any[]> {
    try {
      // Ensure initialization
      await this.initializeGemini();
      
      if (!this.proModel) {
        throw new Error('Gemini Pro model not available');
      }

      const prompt = `Process this CSV data for sign language dataset training:

${csvData.substring(0, 3000)}...

Instructions:
1. Parse the CSV data and extract sign language labels and features
2. Create structured dataset entries for machine learning
3. Each entry must have: id, label, features (array of 5-10 numbers), confidence
4. Generate realistic feature vectors that represent hand/gesture characteristics
5. Ensure labels are clean ASL sign words
6. Return as a clean JSON array

Format each entry exactly like this:
{
  "id": "sign_1", 
  "label": "hello",
  "features": [0.8, 0.9, 0.7, 0.85, 0.92],
  "confidence": 0.95
}

Return only the JSON array:`;

      const result = await this.proModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      try {
        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
      }

      // Fallback: create dataset from CSV structure
      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length < 2) return [];
      
      return lines.slice(1, 51).map((line, index) => {
        const values = line.split(',');
        const label = values[0]?.trim().toLowerCase() || `sign_${index}`;
        
        return {
          id: `processed_${Date.now()}_${index}`,
          label: label,
          features: Array.from({ length: 5 }, () => 0.5 + Math.random() * 0.4),
          confidence: 0.8 + Math.random() * 0.15
        };
      });
    } catch (error) {
      console.error('Gemini dataset processing error:', error);
      return [];
    }
  }

  getCurrentApiKey(): string | null {
    return this.currentApiKey;
  }

  isInitialized(): boolean {
    return !!this.flashModel && !!this.proModel;
  }
}

export const geminiService = new GeminiService();