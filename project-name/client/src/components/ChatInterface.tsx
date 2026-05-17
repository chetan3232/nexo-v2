import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getLanguageIcon } from '../context/AppContext';
import { Send, Plus, Copy, Check, Bot, Sparkles, Loader } from 'lucide-react';
import { FileCreationStatus } from '../types';

const FileCreationItem: React.FC<{ file: FileCreationStatus; delay: number }> = ({ file, delay }) => {
    const iconUrl = getLanguageIcon(file.fileName);
    return (
        <div className="file-creation-item" style={{ animationDelay: `${delay}ms` }}>
            <div className="file-icon-small">
                <img src={iconUrl} alt="" width={16} height={16} />
            </div>
            <span className="file-item-name">{file.fileName}</span>
            <div className="file-status-icon">
                {file.status === 'creating' && <div className="spinner" />}
                {file.status === 'done' && <div className="checkmark"><Check size={11} strokeWidth={3} /></div>}
            </div>
        </div>
    );
};

const MessageContent: React.FC<{ content: string; files?: FileCreationStatus[] }> = ({ content, files }) => {
    // We strictly avoid rendering code blocks in the chat as per user instruction.
    // All code is created as files and managed via the workspace.
    return (
        <div className="message-content-wrapper">
            <div className="message-text">
                {content.split('\n').map((line, i) => (
                    line.trim() === '' ? <div key={i} style={{ height: '8px' }} /> : <p key={i}>{line}</p>
                ))}
            </div>
            {files && files.length > 0 && (
                <div className="file-creation-list">
                    <div className="file-list-header">Generated Workspace Files:</div>
                    {files.map((file, i) => <FileCreationItem key={file.fileName} file={file} delay={i * 150} />)}
                </div>
            )}
        </div>
    );
};

const ChatInterface = () => {
    const { currentChat, sendMessage, isLoading, generationStatus, createChat } = useApp();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentChat?.messages, isLoading, generationStatus]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const msg = input;
        setInput('');
        await sendMessage(msg);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="chat-header">
                <div className="chat-header-title"><Sparkles size={16} color="var(--accent)" /><span>{currentChat?.title || 'Nexo Intelligence'}</span></div>
                <button onClick={createChat} title="New Chat"><Plus size={16} /></button>
            </div>

            <div className="messages-area">
                {!currentChat ? (
                    <div className="empty-chat-state">
                        <Bot size={28} />
                        <h3>Ready for Global Deployment</h3>
                        <p>Ask Nexo to build your vision with professional Unsplash assets and optimized code.</p>
                        <button className="btn btn-primary" onClick={createChat}>New Project</button>
                    </div>
                ) : (
                    currentChat.messages?.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role}`}>
                            <div className="message-avatar">{msg.role === 'user' ? 'U' : '✦'}</div>
                            <div className="message-body">
                                <div className="message-sender">{msg.role === 'user' ? 'You' : 'Nexo Pro'}</div>
                                <MessageContent content={msg.content} files={msg.files} />
                            </div>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="message assistant">
                        <div className="message-avatar">✦</div>
                        <div className="message-body">
                            <div className="message-sender">Nexo Pro</div>
                            {generationStatus ? (
                                <div className="generation-status">
                                    <div className="spinner-small" />
                                    <span>{generationStatus}</span>
                                </div>
                            ) : (
                                <div className="typing-indicator"><div className="dot" /><div className="dot" /><div className="dot" /></div>
                            )}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {currentChat && (
                <div className="chat-input-area">
                    <div className="chat-input-wrapper">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Architect your vision..."
                            rows={1}
                            disabled={isLoading}
                        />
                        <button className="send-btn" onClick={handleSend} disabled={!input.trim() || isLoading}><Send size={16} /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
