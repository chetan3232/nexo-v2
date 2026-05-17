const API_URL = 'http://localhost:5000/api';

export const api = {
    // Files
    getFiles: async () => {
        try {
            const res = await fetch(`${API_URL}/files/files`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to get files:', err);
            return [];
        }
    },
    createFile: async (name: string, type: 'file' | 'folder' = 'file', content: string = '') => {
        try {
            const res = await fetch(`${API_URL}/files/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, content })
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to create file:', err);
            throw err;
        }
    },
    updateFile: async (id: string, content: string) => {
        try {
            const res = await fetch(`${API_URL}/files/update/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to update file:', err);
            throw err;
        }
    },
    renameFile: async (id: string, name: string) => {
        try {
            const res = await fetch(`${API_URL}/files/rename/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to rename file:', err);
            throw err;
        }
    },
    deleteFile: async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/files/delete/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to delete file:', err);
            throw err;
        }
    },

    // Chats
    getChats: async () => {
        try {
            const res = await fetch(`${API_URL}/chats/list`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to get chats:', err);
            return [];
        }
    },
    createChat: async (title?: string) => {
        try {
            const res = await fetch(`${API_URL}/chats/new`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title || 'New Chat' })
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to create chat:', err);
            throw err;
        }
    },
    getChat: async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/chats/${id}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to get chat:', err);
            throw err;
        }
    },
    saveChat: async (id: string, messages: any[], title?: string) => {
        try {
            const res = await fetch(`${API_URL}/chats/save/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, title })
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to save chat:', err);
            throw err;
        }
    },
    deleteChat: async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/chats/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to delete chat:', err);
            throw err;
        }
    },

    // AI Chat
    sendAIMessage: async (messages: { role: string; content: string }[]) => {
        try {
            const res = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errData.error || `HTTP error! status: ${res.status}`);
            }
            return res.json();
        } catch (err) {
            console.error('Failed to send AI message:', err);
            throw err;
        }
    },

    // Deployment
    deployProject: async (projectName: string) => {
        try {
            const res = await fetch(`${API_URL}/deploy/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName })
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (err) {
            console.error('Failed to deploy project:', err);
            throw err;
        }
    }
};
