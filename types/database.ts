// Database types for TypeScript integration
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'user' | 'admin';
          preferences: any;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: 'user' | 'admin';
          preferences?: any;
          created_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          role?: 'user' | 'admin';
          preferences?: any;
          last_login?: string;
        };
      };
      chats: {
        Row: {
          chat_id: string;
          user_id: string;
          message: string;
          type: 'text' | 'sign' | 'speech';
          timestamp: string;
          metadata: any;
        };
        Insert: {
          chat_id: string;
          user_id: string;
          message: string;
          type: 'text' | 'sign' | 'speech';
          timestamp?: string;
          metadata?: any;
        };
        Update: {
          message?: string;
          type?: 'text' | 'sign' | 'speech';
          metadata?: any;
        };
      };
      datasets: {
        Row: {
          dataset_id: string;
          type: string;
          status: 'uploading' | 'processing' | 'training' | 'completed' | 'failed';
          uploaded_by: string;
          trained_model_link: string | null;
          created_at: string;
          metadata: any;
        };
        Insert: {
          dataset_id: string;
          type: string;
          status?: 'uploading' | 'processing' | 'training' | 'completed' | 'failed';
          uploaded_by: string;
          trained_model_link?: string;
          created_at?: string;
          metadata?: any;
        };
        Update: {
          type?: string;
          status?: 'uploading' | 'processing' | 'training' | 'completed' | 'failed';
          trained_model_link?: string;
          metadata?: any;
        };
      };
      logs: {
        Row: {
          log_id: string;
          user_id: string;
          action: string;
          timestamp: string;
          metadata: any;
        };
        Insert: {
          log_id: string;
          user_id: string;
          action: string;
          timestamp?: string;
          metadata?: any;
        };
        Update: {
          action?: string;
          metadata?: any;
        };
      };
      analytics: {
        Row: {
          metric_id: string;
          type: string;
          value: number;
          period: string;
          created_at: string;
        };
        Insert: {
          metric_id: string;
          type: string;
          value: number;
          period: string;
          created_at?: string;
        };
        Update: {
          type?: string;
          value?: number;
          period?: string;
        };
      };
    };
  };
}