# 🧠 NEXO V2 — The Complete AI Agent & Developer Handbook

> **IMPORTANT:** Ye file NEXO V2 ka "Single Source of Truth" hai. Kisi bhi AI agent ya developer ko project start karne se pehle ise poora padhna mandatory hai.  
> Yeh guide structure, logic, protocols, aur standards ko define karti hai.

---

## 🎯 1. Project Vision & Overview

**NEXO V2** sirf ek code generator nahi hai, yeh ek **Autonomous Software Engineer** hai jo browser ke andar chalta hai. User ke natural language prompts ko actual, running software mein convert karta hai.

*   **Primary Goal:** Reduce development time from weeks to seconds.
*   **Target Users:** Product Managers (Prototyping), Developers (Scaffolding), aur Non-tech founders (MVP building).
*   **Core Experience:** "Describe it, See it, Tweak it, Ship it."

### 🎨 Design Language: "The Studio Aesthetic"
*   **Minimalism:** Google AI Studio aur Vercel jaisa clean interface.
*   **Density:** Pro-tools feel jahan text aur panels tightly packed hain but clean hain.
*   **Interactive:** Har UI element AI ke saath synced hai (Visual Editor).

---

## 🏗️ 2. Autonomous Multi-Agent Parallel Engine

NEXO V2 uses a **Highly Parallelized Orchestration Engine** for maximum speed and intelligence.

```
[ USER PROMPT ]
       │
       ▼
[ PHASE 1: STRATEGIC ] (Parallel)
├── PM Agent (PRD)
├── Designer Agent (Tokens)
└── DevOps Agent (Environment)
       │
       ▼
[ PHASE 2: IMPLEMENTATION ] (Parallel & Collaborative)
├── Frontend Agent <────┐
│                       │ (Collaboration Bus)
└── Backend Agent <─────┘
       │
       ▼
[ PHASE 3: VERIFICATION ] (Parallel)
├── QA Agent (Testing)
└── Security Agent (Vulnerability Scan)
       │
       ▼
[ FINAL: DEPLOYMENT ]
└── Runtime Boot (WebContainer)
```

### 🤝 2.1 The Collaboration Bus
Agents ek dusre se baat kar sakte hain real-time mein:
- **Frontend → Backend**: "Need `/movies` endpoint for fetching list."
- **Backend → Frontend**: "Need a search input component for the navbar."
This inter-agent communication ensures that the generated layers are perfectly synced.

## 🧬 2.2 AI Refactor Engine
NEXO V2 support karta hai **Complex Project Migrations**:
- **Framework Swap**: Vite → Next.js transformation (folder migration, route config, SSR setup).
- **Language Upgrade**: JS → TS migration (renaming files, generating types, fixing imports).
- **Architecture Refactor**: Monolith → Modular split.
Orchestrator ka `handleRefactor` method in migrations ko manage karta hai.

---

## 📂 3. The Agent Squad: Protocols & Responsibilities

Har agent ka ek specific role aur output format hota hai.

### 🔴 3.1 Planner Agent (`agents/PlannerAgent.ts`)
*   **Input:** Raw prompt + History context.
*   **Output:** Executable steps (JSON array or Markdown list).
*   **Logic:** Break complex tasks into phases. Example: "First setup tailwind, then build nav, then auth logic."

### 🔴 3.2 PM Agent (`agents/PMAgent.ts`)
*   **Output:** `prd.md` file.
*   **Protocol:** Yeh agent features, user flow, aur tech stack constraints define karta hai.

### 🔴 3.3 Designer Agent (`agents/DesignerAgent.ts`)
*   **Output:** `DesignSystem` tokens.
*   **Logic:** Tailwind config updates generate karta hai. Accent colors, border radii, aur font families define karta hai.

### 🔴 3.4 Frontend Agent (`agents/FrontendAgent.ts`)
*   **Output:** React/HTML components using `---FILE: path---` syntax.
*   **Protocol:** Strict modularity follows karta hai. One component per file.

### 🔴 3.5 DevOps Agent (`agents/DevOpsAgent.ts`)
*   **Output:** `package.json`, `tsconfig.json`, `.env.example`.
*   **Logic:** Check karta hai ki dependencies version-compatible hain ya nahi.

