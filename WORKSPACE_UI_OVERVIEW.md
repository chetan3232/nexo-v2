# 🧠 Nexo V2 — Complete Workspace & UI/Design Overview

> **Generated:** 2026-05-26  
> **Version:** V2.3.0 (Dual AI Engine + Dynamic Color Loader)  
> **Project:** Nexo V2 — AI-Powered App Builder  
> **Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion + Firebase + Google Gemini AI (3 Gemini, 2 Nvidia, 1 Groq)  
> **Routes:** `/` (Home) · `/demo` (Workspace) · `/build` (Hardware Guide)

---

## 📁 Full Workspace Structure

```
Nexo V2/
├── 📄 index.html                    # App entry HTML, PWA manifest link
├── 📄 index.tsx                     # React DOM root mount
├── 📄 App.tsx (root)                # Legacy root (unused in src/)
├── 📄 vite.config.ts                # Vite build config with React plugin
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 package.json                  # Dependencies & scripts
├── 📄 vercel.json                   # Vercel deployment config
├── 📄 manifest.json                 # PWA manifest
├── 📄 service-worker.js             # Offline PWA support
├── 📄 constants.ts                  # Global constants
├── 📄 types.ts                      # Global type definitions
├── 📄 metadata.json                 # Project metadata
│
├── 📁 src/                          # ← MAIN SOURCE (active)
│   ├── 📄 App.tsx                   # Router: HashRouter + Layout + Routes
│   ├── 📄 index.tsx                 # React entry point
│   ├── 📄 index.css                 # Global styles
│   ├── 📄 types.ts                  # Local types (Message, CompanionState, etc.)
│   ├── 📄 vite-env.d.ts             # Vite env types
│   │
│   ├── 📁 pages/                    # Route-level page components
│   │   ├── 📄 Home.tsx              # Landing/marketing homepage
│   │   ├── 📄 ChatInterface.tsx     # Main AI workspace (split-panel)
│   │   └── 📄 Build.tsx             # Hardware/build guide page
│   │
│   ├── 📁 components/               # Shared UI components
│   │   ├── 📄 Avatar.tsx            # Animated AI companion avatar
│   │   ├── 📄 Layout.tsx            # Global layout: Header + Nav + Footer
│   │   ├── 📄 PremiumModal.tsx      # Premium upgrade modal
│   │   │
│   │   ├── 📁 chat/                 # Workspace chat components
│   │   │   ├── 📄 InitialOverlay.tsx    # Full-screen start screen (prompt input)
│   │   │   ├── 📄 ChatPanel.tsx         # Right-side chat messages panel
│   │   │   ├── 📄 CommandPalette.tsx    # Keyboard command palette (⌘K)
│   │   │   ├── 📄 BuildQueue.tsx        # Build task queue display
│   │   │   ├── 📄 ReasoningPanel.tsx    # AI reasoning/thinking panel
│   │   │   ├── 📄 TaskBoard.tsx         # Kanban-style task board
│   │   │   └── 📄 Terminal.tsx          # Terminal output component
│   │   │
│   │   ├── 📁 editor/              # Code editor components
│   │   │   ├── 📄 EditorPanel.tsx       # Monaco-based code editor
│   │   │   ├── 📄 DevTools.tsx          # Dev tools / console panel
│   │   │   ├── 📄 CodeExplainer.tsx     # AI code explanation panel
│   │   │   └── 📄 VisualDesignPanel.tsx # Drag-and-drop visual editor
│   │   │
│   │   ├── 📁 preview/             # App preview components
│   │   │   └── (PreviewPanel.tsx)       # Lazy-loaded iframe preview
│   │   │
│   │   ├── 📁 sidebar/             # Activity bar / sidebar panels
│   │   │   ├── 📄 ActivityBar.tsx       # Left icon activity bar
│   │   │   ├── 📄 DependencyGraph.tsx   # Visual dependency graph
│   │   │   ├── 📄 ExportPanel.tsx       # Export options panel
│   │   │   ├── 📄 HealthDashboard.tsx   # Project health dashboard
│   │   │   ├── 📄 ProductionScanner.tsx # Production readiness scanner
│   │   │   ├── 📄 TeamPanel.tsx         # Team collaboration panel
│   │   │   └── 📄 TimelinePanel.tsx     # Build/commit timeline
│   │   │
│   │   ├── 📁 marketplace/         # Plugin marketplace
│   │   │   └── 📄 MarketplacePanel.tsx  # Plugin browser UI
│   │   │
│   │   └── 📁 ui/                  # Global UI modals & shared elements
│   │       ├── 📄 LandingHero.tsx       # Dark-mode hero (alternate workspace entry)
│   │       ├── 📄 SettingsModal.tsx     # Settings modal (Chat/Share/Publish/GitHub)
│   │       ├── 📄 ExportModal.tsx       # Export/download modal
│   │       ├── 📄 DeployModal.tsx       # Deployment modal
│   │       ├── 📄 PricingModal.tsx      # Pricing/plans modal
│   │       ├── 📄 SavedChatsModal.tsx   # Saved projects browser
│   │       ├── 📄 GithubIcon.tsx        # Custom GitHub SVG icon
│   │       └── 📄 UsageStats.tsx        # Token/usage display widget
│   │
│   ├── 📁 agents/                  # AI Agent system (Multi-agent Orchestration)
│   │   ├── 📄 Orchestrator.ts          # Master controller (25KB — core engine)
│   │   ├── 📄 BaseAgent.ts             # Abstract agent base class
│   │   ├── 📄 FrontendAgent.ts         # Frontend code generation agent
│   │   ├── 📄 BackendAgent.ts          # Backend/API generation agent
│   │   ├── 📄 DesignerAgent.ts         # UI/design agent
│   │   ├── 📄 ArchitectureAgent.ts     # System architecture agent
│   │   ├── 📄 DebugAgent.ts            # Debugging agent
│   │   ├── 📄 QAAgent.ts               # Quality assurance agent
│   │   ├── 📄 SecurityAgent.ts         # Security review agent
│   │   ├── 📄 DevOpsAgent.ts           # DevOps/deployment agent
│   │   ├── 📄 PMAgent.ts               # Project management agent
│   │   ├── 📄 PlannerAgent.ts          # Task planning agent
│   │   ├── 📄 AnimationAgent.ts        # Animation generation agent
│   │   ├── 📄 EnhancementAgent.ts      # Code enhancement agent
│   │   ├── 📄 RefactorAgent.ts         # Code refactoring agent
│   │   ├── 📄 ProductionAgent.ts       # Production-readiness agent
│   │   ├── 📄 CloningAgent.ts          # URL-to-clone agent
│   │   ├── 📄 CollaborationBus.ts      # Inter-agent messaging bus
│   │   └── 📄 index.ts                 # Agent exports
│   │
│   ├── 📁 stores/                  # Zustand global state stores
│   │   ├── 📄 agentStore.ts            # AI model, projectMode, language selection
│   │   ├── 📄 chatStore.ts             # Chat messages, input, chatId
│   │   ├── 📄 projectStore.ts          # Generated files, build phase, tasks
│   │   ├── 📄 designStore.ts           # Visual editor selected element
│   │   ├── 📄 memoryStore.ts           # Long-term AI memory/context
│   │   ├── 📄 runtimeStore.ts          # Runtime/WebContainer state
│   │   ├── 📄 subscriptionStore.ts     # User plan / subscription state
│   │   ├── 📄 teamStore.ts             # Team members / collaboration
│   │   └── 📄 visualEditorStore.ts     # Visual editor panel state
│   │
│   ├── 📁 services/                # External API & service integrations
│   │   ├── 📄 firebase.ts              # Firebase Auth + Firestore
│   │   ├── 📄 geminiService.ts         # Google Gemini AI API wrapper
│   │   ├── 📄 brainService.ts          # AI memory/brain service
│   │   ├── 📄 deploymentService.ts     # App deployment service
│   │   ├── 📄 exportService.ts         # ZIP export service
│   │   ├── 📄 blockService.ts          # Block-based content service
│   │   ├── 📄 githubService.ts         # GitHub API integration
│   │   ├── 📄 pluginService.ts         # Plugin system service
│   │   ├── 📄 usageManager.ts          # Token usage tracking
│   │   └── 📁 runtime/                 # WebContainer runtime service
│   │
│   ├── 📁 utils/                   # Utility functions
│   │   ├── 📄 intentAnalyzer.ts        # User intent parsing (16KB)
│   │   ├── 📄 parser.ts                # Code/response parser (8KB)
│   │   ├── 📄 depAnalyzer.ts           # Dependency analyzer
│   │   ├── 📄 deps.ts                  # Dependency helpers
│   │   ├── 📄 context.ts               # Context builder
│   │   ├── 📄 animations.ts            # Framer Motion animation presets
│   │   └── 📄 visualEditorScript.ts    # Visual editor injection script
│   │
│   ├── 📁 lib/                     # Libraries/wrappers
│   │   ├── 📄 templates.ts             # Project starter templates
│   │   └── 📄 webcontainer.ts          # WebContainer API wrapper
│   │
│   ├── 📁 types/                   # TypeScript type definitions
│   │   └── 📄 plugins.ts               # Plugin type definitions
│   │
│   └── 📁 assets/                  # Static assets
│       └── 📄 NEXO-V2.png              # Nexo logo image
│
├── 📁 api/                         # Serverless API routes (Vercel)
│   ├── 📄 chat.js                  # Main AI chat endpoint (8.9KB)
│   ├── 📄 ai-chat.ts               # TypeScript AI chat handler
│   └── 📄 serve-deployment.ts      # Static deployment server
│
├── 📁 services/ (root)             # Root-level services (server-side)
│   ├── 📄 ai.ts                    # AI abstraction layer
│   ├── 📄 gemini.ts                # Gemini API (5.7KB)
│   ├── 📄 openai.ts                # OpenAI API wrapper
│   ├── 📄 elevenlabs.ts            # ElevenLabs TTS API (3.2KB)
│   ├── 📄 export.ts                # Export logic (4.3KB)
│   └── 📄 storage.ts               # Storage abstraction
│
├── 📁 plugins/                     # Plugin system
│   └── 📁 supabase-core/           # Supabase plugin
│
├── 📁 project-name/                # Full-stack backend scaffold
│   ├── 📄 README.md
│   ├── 📁 client/                  # Client-side of generated project
│   └── 📁 server/                  # Express.js backend
│       └── 📁 routes/
│           └── 📄 ai.js            # AI route handler
│
├── 📁 components/ (root)           # Legacy/standalone components
│   ├── 📄 Assistant.tsx            # Legacy AI assistant (34KB)
│   └── 📄 NoteList.tsx             # Legacy note list component
│
├── 📁 docs/                        # Developer documentation
│   ├── 📄 AGENTS.md                # Multi-agent system docs
│   ├── 📄 NEXO_CONTEXT.md          # Full system context
│   ├── 📄 PROMPT_ARCHITECTURE.md   # Prompt engineering docs
│   └── 📄 OLLAMA_DIAGNOSIS.md      # Ollama troubleshooting
│
├── 📁 project-brain/               # AI project memory store
├── 📁 dist/                        # Production build output
├── 📁 claude-code-system-prompts-main/  # Claude prompts reference
│
├── 📄 nexo.md                      # Nexo project notes (11.7KB)
├── 📄 upgread.md                   # Upgrade changelog (7.2KB)
├── 📄 env.md                       # Environment variables guide
├── 📄 change.txt                   # Change log text
├── 📄 README.md                    # Project readme (4.8KB)
├── 📄 SECURITY.md                  # Security policy
├── 📄 LICENSE                      # MIT License
├── 📄 .env.local                   # Local env variables (Firebase, Gemini keys)
└── 📄 .gitignore                   # Git ignore rules
```

