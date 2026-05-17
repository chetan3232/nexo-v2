import { create } from "zustand";

interface VisualEditorStore {
  isVisualMode: boolean;
  setIsVisualMode: (val: boolean) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  styles: Record<string, any>;
  updateStyle: (id: string, style: any) => void;
}

export const useVisualEditorStore = create<VisualEditorStore>((set) => ({
  isVisualMode: false,
  setIsVisualMode: (isVisualMode) => set({ isVisualMode }),
  selectedElementId: null,
  setSelectedElementId: (selectedElementId) => set({ selectedElementId }),
  styles: {},
  updateStyle: (id, style) =>
    set((state) => ({
      styles: {
        ...state.styles,
        [id]: { ...(state.styles[id] || {}), ...style },
      },
    })),
}));
