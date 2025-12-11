import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Sparkles, Volume2, VolumeX, Trash2, Settings, X, Save, CheckCircle, AlertCircle, Copy, Check, Plus, Image as ImageIcon, Code, PenTool, Lightbulb, Compass, Lock, CreditCard, Terminal, Loader2, ShieldCheck, RefreshCw, Key } from 'lucide-react';
import { Message, Note } from '../types';
import { sendMessageToAI, ModelProvider } from '../services/ai';
import { speakText, VoiceSettings, DEFAULT_SETTINGS, getVoiceSettingsForContext } from '../services/elevenlabs';
import { exportNotes } from '../services/export';
import { loadChatHistory, saveChatHistory, clearChatHistory } from '../services/storage';
import { UPI_ID, PREMIUM_COST } from '../constants';

interface AssistantProps {
  onCreateNote: (title: string, content: string) => string;
  onEditNote: (target: string, newTitle?: string, newContent?: string) => string;
  onExportNotes: (format: string) => Promise<string>;
  notesCount: number;
  notes: Note[];
}

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[#e5e7eb] bg-[#f8f9fa] shadow-sm group">
      <div className="flex items-center justify-between px-3 py-2 bg-[#f0f4f9] border-b border-[#e5e7eb]">
        <span className="text-xs font-mono text-[#444746] uppercase font-bold">{language || 'CODE'}</span>
        <button 
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[#5f6368] hover:text-[#1f1f1f] transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy code'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar bg-white">
        <pre className="font-mono text-sm text-[#1f1f1f] whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const parts = content.split(/```(\w*)\n([\s\S]*?)```/g);
  
  if (parts.length === 1) {
    return <p className="leading-7 whitespace-pre-wrap text-[#1f1f1f]">{content}</p>;
  }

  return (
    <div className="leading-7 space-y-2">
      {parts.map((part, index) => {
        if (index % 3 === 0) {
          if (!part.trim()) return null;
          return <p key={index} className="whitespace-pre-wrap text-[#1f1f1f]">{part}</p>;
        } else if (index % 3 === 1) {
          return null;
        } else {
          const language = parts[index - 1];
          return <CodeBlock key={index} language={language} code={part} />;
        }
      })}
    </div>
  );
};

export const Assistant: React.FC<AssistantProps> = ({ onCreateNote, onEditNote, onExportNotes, notesCount, notes }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelProvider>('google'); // Default to Flex (Gemini)
  const [isCodingMode, setIsCodingMode] = useState(false);
  
  // Premium Features
  const [isPremium, setIsPremium] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verificationStep, setVerificationStep] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [captcha, setCaptcha] = useState({ q: '', a: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isListeningRef = useRef(isListening);
  const isSpeakingRef = useRef(isSpeaking);

  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input, liveTranscript]);

  useEffect(() => {
    const history = loadChatHistory();
    if (history.length > 0) setMessages(history);
    
    // Check premium status using a secure-looking token (Base64 encoded)
    const premiumToken = localStorage.getItem('nexo_secure_token');
    if (premiumToken) {
      try {
        const decoded = atob(premiumToken);
        if (decoded.startsWith('nexo_verified_')) {
          setIsPremium(true);
        }
      } catch (e) {
        localStorage.removeItem('nexo_secure_token');
      }
    }
    
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ q: `${a} + ${b}`, a: a + b });
    setCaptchaInput('');
  };

  useEffect(() => {
    if (messages.length > 0) saveChatHistory(messages);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        if (isListeningRef.current) {
          try { recognition.start(); } catch (e) { setIsListening(false); }
        } else {
          setIsListening(false);
        }
      };
      recognition.onresult = (event: any) => {
        if (isSpeakingRef.current) return;
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interimTranscript += event.results[i][0].transcript;
        }
        if (interimTranscript) setLiveTranscript(interimTranscript);
        if (finalTranscript) {
          const text = finalTranscript.trim();
          setLiveTranscript('');
          handleSendMessage(text, true);
        }
      };
      recognitionRef.current = recognition;
    }
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const toggleSound = () => {
    if (isSpeaking) {
      if (audioRef.current) audioRef.current.pause();
      else window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setSoundEnabled(!soundEnabled);
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear chat history?")) {
      clearChatHistory();
      setMessages([]);
    }
  };

  const handleCreateNote = (title: string, content: string) => {
    const result = onCreateNote(title, content);
    showToast(`Saved: ${title}`, 'success');
    return result;
  };

  const handleEditNote = (target: string, newTitle?: string, newContent?: string) => {
    const result = onEditNote(target, newTitle, newContent);
    showToast("Note updated.", 'success');
    return result;
  };

  const handleSaveSession = () => {
    const conversationMessages = messages.filter(m => m.id !== 'init' && m.role !== 'system');
    if (conversationMessages.length === 0) {
      showToast("Nothing to save.", 'info');
      return;
    }
    const timestamp = new Date().toLocaleString();
    const title = `Chat - ${timestamp}`;
    const content = conversationMessages
      .map(m => {
        const speaker = m.role === 'user' ? 'USER' : 'NEXO';
        return `**${speaker}**:\n${m.content}`;
      })
      .join('\n\n---\n\n');
    handleCreateNote(title, content);
  };

  const toolHandler = async (name: string, args: any) => {
    if (name === 'createNote') return handleCreateNote(args.title, args.content);
    if (name === 'editNote') return handleEditNote(args.target, args.newTitle, args.newContent);
    if (name === 'exportNotes') {
      try {
        await exportNotes(notes, args.format, showToast);
        return await onExportNotes(args.format);
      } catch (e: any) { return `Failed: ${e.message}`; }
    }
    return "Unknown tool.";
  };

  const handleModelChange = (model: ModelProvider) => {
    // If selecting OpenAI (now v2/Premium), check payment
    if (model === 'openai' && !isPremium) {
      setShowPaymentModal(true);
      return;
    }
    setCurrentModel(model);
  };

  const handleVerifyPayment = () => {
    // 1. Validate UTR (Exact 12 digits)
    if (!/^\d{12}$/.test(transactionId)) {
      setPaymentError("Invalid UTR. Must be exactly 12 digits.");
      return;
    }

    // 2. Validate Captcha
    if (parseInt(captchaInput) !== captcha.a) {
      setPaymentError("Incorrect math answer. Please try again.");
      generateCaptcha();
      return;
    }
    
    setPaymentError('');
    setIsVerifyingPayment(true);
    setVerificationStep("Connecting to Secure Gateway...");

    // Simulated 3-Step Verification Process
    setTimeout(() => {
       setVerificationStep("Validating Transaction ID...");
       
       setTimeout(() => {
          setVerificationStep("Confirming with Bank...");
          
          setTimeout(() => {
            setIsVerifyingPayment(false);
            setVerificationStep('');
            
            // Generate secure token
            const secureToken = btoa(`nexo_verified_${Date.now()}_${transactionId.slice(-4)}`);
            localStorage.setItem('nexo_secure_token', secureToken);
            
            setIsPremium(true);
            setShowPaymentModal(false);
            setCurrentModel('openai'); // Switch to Premium (v2/OpenAI) automatically
            showToast("Payment Verified! Premium Unlocked.", "success");
            setTransactionId('');
          }, 1500);
          
       }, 1500);
       
    }, 1500);
  };

  const handleSendMessage = async (text: string, fromVoice = false) => {
    if (!text.trim()) return;

    if (isSpeaking) {
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const newUserMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      isVoice: fromVoice
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setLiveTranscript('');
    setIsThinking(true);

    try {
      const history = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, parts: [{ text: m.content }] }));
      
      let promptToSend = text;
      
      // ENFORCED CODING MODE PROMPT
      if (isCodingMode) {
        promptToSend = `[SYSTEM: CODING MODE ACTIVE.
        
CRITICAL INSTRUCTIONS:
1. STRICTLY CODE ONLY. NO CONVERSATIONAL FILLER. NO "Here is the code". NO "I hope this helps".
2. START DIRECTLY WITH THE CODE BLOCK.
3. FOR HTML/WEB REQUESTS: You MUST generate a SINGLE index.html file containing ALL CSS (in <style>) and JS (in <script>). DO NOT separate files.
4. Make the UI modern, beautiful, and futuristic. Best quality code only.
]\n\n${text}`;
      }

      const aiResponseText = await sendMessageToAI(currentModel, promptToSend, history, toolHandler);
      
      const newAiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: aiResponseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newAiMsg]);
      setIsThinking(false);

      if (soundEnabled && !aiResponseText.includes('```')) {
        playAiResponse(aiResponseText);
      }

    } catch (error: any) {
      console.error(error);
      setIsThinking(false);
      // Display specific error message to the user
      const errorMessage = error.message || "Network error.";
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `Error: ${errorMessage}`, timestamp: Date.now() }]);
    }
  };

  const speakNative = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices.find(v => v.lang.includes('en-US')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    audioRef.current = null;
    window.speechSynthesis.speak(utterance);
  };

  const playAiResponse = async (text: string) => {
    if (!text) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    
    // Always use default key logic since we removed user input for ElevenLabs
    const defaultKey = 'sk_e8ef01d93be3ddfe8bfd93f57f1e031c842ab8381457588b'; 

    if (!defaultKey) {
        showToast("Using System Voice", "info");
        speakNative(text);
        return;
    }
    
    try {
        const audio = await speakText(text, voiceSettings, defaultKey);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => { setIsSpeaking(false); showToast("Voice fallback.", "info"); speakNative(text); };
        await audio.play();
    } catch (e: any) {
        speakNative(text);
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-white">
      {/* Toast */}
      {notification && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium ${
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
            'bg-[#1e1e1e] text-white border-[#1e1e1e]'
          }`}>
             {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
             <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="absolute top-0 right-0 z-20 flex gap-1 p-4 items-center">
           <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full text-[#444746] hover:bg-[#f0f4f9] transition-colors" title="Settings">
             <Settings size={20} />
           </button>
           <button onClick={toggleSound} className={`p-2 rounded-full transition-colors ${soundEnabled ? 'text-blue-600 bg-blue-50' : 'text-[#444746] hover:bg-[#f0f4f9]'}`} title="Toggle Voice">
             {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
           </button>
           <button onClick={handleClearHistory} className="p-2 rounded-full text-[#444746] hover:bg-[#f0f4f9] transition-colors" title="Clear History">
             <Trash2 size={20} />
           </button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-0 animate-slide-up relative flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb] sticky top-0 bg-white z-10 rounded-t-2xl shrink-0">
                <h3 className="text-lg font-semibold text-[#1f1f1f] flex items-center gap-2">
                    <ShieldCheck className="text-green-600" size={20} />
                    Secure Gateway
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-[#5f6368] hover:bg-[#f0f4f9] p-1.5 rounded-full">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Content - Added flex-1 and min-h-0 for proper scrolling */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div className="text-center mb-6">
                    <p className="text-sm text-[#444746] mb-1">Lifetime Access</p>
                    <div className="text-3xl font-bold text-[#2B6CFF]">{PREMIUM_COST}</div>
                    <p className="text-xs text-gray-500 mt-1">Unlock NEXO v2 + Priority Support</p>
                </div>
                
                <div className="flex flex-col items-center bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-[#e5e7eb] mb-3">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${UPI_ID}&pn=NEXO Premium&am=199&cu=INR`}
                        alt="Payment QR Code" 
                        className="rounded-md"
                    />
                    </div>
                    <p className="text-xs font-medium text-[#1f1f1f] mb-1">Scan & Pay via any UPI App</p>
                    <p className="font-mono text-[10px] text-[#5f6368] bg-white px-2 py-1 rounded border border-[#e5e7eb] inline-flex items-center gap-1 select-all cursor-pointer hover:bg-gray-50" onClick={() => {navigator.clipboard.writeText(UPI_ID); showToast("UPI ID Copied")}}>
                        {UPI_ID} <Copy size={10} />
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[#5f6368] uppercase mb-1">
                            1. Enter UTR / Ref ID
                        </label>
                        <input 
                            type="text"
                            placeholder="Example: 345678901234"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ''))}
                            maxLength={12}
                            className={`w-full px-4 py-3 bg-[#f8f9fa] border rounded-xl text-[#1f1f1f] focus:outline-none focus:ring-2 transition-all font-mono text-center tracking-widest text-lg ${paymentError.includes('UTR') ? 'border-red-500 focus:ring-red-200' : 'border-[#e5e7eb] focus:ring-blue-100'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#5f6368] uppercase mb-1">
                            2. Security Check: {captcha.q} = ?
                        </label>
                        <div className="flex gap-2">
                             <input 
                                type="number"
                                placeholder="?"
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                className={`w-20 px-3 py-2 bg-[#f8f9fa] border rounded-lg text-center font-bold text-[#1f1f1f] focus:outline-none focus:ring-2 ${paymentError.includes('math') ? 'border-red-500' : 'border-[#e5e7eb] focus:ring-blue-100'}`}
                            />
                            <button onClick={generateCaptcha} className="p-2 text-[#5f6368] hover:bg-[#f0f4f9] rounded-lg" title="Refresh Captcha">
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    {paymentError && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-xs font-medium animate-pulse">
                            <AlertCircle size={14} />
                            {paymentError}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Footer (Sticky) */}
            <div className="p-4 border-t border-[#e5e7eb] bg-white sticky bottom-0 rounded-b-2xl shrink-0">
                <button 
                onClick={handleVerifyPayment}
                disabled={isVerifyingPayment || transactionId.length !== 12 || !captchaInput}
                className={`w-full font-medium py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm
                    ${isVerifyingPayment || transactionId.length !== 12 || !captchaInput
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200' 
                    : 'bg-[#1f1f1f] text-white hover:bg-black shadow-gray-200'}`}
                >
                {isVerifyingPayment ? (
                    <>
                    <Loader2 size={18} className="animate-spin" />
                    {verificationStep}
                    </>
                ) : (
                    <>
                    <Lock size={16} />
                    Verify Securely
                    </>
                )}
                </button>
                <div className="flex justify-center items-center gap-1 mt-3 text-[10px] text-[#8e918f]">
                    <Lock size={10} />
                    <span>256-bit SSL Encrypted Verification</span>
                </div>
            </div>

          </div>
        </div>
      )}

      {/* Settings Overlay */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-30 w-80 bg-white rounded-2xl p-6 shadow-xl border border-[#e5e7eb] animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-[#1f1f1f]">Settings</h3>
            <button onClick={() => setShowSettings(false)} className="text-[#5f6368] hover:bg-[#f0f4f9] p-1 rounded-full"><X size={20} /></button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium text-[#5f6368] mb-2 block uppercase tracking-wide">AI Model</label>
              <div className="flex bg-[#f0f4f9] p-1 rounded-lg">
                <button
                  onClick={() => handleModelChange('google')}
                  className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${currentModel === 'google' ? 'bg-white text-blue-600 shadow-sm' : 'text-[#444746]'}`}
                >
                  Flex (Free)
                </button>
                <button
                  onClick={() => handleModelChange('openai')}
                  className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${currentModel === 'openai' ? 'bg-white text-[#d96570] shadow-sm' : 'text-[#444746]'}`}
                >
                  v2 {!isPremium && <Lock size={12} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#5f6368] mb-2 block uppercase tracking-wide">Voice Settings</label>
              <p className="text-sm text-[#444746] mb-2">Adjust speech output style.</p>
              <div className="grid grid-cols-2 gap-2">
                 {['neutral', 'expressive'].map((preset) => (
                    <button 
                      key={preset}
                      onClick={() => setVoiceSettings(getVoiceSettingsForContext(preset as any))}
                      className="px-2 py-1.5 bg-[#f0f4f9] rounded text-xs text-[#444746] hover:bg-[#dfe3e7] capitalize"
                    >
                      {preset}
                    </button>
                 ))}
              </div>
            </div>
            
            {isPremium && (
               <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-2">
                 <div className="bg-green-100 p-1.5 rounded-full text-green-700">
                    <CheckCircle size={14} />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-green-800">Premium Active</p>
                   <p className="text-[10px] text-green-600">Lifetime license unlocked</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto pt-20 pb-40 px-4">
        {messages.length === 0 ? (
           <div className="flex flex-col items-center justify-center mt-12 animate-slide-up">
              <div className="text-5xl md:text-6xl font-medium mb-2 tracking-tight">
                <span className="gemini-gradient-text">Hello, NEXO</span>
              </div>
              <p className="text-2xl text-[#c4c7c5] font-medium mb-12">How can I help you today?</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl">
                 {[
                   { icon: <Compass size={20} className="text-[#4285f4]" />, label: "Plan a trip", sub: "Road trip to mountains" },
                   { icon: <Lightbulb size={20} className="text-[#eab308]" />, label: "Brainstorm", sub: "Startup business names" },
                   { icon: <Code size={20} className="text-[#c758d4]" />, label: "Write code", sub: "Python API script" },
                   { icon: <PenTool size={20} className="text-[#e26a45]" />, label: "Draft email", sub: "Request for meeting" },
                 ].map((item, idx) => (
                   <button key={idx} onClick={() => handleSendMessage(item.label + " " + item.sub)} className="p-4 bg-[#f0f4f9] rounded-xl text-left hover:bg-[#dfe3e7] transition-colors h-32 flex flex-col justify-between">
                      <span className="bg-white p-2 rounded-full w-fit shadow-sm">{item.icon}</span>
                      <span className="text-sm font-medium text-[#1f1f1f]">{item.label}</span>
                   </button>
                 ))}
              </div>
           </div>
        ) : (
           <div className="space-y-8">
             {messages.map((msg) => (
               <div key={msg.id} className={`flex gap-4 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                 
                 {/* Avatar/Icon */}
                 <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 ${msg.role === 'user' ? 'hidden' : 'bg-white'}`}>
                    {msg.role === 'model' && <Sparkles size={20} className="text-[#4285f4]" />}
                 </div>

                 {/* Message Content */}
                 <div className={`max-w-[85%] ${
                     msg.role === 'user' 
                       ? 'bg-[#f0f4f9] text-[#1f1f1f] px-5 py-3 rounded-[20px] rounded-br-sm' 
                       : 'bg-transparent text-[#1f1f1f] py-1'
                   }`}>
                   
                   {msg.role === 'model' && (
                     <div className="mb-1 text-sm font-medium text-[#1f1f1f]">NEXO {currentModel === 'google' ? 'Flex' : 'v2'}</div>
                   )}
                   
                   <MessageContent content={msg.content} />
                   
                   {/* Model Actions */}
                   {msg.role === 'model' && (
                      <div className="flex gap-1 mt-3">
                         <button onClick={() => playAiResponse(msg.content)} className="p-1.5 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full transition-colors" title="Listen">
                           <Volume2 size={16} />
                         </button>
                         <button onClick={() => {navigator.clipboard.writeText(msg.content); showToast("Copied to clipboard")}} className="p-1.5 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full transition-colors" title="Copy">
                           <Copy size={16} />
                         </button>
                         <button onClick={() => handleSaveSession()} className="p-1.5 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full transition-colors" title="Save Chat">
                           <Save size={16} />
                         </button>
                      </div>
                   )}
                 </div>
               </div>
             ))}
             {isThinking && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mt-1"><Sparkles size={20} className="text-[#4285f4] animate-pulse" /></div>
                  <div className="text-[#5f6368] py-2 text-sm font-medium animate-pulse">Thinking...</div>
                </div>
             )}
             <div ref={chatEndRef} />
           </div>
        )}
      </div>

      {/* Input Area - Basic Gemini Style */}
      <div className="fixed bottom-0 left-0 right-0 md:left-72 bg-white pb-6 pt-2 px-4 z-10">
         <div className="max-w-3xl mx-auto relative">
            
            <div className={`bg-[#f0f4f9] rounded-full flex items-center px-2 py-2 transition-shadow ${input ? 'shadow-sm' : ''} ${isCodingMode ? 'ring-2 ring-green-100' : ''}`}>
               
               {/* Plus Button */}
               <button className="p-2.5 rounded-full text-[#1f1f1f] hover:bg-[#dfe3e7] transition-colors shrink-0">
                  <Plus size={20} />
               </button>

               {/* Coding Mode Toggle */}
               <button 
                  onClick={() => setIsCodingMode(!isCodingMode)} 
                  className={`p-2.5 rounded-full transition-colors shrink-0 ${isCodingMode ? 'bg-[#d1e7dd] text-[#0f5132]' : 'text-[#1f1f1f] hover:bg-[#dfe3e7]'}`}
                  title="Coding Mode"
               >
                  <Terminal size={20} />
               </button>

               {/* Input */}
               <textarea 
                  ref={textareaRef}
                  value={liveTranscript || input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(input);
                    }
                  }}
                  placeholder={isCodingMode ? "Describe your code/app..." : "Enter a prompt here"}
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[#1f1f1f] placeholder-[#5f6368] px-2 py-2 text-[16px] resize-none max-h-32 custom-scrollbar outline-none"
                  style={{ minHeight: '44px' }}
               />

               <div className="flex items-center gap-1 pr-1">
                  {/* Mic Button */}
                  <button 
                     onClick={toggleListening}
                     className={`p-2.5 rounded-full transition-colors ${isListening ? 'bg-[#ef4444] text-white animate-pulse' : 'text-[#1f1f1f] hover:bg-[#dfe3e7]'}`}
                  >
                     <Mic size={20} />
                  </button>

                  {/* Send Button */}
                  {input.trim() && (
                    <button 
                       onClick={() => handleSendMessage(input)}
                       className="p-2.5 text-[#0b57d0] hover:bg-[#d3e3fd] rounded-full transition-colors"
                    >
                       <Send size={20} />
                    </button>
                  )}
               </div>
            </div>
            
            <div className="text-center mt-3">
               <span className="text-[11px] text-[#5f6368]">NEXO can make mistakes. Check important info.</span>
            </div>
         </div>
      </div>
    </div>
  );
};