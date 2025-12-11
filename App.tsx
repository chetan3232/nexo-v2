import React, { useState, useEffect } from 'react';
import { Brain, FileText, Menu, Plus } from 'lucide-react';
import { Assistant } from './components/Assistant';
import { NoteList } from './components/NoteList';
import { Note } from './types';
import { loadNotes, saveNotesToStorage } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'assistant' | 'notes'>('assistant');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load notes on mount
  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  // Save notes when changed
  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  const handleCreateNote = (title: string, content: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: title || 'Untitled Note',
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    return "Note saved successfully.";
  };

  const handleEditNote = (target: string, newTitle?: string, newContent?: string) => {
    const lowerTarget = target.toLowerCase();
    const note = notes.find(n => 
      n.id === target || 
      n.title.toLowerCase().includes(lowerTarget)
    );

    if (!note) return `I couldn't find a note matching "${target}".`;

    setNotes(prev => prev.map(n => {
      if (n.id === note.id) {
        return {
          ...n,
          title: newTitle || n.title,
          content: newContent || n.content,
          updatedAt: Date.now()
        };
      }
      return n;
    }));
    return `Note updated.`;
  };

  const handleExportNotes = async (format: string) => {
    return `Initiating ${format} export for ${notes.length} notes.`;
  };

  return (
    <div className="flex h-screen bg-white text-[#1f1f1f] overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white z-50 flex items-center px-4 justify-between border-b border-[#e5e7eb]">
         <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-[#5f6368]">
           <Menu size={24} />
         </button>
         <span className="font-medium text-lg text-[#1f1f1f]">NEXO</span>
         <div className="w-8"></div> {/* Spacer */}
      </div>

      {/* Sidebar - Gemini Style (Light Gray) */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#f0f4f9] transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        flex flex-col p-4
      `}>
        <div className="flex items-center space-x-2 mb-8 px-2 md:mt-2 mt-16">
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 mr-2">
            <Menu size={24} />
          </button>
          <span className="text-xl font-medium text-[#444746]">NEXO</span>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={() => { setActiveTab('assistant'); setIsSidebarOpen(false); }}
          className="flex items-center space-x-3 bg-[#dde3ea] text-[#1f1f1f] px-4 py-3 rounded-full mb-6 hover:shadow-sm transition-all w-fit"
        >
          <Plus size={20} className="text-[#444746]" />
          <span className="font-medium text-sm text-[#444746]">New chat</span>
        </button>

        <div className="flex flex-col space-y-1">
          <button 
            onClick={() => { setActiveTab('assistant'); setIsSidebarOpen(false); }}
            className={`flex items-center space-x-4 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'assistant' ? 'bg-[#d3e3fd] text-[#001d35]' : 'text-[#444746] hover:bg-[#e1e3e1]'
            }`}
          >
            <Brain size={18} />
            <span>Assistant</span>
          </button>

          <button 
            onClick={() => { setActiveTab('notes'); setIsSidebarOpen(false); }}
            className={`flex items-center space-x-4 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'notes' ? 'bg-[#d3e3fd] text-[#001d35]' : 'text-[#444746] hover:bg-[#e1e3e1]'
            }`}
          >
            <FileText size={18} />
            <span>Notes</span>
            <span className="ml-auto bg-white/50 px-2 py-0.5 rounded-full text-xs">
              {notes.length}
            </span>
          </button>
        </div>

        <div className="mt-auto px-4 py-4 text-xs text-[#747775]">
          <p>NEXO may display inaccurate info, including about people, so double-check its responses.</p>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden bg-white relative pt-16 md:pt-0">
        <div className="h-full w-full overflow-y-auto">
          {activeTab === 'assistant' ? (
            <Assistant 
              onCreateNote={handleCreateNote}
              onEditNote={handleEditNote}
              onExportNotes={handleExportNotes}
              notesCount={notes.length}
              notes={notes}
            />
          ) : (
            <div className="p-4 md:p-8 max-w-6xl mx-auto">
              <NoteList notes={notes} setNotes={setNotes} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}