---

## 🎨 UI & Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background (Light) | `#fbf9f6` | App background, home page, workspace |
| Background (Dark) | `#09090b` | LandingHero overlay, dark workspace |
| Primary Text | `stone-900` / `#1c1917` | Headings, buttons |
| Secondary Text | `stone-500` / `#78716c` | Body copy, labels |
| Accent Orange | `orange-500` / `amber-600` | Home hero gradient, CTA |
| Accent Indigo | `indigo-500` / `indigo-600` | Workspace actions, model selector |
| Accent Purple | `purple-600` | Gradient backgrounds |
| Emerald | `emerald-500` | Success, task done states |
| White | `#ffffff` | Cards, panels, modals |
| Border | `stone-200` / `white/10` | Dividers, card borders |

### Typography

| Element | Style |
|---------|-------|
| Font | System `font-sans` (Inter-like) |
| Hero H1 | `text-6xl md:text-8xl font-bold tracking-tighter` |
| Section H2 | `text-4xl md:text-6xl font-bold tracking-tight` |
| Card H3 | `text-2xl font-bold` |
| Body | `text-xl text-stone-500 font-light` |
| Label | `text-xs font-bold uppercase tracking-widest` |
| Mono code | `font-mono text-sm` |

### Design Tokens

| Property | Value |
|----------|-------|
| Border Radius | `rounded-full`, `rounded-2xl`, `rounded-[2rem]`, `rounded-[3rem]` |
| Shadows | `shadow-sm`, `shadow-xl`, `shadow-2xl` |
| Blur | `backdrop-blur-xl`, `backdrop-blur-2xl`, `blur-3xl` |
| Transitions | `duration-300`, `transition-all`, `hover:-translate-y-1` |
| Animations | `animate-ping`, `animate-pulse`, `animate-spin` |

