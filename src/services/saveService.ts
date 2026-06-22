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

  // 2. Save to local Node server database
  try {
    const res = await fetch(`/api/chats/save/${chatId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatData),
    });
    if (!res.ok) {
      console.error("[SaveService] Server save error status:", res.status);
    } else {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error("[SaveService] Local save fetch failed:", err);
  }

  return chatData;
};
