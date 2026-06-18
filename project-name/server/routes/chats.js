const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { v4: uuidv4 } = require('uuid');

// --- Create New Chat ---
router.post('/new', (req, res) => {
    try {
        const { title = 'New Chat' } = req.body;
        const chatsData = store.readChats(); // { chats: [...] }

        const newChat = {
            id: uuidv4(),
            title,
            messages: [],
            createdAt: new Date().toISOString()
        };

        // Ensure chats array exists
        if (!chatsData.chats) chatsData.chats = [];

        chatsData.chats.push(newChat);
        store.writeChats(chatsData);

        res.status(201).json(newChat);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// --- Save/Update Chat Messages ---
router.post('/save/:id', (req, res) => {
    try {
        const { messages, title, content, model, projectMode } = req.body;
        const chatsData = store.readChats();
        if (!chatsData.chats) chatsData.chats = [];

        let chatIndex = chatsData.chats.findIndex(c => c.id === req.params.id);

        if (chatIndex === -1) {
            // Upsert / Create new chat session if not found
            const newChat = {
                id: req.params.id,
                title: title || 'Untitled Project',
                messages: messages || [],
                content: content || null,
                model: model || '',
                projectMode: projectMode || '',
                createdAt: new Date().toISOString(),
                updatedAt: Date.now()
            };
            chatsData.chats.push(newChat);
            chatIndex = chatsData.chats.length - 1;
        } else {
            // Update fields
            if (messages !== undefined) chatsData.chats[chatIndex].messages = messages;
            if (title !== undefined) chatsData.chats[chatIndex].title = title;
            if (content !== undefined) chatsData.chats[chatIndex].content = content;
            if (model !== undefined) chatsData.chats[chatIndex].model = model;
            if (projectMode !== undefined) chatsData.chats[chatIndex].projectMode = projectMode;
            chatsData.chats[chatIndex].updatedAt = Date.now();
        }

        store.writeChats(chatsData);
        res.json(chatsData.chats[chatIndex]);
    } catch (err) {
        console.error("[Backend Chats] Save chat error:", err);
        res.status(500).json({ error: 'Failed to save chat' });
    }
});

// --- Get All Chats (List) ---
router.get('/list', (req, res) => {
    try {
        const data = store.readChats();
        // Return summary (without heavy messages if needed, but for now full obj is fine)
        res.json(data.chats || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to list chats' });
    }
});

// --- Get Single Chat ---
router.get('/:id', (req, res) => {
    try {
        const data = store.readChats();
        const chat = data.chats.find(c => c.id === req.params.id);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get chat' });
    }
});

// --- Delete Chat ---
router.delete('/:id', (req, res) => {
    try {
        const data = store.readChats();
        const initialLen = data.chats.length;
        data.chats = data.chats.filter(c => c.id !== req.params.id);

        if (data.chats.length === initialLen) return res.status(404).json({ error: 'Chat not found' });

        store.writeChats(data);
        res.json({ message: 'Chat deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

module.exports = router;
