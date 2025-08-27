import { supabase } from '../lib/supabase';

export interface SignDataset {
  id: string;
  label: string;
  features: number[];
  confidence: number;
}

export interface DatasetUploadResult {
  success: boolean;
  datasetId?: string;
  error?: string;
}

class DatasetService {
  private dataset: SignDataset[] = [];
  private isLoaded = false;

  async loadDataset(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load from Supabase first
      const { data: datasets } = await supabase
        .from('datasets')
        .select('*')
        .eq('status', 'completed');

      if (datasets && datasets.length > 0) {
        // Process datasets from Supabase
        this.dataset = this.processSupabaseDatasets(datasets);
      } else {
        // Fallback to built-in dataset
        this.dataset = this.getBuiltInDataset();
      }

      this.isLoaded = true;
      console.log(`Dataset loaded with ${this.dataset.length} entries`);
    } catch (error) {
      console.error('Error loading dataset:', error);
      // Use built-in dataset as fallback
      this.dataset = this.getBuiltInDataset();
      this.isLoaded = true;
    }
  }

  private processSupabaseDatasets(datasets: any[]): SignDataset[] {
    const processedData: SignDataset[] = [];
    
    datasets.forEach(dataset => {
      if (dataset.metadata && dataset.metadata.data) {
        const data = dataset.metadata.data;
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            processedData.push({
              id: `${dataset.dataset_id}_${item.id || Math.random()}`,
              label: item.label || 'unknown',
              features: item.features || [],
              confidence: item.confidence || 0.8
            });
          });
        }
      }
    });

    return processedData;
  }

  private getBuiltInDataset(): SignDataset[] {
    // Built-in sign language dataset based on common ASL signs
    return [
      {
        id: 'hello_1',
        label: 'hello',
        features: [0.8, 0.9, 0.7, 0.85, 0.92],
        confidence: 0.95
      },
      {
        id: 'thank_you_1',
        label: 'thank you',
        features: [0.7, 0.8, 0.9, 0.75, 0.88],
        confidence: 0.92
      },
      {
        id: 'please_1',
        label: 'please',
        features: [0.85, 0.7, 0.8, 0.9, 0.82],
        confidence: 0.89
      },
      {
        id: 'yes_1',
        label: 'yes',
        features: [0.9, 0.85, 0.7, 0.8, 0.95],
        confidence: 0.94
      },
      {
        id: 'no_1',
        label: 'no',
        features: [0.6, 0.9, 0.8, 0.7, 0.85],
        confidence: 0.91
      },
      {
        id: 'sorry_1',
        label: 'sorry',
        features: [0.75, 0.8, 0.85, 0.9, 0.78],
        confidence: 0.87
      },
      {
        id: 'help_1',
        label: 'help',
        features: [0.8, 0.75, 0.9, 0.85, 0.88],
        confidence: 0.90
      },
      {
        id: 'good_1',
        label: 'good',
        features: [0.9, 0.8, 0.75, 0.95, 0.85],
        confidence: 0.93
      },
      {
        id: 'bad_1',
        label: 'bad',
        features: [0.7, 0.85, 0.8, 0.75, 0.9],
        confidence: 0.88
      },
      {
        id: 'water_1',
        label: 'water',
        features: [0.85, 0.9, 0.7, 0.8, 0.92],
        confidence: 0.89
      }
    ];
  }

  async recognizeSign(imageFeatures: number[]): Promise<{ label: string; confidence: number }> {
    await this.loadDataset();

    if (this.dataset.length === 0) {
      return { label: 'unknown', confidence: 0.0 };
    }

    let bestMatch = this.dataset[0];
    let bestSimilarity = 0;

    // Simple similarity calculation
    for (const sign of this.dataset) {
      const similarity = this.calculateSimilarity(imageFeatures, sign.features);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = sign;
      }
    }

    // Apply confidence threshold
    const finalConfidence = bestSimilarity * bestMatch.confidence;
    
    return {
      label: finalConfidence > 0.6 ? bestMatch.label : 'unknown',
      confidence: finalConfidence
    };
  }

  private calculateSimilarity(features1: number[], features2: number[]): number {
    if (features1.length !== features2.length) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < features1.length; i++) {
      sum += Math.abs(features1[i] - features2[i]);
    }

    return Math.max(0, 1 - (sum / features1.length));
  }

  async uploadDataset(file: any, metadata: any): Promise<DatasetUploadResult> {
    try {
      const datasetId = `dataset_${Date.now()}`;
      
      const { error } = await supabase
        .from('datasets')
        .insert({
          dataset_id: datasetId,
          type: metadata.type || 'sign_language',
          status: 'completed',
          uploaded_by: metadata.userId,
          metadata: {
            filename: metadata.filename,
            uploadDate: new Date().toISOString(),
            data: metadata.data
          }
        });

      if (error) throw error;

      // Reload dataset to include new data
      this.isLoaded = false;
      await this.loadDataset();

      return { success: true, datasetId };
    } catch (error) {
      console.error('Dataset upload error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  getDatasetStats() {
    return {
      totalSigns: this.dataset.length,
      uniqueLabels: [...new Set(this.dataset.map(d => d.label))].length,
      averageConfidence: this.dataset.reduce((sum, d) => sum + d.confidence, 0) / this.dataset.length
    };
  }
}

export const datasetService = new DatasetService();