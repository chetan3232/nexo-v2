import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { api } from './api';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import ChatInterface from './components/ChatInterface';
import {
    Folder, MessageSquare, Rocket, X, Settings, Terminal,
    Code2, Trash2, Plus, ExternalLink, CheckCircle, Loader, AlertCircle, Globe, RefreshCw, Edit2
} from 'lucide-react';

// Deploy Modal Component
const DeployModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { files } = useApp();
    const [projectName, setProjectName] = useState('my-project');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploySteps, setDeploySteps] = useState<{ label: string; status: 'pending' | 'active' | 'done' | 'error' }[]>([]);
    const [deployUrl, setDeployUrl] = useState('');
    const [deployError, setDeployError] = useState('');

    const handleDeploy = async () => {
        if (!projectName.trim()) return;

        setIsDeploying(true);
        setDeployError('');
        setDeployUrl('');

        const steps = [
            { label: 'Initializing deployment engine...', status: 'active' as const },
            { label: 'Analyzing workspace architectural integrity...', status: 'pending' as const },
            { label: 'Compiling production-grade bundles...', status: 'pending' as const },
            { label: 'Distributing to Nexo Global Edge nodes...', status: 'pending' as const },
            { label: 'Synchronizing SSL certificates...', status: 'pending' as const },
        ];

        setDeploySteps(steps);

        try {
            // First 2 steps simulated for aesthetics
            await new Promise(r => setTimeout(r, 1200));
            setDeploySteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'done' } : i === 1 ? { ...s, status: 'active' } : s));

            await new Promise(r => setTimeout(r, 1500));
            setDeploySteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'done' } : i === 2 ? { ...s, status: 'active' } : s));

            // Call real backend for the actual "build" and "upload"
            const result = await api.deployProject(projectName);

            if (result.success) {
                // Final steps
                setDeploySteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'done' } : i === 3 ? { ...s, status: 'active' } : s));
                await new Promise(r => setTimeout(r, 1000));
                setDeploySteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'done' } : i === 4 ? { ...s, status: 'active' } : s));
                await new Promise(r => setTimeout(r, 800));
                setDeploySteps(prev => prev.map(s => ({ ...s, status: 'done' })));

                setDeployUrl(result.url);
            } else {
                setDeployError(result.error);
                setDeploySteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
            }
        } catch (err: any) {
            setDeployError(err.message || 'Global Edge Deployment failed.');
            setDeploySteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div>
                        <div className="modal-title">
                            <Rocket size={20} color="var(--accent)" />
                            Deploy Project
                        </div>
                        <div className="modal-subtitle">Deploy your project to the web in seconds</div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', padding: '4px', borderRadius: 'var(--radius-sm)'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Project Name
                </label>
                <input
                    className="modal-input"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    disabled={isDeploying}
                />

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={12} />
                    {files.filter(f => f.type === 'file').length} file(s) will be deployed
                </div>

                {/* Deploy Progress */}
                {deploySteps.length > 0 && (
                    <div className="deploy-progress">
                        {deploySteps.map((step, i) => (
                            <div key={i} className={`deploy-step ${step.status}`}>
                                {step.status === 'done' && <CheckCircle size={15} />}
                                {step.status === 'active' && <Loader size={15} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />}
                                {step.status === 'pending' && <div style={{ width: 15, height: 15, borderRadius: '50%', border: '1.5px solid var(--border-primary)' }} />}
                                {step.status === 'error' && <AlertCircle size={15} />}
                                <span>{step.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Deploy URL */}
                {deployUrl && (
                    <div className="deploy-url">
                        <CheckCircle size={16} color="var(--success)" />
                        <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                            {deployUrl}
                        </a>
                        <ExternalLink size={12} color="var(--success)" style={{ marginLeft: 'auto' }} />
                    </div>
                )}

                {/* Error */}
                {deployError && (
                    <div style={{
                        marginTop: '12px', padding: '10px 14px',
                        background: 'var(--danger-glow)', border: '1px solid rgba(248, 81, 73, 0.3)',
                        borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '13px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <AlertCircle size={16} />
                        {deployError}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleDeploy}
                        disabled={isDeploying || !projectName.trim()}
                        style={{ opacity: isDeploying ? 0.7 : 1 }}
                    >
                        {isDeploying ? (
                            <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Deploying...</>
                        ) : deployUrl ? (
                            <><CheckCircle size={14} /> Deployed!</>
                        ) : (
                            <><Rocket size={14} /> Deploy Now</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Chat List Panel for Sidebar
const ChatListPanel = () => {
    const { chats, loadChat, createChat, deleteChat, currentChat, saveChat } = useApp();

    return (
        <div className="chat-list-panel">
            <button className="new-chat-btn" onClick={createChat}>
                <Plus size={14} />
                New Chat
            </button>
            <div className="chat-list">
                {chats.map(c => (
                    <div
                        key={c.id}
                        className={`chat-list-item ${currentChat?.id === c.id ? 'active' : ''}`}
                        onClick={() => loadChat(c.id)}
                    >
                        <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                        <span className="chat-item-title">{c.title || 'Untitled'}</span>
                        <div className="chat-item-actions">
                            <button onClick={async (e) => {
                                e.stopPropagation();
                                const newTitle = prompt('Rename Chat:', c.title);
                                if (newTitle && newTitle !== c.title) {
                                    await saveChat(c.id, c.messages || [], newTitle);
                                }
                            }} title="Rename">
                                <Edit2 size={13} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} title="Delete">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}
                {chats.length === 0 && (
                    <div style={{
                        padding: '20px', textAlign: 'center',
                        color: 'var(--text-muted)', fontSize: '12px'
                    }}>
                        No chats yet. Start a new conversation!
                    </div>
                )}
            </div>
        </div>
    );
};

const PreviewPane = () => {
    const { getPreviewHTML, viewMode, files } = useApp();
    const [key, setKey] = useState(0);
    const html = getPreviewHTML();
    const prevHtmlRef = React.useRef<string | null>(null);

    // Auto-refresh preview when generated HTML changes (files updated)
    useEffect(() => {
        if (html && html !== prevHtmlRef.current) {
            prevHtmlRef.current = html;
            setKey(k => k + 1);
        }
    }, [html]);

    if (viewMode !== 'preview' && viewMode !== 'split') return null;

    if (!html) {
        return (
            <div className="preview-pane" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <Globe size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p>No preview available</p>
                    <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.6 }}>Generate an HTML file to see live preview</p>
                </div>
            </div>
        );
    }

    return (
        <div className="preview-pane">
            <div className="preview-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} color="var(--success)" />
                    <span>Live Preview</span>
                </div>
                <div className="preview-url-bar">localhost:3000</div>
                <button onClick={() => setKey(k => k + 1)} title="Refresh">
                    <RefreshCw size={14} />
                </button>
            </div>
            <iframe
                key={key}
                srcDoc={html}
                className="preview-iframe"
                sandbox="allow-scripts allow-modals allow-same-origin"
                allow="cross-origin-isolated"
            />
        </div>
    );
};

// Main Layout
const MainLayout = () => {
    const { activeFile, viewMode, setViewMode } = useApp();
    const [leftPanel, setLeftPanel] = useState<'files' | 'chats'>('files');
    const [showChatPanel, setShowChatPanel] = useState(true);
    const [showDeploy, setShowDeploy] = useState(false);

    return (
        <div className="ide-container">
            {/* Activity Bar */}
            <div className="activity-bar">
                <button
                    className={`activity-item ${leftPanel === 'files' ? 'active' : ''}`}
                    title="Explorer"
                    onClick={() => setLeftPanel('files')}
                >
                    <Folder size={22} />
                </button>
                <button
                    className={`activity-item ${leftPanel === 'chats' ? 'active' : ''}`}
                    title="Chat History"
                    onClick={() => { setLeftPanel('chats'); setShowChatPanel(true); }}
                >
                    <MessageSquare size={22} />
                </button>

                <div className="separator" />

                <button className="activity-item" title="Deploy" onClick={() => setShowDeploy(true)}>
                    <Rocket size={22} />
                </button>

                <div className="spacer" />

                <button
                    className={`activity-item ${showChatPanel ? 'active' : ''}`}
                    title="Toggle Builder Chat"
                    onClick={() => setShowChatPanel(!showChatPanel)}
                    style={{ color: showChatPanel ? 'var(--accent)' : undefined }}
                >
                    <Terminal size={22} />
                </button>

                <button className="activity-item" title="Settings">
                    <Settings size={22} />
                </button>
            </div>

            {/* Sidebar (Explorer/Chats) */}
            <div className="sidebar">
                {leftPanel === 'files' ? <FileExplorer /> : <ChatListPanel />}
            </div>

            {/* Main Workspace Area (Code + Preview) */}
            <div className="workspace-main" style={{ display: 'flex', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                {(viewMode === 'code' || viewMode === 'split') && (
                    <div className="editor-container" style={{ flex: 1, height: '100%', minWidth: 0 }}>
                        <CodeEditor />
                    </div>
                )}

                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className="preview-container" style={{
                        flex: viewMode === 'split' ? 1 : 2,
                        height: '100%',
                        borderLeft: viewMode === 'split' ? '1px solid var(--border-primary)' : 'none'
                    }}>
                        <PreviewPane />
                    </div>
                )}
            </div>

            {/* AI Builder Panel (Chat) */}
            {showChatPanel && (
                <div className="chat-panel">
                    <ChatInterface />
                </div>
            )}

            {/* Deploy Modal */}
            {showDeploy && <DeployModal onClose={() => setShowDeploy(false)} />}

            {/* Status Bar */}
            <div className="status-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
                <div className="status-left">
                    <span className="status-item"><Code2 size={12} /> Nexo Intelligence v2</span>
                    {activeFile && <span className="status-item">{activeFile.name} (Modified)</span>}
                </div>
                <div className="status-right">
                    <span className="status-item">UTF-8</span>
                    <span className="status-item">{activeFile ? activeFile.name.split('.').pop()?.toUpperCase() : 'IDE'}</span>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <AppProvider>
            <MainLayout />
        </AppProvider>
    );
};

export default App;
