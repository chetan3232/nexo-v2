import { create } from 'zustand';
import { Message, CompanionState } from '../types';

interface ChatState {
  messages: Message[];
  companionState: CompanionState;
  voiceTranscription: string;
  addMessage: (msg: Message) => void;
  setMessages: (messages: Message[]) => void;
  setCompanionState: (state: CompanionState) => void;
  setVoiceTranscription: (text: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  companionState: CompanionState.IDLE,
  voiceTranscription: '',
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  setCompanionState: (companionState) => set({ companionState }),
  setVoiceTranscription: (voiceTranscription) => set({ voiceTranscription }),
  clearMessages: () => set({ messages: [] }),
}));
