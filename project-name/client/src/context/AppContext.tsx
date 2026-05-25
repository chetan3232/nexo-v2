import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ProjectFile, ChatSession, ChatMessage, FileCreationStatus } from '../types';
import { api } from '../api';

type ViewMode = 'code' | 'preview' | 'split';

interface AppContextType {
    files: ProjectFile[];
    chats: ChatSession[];
    activeFile: ProjectFile | null;
    currentChat: ChatSession | null;
    openFiles: ProjectFile[];
    isLoading: boolean;
    generationStatus: string;
    viewMode: ViewMode;

    setViewMode: (mode: ViewMode) => void;
    loadFiles: () => Promise<void>;
    loadFile: (id: string) => void;
    closeFile: (id: string) => void;
    createFile: (name: string, type?: 'file' | 'folder', content?: string) => Promise<ProjectFile>;
    updateFileContent: (id: string, content: string) => Promise<void>;
    renameFile: (id: string, name: string) => Promise<void>;
    deleteFile: (id: string) => Promise<void>;

    // Chat
    createChat: () => Promise<void>;
    loadChat: (id: string) => Promise<void>;
    saveChat: (id: string, messages: ChatMessage[], title?: string) => Promise<void>;
    deleteChat: (id: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    getPreviewHTML: () => string | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const getLanguageIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const icons: Record<string, string> = {
        'html': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
        'css': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
        'js': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
        'jsx': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
        'ts': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
        'tsx': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
        'py': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    };
    return icons[ext] || 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/devicon/devicon-original.svg';
};

export const getLanguageName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const names: Record<string, string> = {
        'html': 'HTML', 'css': 'CSS', 'js': 'JavaScript', 'jsx': 'React JSX',
        'ts': 'TypeScript', 'tsx': 'React TSX', 'py': 'Python',
    };
    return names[ext] || 'Text';
};

