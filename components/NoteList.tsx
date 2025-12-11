import React, { useState, useMemo } from 'react';
import { Note } from '../types';
import { FileText, Clock, Trash2, Search, ArrowUpDown, X, Printer, FileType } from 'lucide-react';
import { exportNotes } from '../services/export';
import Fuse from 'fuse.js';

interface NoteListProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

type SortOption = 'newest' | 'oldest' | 'alpha';

export const NoteList: React.FC<NoteListProps> = ({ notes, setNotes }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this note?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const filteredAndSortedNotes = useMemo(() => {
    let result = notes;
    const query = searchQuery.trim().toLowerCase();

    if (query) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = startOfToday - 86400000;
        
        if (query === 'today') {
             result = notes.filter(n => n.createdAt >= startOfToday);
        } else if (query === 'yesterday') {
             result = notes.filter(n => n.createdAt >= startOfYesterday && n.createdAt < startOfToday);
        } else {
             const fuse = new Fuse(notes, {
                keys: [{ name: 'title', weight: 2 }, { name: 'content', weight: 1 }],
                threshold: 0.4,
                ignoreLocation: true,
             });
             result = fuse.search(searchQuery).map(r => r.item);
        }
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      if (sortBy === 'alpha') return a.title.localeCompare(b.title);
      return 0;
    });

  }, [notes, searchQuery, sortBy]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#e5e7eb] pb-6 gap-6 animate-slide-up">
        <div>
          <h2 className="text-3xl font-normal text-[#1f1f1f]">Notes</h2>
          <p className="text-[#5f6368] mt-1">Your saved ideas and conversations.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           {/* Minimal Search */}
           <div className="relative group flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-[#5f6368]" />
              </div>
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-[#f0f4f9] border-none rounded-full text-sm text-[#1f1f1f] placeholder-[#5f6368] focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5f6368] hover:text-[#1f1f1f]">
                  <X size={14} />
                </button>
              )}
           </div>

           {/* Minimal Sort */}
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowUpDown size={16} className="text-[#5f6368]" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto pl-10 pr-8 py-2.5 bg-[#f0f4f9] border-none rounded-full text-sm text-[#1f1f1f] focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="alpha">A-Z</option>
              </select>
           </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="flex justify-end gap-2 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <button 
              onClick={() => exportNotes(filteredAndSortedNotes, 'docx')} 
              className="px-4 py-2 rounded-full text-sm font-medium border border-[#c4c7c5] text-[#444746] hover:bg-[#f0f4f9] transition-colors flex items-center gap-2"
              disabled={filteredAndSortedNotes.length === 0}
            >
                <FileType size={16} className="text-blue-600" /> Export Word
            </button>
            <button 
              onClick={() => exportNotes(filteredAndSortedNotes, 'pdf')} 
              className="px-4 py-2 rounded-full text-sm font-medium border border-[#c4c7c5] text-[#444746] hover:bg-[#f0f4f9] transition-colors flex items-center gap-2"
              disabled={filteredAndSortedNotes.length === 0}
            >
                <Printer size={16} className="text-red-600" /> Export PDF
            </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#f8f9fa] rounded-2xl">
          <FileText className="w-12 h-12 text-[#c4c7c5] mb-4" />
          <p className="text-[#444746] font-medium">No notes yet</p>
          <p className="text-sm text-[#5f6368] mt-1">Start chatting to save notes.</p>
        </div>
      ) : filteredAndSortedNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#5f6368] text-sm">No matches found.</p>
          <button onClick={() => setSearchQuery('')} className="mt-2 text-[#0b57d0] hover:underline text-sm font-medium">Clear search</button>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {filteredAndSortedNotes.map((note, index) => (
            <div 
              key={note.id} 
              className="bg-white border border-[#e5e7eb] p-5 rounded-2xl hover:shadow-md transition-shadow duration-200 break-inside-avoid animate-slide-up group"
              style={{ animationDelay: `${index * 50 + 100}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-base font-medium text-[#1f1f1f] truncate pr-2" title={note.title}>
                  {note.title}
                </h3>
                <button onClick={() => handleDelete(note.id)} className="text-[#5f6368] hover:text-[#b3261e] transition-colors p-1 rounded-full hover:bg-[#fce8e6]">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <p className="text-[#444746] text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                {note.content.length > 300 ? note.content.substring(0, 300) + "..." : note.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-[#5f6368] pt-3 border-t border-[#f0f4f9]">
                <div className="flex items-center">
                  <Clock size={12} className="mr-1.5" />
                  {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};