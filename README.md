
  <h1>🚀 NEXO V2 — The Autonomous AI Studio</h1>
  
  <p align="center">
    <b>NEXO V2 isn't just a code generator. It’s an Autonomous Software Engineer that lives in your browser.</b>
    <br />
    <i>Describe it. See it. Tweak it. Ship it. All in seconds.</i>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Status-Production--Ready-emerald?style=for-the-badge&logo=rocket" />
    <img src="https://img.shields.io/badge/Version-2.3.0-indigo?style=for-the-badge&logo=git" />
    <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Built%20With-Gemini%203.5-blue?style=for-the-badge&logo=google-gemini" />
  </p>
</div>

---

## ✨ Key Features

NEXO V2 is built on a **Multi-Agent Parallel Engine** designed to handle full-stack development autonomously.

- **⚡ Dual AI Engine Architecture (V2.3.0)**: Split reasoning into a **Fast Thinker** (instant planning/file skeleton layout in < 1.5s) and a **Deep Thinker** (background deep coding and code chunk streaming).
- **🎨 Dynamic Color-Coded State Machine**: Real-time progress loader that changes colors dynamically per phase (Planning 🔵, Generating 🟣, Fixing 🟡, Deploying 🟢).
- **🧠 Autonomous Multi-Agent Parallel Engine**: Specialized agents (PM, Designer, Frontend, Backend, QA) work simultaneously to build your app layers in parallel.
- **⚡ Virtual Browser Runtime**: Powered by **StackBlitz WebContainers**, NEXO runs your code in a secure, sandboxed environment directly in the browser. No local setup required.
- **🔮 Observe Mode**: Point NEXO to any URL and it will scan the UI, extract fonts, colors, and layouts, and recreate it as editable high-fidelity React components.
- **🛠️ Self-Healing Loop**: Automated error diagnosis and patching. If the build fails, NEXO analyzes the logs and fixes the code autonomously.
- **🎨 Visual AI Editor**: Select any element in the live preview and tell NEXO to change its style, layout, or content in real-time.
- **🚀 One-Click SaaS Export**: Instantly inject Authentication (Firebase/Clerk), Payments (Stripe), and Dashboards into any project before exporting.
- **🤝 AI Team Mode**: Collaborate in real-time with AI agents that have visible "Thinking" and "Coding" statuses.

---

## 🛠️ Tech Stack

- **Core**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS 3.4, Framer Motion (Apple-level animations)
- **Intelligence**: Google Gemini 2.0 / NVIDIA GLM-4.7
- **Runtime**: WebContainer API
- **State**: Zustand (Reactive stores)
- **Database Support**: Prisma, PostgreSQL (via WebContainer emulation)

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A Gemini API Key (or OpenRouter/NVIDIA API Key)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/chetan3232/nexo-v2.git
   cd nexo-v2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   Create a `.env.local` file in the root and add your API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Studio**:
   ```bash
   npm run dev
   ```
   The studio will be available at `http://localhost:3000`.

5. **Run Server**:
   ```bash
   cd project-name/server
   npm run dev
   ```
   The server will be available at `http://localhost:5000`.   

---

## 📂 Project Structure

```text
├── src/
│   ├── agents/          # Specialized AI Agents (PM, Frontend, etc.)
│   ├── components/      # Modular UI Components & Workspace Panels
│   ├── services/        # WebContainer, Firebase, and AI Services
│   ├── stores/          # Zustand State Management
│   ├── types/           # Global TypeScript Interfaces
│   └── utils/           # AI Prompts, Parsers, and Visual Editor Logic
├── project-brain/       # Persistent AI Context & Learned Preferences
├── public/              # Static Assets
└── api/                 # Backend Proxy & Deployment Logic
```

---

## 🛡️ Security

NEXO V2 prioritizes security through total isolation. All generated code executes within the **WebContainer sandbox**, meaning it has no access to your local file system or sensitive system resources.

For more details, see [SECURITY.md](./SECURITY.md).

---

## 🤝 Contributing

We welcome contributions! Whether it's adding new agents, improving UI templates, or fixing bugs:
1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br/>
  <p>Built with ❤️ by the NEXO Community</p>
  <a href="https://twitter.com/nexo_studio">Twitter</a> • <a href="https://discord.gg/nexo">Discord</a> • <a href="https://nexo.studio">Website</a>
</div>
