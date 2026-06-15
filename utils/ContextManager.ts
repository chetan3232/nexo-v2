import { Message } from '../types';

export class ContextManager {
  /**
   * Compresses message history to manage LLM token context windows.
   */
  public static summarizeHistory(messages: Message[], maxCount = 8): Message[] {
    if (messages.length <= maxCount) return messages;

    console.log(`[ContextManager] Truncating context. Condensing ${messages.length} messages into ${maxCount} slots.`);

    // Keep the last (maxCount - 1) messages intact
    const recentMessages = messages.slice(-(maxCount - 1));
    
    // Summarize the older messages
    const precedingMessages = messages.slice(0, messages.length - (maxCount - 1));
    const userPrompts = precedingMessages
      .filter((m) => m.role === 'user')
      .map((m) => m.text);

    const summarizedContext = `[Context Summary] Previous conversation history: The user and AI developer collaborated on project layout requirements. Key prompts requested: ${userPrompts.map(p => `"${p}"`).join(', ')}. The developer generated structural components and styled the workspace successfully.`;

    const summaryMessage: Message = {
      role: 'system',
      text: summarizedContext,
      timestamp: Date.now()
    };

    return [summaryMessage, ...recentMessages];
  }
}
export default ContextManager;
