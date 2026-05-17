const fs = require('fs');
const path = require('path');

const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const CHATS_FILE = path.join(__dirname, 'chats.json');

// Initialize data files if they don't exist
const initializeData = () => {
    if (!fs.existsSync(PROJECTS_FILE)) {
        fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ files: [] }));
    }
    if (!fs.existsSync(CHATS_FILE)) {
        fs.writeFileSync(CHATS_FILE, JSON.stringify({ chats: [] }));
    }
};

const readProjects = () => {
    try {
        const data = fs.readFileSync(PROJECTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) { return { files: [] }; }
};

const writeProjects = (data) => {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));
};

const readChats = () => {
    try {
        const data = fs.readFileSync(CHATS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) { return { chats: [] }; }
};

const writeChats = (data) => {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(data, null, 2));
};

module.exports = {
    initializeData,
    readProjects,
    writeProjects,
    readChats,
    writeChats
};
