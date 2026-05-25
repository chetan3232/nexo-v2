export interface CodeExecutionResult {
  code: string;
  output: string;
  status?: "success" | "error";
}

export interface WebsiteContent {
  files: Record<string, string>;
  patches?: Record<string, string>;
  mainFile: string;
  template: "web" | "react" | "node" | "python" | "unknown";
}

export interface FileProgress {
  status: "writing" | "done";
  charCount: number;
}

export interface Message {
  role: "user" | "model" | "system" | "assistant";
  text: string;
  timestamp: number;
  codeExecution?: CodeExecutionResult;
  websiteContent?: WebsiteContent;
  isError?: boolean;
  content?: any;
}

export enum CompanionState {
  IDLE = "IDLE",
  LISTENING = "LISTENING",
  THINKING = "THINKING",
  CODING = "CODING",
  BUILDING = "BUILDING",
  SPEAKING = "SPEAKING",
}

export type ModelId = "moonshotai/kimi-k2.5" | "minimaxai/minimax-m2.5";

export interface AIModelOptions {
  model: string;
  projectMode?: "frontend" | "fullstack";
  techStack?: string;
  selectedLanguage?: string;
  temperature?: number;
  topP?: number;
}

export enum EditType {
  UPDATE_COMPONENT = "UPDATE_COMPONENT",
  ADD_FEATURE = "ADD_FEATURE",
  FIX_ISSUE = "FIX_ISSUE",
  UPDATE_STYLE = "UPDATE_STYLE",
  REFACTOR = "REFACTOR",
  FULL_REBUILD = "FULL_REBUILD",
  ADD_DEPENDENCY = "ADD_DEPENDENCY",
}

export interface EditIntent {
  type: EditType;
  targetFiles: string[];
  confidence: number;
  description: string;
  suggestedContext: string[];
}

export interface FileManifest {
  files: Record<
    string,
    {
      content: string;
      lastModified: number;
      componentInfo?: {
        name: string;
      };
    }
  >;
  entryPoint: string;
  styleFiles: string[];
}

export interface IntentPattern {
  patterns: RegExp[];
  type: EditType;
  fileResolver: (prompt: string, manifest: FileManifest) => string[];
}
