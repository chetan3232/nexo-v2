import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getLanguageIcon } from '../context/AppContext';
import { Folder, Trash2, Edit2, FolderPlus, FilePlus, ChevronRight, ChevronDown } from 'lucide-react';

const FileExplorer = () => {
    const { files, loadFile, createFile, deleteFile, renameFile, activeFile } = useApp();
    const [newItemName, setNewItemName] = useState('');
    const [creationType, setCreationType] = useState<'file' | 'folder'>('file');
    const [showCreate, setShowCreate] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const handleCreate = async () => {
        if (!newItemName.trim()) return;
        await createFile(newItemName.trim(), creationType);
        setNewItemName('');
        setShowCreate(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleCreate();
        if (e.key === 'Escape') { setShowCreate(false); setNewItemName(''); }
    };

    const handleRename = (id: string, currentName: string) => {
        const name = prompt("Rename to:", currentName);
        if (name && name !== currentName) renameFile(id, name);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this?")) {
            deleteFile(id);
        }
    };

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const sortedFiles = [...files].sort((a, b) =>
        a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1
    );

    return (
        <div className="file-explorer">
            <div className="sidebar-header">
                <span className="sidebar-title">Explorer</span>
                <div className="sidebar-actions">
                    <button onClick={() => { setCreationType('file'); setShowCreate(true); }} title="New File">
                        <FilePlus size={15} />
                    </button>
                    <button onClick={() => { setCreationType('folder'); setShowCreate(true); }} title="New Folder">
                        <FolderPlus size={15} />
                    </button>
                </div>
            </div>

            {showCreate && (
                <div className="file-create-bar">
                    <input
                        autoFocus
                        placeholder={`${creationType === 'file' ? 'File' : 'Folder'} name...`}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => { if (!newItemName) setShowCreate(false); }}
                    />
                    {newItemName && <button className="create-btn" onClick={handleCreate}>Add</button>}
                </div>
            )}

            <ul className="file-list">
                {sortedFiles.map(file => (
                    <li
                        key={file.id}
                        className={`file-item ${file.type} ${activeFile?.id === file.id ? 'active' : ''}`}
                        onClick={() => {
                            if (file.type === 'folder') {
                                toggleFolder(file.id);
                            } else {
                                loadFile(file.id);
                            }
                        }}
                    >
                        <span className="file-icon">
                            {file.type === 'folder' ? (
                                <>
                                    {expandedFolders.has(file.id) ?
                                        <ChevronDown size={14} style={{ color: '#8b949e' }} /> :
                                        <ChevronRight size={14} style={{ color: '#8b949e' }} />
                                    }
                                    <Folder size={16} color="#e3b341" />
                                </>
                            ) : (
                                <img
                                    src={getLanguageIcon(file.name)}
                                    alt=""
                                    width={16}
                                    height={16}
                                    style={{ marginLeft: '18px' }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                        </span>
                        <span className="file-name">{file.name}</span>
                        <div className="file-actions">
                            <button onClick={(e) => { e.stopPropagation(); handleRename(file.id, file.name); }} title="Rename">
                                <Edit2 size={13} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} title="Delete">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {files.length === 0 && (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    lineHeight: '1.6'
                }}>
                    <p>No files yet.</p>
                    <p style={{ marginTop: '4px', opacity: 0.7 }}>
                        Create a file or ask AI to generate code
                    </p>
                </div>
            )}
        </div>
    );
};

export default FileExplorer;
