
export interface CodeExecutionResult {
  code: string;
  output: string;
  status?: 'success' | 'error';
}

export interface WebsiteContent {
  files: Record<string, string>; // Path -> Content mapping
  mainFile: string; // Entry point (e.g., App.tsx)
  template: 'react' | 'web' | 'node' | 'python';
  dependencies?: Record<string, string>; // package.json extras
  patches?: Record<string, string>; // Path -> Diff mapping
}

export interface Message {
  role: 'user' | 'model' | 'system' | 'assistant';
  text: string;
  timestamp: number;
  codeExecution?: CodeExecutionResult;
  websiteContent?: WebsiteContent;
  isError?: boolean;
}

export enum CompanionState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  CODING = 'CODING',
  BUILDING = 'BUILDING',
  SPEAKING = 'SPEAKING',
}

// Model IDs mapping to fast / deep reasoning
export type ModelId = 
  | 'gemini-3-pro-preview'
  | 'gemini-3-flash-preview'
  | 'nvidia/nemotron-3-super-120b-a12b:free'
  | 'google/gemma-4-31b-it:free';

export interface DesignTokens {
  themeMode: 'light' | 'dark' | 'custom';
  primaryColor: string;
  accentColor: string;
  borderRadius: string; // 'md' | 'lg' | 'full'
  fontFamily: string; // 'Inter' | 'Outfit' | 'Geist'
}

export interface BuildTask {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  agent: string; // Agent type: e.g., 'Planner', 'PM', 'Designer', 'Frontend', 'Backend', 'DevOps', 'QA', 'Security', 'Debug'
}

export interface AppConcept {
  id: string;
  name: string;
  description: string;
  designTokens: DesignTokens;
  features: string[];
}

export interface QualityScores {
  performance: number;
  accessibility: number;
  seo: number;
  security: number;
}
