/**
 * AgentEventBus
 * 
 * Singleton wrapper around useAgentEventStore.
 * The Orchestrator and all agents call AgentEventBus.emit(event)
 * to push events into the live timeline without importing React hooks.
 */

import { useAgentEventStore } from "../stores/agentEventStore";
import { AgentEvent, AgentEventType } from "../types/agentEvents";

export class AgentEventBus {
  private static instance: AgentEventBus;

  public static getInstance(): AgentEventBus {
    if (!AgentEventBus.instance) {
      AgentEventBus.instance = new AgentEventBus();
    }
    return AgentEventBus.instance;
  }

  private constructor() {}

  /** Emit any typed AgentEvent into the timeline store */
  public emit(event: AgentEvent): void {
    useAgentEventStore.getState().emit(event);
  }

  /** Shorthand helpers for common events */

  public thinking(message: string): void {
    this.emit({ type: "thinking", message, timestamp: Date.now() });
  }

  public fileCreate(path: string): void {
    this.emit({ type: "file_create", path, timestamp: Date.now() });
  }

  public fileWrite(path: string, chunk: string): void {
    this.emit({ type: "file_write", path, chunk, timestamp: Date.now() });
  }

  public fileDone(path: string): void {
    this.emit({ type: "file_done", path, timestamp: Date.now() });
  }

  public buildStart(): void {
    this.emit({ type: "build_start", timestamp: Date.now() });
  }

  public buildSuccess(): void {
    this.emit({ type: "build_success", timestamp: Date.now() });
  }

  public buildError(message: string): void {
    this.emit({ type: "build_error", message, timestamp: Date.now() });
  }

  public autoFix(attempt: number, maxAttempts: number, error: string): void {
    this.emit({ type: "auto_fix", attempt, maxAttempts, error, timestamp: Date.now() });
  }

  public previewReady(url: string): void {
    this.emit({ type: "preview_ready", url, timestamp: Date.now() });
  }

  public agentSwitch(from: string, to: string): void {
    this.emit({ type: "agent_switch", from, to, timestamp: Date.now() });
  }

  public userMessage(text: string): void {
    this.emit({ type: "user", text, timestamp: Date.now() });
  }

  public assistantMessage(text: string): void {
    this.emit({ type: "assistant", text, timestamp: Date.now() });
  }

  public done(message: string, fileCount: number): void {
    this.emit({ type: "done", message, fileCount, timestamp: Date.now() });
  }

  /** Reset all events before a new generation starts */
  public clear(): void {
    useAgentEventStore.getState().clearEvents();
  }

  /** Start / stop generation flag */
  public setGenerating(v: boolean): void {
    useAgentEventStore.getState().setIsGenerating(v);
  }

  /**
   * Parse a streaming text chunk and auto-detect file paths using the
   * Nexo Protocol marker: ---FILE: path---
   * Returns the detected file paths for the caller to track.
   */
  public parseStreamChunkForFiles(
    chunk: string,
    knownPaths: Set<string>
  ): Set<string> {
    const FILE_MARKER = /---FILE:\s*([^\s-][^\n]*?)---/g;
    let match: RegExpExecArray | null;
    const newPaths = new Set(knownPaths);

    while ((match = FILE_MARKER.exec(chunk)) !== null) {
      const path = match[1].trim();
      if (!newPaths.has(path)) {
        newPaths.add(path);
        this.fileCreate(path);
      }
    }

    return newPaths;
  }
}
