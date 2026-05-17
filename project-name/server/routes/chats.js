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
        const { messages, title } = req.body;
        const chatsData = store.readChats();
        const chatIndex = chatsData.chats.findIndex(c => c.id === req.params.id);

        if (chatIndex === -1) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Update fields
        if (messages) chatsData.chats[chatIndex].messages = messages;
        if (title) chatsData.chats[chatIndex].title = title;

        store.writeChats(chatsData);
        res.json(chatsData.chats[chatIndex]);
    } catch (err) {
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
