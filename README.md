# 🚀 NEXO V2 — The Autonomous AI Studio

<p align="center">
  <b>NEXO V2 is an autonomous software engineering agent workspace that runs entirely in your browser.</b>
  <br />
  <i>Describe your idea, watch the AI plan and write code, tweak it visually, and deploy it live in seconds.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production--Ready-emerald?style=for-the-badge&logo=rocket" alt="Status" />
  <img src="https://img.shields.io/badge/Version-2.3.0-indigo?style=for-the-badge&logo=git" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Built%20With-Gemini%203.5-blue?style=for-the-badge&logo=google-gemini" alt="Built With Gemini" />
</p>

---

## ✨ Core Features

NEXO V2 uses a specialized **Multi-Agent Parallel Engine** to construct full-stack web applications interactively.

### ✍️ Monaco Typewriter Simulation

Watch the AI write code in real-time. Instead of large, jumpy blocks of text appearing suddenly, the Monaco Editor uses an adaptive typewriter simulator to stream code smoothly character-by-character. Typing speeds automatically scale based on network latency to avoid delays.

### ⚡ Capped LLM Latency (Fast Thinking)

We optimize intermediate agent steps (such as layout planning and prompt enhancement) by applying strict token caps (`maxTokens: 250` for enhancer, `400` for planner). This cuts initial planning states down to under a second, ensuring a responsive workspace.

### 🧠 Autonomous Multi-Agent Pipeline

- **PM/Planner Agent**: Outlines milestones, determines layouts, and maps out targeted files.
- **UI & Code Agent**: Generates production-ready frontend and backend components concurrently.
- **Build & Fixer Agent (Self-Healing)**: Intercepts compiler exceptions in the virtual container and issues self-healing code edits to fix bugs automatically.

### 💻 Local-First & Cloud-Sync Architecture

Nexo V2 features a robust hybrid state manager. If Firebase configurations are absent, the application automatically runs in a fully functional **Local-Only Mode** with LocalStorage persistence. Once Firebase credentials are provided, cloud syncing and user authentication are enabled.

---

## 🛠️ Technology Stack

| Layer                  | Technologies                                                             |
| :--------------------- | :----------------------------------------------------------------------- |
| **Frontend Framework** | React 19, Vite, TypeScript                                               |
| **Styling & UI**       | Tailwind CSS 3.4, Lucide Icons, Framer Motion (micro-animations)         |
| **Virtual Sandbox**    | StackBlitz WebContainer API (in-browser Node.js/npm runtime)             |
| **State Management**   | Zustand                                                                  |
| **Database & API**     | Node.js Express server, Prisma, PostgreSQL (emulated)                    |
| **AI Providers**       | Google Gemini 2.0, OpenAI GPT-4o, Anthropic Claude 3.5, Groq, NVIDIA GLM |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.0.0 or higher)
- An API Key from Google Gemini, OpenRouter, or NVIDIA Integration.

### 1. Clone & Install Client

```bash
git clone https://github.com/chetan3232/nexo-v2.git
cd nexo-v2
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Firebase Sync & Auth
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
```

> ℹ️ **Note**: Omit the Firebase variables to run in local-only sandbox mode.

### 3. Launch Development Environments

Nexo V2 runs with a React client and a Node.js companion orchestration server.

**Start Client Workspace (Terminal 1)**:

```bash
npm run dev
```

_App launches on `http://localhost:3000`_

**Start Backend Orchestrator Server (Terminal 2)**:

```bash
cd project-name/server
npm run dev
```

_Server launches on `http://localhost:5000`_

---

## 📂 Project Structure

```text
├── src/
│   ├── agents/          # Specialized AI Agent executors (PM, Frontend, DevOps)
│   ├── components/      # UI components (Chat panels, Monaco Editor, Live Preview)
│   ├── services/        # WebContainer bindings, Firebase integrations
│   ├── stores/          # Zustand reactive state managers
│   └── utils/           # AI system prompts, parsers, and visual editors
├── project-name/
│   └── server/          # Node.js Express companion orchestrator server
│       ├── routes/      # SSE stream & job status controllers
│       └── services/    # AI Gateway, Queue managers, Prompt enhancers
└── nexo.md              # High-fidelity architectural specifications
```

---

## 🛡️ Sandbox Security

Security is built directly into Nexo V2's execution model:

- **Total Isolation**: Generated applications execute completely client-side in the **WebContainer sandbox**. They have no access to your host machine's filesystem or native terminal processes.
- **Key Security**: AI API keys are stored only in your local browser state and are transmitted directly/proxied safely for streaming completions.

For more details, see [SECURITY.md](./SECURITY.md).

---

## 📄 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more details.

---

<p align="center">
  Built with ❤️ by the NEXO Community<br/>
</p>
