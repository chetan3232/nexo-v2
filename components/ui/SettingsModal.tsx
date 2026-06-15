import React, { useState } from 'react';
import { X, Key, Github, Save } from 'lucide-react';
import { useMemoryStore } from '../../stores/memoryStore';
import { useAgentStore } from '../../stores/agentStore';
import { ModelId } from '../../types';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const preferences = useMemoryStore((state) => state.preferences);
  const setPreferences = useMemoryStore((state) => state.setPreferences);
  const selectedModel = useAgentStore((state) => state.selectedModel);
  const setSelectedModel = useAgentStore((state) => state.setSelectedModel);

  const [githubToken, setGithubToken] = useState(preferences.githubToken || '');
  const [repoUrl, setRepoUrl] = useState(preferences.repoUrl || '');
  const [branchName, setBranchName] = useState(preferences.branchName || 'main');
  const [model, setModel] = useState<ModelId>(selectedModel);

  const handleSave = () => {
    setPreferences({
      githubToken,
      repoUrl,
      branchName
    });
    setSelectedModel(model);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-stone-200 select-none">
      <div className="max-w-md w-full bg-[#0d0d0f] border border-stone-800 rounded-[2rem] p-6 space-y-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-stone-800">
          <span className="font-bold text-sm text-white">Project Settings</span>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-stone-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* LLM Model select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" /> Default Coder LLM
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelId)}
              className="w-full bg-stone-900 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-200 outline-none cursor-pointer"
            >
              <option value="nvidia/nemotron-3-super-120b-a12b:free">NVIDIA Nemotron-3 Super 120B (Free)</option>
              <option value="google/gemma-4-31b-it:free">Gemma 4 31B (OpenRouter)</option>
              <option value="gemini-3-pro-preview">Gemini 3 Pro (Local GenAI)</option>
              <option value="gemini-3-flash-preview">Gemini 3 Flash (Local GenAI)</option>
            </select>
          </div>

          {/* GitHub Config */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-indigo-400" /> GitHub Repository Push
            </label>
            
            <div className="space-y-2">
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="Personal Access Token (ghp_...)"
                className="w-full bg-stone-900 border border-stone-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-stone-700"
              />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="Repository URL (e.g. chetan3232/Nexo-V2)"
                className="w-full bg-stone-900 border border-stone-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-stone-700"
              />
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Branch Name (e.g. main)"
                className="w-full bg-stone-900 border border-stone-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-stone-700"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors mt-4"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>

      </div>
    </div>
  );
};
export default SettingsModal;
