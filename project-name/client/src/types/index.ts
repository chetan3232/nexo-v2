export interface ProjectFile {
    id: string;
    name: string;
    type: 'file' | 'folder';
    content: string;
    language?: string;
    createdAt?: string;
}

export interface FileCreationStatus {
    fileName: string;
    status: 'creating' | 'done' | 'error';
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    files?: FileCreationStatus[];
    codeBlocks?: CodeBlock[];
}

export interface CodeBlock {
    language: string;
    code: string;
    fileName?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
}

export interface AppState {
    files: ProjectFile[];
    activeFileId: string | null;
    chats: ChatSession[];
    activeChatId: string | null;
}
