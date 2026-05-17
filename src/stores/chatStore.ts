import { create } from "zustand";
import { Message, CompanionState } from "../types";

interface ChatStore {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  input: string;
  setInput: (input: string) => void;
  state: CompanionState;
  setState: (state: CompanionState) => void;
  hasStarted: boolean;
  setHasStarted: (hasStarted: boolean) => void;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  showSavedChats: boolean;
  setShowSavedChats: (show: boolean) => void;
  savedChatsList: any[];
  setSavedChatsList: (list: any[]) => void;
  recentChats: any[];
  setRecentChats: (list: any[]) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  setMessages: (updater) =>
    set((state) => ({
      messages:
        typeof updater === "function" ? updater(state.messages) : updater,
    })),
  input: "",
  setInput: (input) => set({ input }),
  state: CompanionState.IDLE,
  setState: (companionState) => set({ state: companionState }),
  hasStarted: false,
  setHasStarted: (hasStarted) => set({ hasStarted }),
  currentChatId: null,
  setCurrentChatId: (currentChatId) => set({ currentChatId }),
  showSavedChats: false,
  setShowSavedChats: (showSavedChats) => set({ showSavedChats }),
  savedChatsList: [],
  setSavedChatsList: (savedChatsList) => set({ savedChatsList }),
  recentChats: [],
  setRecentChats: (recentChats) => set({ recentChats }),
  resetChat: () =>
    set({
      messages: [],
      input: "",
      state: CompanionState.IDLE,
      hasStarted: false,
      currentChatId: null,
      recentChats: [],
    }),
}));
