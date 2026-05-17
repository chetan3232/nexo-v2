const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { v4: uuidv4 } = require('uuid');

// --- Project Files API ---

// GET All Files
router.get('/files', (req, res) => {
    try {
        const data = store.readProjects();
        res.json(data.files || []);
    } catch (err) { res.status(500).json({ error: 'Failed to read files' }); }
});

// POST Create File
router.post('/create', (req, res) => {
    try {
        const { name, type = 'file', content = '' } = req.body;
        if (!name) return res.status(400).json({ error: 'Filename required' });

        const data = store.readProjects();
        const newFile = {
            id: uuidv4(),
            name,
            type,
            content,
            createdAt: new Date().toISOString()
        };
        data.files.push(newFile);
        store.writeProjects(data);
        res.status(201).json(newFile);
    } catch (err) { res.status(500).json({ error: 'Failed to create file' }); }
});

// PUT Update File Content
router.put('/update/:id', (req, res) => {
    try {
        const { content } = req.body;
        const data = store.readProjects();
        const index = data.files.findIndex(f => f.id === req.params.id);

        if (index === -1) return res.status(404).json({ error: 'File not found' });

        data.files[index].content = content;
        store.writeProjects(data);
        res.json(data.files[index]);
    } catch (err) { res.status(500).json({ error: 'Failed to update file' }); }
});

// PUT Rename File
router.put('/rename/:id', (req, res) => {
    try {
        const { name } = req.body;
        const data = store.readProjects();
        const index = data.files.findIndex(f => f.id === req.params.id);

        if (index === -1) return res.status(404).json({ error: 'File not found' });

        data.files[index].name = name;
        store.writeProjects(data);
        res.json(data.files[index]);
    } catch (err) { res.status(500).json({ error: 'Failed to rename file' }); }
});

// DELETE File
router.delete('/delete/:id', (req, res) => {
    try {
        const data = store.readProjects();
        const initialLen = data.files.length;
        data.files = data.files.filter(f => f.id !== req.params.id);

        if (data.files.length === initialLen) return res.status(404).json({ error: 'File not found' });

        store.writeProjects(data);
        res.json({ message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ error: 'Failed to delete file' }); }
});

module.exports = router;
