import { create } from 'zustand';

type AgentStatus = 'Thinking' | 'Coding' | 'Idle';

interface TeamState {
  agentStatuses: Record<string, AgentStatus>;
  setAgentStatus: (agent: string, status: AgentStatus) => void;
  resetAgentStatuses: () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  agentStatuses: {
    Planner: 'Idle',
    PM: 'Idle',
    Designer: 'Idle',
    Frontend: 'Idle',
    Backend: 'Idle',
    DevOps: 'Idle',
    QA: 'Idle',
    Security: 'Idle',
    Debug: 'Idle',
  },
  setAgentStatus: (agent, status) => set((state) => ({
    agentStatuses: { ...state.agentStatuses, [agent]: status }
  })),
  resetAgentStatuses: () => set({
    agentStatuses: {
      Planner: 'Idle',
      PM: 'Idle',
      Designer: 'Idle',
      Frontend: 'Idle',
      Backend: 'Idle',
      DevOps: 'Idle',
      QA: 'Idle',
      Security: 'Idle',
      Debug: 'Idle',
    }
  }),
}));
