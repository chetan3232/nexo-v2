# 🧠 NEXO V2 — AI Agent Context File

> **Ye file kisi bhi AI agent ke liye hai jo is project mein kaam karega.**  
> Poora project samajhne ke liye is file ko pehle padho.

---

## 🎯 Project Overview

**NEXO V2** ek ultra-high-end AI-powered software development studio hai — users natural language mein describe karte hain ki kya banana hai, aur NEXO AI unke liye complete, production-ready applications generate karta hai.

**Tagline:** *"Describe karo, NEXO banayega."*
**Studio Aesthetic:** "Google AI Studio" style — Clean, minimalist, white-dominant UI with high-density workspace.
**Tech Stack:** React 19 + TypeScript + Vite + InsForge (BaaS) + WebContainers (True Runtime)

---

## 🏗️ Architecture Diagram

```
User (Browser)
    │
    ▼
NEXO STUDIO Frontend (Vite + TypeScript)
    │
    ├── pages/ChatInterface.tsx   ← 🔴 Main Studio Shell (~1500 lines)
    ├── components/chat/InitialOverlay.tsx ← 🟢 NEW: Project Config Dashboard
    ├── agents/Orchestrator.ts    ← Master Controller
    └── services/runtime/webcontainer.ts ← True Sandbox Runtime
    │
    ▼
api/chat.js                       ← Backend API (Vercel Serverless Function)
    │  (Multi-Agent Router: Planner, Coder, Debugger)
    │
    ├── NVIDIA API → GLM-4.7 / MiniMax / Qwen 3 (Thinking models)
    └── OpenRouter → Gemini 2.0 / Llama 3.3 (General purpose)
    │
    ▼
InsForge Backend (BaaS)
    ├── Database → user_deployments table (project saves)
    ├── Auth → Firebase (Google OAuth)
    └── Functions → serve-deployment (live preview hosting)
```

---

## 📁 Project Structure (Detailed)

```
c:\Chetan\Nexo V2\
├── api/
│   ├── chat.js              ← 🔴 MAIN AI BACKEND (Vercel serverless)
│   └── serve-deployment.ts  ← Serves deployed projects via InsForge
│
├── agents/                  ← 🟢 AI AGENT SQUAD (Orchestration logic)
│   ├── Orchestrator.ts      ← Flow: PM -> Design -> Code -> Boot
│   ├── PMAgent.ts           ← Specifications generator
│   ├── DesignerAgent.ts     ← UI/UX & Design System
│   ├── FrontendAgent.ts     ← Code implementation (React/HTML)
│   ├── BackendAgent.ts      ← Logic & API implementation
│   └── DebugAgent.ts        ← Self-healing & Error patching
│
├── pages/
│   ├── ChatInterface.tsx    ← 🔴 MAIN STUDIO PAGE
│   ├── Home.tsx             ← Landing page
│   └── Build.tsx            ← Project history/build page
│
├── components/
│   ├── chat/
│   │   ├── InitialOverlay.tsx ← 🟢 Studio Setup UI
│   │   └── ChatPanel.tsx      ← AI Chat interface
│   ├── editor/
│   │   ├── EditorPanel.tsx    ← Monaco editor with file tabs
│   │   └── DevTools.tsx       ← AI Logs & Terminal
│   └── preview/
│       └── PreviewPanel.tsx   ← WebContainer live preview
│
├── stores/                  ← Zustand State
│   ├── agentStore.ts        ← Model, Mode, Language
│   ├── projectStore.ts      ← Files & Build Status
│   └── runtimeStore.ts      ← Logs & Reasoning
│
├── services/
│   ├── runtime/
│   │   ├── webcontainer.ts  ← 🟢 True Browser Sandbox
│   │   └── devServer.ts     ← Terminal & Package Manager
│   └── geminiService.ts     ← Low-level AI connection
│
├── utils/
│   ├── parser.ts            ← 🔴 AI Code Extractor
│   ├── context.ts           ← History compression
│   └── deps.ts              ← Dynamic dependency detection
│
└── docs/
    └── NEXO_CONTEXT.md      ← You are here
```

---

## 🔴 Core Logic — Deep Dive

### 1. `api/chat.js` — The AI Brain (Backend)
- **Vercel Serverless**: Max 120s timeout.
- **SSE (Server-Sent Events)**: Response stream karta hai.
- **Model Routing**: 
  - `minimaxai/minimax-m2.7` → NVIDIA API.
  - `qwen/qwen3-coder-480b` → NVIDIA API.
  - Others → OpenRouter.

### 2. `utils/parser.ts` — The Code Translator
Extracts files from AI response using:
- `---FILE: path---` ... `---END FILE---` (Primary)
- ` ```lang filename="path" ` (Standard)
- **Patch Support**: `---PATCH: path---` ... `---END PATCH---` (For delta updates).

### 3. `Orchestrator.ts` — The Master Controller
1. **PM Phase**: Generates `prd.md`.
2. **Design Phase**: Generates `DesignSystem` (Tailwind tokens).
3. **Coding Phase**: Parallel implementation of UI and Logic.
4. **Boot Phase**: Mounts files into WebContainer -> `npm install` -> `npm run dev`.

---

## 🛡️ Self-Healing Loop
1. **Capture**: `WebContainer` terminal errors detect hote hain.
2. **Diagnosis**: `DebugAgent` ko current files + error log bheje jaate hain.
3. **Action**: AI `PATCH` generate karta hai (pure file rewrite ki zarurat nahi).
4. **Result**: Files update hoti hain, app auto-reloads hota hai.

---

## 🧪 Tech Stack Mapping
- **Frontend Only**: HTML/CSS/JS (Vanilla) - Direct iframe injection.
- **Frontend + Backend (Fullstack)**: React (Vite) + Node.js (Express).
- **Custom Languages**: Python/Flask, Go, etc. handled via specialized system prompts.

---

## 🚀 Roadmap & Future Phases

### 🔥 PHASE 4 — Visual AI Builder
- Drag-and-drop components (`dnd-kit`).
- Inline text editing in preview.
- Bidirectional sync: UI <-> Code.

### 🔥 PHASE 5 — Production Platform
- GitHub integration (One-click repo create/push).
- Deployment to Vercel/Netlify.
- Docker export.

### 🔥 PHASE 6 — Monetization
- Token usage tracking.
- Premium plans for higher RAM & better models.
- Real-time collaboration.

---

## ⚠️ Critical Rules (AI Agent MUST follow)

1. **Tailwind CSS 3.4**: Do NOT use v4. Stay on v3.4 utilities.
2. **Space Efficiency**: Studio is compact (Header 48px, Sidebar 40px). Maximize Editor/Preview.
3. **WebContainer Ready**: Always include `package.json` for React/Node projects.
4. **Language Awareness**: User's `selectedLanguage` is law. Use it for all logic.
5. **No Placeholders**: Use `generate_image` for real assets.

---

## 📦 Key Dependencies
```json
{
  "@insforge/sdk": "^1.2.0",
  "@webcontainer/api": "^1.1.0",
  "react-resizable-panels": "^2.1.0",
  "framer-motion": "^12.23.25",
  "lucide-react": "^0.556.0",
  "monaco-editor": "^0.52.0"
}
```

---

*Last updated: May 2026 | Project: NEXO V2 Studio | Status: Production Ready | Version: 2.1.0*
