import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Paperclip, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useAgentStore } from '../../stores/agentStore';
import { CompanionState, Message } from '../../types';

interface ChatPanelProps {
  onSendMessage: (text: string, attachment?: { name: string; content: string }) => void;
  onRetryMessage: (index: number) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onSendMessage, onRetryMessage }) => {
  const messages = useChatStore((state) => state.messages);
  const companionState = useChatStore((state) => state.companionState);
  
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  // Multimodal file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, companionState]);

  // Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            setInput((prev) => prev + ' ' + e.results[i][0].transcript);
          } else {
            interim += e.results[i][0].transcript;
          }
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleSpeech = () => {
    if (!recognition) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSend = () => {
    if (!input.trim() && !attachedFile) return;
    if (isListening && recognition) {
      recognition.stop();
    }
    onSendMessage(input, attachedFile || undefined);
    setInput('');
    setAttachedFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.onload = (event) => {
        setAttachedFile({
          name: file.name,
          content: event.target?.result as string, // Base64 encoding
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        setAttachedFile({
          name: file.name,
          content: event.target?.result as string, // Raw text
        });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] border-l border-stone-800 text-stone-200">
      
      {/* Header */}
      <div className="h-12 border-b border-stone-800 flex items-center justify-between px-4 shrink-0">
        <span className="font-bold text-xs tracking-wide">Studio Chat Assistant</span>
        <div className="flex items-center gap-1 text-[9px] font-mono text-stone-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase">
          <span className={`w-1 h-1 rounded-full ${companionState === CompanionState.IDLE ? 'bg-green-500' : 'bg-indigo-500 animate-pulse'}`}></span>
          <span>{companionState}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-300`}>
            {msg.isError ? (
              <div className="max-w-[90%] p-3 bg-red-950/20 border border-red-800/40 rounded-2xl rounded-tl-none text-red-300 space-y-2 shadow-lg">
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>Compilation / Gen Error</span>
                </div>
                <p className="text-[11px] leading-relaxed text-red-400">{msg.text}</p>
                <button
                  onClick={() => onRetryMessage(idx)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] font-bold text-red-400 hover:bg-red-500/20 transition-all shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Request
                </button>
              </div>
            ) : (
              <div className={`max-w-[90%] p-3 text-[11px] leading-relaxed shadow-lg ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                  : 'bg-stone-900 border border-stone-800 text-stone-300 rounded-2xl rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
        {companionState !== CompanionState.IDLE && (
          <div className="flex justify-start items-center gap-1.5 text-stone-500 text-[9px] font-bold uppercase tracking-widest px-1.5 animate-pulse">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Companion is working...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-stone-950/50 border-t border-stone-800 space-y-1.5">
        {attachedFile && (
          <div className="flex items-center justify-between bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-[9px] font-mono">
            <span className="truncate max-w-[180px] text-indigo-300">📎 {attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="text-stone-500 hover:text-white">✕</button>
          </div>
        )}
        
        <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-0.5 focus-within:border-stone-700 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-stone-500 hover:text-white transition-colors"
            title="Attach file / image mockup"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,text/*,.json,.js,.ts,.tsx" />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type prompt here..."
            className="flex-1 bg-transparent border-none text-white text-[11px] p-2 outline-none resize-none h-8 scrollbar-none font-normal"
            rows={1}
          />

          <button
            onClick={toggleSpeech}
            className={`p-2 transition-colors ${isListening ? 'text-red-400 animate-pulse' : 'text-stone-500 hover:text-white'}`}
            title="Voice command integration"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() && !attachedFile}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-800 disabled:text-stone-600 text-white rounded-lg transition-all font-bold"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>

    </div>
  );
};
export default ChatPanel;
