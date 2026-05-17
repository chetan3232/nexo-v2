import { create } from "zustand";

export interface TeamMember {
  id: string;
  name: string;
  role: "designer" | "developer" | "pm" | "ai-agent";
  avatar: string;
  status: "idle" | "coding" | "thinking";
  isAI: boolean;
}

interface TeamStore {
  members: TeamMember[];
  addMember: (member: TeamMember) => void;
  removeMember: (id: string) => void;
  updateStatus: (id: string, status: TeamMember["status"]) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  members: [
    {
      id: "nexo-core",
      name: "NEXO Orchestrator",
      role: "ai-agent",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=nexo",
      status: "idle",
      isAI: true,
    },
    {
      id: "pm-agent",
      name: "Product Lead",
      role: "ai-agent",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=pm",
      status: "idle",
      isAI: true,
    },
    {
      id: "designer-agent",
      name: "UI Architect",
      role: "ai-agent",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=design",
      status: "idle",
      isAI: true,
    },
    {
      id: "frontend-agent",
      name: "Frontend Dev",
      role: "ai-agent",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=frontend",
      status: "idle",
      isAI: true,
    },
    {
      id: "backend-agent",
      name: "Backend Dev",
      role: "ai-agent",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=backend",
      status: "idle",
      isAI: true,
    },
    {
      id: "qa-agent",
      name: "QA Engineer",
      role: "ai-agent",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=qa",
      status: "idle",
      isAI: true,
    },
    {
      id: "devops-agent",
      name: "DevOps Lead",
      role: "ai-agent",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=devops",
      status: "idle",
      isAI: true,
    },
  ],
  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),
  removeMember: (id) =>
    set((state) => ({ members: state.members.filter((m) => m.id !== id) })),
  updateStatus: (id, status) =>
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, status } : m)),
    })),
}));
