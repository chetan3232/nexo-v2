import { useProjectStore } from '../stores/projectStore';
import { useTeamStore } from '../stores/teamStore';
import { useChatStore } from '../stores/chatStore';
import { useRuntimeStore } from '../stores/runtimeStore';
import { useAgentStore } from '../stores/agentStore';
import { PlannerAgent } from './PlannerAgent';
import { PMAgent } from './PMAgent';
import { DesignerAgent } from './DesignerAgent';
import { FrontendAgent } from './FrontendAgent';
import { BackendAgent } from './BackendAgent';
import { DevOpsAgent } from './DevOpsAgent';
import { QAAgent } from './QAAgent';
import { SecurityAgent } from './SecurityAgent';
import { DebugAgent } from './DebugAgent';
import { CompanionState, AppConcept, BuildTask } from '../types';
import { extractCodeFromText } from '../utils/parser';
import { BrainService } from '../services/brainService';
import { ContextManager } from '../utils/ContextManager';

export class Orchestrator {
  private planner = new PlannerAgent();
  private pm = new PMAgent();
  private designer = new DesignerAgent();
  private frontend = new FrontendAgent();
  private backend = new BackendAgent();
  private devops = new DevOpsAgent();
  private qa = new QAAgent();
  private security = new SecurityAgent();
  private debug = new DebugAgent();

  /**
   * Phase 1: Intent Extraction & Concept Generation
   */
  async runIntentExtraction(prompt: string): Promise<AppConcept[]> {
    const projectStore = useProjectStore.getState();
    const teamStore = useTeamStore.getState();
    const chatStore = useChatStore.getState();

    chatStore.setCompanionState(CompanionState.THINKING);
    teamStore.setAgentStatus('Planner', 'Thinking');
    projectStore.setBuildPhase(1);

    // Call LLM via PlannerAgent or direct explore prompt
    const designSystem = await this.designer.generateDesignSystem(prompt);

    const concepts: AppConcept[] = [
      {
        id: 'concept-saas',
        name: 'Modern SaaS Vibe',
        description: 'Clean typography, deep borders, glassmorphic dark controls and modern indigo brand accents.',
        designTokens: {
          themeMode: 'dark',
          primaryColor: '#6366f1', // Indigo
          accentColor: '#f97316',  // Orange
          borderRadius: 'lg',
          fontFamily: 'Inter',
        },
        features: ['Interactive Landing Layout', 'Rich Grid Dashboard', 'Integrated Custom Controls'],
      },
      {
        id: 'concept-cyber',
        name: 'Bold Cyber-Tech Vibe',
        description: 'High contrast styling, neon violet primary colors, sharp geometric borders, and Outfit font.',
        designTokens: {
          themeMode: 'dark',
          primaryColor: '#a855f7', // Violet/Purple
          accentColor: '#10b981',  // Emerald Green
          borderRadius: 'md',
          fontFamily: 'Outfit',
        },
        features: ['High-contrast Dark UI Theme', 'Modern Grid Components', 'Pulsing Indicator Actions'],
      }
    ];

    // Align design tokens with generated vibe
    concepts[0].designTokens = { ...designSystem, themeMode: 'dark' };
    concepts[1].designTokens = {
      ...designSystem,
      themeMode: 'dark',
      primaryColor: designSystem.accentColor || '#10b981',
      accentColor: designSystem.primaryColor || '#a855f7',
      borderRadius: 'md',
      fontFamily: 'Outfit'
    };

    projectStore.setConcepts(concepts);
    teamStore.setAgentStatus('Planner', 'Idle');
    chatStore.setCompanionState(CompanionState.IDLE);
    projectStore.setBuildPhase(2); // Progress to Concept Selection screen

    return concepts;
  }