---

## ⚡ 4. The Virtual Runtime (WebContainer Deep Dive)

NEXO V2 uses **StackBlitz WebContainers** to run code in the browser.

### 🔄 4.1 The Boot Lifecycle
1.  **Booting:** `WebContainerService.boot()` call hota hai (Single instance).
2.  **Mounting:** `extractCodeFromText()` se files extract hoke virtual disk par write hoti hain.
3.  **Installing:** `DevServerService.install()` runs `npm install`. Note: NPM is emulated in the browser.
4.  **Running:** `npm run dev` start hota hai. Output `DevTools` panel mein stream hota hai.

### 🛠️ 4.2 Dependency Auto-Discovery
Agar code mein `import { lucide } from 'lucide-react'` hai but `package.json` mein nahi, to `utils/deps.ts` use detect karke auto-install karta hai.

---

## 🧠 5. Intelligence & Memory Engine (Project Brain)

NEXO V2 uses a **Structured Persistent Intelligence Layer** stored in `/project-brain/`.

### 📂 5.1 The Brain Structure
- `architecture.md`: Project's structural blueprint.
- `coding-style.md`: Type safety, naming, and UI standards.
- `decisions.log`: Historical architectural choices.
- `user-behavior.json`: Learned preferences (UI styles, frequent prompts).
- `stack-patterns.json`: Preferred libraries and code snippets.
- `project-goals.md`: Short/Long term roadmap.

### 🧠 5.2 Learning Mechanism
1.  **Post-Build Analysis**: After every build, `BrainService` analyzes the prompt and generated code.
2.  **Context Injection**: `memoryStore` merges brain data into agent prompts, ensuring every new feature (e.g., "add dashboard") follows existing patterns.
3.  **Self-Correction**: Past bugs and fixes are logged to prevent repetitive errors.

### 🧠 5.3 Context Management
*   **Long Context:** Purane messages ko summarize kiya jata hai `ContextManager.ts` mein taaki token limit cross na ho.

### 🛡️ 5.4 The Self-Healing Loop
1.  **Error Signal:** Terminal output mein `ERROR` keywords detect hote hain.
2.  **Diagnosis:** `DebugAgent` ko error message aur active code context bheja jata hai.
3.  **Patch Generation:** AI ek `PATCH` block generate karta hai.
4.  **Application:** `parser.ts` file overwrite karta hai aur hot-reload trigger hota hai.

---

## 🎨 6. Visual AI Builder (Communication Protocol)

Iframe aur Host Studio ke beech communication postMessage API ke through hota hai.

### 📤 6.1 Host to Iframe
*   `SET_VISUAL_MODE`: Elements par outline borders enable karta hai.
*   `UPDATE_STYLE`: Specific ID waale element ke CSS change karta hai.

### 📥 Iframe to Host
*   `ELEMENT_SELECTED`: Clicked element ki metadata (ID, Tag, Current Styles) bhejta hai.
*   `STYLE_SYNCED`: Jab UI mein change ho, to `visualEditorStore` update hota hai.

---

## 💾 7. State Management (Zustand Stores)

Har store ki ek unique responsibility hai:

| Store | Responsibility | Key Fields |
| :--- | :--- | :--- |
| `projectStore` | File system & Build status | `files`, `buildPhase`, `selectedFileName` |
| `agentStore` | AI Model & Params | `selectedModel`, `temperature`, `techStack` |
| `chatStore` | Conversation history | `messages`, `companionState` |
| `memoryStore` | Persistent user data | `preferences`, `buildHistory` |
| `subscriptionStore`| Monetization | `currentPlan`, `usageMeter` |
| `runtimeStore` | WebContainer state | `isBooted`, `logs`, `reasoning` |
| `teamStore` | Real-time Collaboration | `members`, `agentStatuses` |
| `blockStore` | Reusable AI Components | `savedBlocks`, `templates` |

---

## 🧪 8. Tech Stack Support Matrix

NEXO optimized templates use karta hai high-performance ke liye:

1.  **React 19 (Vite):** Standard for web apps. Includes Tailwind 3.4.
2.  **Next.js 15:** App Router support. WebContainer mein performance heavy hai, isliye light components prefer hote hain.
3.  **Node/Express:** Backend APIs ke liye.
4.  **Python/Flask:** Data science ya simple logic servers ke liye.
5.  **Vanilla Web:** Index.html + CSS (For ultra-fast previews).

---

## 🛡️ 9. Security & Sandbox Rules

*   **Isolation:** Saara code WebContainer sandbox mein chalta hai. Local file access nahi hai.
*   **CORS Management:** Proxy server use hota hai external APIs call karne ke liye.
*   **Token Protection:** User API keys browser storage mein encrypted save hoti hain.

---

## 🚀 10. Development & Contribution Guide

Agar aap NEXO mein naya feature add kar rahe hain:

### 🛠️ Adding a New Agent
1.  `agents/` directory mein nayi file banao (Extends `BaseAgent`).
2.  System prompt `utils/prompts.ts` mein add karo.
3.  `Orchestrator.ts` mein use parallel ya sequential flow mein call karo.

### 🎨 Adding a UI Component
1.  `components/ui/` mein modular component banao.
2.  Lucide icons use karo for consistency.
3.  Framer Motion animations apply karo for premium feel.

---

## 🚀 11. Viral & Advanced Features (V2.2+)

NEXO V2 incorporates several "Killer Features" that set it apart:

### 🌐 11.1 Observe Mode (Website Cloning)
*   **Logic:** `CloningAgent` uses computer vision concepts to "see" a URL's layout, fonts, and colors.
*   **Action:** It reconstructs the UI as editable React components inside NEXO instantly.

### 🧠 11.2 AI Team Mode
*   **Real-time Collaboration:** Human users and AI agents work together in a shared workspace.
*   **Status Tracking:** `teamStore` tracks which agent is "Thinking", "Coding", or "Idle" in real-time.

### 🛡️ 11.3 Production Readiness Scanner
*   **Automated Audit:** Pre-deployment scanner for SEO, Accessibility, Security headers, and Performance.
*   **Score:** Projects receive a health score (0-100) with suggested AI fixes.

### 📦 11.4 Reusable AI Blocks
*   **Cloud Storage:** Users can save high-fidelity UI blocks (Hero sections, Auth forms) to a private library.
*   **Cross-Project Injection:** One-click injection of saved blocks into new projects.

### ⚡ 11.5 SaaS Killer Export
*   **One-Click SaaS:** Automatically adds Auth (Firebase/Clerk), Payments (Stripe), and a Dashboard to any project during export.

### 🌐 11.6 Multimodal Chat, Dynamic API Routing & GitHub Integration (V2.2.1)
*   **Multimodal Attachments:** Drag/attach file and image uploads in chat panel. Text files are parsed as code blocks, and images are structured into Base64 `image_url` OpenAI/Gemini compatible payloads.
*   **One-Click GitHub Push:** Credentials (`githubToken`, `repoUrl`, `branchName`) are managed and persisted under Settings > Integrations. The main header button triggers an immediate one-click background push without confirmation popups.
*   **Multi-Provider Routing:** Backend router `/api/chat` handles model prefix requests dynamically (routing Google Gemini to Generative Language API, Groq models to Groq, and Qwen models to OpenRouter).

### ⚡ 11.7 Dual AI Engine Architecture & State Machine (V2.3.0)
*   **Dual AI Engine:** Splits the code generation flow into a **Fast Thinker** model (Gemini 2.5 Flash / Groq) that outputs a plan and file structure in `< 1.5 seconds` and instantly spawns empty workspace file trees, and a **Deep Thinker** model (Gemini 2.5 Pro / Qwen 3 Coder) that generates deep background code logic.
*   **State Machine UI:** Implemented dynamic color themes for active build states: Planning (Blue 🔵), Generating (Purple 🟣), Fixing (Orange 🟡), and Deploying (Teal 🟢).
*   **Nodemon Configured:** Configured `nodemon.json` to ignore data updates, preventing server reboots during job state mutations.