---

## 🏠 Home Page (`/`) — `src/pages/Home.tsx`

### Layout Structure

```
<Layout>                          ← Header + Nav + Footer wrapper
  <Home>
    ├── Section 1: Hero
    │   ├── Background gradient blob (orange/blue/purple radial)
    │   ├── "Nexo v2 is live" badge (animated ping dot)
    │   ├── H1: "Build your friend. Design your world." (gradient text)
    │   ├── Subtext description
    │   ├── CTAs: [Try the Demo] [Hardware Guide]
    │   └── Floating Avatar (CompanionState.IDLE)
    │
    ├── Section 2: Feature Cards (3-column grid)
    │   ├── ❤️ Emotional Core (red)
    │   ├── 💻 Self-Building (blue)
    │   └── 🌐 Open Platform (green)
    │
    └── Section 3: Dark Feature Block
        ├── Background: stone-900 + indigo gradient glow + noise texture
        ├── Left: "Code with a friend. Not a bot." + description + CTA
        └── Right: Animated code snippet card (rotated, hover normalizes)
```

### Home Page Design Details

| Element | Design |
|---------|--------|
| Hero background | `bg-gradient-to-br from-orange-100/50 via-blue-100/30 to-purple-100/30 blur-3xl` radial blob |
| Badge | White pill, `border-stone-200`, animated `bg-orange-400 animate-ping` dot |
| H1 gradient | `bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent` |
| Primary CTA | `bg-stone-900 rounded-full hover:-translate-y-1 shadow-xl` |
| Feature cards | `rounded-[2rem] hover:shadow-xl hover:-translate-y-2 transition-all duration-300` |
| Feature icon bg | Colored `rounded-2xl` with `group-hover:scale-110` |
| Dark block | `bg-stone-900 rounded-[3rem]` + `opacity-20 noise.svg` + `blur-[100px] indigo gradient` |
| Code mock | `rounded-2xl bg-stone-800/50 rotate-3 hover:rotate-0 transition-transform duration-500` |