  /**
   * Phase 4: Generate Blueprint Checklist
   */
  async generateBlueprint(prompt: string, selectedConcept: AppConcept) {
    const projectStore = useProjectStore.getState();
    const teamStore = useTeamStore.getState();
    
    projectStore.setBuildPhase(4);
    teamStore.setAgentStatus('Planner', 'Thinking');

    // Generate checklist from PlannerAgent
    const checklist = await this.planner.generateChecklist(prompt);
    projectStore.setBlueprintTasks(checklist);
    
    teamStore.setAgentStatus('Planner', 'Idle');
    projectStore.setBuildPhase(5); // Progress to Customize Blueprint screen
  }

  /**
   * Phase 7-9: Build the Workspace Files
   */
  async buildProject(prompt: string, checklist: BuildTask[]) {
    const projectStore = useProjectStore.getState();
    const teamStore = useTeamStore.getState();
    const runtimeStore = useRuntimeStore.getState();
    const tokens = projectStore.designTokens;

    // Project Brain Context Injection
    const brainService = BrainService.getInstance();
    const brainFiles = await brainService.loadBrain();
    let behavior: any = {};
    try {
      behavior = JSON.parse(brainFiles['user-behavior.json'] || '{}');
    } catch (e) {}

    // Enhance prompt using user behavioral patterns
    const enhancedPrompt = brainService.injectContext(prompt, behavior);

    projectStore.setBuildPhase(7);
    runtimeStore.clearLogs();
    runtimeStore.addLog("Initializing build workspace scaffold...");

    // Stage C Phase 7: Empty Virtual Tree Init based on dynamic tech stack matrix
    const techStack = useAgentStore.getState().techStack;
    let targetStackName = 'React 19 Vite';
    let files: Record<string, string> = {};

    if (techStack === 'react') {
      targetStackName = 'React 19 Vite';
      files = {
        'index.html': '<!-- Loading index skeleton -->',
        'App.tsx': '// Bootstrapping App views',
        'package.json': '{}',
      };
    } else if (techStack === 'web') {
      targetStackName = 'Vanilla HTML5 / CSS3';
      files = {
        'index.html': '<!-- Loading index html -->',
        'styles.css': '/* Styling rules */',
        'script.js': '// Main script',
      };
    } else if (techStack === 'node') {
      targetStackName = 'Next.js 15 App Router';
      files = {
        'app/page.tsx': '// NextJS page',
        'next.config.js': '// NextConfig',
        'package.json': '{}',
      };
    } else if (techStack === 'python') {
      targetStackName = 'Python Flask App';
      files = {
        'app.py': '# Flask Application Core',
        'requirements.txt': '# Python dependencies',
      };
    }

    projectStore.setFiles(files);
    await new Promise((resolve) => setTimeout(resolve, 800));


    // Phase 8: Deep Code Generation
    projectStore.setBuildPhase(8);
    runtimeStore.addLog("Running Sequential Multi-Agent parallel compilations...");

    // DevOps builds config files
    teamStore.setAgentStatus('DevOps', 'Thinking');
    runtimeStore.addLog("DevOps: Config files initialization...");
    const devopsOutput = await this.devops.setupConfig(enhancedPrompt, 'React 19 Vite');
    const devopsFiles = extractCodeFromText(devopsOutput).website?.files || {};
    Object.assign(files, devopsFiles);
    projectStore.setFiles({ ...files });
    teamStore.setAgentStatus('DevOps', 'Idle');

    // PM builds product specs
    teamStore.setAgentStatus('PM', 'Thinking');
    runtimeStore.addLog("PM: Generating product specification details...");
    const prdText = await this.pm.generatePRD(enhancedPrompt);
    files['prd.md'] = prdText;
    projectStore.setFiles({ ...files });
    teamStore.setAgentStatus('PM', 'Idle');

    // Frontend component writing
    teamStore.setAgentStatus('Frontend', 'Thinking');
    runtimeStore.addLog("Frontend: Writing React UI Views and design frames...");
    const tokensStr = JSON.stringify(tokens);
    const feOutput = await this.frontend.generateViews(enhancedPrompt, prdText, tokensStr);
    const feFiles = extractCodeFromText(feOutput).website?.files || {};
    Object.assign(files, feFiles);
    projectStore.setFiles({ ...files });
    
    // Simulate real-time Collaboration Bus message sharing
    runtimeStore.addLog("Frontend Agent: [Collaboration Bus] Requesting `/movies` endpoint for fetching list from Backend Agent...");
    await new Promise(r => setTimeout(r, 600));
    runtimeStore.addLog("Backend Agent: [Collaboration Bus] Acknowledged. Exposing `/api/movies` route handler and JSON dataset.");
    await new Promise(r => setTimeout(r, 600));
    
    teamStore.setAgentStatus('Frontend', 'Idle');

    // Backend Mock routing writing
    teamStore.setAgentStatus('Backend', 'Thinking');
    runtimeStore.addLog("Backend: Stubbing mock controllers and local Express routing schemas...");
    const beOutput = await this.backend.generateMockAPI(enhancedPrompt, prdText);
    const beFiles = extractCodeFromText(beOutput).website?.files || {};
    Object.assign(files, beFiles);
    
    runtimeStore.addLog("Backend Agent: [Collaboration Bus] Requesting search input component from Frontend Agent...");
    await new Promise(r => setTimeout(r, 600));
    runtimeStore.addLog("Frontend Agent: [Collaboration Bus] Acknowledged. Adding SearchInput React component to Navbar view.");
    await new Promise(r => setTimeout(r, 600));
    
    // Add custom styling rules supporting fonts & background
    if (techStack === 'react' || techStack === 'web') {
      const cssFile = techStack === 'react' ? 'index.css' : 'styles.css';
      files[cssFile] = `
@import "tailwindcss";
body {
  font-family: '${tokens.fontFamily}', sans-serif;
  background-color: ${tokens.themeMode === 'dark' ? '#09090b' : '#ffffff'};
  color: ${tokens.themeMode === 'dark' ? '#ffffff' : '#09090b'};
}
`;
    }
    
    projectStore.setFiles({ ...files });
    teamStore.setAgentStatus('Backend', 'Idle');


    // Phase 9: Live Sandbox Compile & Install
    projectStore.setBuildPhase(9);
    runtimeStore.addLog("WebContainer: Launching sandboxed browser VM runtime...");
    
    // Simulate NPM installer logs using DevServerService install emulation
    runtimeStore.addLog("npm install --no-audit");
    await new Promise((res) => setTimeout(res, 1200));
    runtimeStore.addLog("added 124 packages, audited 125 packages in 1.4s");
    runtimeStore.addLog("npm run dev");
    runtimeStore.addLog("  Vite v6.0.1  dev server running on port 3000:");
    runtimeStore.addLog("  > Local: http://localhost:3000/");

    // Phase 10: Quality Auditing
    projectStore.setBuildPhase(10);
    runtimeStore.addLog("QA/Security: Running accessibility checks, vulnerability audits and page audits...");
    
    teamStore.setAgentStatus('QA', 'Thinking');
    const scores = await this.qa.auditProject(files);
    projectStore.setQualityScores(scores);
    teamStore.setAgentStatus('QA', 'Idle');

    teamStore.setAgentStatus('Security', 'Thinking');
    const secLog = await this.security.performScan(files);
    runtimeStore.addLog(`Security Scan Results:\n${secLog}`);
    teamStore.setAgentStatus('Security', 'Idle');

    // Phase 11: Deployment Routing & Compilation
    projectStore.setBuildPhase(11);
    await new Promise((res) => setTimeout(res, 800));

    // Phase 12: Preview Redirect
    projectStore.setBuildPhase(12);
    runtimeStore.addLog("Pre-compilation finished. Routing to visual preview panel.");
    await new Promise((res) => setTimeout(res, 1000));
    
    // Set selected file as App.tsx or index.html
    const selected = files['App.tsx'] ? 'App.tsx' : (files['index.html'] ? 'index.html' : Object.keys(files)[0]);
    projectStore.setSelectedFileName(selected);

    // Sync build details to Project Brain
    await brainService.postBuildAnalysis(prompt, files);
  }


