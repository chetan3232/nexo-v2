import React from 'react';
import { Terminal, Code, MessageSquare, Monitor, Users, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { useTeamStore } from '../../stores/teamStore';

interface WorkspaceSidebarProps {
  activeTab: 'chat' | 'code' | 'preview' | 'team';
  setActiveTab: (tab: 'chat' | 'code' | 'preview' | 'team') => void;
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
  ] as const;

  return (
    <div className="w-16 md:w-60 bg-[#09090b] border-r border-stone-900 flex flex-col justify-between shrink-0 select-none text-stone-400">
      
      {/* Top Header Logo */}
      <div className="space-y-6">
        <div className="h-16 border-b border-stone-900 flex items-center gap-3 px-4 shrink-0">
          <button
            onClick={onExit}
            className="p-1.5 hover:bg-white/5 rounded-lg text-stone-500 hover:text-white transition-colors"
            title="Exit Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="hidden md:inline font-bold text-sm text-white uppercase tracking-wider">Nexo Studio</span>
        </div>

        {/* Menu Navigation */}
        <nav className="px-3 space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'hover:bg-white/5 text-stone-400 hover:text-stone-200'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Profile and Settings config */}
      <div className="p-3 border-t border-stone-900 space-y-1.5">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-white/5 text-stone-400 hover:text-stone-200 transition-all"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>

    </div>
  );
};
export default WorkspaceSidebar;