### 🎙️ 11.8 Voice-to-App & Enhanced Multi-Agent UI (V2.4.0)
*   **Voice-to-App Generation:** Full Web Speech API integration on both the InitialOverlay landing page and in-chat ChatPanel. Users click the mic button to speak their app idea — live interim transcript shows in real-time as they speak, then finalizes to the prompt input automatically.
*   **Enhanced Multi-Agent Build Progress:** The chat panel now shows a rich animated pipeline with color-coded phase badges (🧠 Planner Agent, ⚡ Code Agent, 🔧 Fix Agent, 🚀 Deploy Agent), animated bouncing dots for running tasks, green checkmarks for completed tasks, and smooth per-task entrance animations.
*   **Dual Engine Sidebar Badges:** The InitialOverlay sidebar shows two dynamic badges: "⚡ Fast: Gemini Flash" (planner) and "🧠 Deep: [selected model]" (coder), always reflecting the user's active model selection.
*   **Expanded Runtime Error Capture:** `errorCapture.ts` now covers 10 error patterns including `Cannot read properties`, `is not a function`, `SyntaxError`, and `Uncaught Error` — all trigger the self-healing loop automatically.

### 🎬 11.9 Intent Exploration, Theme Builder, & Cinematic Flow (V2.5.0 - Phases 1-12)
NEXO V2.5.0 introduces the **12-Phase Ultimate Generation Flow** splitting execution into three key dynamic stages:

#### Stage A: Intent & Design Exploration (Phases 1-3)
*   **Phase 1: Intent Extraction:** Call `/api/ai/explore` to analyze user input. Extract appType, targetUsers, platform, and core features dynamically using Gemini models.
*   **Phase 2: Concept Selection:** Presents the user with 2 generated custom style concepts (e.g. Modern SaaS, Bold Startup) complete with distinct primary colors, typography, borders, and animations.
*   **Phase 3: Design Editor:** A live UI customization overlay where developers adjust primary colors, dark/light/custom theme modes, custom borders, and font settings with a live rendering component preview box.

#### Stage B: Theme Builder & Blueprint Editor (Phases 4-6)
*   **Phase 4: Blueprint Generation:** Request `/api/ai/blueprint` to generate a structured implementation checklist listing page lists, backend configurations, and integrations.
*   **Phase 5: Blueprint Customization:** Users can edit the blueprint plan by entering modifications (e.g. "Add Checkout page", "Add Google Auth"), rebuilding the task flow dynamically before writing code.
*   **Phase 6: Structure Confirmation:** Visual check verifying structure, styling configurations, and pages checklist.

#### Stage C: Cinematic Generation Experience (Phases 7-9)
*   **Phase 7: Plan Scaffolding:** Creates empty workspace skeletons instantly.
*   **Phase 8: Deep Code Generation:** The Deep Thinker agent writes high-performance, responsive codebase streaming file-writing progress events live (writing, char counts, active completions) via EventSource (SSE).
*   **Phase 9: Live Sandbox Compile:** Mounts code in StackBlitz WebContainers, auto-resolving imports and installing dependencies.

#### Stage D: Ultimate Flow Completion (Phases 10-12)
*   **Phase 10: Quality Auditing:** Launches automated testing & security scans. Displays `QualityReviewOverlay` on complete, scoring Performance, Accessibility, SEO, and UI Quality (0-100 metrics).
*   **Phase 11: Deployment Routing:** Packages builds and starts sandbox local development servers.
*   **Phase 12: Preview Redirect:** Displays the `PreviewTransferOverlay` representing sandbox boot, starting local servers, and routing live to the preview iframe.

---

## 📂 12. Project Directory & File Structure

Here is the structured folder map of the entire NEXO V2 workspace for reference:

```text
NEXO-V2 Workspace Root
├── .env.local                  # Environment configuration keys
├── App.tsx                     # Entry App configuration wrapper
├── index.html                  # Core HTML template shell
├── index.tsx                   # Main index render mount
├── package.json                # Frontend package dependencies configuration
├── tsconfig.json               # TypeScript path config rules
├── vite.config.ts              # Vite configuration (aliases, server proxies)
├── src/                        # Core Frontend Source Code
│   ├── App.tsx
│   ├── index.tsx
│   ├── index.css
│   ├── types.ts                # App typescript models (Message, CompanionState)
│   ├── agents/                 # Multi-Agent squads definitions
│   │   ├── BaseAgent.ts        # Common abstract class for all agents
│   │   ├── PlannerAgent.ts     # Initial flow coordinator
│   │   ├── PMAgent.ts          # Strategy specifications and prd.md writer
│   │   ├── DesignerAgent.ts    # Styles and theme tokens manager
│   │   ├── FrontendAgent.ts    # File write codes and layout architectures
│   │   ├── BackendAgent.ts     # Mock APIs and routes generator
│   │   ├── DevOpsAgent.ts      # Configurations writer (package.json, tsconfig)
│   │   ├── DebugAgent.ts       # Code debug / self-healing router
│   │   ├── QAAgent.ts          # Code validation and test generator
│   │   ├── SecurityAgent.ts    # Code security scanner
│   │   ├── RefactorAgent.ts    # Architecture migrations handler
│   │   ├── ArchitectureAgent.ts
│   │   ├── AnimationAgent.ts
│   │   ├── ProductionAgent.ts
│   │   ├── CloningAgent.ts     # Visual web cloning layout engine
│   │   ├── CollaborationBus.ts # Inter-agent request/response bus
│   │   ├── Orchestrator.ts     # Core strategic compiler and stream connector
│   │   └── index.ts
│   ├── components/             # React View Components
│   │   ├── Layout.tsx          # App base sidebar / container layout wrapper
│   │   ├── Avatar.tsx
│   │   ├── PremiumModal.tsx
│   │   ├── chat/               # Chat panels & workflow layouts
│   │   │   ├── ChatPanel.tsx            # Main chat interface panel
│   │   │   ├── InitialOverlay.tsx       # Landing overlays with voice inputs
│   │   │   ├── DesignExploration.tsx    # Intent Selectors & Custom Theme editors
│   │   │   ├── AgentWorkflowOverlay.tsx # Running progress tracking indicator
│   │   │   ├── QualityReviewOverlay.tsx # Scores metrics panel (SEO, performance)
│   │   │   ├── PreviewTransferOverlay.tsx # Starting server loader status
│   │   │   ├── BuildQueue.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── ReasoningPanel.tsx
│   │   │   ├── TaskBoard.tsx
│   │   │   └── Terminal.tsx
│   │   ├── editor/             # Files editor panel views
│   │   │   ├── EditorPanel.tsx          # Code editor panel (Lazy Monaco)
│   │   │   ├── DevTools.tsx             # Server logs and terminals
│   │   │   ├── CodeExplainer.tsx
│   │   │   └── VisualDesignPanel.tsx
│   │   ├── preview/
│   │   │   └── PreviewPanel.tsx         # Live sandboxed preview frame (postMessage integration)
│   │   ├── sidebar/            # Sidebar status widgets
│   │   │   ├── WorkspaceSidebar.tsx
│   │   │   ├── HealthDashboard.tsx
│   │   │   ├── ProductionScanner.tsx
│   │   │   ├── TeamPanel.tsx
│   │   │   ├── TimelinePanel.tsx
│   │   │   └── DependencyGraph.tsx
│   │   ├── ui/                 # Custom controls & configurations Modals
│   │   │   ├── SettingsModal.tsx        # Settings (Integrations, parameters)
│   │   │   ├── TokenDashboard.tsx       # Realtime usage statistics counters
│   │   │   ├── DeployModal.tsx          # Push deployment triggers
│   │   │   ├── PricingModal.tsx
│   │   │   ├── SavedChatsModal.tsx
│   │   │   ├── StudioControls.tsx
│   │   │   ├── UsageStats.tsx
│   │   │   └── LandingHero.tsx
│   │   └── marketplace/
│   │       └── MarketplacePanel.tsx
│   ├── services/               # Services connection integrations
│   │   ├── firebase.ts         # User auth and firestore integrations
│   │   ├── saveService.ts      # Auto-saving handler
│   │   ├── geminiService.ts
│   │   ├── githubService.ts
│   │   ├── deploymentService.ts
│   │   ├── usageManager.ts
│   │   └── runtime/
│   │       ├── webcontainer.ts # WebContainer boot loaders
│   │       ├── devServer.ts    # Dev scripts running setup
│   │       └── errorCapture.ts # Runtime errors diagnostic capture
│   ├── stores/                 # Zustand state managers
│   │   ├── projectStore.ts     # Workspace files and status state
│   │   ├── chatStore.ts        # Conversational threads
│   │   ├── agentStore.ts       # Model parameters and routing config
│   │   ├── memoryStore.ts      # Client persistent preference settings
│   │   ├── runtimeStore.ts     # Boot states & servers logs
│   │   └── teamStore.ts        # Dynamic agents activity logs
│   └── utils/                  # Helper script utilities
│       ├── parser.ts           # File markers codes extractor
│       ├── deps.ts             # Dependencies updater
│       ├── intentAnalyzer.ts
│       ├── bundler.ts
│       └── agentEventBus.ts    # Events tracking coordinator
└── project-name/               # Backend Workspace Directory
    └── server/                 # Node/Express Backend Server
        ├── server.js           # Server application initializer
        ├── package.json
        ├── nodemon.json
        ├── routes/             # REST Endpoints Controllers
        │   ├── ai.js           # Main routing (/chat, /build, /transcribe, /explore, /blueprint)
        │   ├── chats.js        # User workspace saves manager
        │   ├── files.js
        │   ├── deploy.js       # Target exports / deploy endpoints
        │   └── scrape.js
        ├── services/           # Backend processing services
        │   ├── aiGateway.js    # Smart Multi-Provider engine with Failover Chains
        │   ├── backendOrchestrator.js # Background builds workflow dispatcher
        │   ├── allowanceManager.js # Budget check control services
        │   ├── promptEnhancer.js  # Sparkles query optimization expander
        │   ├── projectMemory.js   # Memories persist database
        │   └── queueManager.js    # In-memory background jobs registry
        ├── data/               # Persistent database JSON saves
        │   ├── USAGE.md        # AI calls history logs
        │   ├── usage.json      # In-depth tokens track usage logs
        │   ├── allowances.json # Budgets settings file
        │   ├── chats.json
        │   └── memories/       # Per-chat JSON persistent databases
        └── utils/
            └── parser.js
```

