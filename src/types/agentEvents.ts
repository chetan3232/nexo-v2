// ============================================================
//  NEXO Agentic Event System — Typed Event Union
//  Every AI action emits one of these events into the timeline.
// ============================================================

export type AgentEventType =
  | "thinking"       // 🧠 AI analyzing / planning a step
  | "file_create"    // 📁 New file path announced
  | "file_write"     // ⚡ Code chunk streaming into a file
  | "file_done"      // ✅ File fully written
  | "build_start"    // 🏗️ Build process initiated
  | "build_success"  // ✅ Build passed clean
  | "build_error"    // ⚠️ Build / runtime error captured
  | "auto_fix"       // 🔧 AI self-healing attempt
  | "preview_ready"  // 🚀 Preview iframe URL available
  | "agent_switch"   // 🔀 Failover to another AI provider
  | "user"           // 👤 User message (for timeline ordering)
  | "assistant"      // 💬 Final assistant text response
  | "done";          // 🎉 All done — session summary

export interface ThinkingEvent {
  type: "thinking";
  message: string;
  timestamp: number;
}

export interface FileCreateEvent {
  type: "file_create";
  path: string;
  timestamp: number;
}

export interface FileWriteEvent {
  type: "file_write";
  path: string;
  chunk: string;        // latest accumulated content for preview
  timestamp: number;
}

export interface FileDoneEvent {
  type: "file_done";
  path: string;
  timestamp: number;
}

export interface BuildStartEvent {
  type: "build_start";
  timestamp: number;
}

export interface BuildSuccessEvent {
  type: "build_success";
  timestamp: number;
}

export interface BuildErrorEvent {
  type: "build_error";
  message: string;
  timestamp: number;
}

export interface AutoFixEvent {
  type: "auto_fix";
  attempt: number;
  maxAttempts: number;
  error: string;
  timestamp: number;
}

export interface PreviewReadyEvent {
  type: "preview_ready";
  url: string;
  timestamp: number;
}

export interface AgentSwitchEvent {
  type: "agent_switch";
  from: string;
  to: string;
  timestamp: number;
}

export interface UserMessageEvent {
  type: "user";
  text: string;
  timestamp: number;
}

export interface AssistantMessageEvent {
  type: "assistant";
  text: string;
  timestamp: number;
}

export interface DoneEvent {
  type: "done";
  message: string;
  fileCount: number;
  timestamp: number;
}

export type AgentEvent =
  | ThinkingEvent
  | FileCreateEvent
  | FileWriteEvent
  | FileDoneEvent
  | BuildStartEvent
  | BuildSuccessEvent
  | BuildErrorEvent
  | AutoFixEvent
  | PreviewReadyEvent
  | AgentSwitchEvent
  | UserMessageEvent
  | AssistantMessageEvent
  | DoneEvent;
