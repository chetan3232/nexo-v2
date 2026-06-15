import { create } from 'zustand';

interface SelectedElement {
  id?: string;
  tagName: string;
  className: string;
  textContent: string;
  inlineStyles?: Record<string, string>;
}

interface VisualEditorState {
  visualMode: boolean;
  selectedElement: SelectedElement | null;
  setVisualMode: (visualMode: boolean) => void;
  setSelectedElement: (element: SelectedElement | null) => void;
  clearSelectedElement: () => void;
}

export const useVisualEditorStore = create<VisualEditorState>((set) => ({
  visualMode: false,
  selectedElement: null,
  setVisualMode: (visualMode) => set({ visualMode }),
  setSelectedElement: (selectedElement) => set({ selectedElement }),
  clearSelectedElement: () => set({ selectedElement: null }),
}));

export default useVisualEditorStore;