---

## 🖥️ Global Layout — `src/components/Layout.tsx`

### Header (Fixed, `z-40`)

```
<header class="fixed top-0 w-full backdrop-blur-xl border-b">
  ├── Logo: Nexo v2 (image + text, hover scale)
  ├── Nav Pills (hidden md:flex, rounded-full pill container)
  │   ├── Home  (active: bg-stone-100 font-semibold)
  │   ├── Workspace
  │   └── Guide
  └── Right Actions
      ├── User Avatar pill (Google photo + name + logout) OR Sign In button
      └── Launch button (hidden on /demo route)
```

| Header Element | Style |
|----------------|-------|
| Background | `bg-[#fbf9f6]/80 backdrop-blur-xl` |
| Logo | `w-9 h-9 rounded-xl shadow-lg group-hover:scale-105` |
| Nav container | `bg-white/50 p-1.5 rounded-full border border-stone-200/50 backdrop-blur-md` |
| Active nav item | `bg-stone-100 text-stone-900 font-semibold rounded-full` |
| User pill | `bg-white pr-3 pl-1.5 py-1.5 rounded-full border border-stone-200/60 shadow-sm` |
| Launch CTA | `bg-stone-900 text-white rounded-full hover:-translate-y-0.5 shadow-lg` |

### Footer (Visible on non-workspace routes)

