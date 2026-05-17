import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getLanguageIcon, getLanguageName } from '../context/AppContext';
import { X, Code2, Eye, Maximize2 } from 'lucide-react';

const CodeEditor = () => {
    const { activeFile, openFiles, loadFile, closeFile, updateFileContent, viewMode, setViewMode } = useApp();
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const debounceTimer = useRef<any>(null);

    const [fileId, setFileId] = useState<string | null>(null);

    useEffect(() => {
        if (activeFile && activeFile.id !== fileId) {
            setContent(activeFile.content || '');
            setFileId(activeFile.id);
        } else if (activeFile && activeFile.id === fileId) {
            // Only update from activeFile if it's vastly different 
            // (e.g. AI updated it) to prevent cursor jumping while user types
            if (activeFile.content && Math.abs(activeFile.content.length - content.length) > 50) {
                setContent(activeFile.content);
            }
        }
    }, [activeFile?.id, activeFile?.content, fileId, content]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);
        if (activeFile) {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                updateFileContent(activeFile.id, val);
            }, 500);
        }
    }, [activeFile, updateFileContent]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newVal = content.substring(0, start) + '    ' + content.substring(end);
            setContent(newVal);
            setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = start + 4; }, 0);
        }
    };

    if (!activeFile) {
        return (
            <div className="welcome-screen">
                <div className="logo-text">Nexo Editor</div>
                <div className="subtitle">Select a file to start editing, or ask AI to generate code</div>
            </div>
        );
    }

    return (
        <div className="editor-wrapper">
            <div className="editor-tabs">
                {openFiles.map(file => (
                    <button
                        key={file.id}
                        className={`editor-tab ${activeFile?.id === file.id ? 'active' : ''}`}
                        onClick={() => loadFile(file.id)}
                    >
                        <img src={getLanguageIcon(file.name)} alt="" width={14} height={14} />
                        {file.name}
                        <span className="close-tab" onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}>
                            <X size={12} />
                        </span>
                    </button>
                ))}

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px', padding: '0 8px' }}>
                    <button className={`editor-tab ${viewMode === 'code' ? 'active' : ''}`} onClick={() => setViewMode('code')} title="Code Mode">
                        <Code2 size={14} />
                    </button>
                    <button className={`editor-tab ${viewMode === 'split' ? 'active' : ''}`} onClick={() => setViewMode('split')} title="Split Mode">
                        <Maximize2 size={14} />
                    </button>
                    <button className={`editor-tab ${viewMode === 'preview' ? 'active' : ''}`} onClick={() => setViewMode('preview')} title="Preview Mode">
                        <Eye size={14} />
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="editor-toolbar">
                    <img src={getLanguageIcon(activeFile.name)} alt="" width={12} height={12} />
                    <span>{getLanguageName(activeFile.name)} — {activeFile.name}</span>
                </div>
                <textarea
                    ref={textareaRef}
                    className="code-textarea"
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                />
            </div>
        </div>
    );
};

export default CodeEditor;
