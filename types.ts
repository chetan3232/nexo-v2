export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isVoice?: boolean;
}

export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  PPTX = 'pptx',
  CSV = 'csv'
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
}