```
<footer class="border-t bg-white py-16">
  4-column grid:
  ├── Brand (Logo + tagline)
  ├── Project links (Web Demo, Hardware Spec, Source Code)
  ├── Community (Discord, Twitter, Blog)
  └── Powered By (AI Engine / NVIDIA / Google Gemini — animated badges)
```

---

## 🧪 Workspace — `src/pages/ChatInterface.tsx` → Route `/demo`

### Workspace Layout Structure

```
<div class="h-screen flex-col overflow-hidden">
  │
  ├── InitialOverlay (shown when no messages — full screen)
  │
  ├── Header (h-14, fixed within workspace)
  │   ├── Left:  ← Back to start
  │   ├── Center: "Untitled" (project title)
  │   └── Right: [Remix] [Share] [Publish] [Edit] [Settings]
  │
  └── Main (flex-1 flex overflow-hidden)
      └── PanelGroup (horizontal, resizable)
          ├── Panel 1 (60% default): Preview / Code / Terminal
          │   ├── Sub-header: Tab switcher [Preview | Code]
          │   │   └── Right controls: [Refresh] [Fullscreen] [Link] [Visual Mode]
          │   └── Content (lazy-loaded):
          │       ├── PreviewPanel (iframe live preview)
          │       ├── EditorPanel (Monaco code editor)
          │       └── DevTools (terminal/logs)
          │
          ├── Resize Handle (w-1 hover:bg-indigo-500 cursor-col-resize)
          │
          └── Panel 2 (40% default, 280-520px): ChatPanel
              ├── Header: Nexo + new chat button
              ├── Messages list (user/AI bubbles + task list)
              └── Input bar (textarea + send button + mic/attach)
```

### Workspace Header Details

| Button | Style |
|--------|-------|
| Back | `rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50` |
| Remix | `flex gap-1.5 text-stone-600 hover:bg-stone-100 rounded-lg` |
| Share | `rounded-full border border-stone-200` |
| Publish | `bg-white border border-stone-200 rounded-full shadow-sm` |
| Settings | `p-1.5 rounded-lg hover:bg-stone-100` icon button |

---

## 🚀 InitialOverlay — `src/components/chat/InitialOverlay.tsx`

The full-screen workspace start page shown before any prompt is sent.

### Layout

```
<div class="fixed inset-0 z-[100] bg-[#fbf9f6] flex">
  │
  ├── Sidebar (w-72, hidden on mobile)
  │   ├── Logo: "NEXO STUDIO" (Sparkles icon)
  │   ├── Recent Projects list
  │   │   └── Per project: icon + name + 3-dot menu
  │   │       └── Actions: Download ZIP · Upload to Drive · Delete
  │   └── Status: "● Google Gemini Active"
  │
  └── Main Content (flex-1, centered)
      ├── Mobile fallback logo
      ├── H2: "Build your next masterpiece."
      ├── Subtext: "Simple, powerful, and autonomous AI development."
      ├── Textarea (large, rounded-[2.5rem], shadow-xl)
      │   └── Bottom-right: [Start Generation →] button
      ├── Config Bar (horizontal pills)
      │   ├── 🤖 Model selector dropdown (Gemini 2.5 Flash etc.)
      │   ├── ━ Divider
      │   ├── Mode toggle: [Frontend | Fullstack]
      │   ├── ━ Divider
      │   └── 💻 Language dropdown (HTML/TS/JS/Python/Go/Rust)
      └── Suggestion Chips
          └── [SaaS Dashboard] [AI Portfolio] [Landing Page] [E-commerce UI]
```

