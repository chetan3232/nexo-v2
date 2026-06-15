import React from 'react';
import { Terminal, Code, MessageSquare, Monitor, Users, Settings, LogOut, ArrowLeft, Globe, ShieldAlert } from 'lucide-react';
import { useTeamStore } from '../../stores/teamStore';

interface WorkspaceSidebarProps {
  activeTab: 'chat' | 'code' | 'preview' | 'team' | 'observe' | 'scanner';
  setActiveTab: (tab: 'chat' | 'code' | 'preview' | 'team' | 'observe' | 'scanner') => void;
  onOpenSettings: () => void;
  onExit: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onExit
}) => {
  const agentStatuses = useTeamStore((state) => state.agentStatuses);

  const menuItems = [
    { id: 'chat', label: 'Builder Chat', icon: MessageSquare },
    { id: 'code', label: 'Code Editor', icon: Code },
    { id: 'preview', label: 'Live Preview', icon: Monitor },
    { id: 'team', label: 'Agent Squads', icon: Users },
    { id: 'observe', label: 'Observe Clone', icon: Globe },
    { id: 'scanner', label: 'Production Audit', icon: ShieldAlert },
  ] as const;


  return (
    <div className="w-14 md:w-48 bg-[#09090b] border-r border-stone-900 flex flex-col justify-between shrink-0 select-none text-stone-400">
      
      {/* Top Header Logo */}
      <div className="space-y-4">
        <div className="h-12 border-b border-stone-900 flex items-center gap-2 px-3 shrink-0">
          <button
            onClick={onExit}
            className="p-1 hover:bg-white/5 rounded-lg text-stone-500 hover:text-white transition-colors"
            title="Exit Workspace"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="hidden md:inline font-bold text-xs text-white uppercase tracking-wider">Nexo Studio</span>
        </div>

        {/* Menu Navigation */}
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'hover:bg-white/5 text-stone-400 hover:text-stone-200'
              }`}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Profile and Settings config */}
      <div className="p-2 border-t border-stone-900 space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-bold hover:bg-white/5 text-stone-400 hover:text-stone-200 transition-all"
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>

    </div>
  );
};
export default WorkspaceSidebar;
