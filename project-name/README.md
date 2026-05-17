# AI Code Editor - Setup & Run Instructions

This is a professional AI Code Editor with Chat System built using React + TypeScript (Frontend) and Node.js + Express (Backend).

## 📂 Project Structure

```
project-name/
├── server/                 # Backend
│   ├── server.js
│   ├── routes/
│   ├── data/              # JSON Storage
│   └── package.json
│
└── client/                 # Frontend
    ├── index.html         # Main HTML (NOT in any subfolder)
    ├── src/
    └── package.json
```

## 🚀 How to Run

### Step 1: Start Backend Server

Open a terminal and run:

```bash
cd project-name/server
npm install
npm run dev
```

The server will start on **http://localhost:5000**

### Step 2: Start Frontend

Open another terminal and run:

```bash
cd project-name/client
npm install
npm run dev
```

The client will start on **http://localhost:5173** (or similar)

## ✨ Features

1. **File Management**
   - Create new files and folders
   - Rename files (click Edit icon)
   - Delete files (click Trash icon with confirmation)
   - Edit file content in the code editor

2. **Chat System**
   - Create new chat conversations
   - Auto-save messages
   - View chat history
   - Delete old chats

3. **Dynamic Structure**
   - No mandatory index.html in user files
   - index.html exists only in client/ root for the app itself
   - User can create any file structure they want

## 🔧 Troubleshooting

If APIs are not working:
1. Make sure backend server is running on port 5000
2. Check browser console for errors
3. Verify CORS is enabled in server.js
4. Check `server/data/projects.json` and `chats.json` exist

## 📝 Notes

- The index.html at `client/index.html` is the application shell (NOT a user file)
- User files are stored in `server/data/projects.json`
- All operations (create, rename, delete) work through REST APIs
