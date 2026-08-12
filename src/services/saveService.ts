import { auth, saveChatToFirebase } from "./firebase";
import { useChatStore } from "../stores/chatStore";
import { useProjectStore } from "../stores/projectStore";
import { useAgentStore } from "../stores/agentStore";

/**
 * Saves the current chat session and all generated code files
 * to both Firebase (if authenticated) and the local Express server.
 */
export const saveCurrentProject = async (): Promise<any> => {
  const chatStore = useChatStore.getState();
  const projectStore = useProjectStore.getState();
  const agentStore = useAgentStore.getState();

  const chatId = chatStore.currentChatId;
  if (!chatId || chatStore.messages.length === 0) return null;

  // Derive project title from the first user message
  const firstUserMessage = chatStore.messages.find((m) => m.role === "user")?.text || "New Project";
  const projectTitle = firstUserMessage.length > 24
    ? firstUserMessage.substring(0, 24) + "..."
    : firstUserMessage;

  const chatData = {
    id: chatId,
    name: projectTitle,
    title: projectTitle,
    date: new Date().toLocaleDateString(),
    updatedAt: Date.now(),
    messages: chatStore.messages,
    content: projectStore.currentContent,
    model: agentStore.selectedModel,
    projectMode: agentStore.projectMode,
    messageCount: chatStore.messages.length,
    fileCount: Object.keys(projectStore.currentContent?.files || {}).length,
  };

  console.log(`[SaveService] Saving project ${chatId} (${projectTitle}) with ${chatData.fileCount} files...`);

  // 1. Save to Firebase (or LocalStorage offline fallback)
  const user = auth.currentUser;
  const uid = user ? user.uid : "mock-local-user-id";
  try {
    await saveChatToFirebase(uid, chatData);
  } catch (e) {
    console.error("[SaveService] Firebase/Local save error:", e);
  }

  // 3. Save to backend persistent project storage if currentProjectId is set
  const currentProjectId = projectStore.currentProjectId;
  if (currentProjectId) {
    try {
      const { saveProjectFileApi, addChatMessageApi } = await import("./projectApi");
      
      // Save all files to backend persistent storage
      const files = projectStore.currentContent?.files || {};
      for (const [filePath, content] of Object.entries(files)) {
        await saveProjectFileApi(currentProjectId, {
          path: filePath,
          content: content as string
        }).catch((e) => console.warn(`[SaveService] Persistent file save failed for ${filePath}:`, e));
      }

      // Sync latest user prompt / assistant response to project chat
      const lastMsg = chatStore.messages[chatStore.messages.length - 1];
      if (lastMsg) {
        await addChatMessageApi(currentProjectId, {
          role: (lastMsg.role as any) || "user",
          content: lastMsg.text || "",
          message_type: lastMsg.role === "user" ? "user_prompt" : "code_generation",
          metadata: { timestamp: lastMsg.timestamp }
        }).catch((e) => console.warn("[SaveService] Persistent chat sync failed:", e));
      }
    } catch (err) {
      console.error("[SaveService] Persistent backend project save error:", err);
    }
  }

  return chatData;
};
