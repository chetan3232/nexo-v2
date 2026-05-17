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

### 🧠 5.3 context Management
*   **Long Context:** Purane messages ko summarize kiya jata hai `ContextManager.ts` mein taaki token limit cross na ho.

### 🛡️ 5.2 The Self-Healing Loop
1.  **Error Signal:** Terminal output mein `ERROR` keywords detect hote hain.
2.  **Diagnosis:** `DebugAgent` ko error message aur active code context bheja jata hai.
3.  **Patch Generation:** AI ek `PATCH` block generate karta hai:
    ```
    <<<< SEARCH
    // Incorrect code
    ==== REPLACE
    // Corrected code
    >>>>
    ```
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

---

## 📝 12. Common Data Structures (Detailed)

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

## 🚀 13. Roadmap: The Path to V3

*   **Phase 7 — Multi-Agent Collaboration:** (COMPLETED) 4-5 agents simultaneously working.
*   **Phase 8 — Native App Export:** (IN PROGRESS) Capacitor/Electron integration.
*   **Phase 9 — Voice UI:** Purely voice commands se full app develop karna.
*   **Phase 10 — Autonomous Maintenance:** AI monitors deployed apps and auto-patches security vulnerabilities.

---

## ⚠️ 14. Critical Constraints (Do Not Violate)

1.  **No `any` usage:** TS interfaces hamesha use karo.
2.  **Streaming First:** UI updates stream ke saath real-time honi chahiye.
3.  **File Naming:** Case-sensitive virtual FS hai. Consistency maintain karo.
4.  **Package Bloat:** Unnecessary dependencies avoid karo runtime performance ke liye.

---6351

*Last updated: May 2026 | Project: NEXO V2 Studio | Status: Production Ready | Version: 2.2.0 | Features: Observe Mode, Team Sync, SaaS Export*

