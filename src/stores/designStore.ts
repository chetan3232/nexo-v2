import { create } from "zustand";

interface DesignSystem {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  spacing: {
    unit: number;
    container: string;
  };
  typography: {
    fontFamily: string;
    baseSize: string;
  };
}

interface DesignStore {
  design: DesignSystem;
  updateDesign: (updates: Partial<DesignSystem>) => void;
  selectedElement: {
    id: string;
    tagName: string;
    text: string;
    styles: Record<string, string>;
  } | null;
  setSelectedElement: (el: any) => void;
}

export const useDesignStore = create<DesignStore>((set) => ({
  design: {
    colors: {
      primary: "#6366f1",
      secondary: "#a855f7",
      accent: "#f43f5e",
      background: "#ffffff",
      text: "#1c1917",
    },
    spacing: {
      unit: 4,
      container: "max-w-7xl",
    },
    typography: {
      fontFamily: "Inter, sans-serif",
      baseSize: "16px",
    },
  },
  updateDesign: (updates) =>
    set((state) => ({ design: { ...state.design, ...updates } })),
  selectedElement: null,
  setSelectedElement: (selectedElement) => set({ selectedElement }),
}));