export const parseCodeBlocks = (text: string) => {
    const blocks: { language: string; code: string; fileName?: string }[] = [];
    const regex = /```(\w+)?\s*\n([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;
    const textParts: string[] = [];
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) textParts.push(text.slice(lastIndex, match.index));
        blocks.push({ language: match[1] || 'text', code: match[2].trim() });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) textParts.push(text.slice(lastIndex));
    return { blocks, textParts, hasCode: blocks.length > 0 };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
    const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
    const [openFiles, setOpenFiles] = useState<ProjectFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('code');

    useEffect(() => { loadFiles(); loadChatsList(); }, []);

    const loadFiles = async () => {
        try {
            const data = await api.getFiles();
            setFiles(data);
            if (activeFile) {
                const refreshed = data.find(f => f.id === activeFile.id);
                if (refreshed) setActiveFile(refreshed);
            }
        } catch (e) { console.error(e); }
    };

    const loadChatsList = async () => {
        try { const data = await api.getChats(); setChats(data); } catch (e) { console.error(e); }
    };

    const loadFile = useCallback((id: string) => {
        const file = files.find(f => f.id === id);
        if (file) {
            setActiveFile(file);
            if (!openFiles.find(f => f.id === id)) setOpenFiles(prev => [...prev, file]);
        }
    }, [files, openFiles]);

    const closeFile = useCallback((id: string) => {
        setOpenFiles(prev => {
            const remaining = prev.filter(f => f.id !== id);
            if (activeFile?.id === id) {
                setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
            }
            return remaining;
        });
    }, [activeFile]);

    const createFile = async (name: string, type: 'file' | 'folder' = 'file', content: string = '') => {
        const newFile = await api.createFile(name, type, content);
        await loadFiles();
        return newFile;
    };

    const updateFileContent = async (id: string, content: string) => {
        await api.updateFile(id, content);
        setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
        if (activeFile?.id === id) setActiveFile({ ...activeFile, content });
    };

    const renameFile = async (id: string, name: string) => { await api.renameFile(id, name); await loadFiles(); };
    const deleteFile = async (id: string) => {
        await api.deleteFile(id);
        if (activeFile?.id === id) setActiveFile(null);
        setOpenFiles(prev => prev.filter(f => f.id !== id));
        await loadFiles();
    };

    const createChat = async () => {
        const newChat = await api.createChat(`Project ${chats.length + 1}`);
        setChats(prev => [...prev, newChat]);
        setCurrentChat(newChat);
    };

    const loadChat = async (id: string) => { const chat = await api.getChat(id); setCurrentChat(chat); };
    const saveChat = async (id: string, messages: ChatMessage[], title?: string) => {
        const updated = await api.saveChat(id, messages, title);
        setCurrentChat(updated);
        setChats(prev => prev.map(c => c.id === id ? updated : c));
    };
    const deleteChat = async (id: string) => { await api.deleteChat(id); if (currentChat?.id === id) setCurrentChat(null); await loadChatsList(); };

    const sendMessage = async (userContent: string) => {
        if (!userContent.trim() || !currentChat?.id) return;

        const userMsg: ChatMessage = { role: 'user', content: userContent, timestamp: new Date().toISOString() };
        const baseMsgs = [...(currentChat.messages || []), userMsg];
        setCurrentChat(prev => prev ? { ...prev, messages: baseMsgs } : prev);
        setIsLoading(true);

        const steps = [
            "Initializing Nexo Intelligence v2...",
            "Analyzing project scope and requirements...",
            "Connecting to Gemini AI engine...",
            "Generating production-ready code...",
        ];

        // Show status steps while waiting for API
        let stepIndex = 0;
        const stepInterval = setInterval(() => {
            if (stepIndex < steps.length) {
                setGenerationStatus(steps[stepIndex]);
                stepIndex++;
            }
        }, 1500);

        try {
            // Build messages for Gemini API (only role + content)
            const apiMessages = baseMsgs.map(m => ({ role: m.role, content: m.content }));

            // Call real Gemini API via server
            const aiResponse = await api.sendAIMessage(apiMessages);

            clearInterval(stepInterval);

            const aiText = aiResponse.text || 'Code generated successfully.';
            const aiFiles = aiResponse.files || [];

            // Create file statuses for UI animation
            const fileStatuses: FileCreationStatus[] = aiFiles.map((f: any) => ({ fileName: f.name, status: 'creating' as const }));
            const aiMsg: ChatMessage = {
                role: 'assistant',
                content: aiText,
                timestamp: new Date().toISOString(),
                files: fileStatuses.length > 0 ? fileStatuses : undefined
            };

            setIsLoading(false);
            setGenerationStatus('');
            setCurrentChat(prev => prev ? { ...prev, messages: [...baseMsgs, aiMsg] } : prev);

            // Create files in workspace one by one with animation
            if (aiFiles.length > 0) {
                let firstFileId = '';
                for (let i = 0; i < aiFiles.length; i++) {
                    await new Promise(r => setTimeout(r, 800));
                    try {
                        const res = await api.createFile(aiFiles[i].name, 'file', aiFiles[i].content);
                        if (i === 0) firstFileId = res.id;
                        fileStatuses[i].status = 'done';
                    } catch {
                        fileStatuses[i].status = 'error';
                    }
                    setCurrentChat(prev => prev ? { ...prev, messages: [...baseMsgs, { ...aiMsg, files: [...fileStatuses] }] } : prev);
                    await loadFiles();
                }

                if (firstFileId) {
                    loadFile(firstFileId);
                    setViewMode('preview');
                }
            }

            await saveChat(currentChat!.id, [...baseMsgs, { ...aiMsg, files: fileStatuses.length > 0 ? fileStatuses : undefined }]);

        } catch (error: any) {
            clearInterval(stepInterval);
            setIsLoading(false);
            setGenerationStatus('');

            const errorMsg: ChatMessage = {
                role: 'assistant',
                content: `❌ **Error:** ${error.message || 'Failed to get AI response. Please check your API key and try again.'}`,
                timestamp: new Date().toISOString()
            };
            setCurrentChat(prev => prev ? { ...prev, messages: [...baseMsgs, errorMsg] } : prev);
            await saveChat(currentChat!.id, [...baseMsgs, errorMsg]);
        }
    };

    const getPreviewHTML = useCallback(() => {
        if (!files || files.length === 0) return null;
        const htmlFile = files.find(f => f.name.endsWith('.html'));
        const cssFiles = files.filter(f => f.name.endsWith('.css'));
        const jsFiles = files.filter(f => f.name.endsWith('.js'));
        const baseHTML = htmlFile?.content || (activeFile?.name.endsWith('.html') ? activeFile.content : '') || '';
        if (!baseHTML.includes('<')) return null;

        let finalHTML = baseHTML;

        // Remove external stylesheet links (we'll inline the CSS)
        finalHTML = finalHTML.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*\/?>/gi, '');

        // Inline all CSS content
        const cssContent = cssFiles.map(f => f.content).join('\n');
        if (cssContent) {
            const styleTag = `<style>\n${cssContent}\n</style>`;
            if (finalHTML.includes('</head>')) {
                finalHTML = finalHTML.replace('</head>', `${styleTag}\n</head>`);
            } else if (finalHTML.includes('<body')) {
                finalHTML = finalHTML.replace('<body', `${styleTag}\n<body`);
            } else {
                finalHTML = styleTag + '\n' + finalHTML;
            }
        }

        // Remove external script tags (we'll inline the JS)
        finalHTML = finalHTML.replace(/<script\s+src=["'](?:\.\/)?script\.js["']\s*><\/script>/gi, '');

        // Inline all JS content
        const jsContent = jsFiles.map(f => f.content).join('\n');
        if (jsContent) {
            const scriptTag = '<script>\n' + jsContent + '\n<' + '/script>';
            if (finalHTML.includes('</body>')) {
                finalHTML = finalHTML.replace('</body>', `${scriptTag}\n</body>`);
            } else {
                finalHTML = finalHTML + '\n' + scriptTag;
            }
        }

        return finalHTML;
    }, [files, activeFile]);

    return (
        <AppContext.Provider value={{
            files, chats, activeFile, currentChat, openFiles, isLoading, generationStatus, viewMode,
            setViewMode, loadFiles, loadFile, closeFile, createFile, updateFileContent, renameFile, deleteFile,
            createChat, loadChat, saveChat, deleteChat, sendMessage, getPreviewHTML
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};