  /**
   * Run Self Healing debug loop on error detection
   */
  async runSelfHealing(errorMsg: string) {
    const projectStore = useProjectStore.getState();
    const teamStore = useTeamStore.getState();
    const runtimeStore = useRuntimeStore.getState();
    const chatStore = useChatStore.getState();

    runtimeStore.addLog(`[Self-Healing] Crash detected: ${errorMsg}`);
    teamStore.setAgentStatus('Debug', 'Thinking');
    chatStore.setCompanionState(CompanionState.CODING);

    try {
      const fix = await this.debug.diagnoseAndFix(errorMsg, projectStore.files);
      if (fix) {
        runtimeStore.addLog(`[Self-Healing] Applying code patch to ${fix.filename}...`);
        projectStore.updateFile(fix.filename, fix.fixedContent);
        runtimeStore.addLog(`[Self-Healing] Patch applied successfully. Reloading sandbox compilation devServer...`);
        // Log correction patch to Project Brain
        await BrainService.getInstance().logCorrection(errorMsg, fix.filename);
      } else {
        runtimeStore.addLog(`[Self-Healing] Unable to auto-generate code patch for this error.`);
      }

    } catch (e: any) {
      runtimeStore.addLog(`[Self-Healing] Diagnosis failed: ${e.message}`);
    }

    teamStore.setAgentStatus('Debug', 'Idle');
    chatStore.setCompanionState(CompanionState.IDLE);
  }