---

## 📝 13. Common Data Structures (Detailed)

### `WebsiteContent`
```typescript
interface WebsiteContent {
  files: Record<string, string>; // Path -> Content mapping
  patches?: Record<string, string>; // Path -> Diff mapping
  mainFile: string; // Entry point (e.g., App.tsx)
  template: 'react' | 'web' | 'node' | 'python';
  dependencies?: Record<string, string>; // package.json extras
}
```

### `BuildTask`
```typescript
interface BuildTask {
  id: string;
  label: string; // "Building Navbar"
  status: 'pending' | 'running' | 'done' | 'error';
  agent: string; // Name of the agent responsible
}
```

---

## 🚀 14. Roadmap: The Path to V3

*   **Phase 7 — Multi-Agent Collaboration:** (COMPLETED) 4-5 agents simultaneously working.
*   **Phase 8 — Native App Export:** (IN PROGRESS) Integration with Electron/Capacitor.
*   **Phase 9 — Voice UI:** (COMPLETED V2.4.0) Voice commands to develop full applications via Web Speech API.
*   **Phase 10 — Autonomous Maintenance:** AI monitors active deployments and auto-patches files.

---

## ⚠️ 15. Critical Constraints (Do Not Violate)

1.  **No `any` usage:** TS interfaces hamesha use karo.
2.  **Streaming First:** UI updates stream ke saath real-time honi chahiye.
3.  **File Naming:** Case-sensitive virtual FS hai. Consistency maintain karo.
4.  **Package Bloat:** Unnecessary dependencies avoid karo runtime performance ke liye.

---

*Last updated: June 2026 | Project: NEXO V2 Studio | Status: Production Ready | Version: 2.5.0 | Features: Explore Intent, Custom Blueprints, Cinematic Progress, Quality Reviews, Team Sync, Dual Engine, Voice-to-App, SaaS Export*
