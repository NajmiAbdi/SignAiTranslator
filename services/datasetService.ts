import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DatasetEntry {
  id: string;
  label: string;
  features: number[];
  confidence: number;
  created_at?: string;
}

class DatasetService {
  private localDataset: DatasetEntry[] = [
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
      confidence: 0.93
    },
    {
      id: 'please_1',
      label: 'please',
      features: [0.9, 0.7, 0.8, 0.82, 0.91],
      confidence: 0.94
    },
    {
      id: 'yes_1',
      label: 'yes',
      features: [0.85, 0.92, 0.78, 0.89, 0.86],
      confidence: 0.96
    },
    {
      id: 'no_1',
      label: 'no',
      features: [0.76, 0.84, 0.91, 0.73, 0.87],
      confidence: 0.92
    }
  ];

  async loadDataset(): Promise<DatasetEntry[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('Using local dataset - Supabase not configured');
        return this.localDataset;
      }

      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading dataset from Supabase:', error);
        return this.localDataset;
      }

      // Combine Supabase data with local dataset
      const combinedDataset = [...this.localDataset];
      
      if (data && data.length > 0) {
        const supabaseEntries = data.map(item => ({
          id: item.id || `entry_${Date.now()}_${Math.random()}`,
          label: item.label || 'unknown',
          features: Array.isArray(item.features) ? item.features : [0.5, 0.6, 0.7, 0.8, 0.9],
          confidence: item.confidence || 0.85,
          created_at: item.created_at
        }));
        
        combinedDataset.push(...supabaseEntries);
      }

      return combinedDataset;
    } catch (error) {
      console.error('Dataset loading error:', error);
      return this.localDataset;
    }
  }

  async findSignInDataset(features: number[]): Promise<DatasetEntry | null> {
    try {
      const dataset = await this.loadDataset();
      
      // Simple similarity matching
      for (const entry of dataset) {
        const similarity = this.calculateSimilarity(features, entry.features);
        if (similarity > 0.8) {
          return entry;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding sign in dataset:', error);
      return null;
    }
  }

  private calculateSimilarity(features1: number[], features2: number[]): number {
    if (features1.length !== features2.length) return 0;
    
    let sum = 0;
    for (let i = 0; i < features1.length; i++) {
      sum += Math.abs(features1[i] - features2[i]);
    }
    
    return 1 - (sum / features1.length);
  }

  async saveDatasetEntry(entry: DatasetEntry): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('Cannot save to Supabase - not configured');
        return false;
      }

      const { error } = await supabase
        .from('datasets')
        .insert([{
          id: entry.id,
          label: entry.label,
          features: entry.features,
          confidence: entry.confidence,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error saving dataset entry:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Dataset save error:', error);
      return false;
    }
  }

  getLocalDataset(): DatasetEntry[] {
    return this.localDataset;
  }
}

export const datasetService = new DatasetService();