### InitialOverlay Design Details

| Element | Style |
|---------|-------|
| Textarea | `bg-white border-stone-200 rounded-[2.5rem] p-10 text-2xl min-h-[220px] shadow-xl` |
| Glow effect | `absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 blur opacity-5 group-focus-within:opacity-20` |
| Start btn | `bg-stone-900 text-white rounded-2xl shadow-xl hover:bg-black hover:scale-105 active:scale-95` |
| Model pill | `rounded-full border border-stone-200 shadow-sm hover:border-indigo-500` |
| Mode toggle active | `bg-indigo-600 text-white shadow-md rounded-full` |
| Suggestion chip | `bg-white rounded-full border border-stone-200 hover:border-indigo-500 hover:text-indigo-600` |
| Sidebar project row | `rounded-xl hover:bg-white hover:border-stone-200 hover:shadow-sm` |

---

## 💬 ChatPanel — `src/components/chat/ChatPanel.tsx`

### Message Bubble System

| Role | Style |
|------|-------|
| User | `bg-stone-900 text-white border-stone-800 justify-end rounded-2xl` |
| AI | `bg-white text-stone-800 border-stone-200 justify-start rounded-2xl` |
| AI label | `Sparkles icon + "NEXO AI" uppercase tracking-widest opacity-50` |
| Building state | Animated indigo ping dot + `subStatus` text |
| Task list | Color-coded dots: emerald=done, indigo=running, stone=pending |

### Input Bar

```
Absolute positioned at bottom:
├── Textarea (h-20, bg-transparent, focus:shadow-md)
├── Bottom controls:
│   ├── Mic button (voice input)
│   ├── Attach button
│   └── Send button (bg-stone-900 rounded-full)
```

---

## ⚙️ SettingsModal — `src/components/ui/SettingsModal.tsx`

### Tabs: Chat · Share · Publish · Versions · Integrations

| Tab | Content |
|-----|---------|
| Chat | Model selector, System Instructions, Microphone source |
| Share/Publish/Versions | Deploy Live + Export ZIP quick actions |
| Integrations | GitHub push (token + repo URL + branch + commit) |

---

## 🤖 AI Agent System — `src/agents/`

| Agent | Responsibility |
|-------|---------------|
| `Orchestrator` | Master flow controller, coordinates all agents |
| `FrontendAgent` | HTML/CSS/React/Vue/JS code generation |
| `BackendAgent` | Node/Express/API generation |
| `DesignerAgent` | UI design decisions, color, layout |
| `ArchitectureAgent` | System design, file structure planning |
| `DebugAgent` | Error detection and fix generation |
| `QAAgent` | Quality checks and test generation |
| `SecurityAgent` | Security vulnerability scanning |
| `DevOpsAgent` | Deployment config generation |
| `PMAgent` | Task breakdown and project planning |
| `PlannerAgent` | Step-by-step plan generation |
| `AnimationAgent` | CSS/Framer Motion animations |
| `EnhancementAgent` | Code improvement suggestions |
| `RefactorAgent` | Code refactoring and cleanup |
| `ProductionAgent` | Production readiness checks |
| `CloningAgent` | Clone existing sites from URL |
| `CollaborationBus` | Inter-agent event bus / messaging |

---

## 🗂️ State Management (Zustand)

| Store | State Managed |
|-------|--------------|
| `agentStore` | `selectedModel`, `projectMode`, `selectedLanguage`, `techStack` |
| `chatStore` | `messages[]`, `input`, `currentChatId`, `hasStarted` |
| `projectStore` | `currentContent` (files), `buildPhase`, `subStatus`, `tasks[]` |
| `designStore` | `selectedElement` (visual editor target) |
| `memoryStore` | Long-term AI conversation memory |
| `runtimeStore` | WebContainer terminal state |
| `subscriptionStore` | User plan (free/pro/team) |
| `teamStore` | Team members, roles, real-time collaboration |
| `visualEditorStore` | Visual editor panel open/close state |