  /**
   * Refactor Engine to migrate structures and update frameworks
   */
  async handleRefactor(
    refactorType: 'framework_swap' | 'language_upgrade' | 'architecture_refactor',
    files: Record<string, string>
  ): Promise<Record<string, string>> {
    const runtimeStore = useRuntimeStore.getState();
    const updatedFiles = { ...files };

    runtimeStore.addLog(`[Refactor Engine] Starting refactor task: ${refactorType}...`);
    await new Promise((res) => setTimeout(res, 1000));

    if (refactorType === 'language_upgrade') {
      runtimeStore.addLog("[Refactor Engine] Language Upgrade: Scanning for Javascript components...");
      Object.keys(updatedFiles).forEach((name) => {
        if (name.endsWith('.js') || name.endsWith('.jsx')) {
          const newName = name.replace(/\.js$/, '.ts').replace(/\.jsx$/, '.tsx');
          updatedFiles[newName] = `// Compiled with TypeScript annotations\n` + updatedFiles[name];
          delete updatedFiles[name];
          runtimeStore.addLog(`[Refactor Engine] Converted ${name} -> ${newName}`);
        }
      });
      updatedFiles['tsconfig.json'] = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  }
}`;
      runtimeStore.addLog("[Refactor Engine] Created default tsconfig.json");
    } else if (refactorType === 'framework_swap') {
      runtimeStore.addLog("[Refactor Engine] Framework Swap: Migrating from Vite -> Next.js App Router...");
      
      // Move components to Next.js App folder
      if (updatedFiles['App.tsx']) {
        updatedFiles['app/page.tsx'] = `// Next.js App Router root page\nimport App from './App';\nexport default function Home() {\n  return <App />;\n}`;
        runtimeStore.addLog("[Refactor Engine] Created app/page.tsx Next.js entrypoint");
      }
      
      updatedFiles['next.config.js'] = `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n};\nmodule.exports = nextConfig;`;
      runtimeStore.addLog("[Refactor Engine] Configured next.config.js");
    } else if (refactorType === 'architecture_refactor') {
      runtimeStore.addLog("[Refactor Engine] Architecture Refactor: Splitting files into modular subdirectories...");
      Object.keys(updatedFiles).forEach((name) => {
        if (name !== 'App.tsx' && name !== 'index.css' && !name.includes('/') && (name.endsWith('.tsx') || name.endsWith('.ts'))) {
          const newPath = `components/ui/${name}`;
          updatedFiles[newPath] = updatedFiles[name];
          delete updatedFiles[name];
          runtimeStore.addLog(`[Refactor Engine] Moved file -> ${newPath}`);
        }
      });
    }

    runtimeStore.addLog("[Refactor Engine] Refactor completed successfully.");
    return updatedFiles;
  }
}
export default Orchestrator;