---

## 🔌 Key Dependencies

| Package | Purpose |
|---------|---------|
| `react 19` + `react-dom` | UI framework |
| `react-router-dom v7` | Routing (HashRouter) |
| `framer-motion v12` | Animations |
| `zustand v5` | State management |
| `@google/genai v2` | Gemini AI SDK |
| `@monaco-editor/react` | VS Code Monaco editor |
| `@webcontainer/api` | Browser-native Node.js runtime |
| `@codesandbox/sandpack-react` | Embedded code sandbox |
| `firebase v12` | Auth + Firestore database |
| `react-resizable-panels` | Draggable split panels |
| `lucide-react` | Icon library |
| `react-hot-toast` | Toast notifications |
| `react-markdown` + `remark-gfm` | Markdown rendering |
| `jszip` | ZIP file generation |
| `fuse.js` | Fuzzy search |
| `openai` | OpenAI API client |
| `ollama` | Local Ollama model support |
| `@e2b/code-interpreter` | E2B cloud code sandbox |
| `dompurify` | HTML sanitization |

---

## 🚦 App Routing

```
HashRouter (client-side)
├── / → Home.tsx (wrapped in Layout: header + footer visible)
├── /demo → ChatInterface.tsx (Layout: header hidden, fullscreen)
└── /build → Build.tsx (wrapped in Layout: header + footer visible)
```

### Route Behavior

| Route | Header | Footer | Layout |
|-------|--------|--------|--------|
| `/` | ✅ Visible | ✅ Visible | Standard page |
| `/demo` | ❌ Hidden (workspace has own header) | ❌ Hidden | Full-screen flex |
| `/build` | ✅ Visible | ✅ Visible | Standard page |

---

## 🔐 Authentication

- **Provider:** Firebase Google OAuth (`signInWithPopup`)
- **Trigger:** Header "Sign In" button or InitialOverlay "Sign in to save projects"
- **State:** `onAuthStateChanged` listener in both `Layout.tsx` and `InitialOverlay.tsx`
- **Data Saved:** Chat history → Firestore (`users/{uid}/chats/{chatId}`)
- **Auto-save:** Debounced 2 seconds after each message change

---

## 📦 Firebase Data Model

```
Firestore:
└── users/
    └── {uid}/
        └── chats/
            └── {chatId}/
                ├── id: string
                ├── name: string (first 30 chars of first message)
                ├── date: string
                ├── updatedAt: number
                ├── messages: Message[]
                ├── content: { files: Record<string, string> }
                ├── model: string
                ├── projectMode: "frontend" | "fullstack"
                └── messageCount: number
```

---

## 🎬 Animation Patterns

| Pattern | Implementation |
|---------|---------------|
| Page fade-in | `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}` |
| Card hover lift | `hover:-translate-y-2 transition-all duration-300` |
| Dropdown open | `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}` |
| Context menu | `initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}` |
| Feature icon hover | `group-hover:scale-110 transition-transform duration-300` |
| Code card hover | `rotate-3 hover:rotate-0 transition-transform duration-500` |
| Building indicator | `animate-ping` + `animate-pulse` indigo dots |
| Avatar preview | `initial={{ scale: 0.9 }} animate={{ scale: 1 }} delay: 0.4s` |
| Glow on focus | `opacity-5 group-focus-within:opacity-20 transition duration-1000` |

---

## 📱 Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| Mobile (< md) | Single column, hamburger menu, sidebar hidden |
| Tablet (md) | 2-col grids, nav visible, panels stack |
| Desktop (lg+) | Full 3-col grids, sidebar visible in workspace |
| xl | Max-width `max-w-7xl` constrains content |

---

*Last updated: 2026-05-25 | Nexo V2 — Full Workspace Documentation*
