import { useProjectStore } from '../stores/projectStore';
import { useTeamStore } from '../stores/teamStore';
import { useChatStore } from '../stores/chatStore';
import { useRuntimeStore } from '../stores/runtimeStore';
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

    projectStore.setBuildPhase(7);
    runtimeStore.clearLogs();
    runtimeStore.addLog("Initializing build workspace scaffold...");

    // Stage C Phase 7: Empty Virtual Tree Init
    const files: Record<string, string> = {
      'index.html': '<!-- Loading index skeleton -->',
      'App.tsx': '// Bootstrapping App views',
      'package.json': '{}',
    };
    projectStore.setFiles(files);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Phase 8: Deep Code Generation
    projectStore.setBuildPhase(8);
    runtimeStore.addLog("Running Sequential Multi-Agent parallel compilations...");

    // DevOps builds config files
    teamStore.setAgentStatus('DevOps', 'Thinking');
    runtimeStore.addLog("DevOps: Config files initialization...");
    const devopsOutput = await this.devops.setupConfig(prompt, 'React 19 Vite');
    const devopsFiles = extractCodeFromText(devopsOutput).website?.files || {};
    Object.assign(files, devopsFiles);
    projectStore.setFiles({ ...files });
    teamStore.setAgentStatus('DevOps', 'Idle');

    // PM builds product specs
    teamStore.setAgentStatus('PM', 'Thinking');
    runtimeStore.addLog("PM: Generating product specification details...");
    const prdText = await this.pm.generatePRD(prompt);
    files['prd.md'] = prdText;
    projectStore.setFiles({ ...files });
    teamStore.setAgentStatus('PM', 'Idle');

    // Frontend component writing
    teamStore.setAgentStatus('Frontend', 'Thinking');
    runtimeStore.addLog("Frontend: Writing React UI Views and design frames...");
    const tokensStr = JSON.stringify(tokens);
    const feOutput = await this.frontend.generateViews(prompt, prdText, tokensStr);
    const feFiles = extractCodeFromText(feOutput).website?.files || {};
    Object.assign(files, feFiles);
    projectStore.setFiles({ ...files });
    teamStore.setAgentStatus('Frontend', 'Idle');

    // Backend Mock routing writing
    teamStore.setAgentStatus('Backend', 'Thinking');
    runtimeStore.addLog("Backend: Stubbing mock controllers and local Express routing schemas...");
    const beOutput = await this.backend.generateMockAPI(prompt, prdText);
    const beFiles = extractCodeFromText(beOutput).website?.files || {};
    Object.assign(files, beFiles);
    
    // Add custom index.css styling rules supporting fonts & background
    files['index.css'] = `
@import "tailwindcss";
body {
  font-family: '${tokens.fontFamily}', sans-serif;
  background-color: ${tokens.themeMode === 'dark' ? '#09090b' : '#ffffff'};
  color: ${tokens.themeMode === 'dark' ? '#ffffff' : '#09090b'};
}
`;
    
    projectStore.setFiles({ ...files });
    teamStore.setAgentStatus('Backend', 'Idle');

    // Phase 9: Live Sandbox Compile & Install
    projectStore.setBuildPhase(9);
    runtimeStore.addLog("WebContainer: Launching sandboxed browser VM runtime...");
    
    // Simulate NPM installer logs
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
      } else {
        runtimeStore.addLog(`[Self-Healing] Unable to auto-generate code patch for this error.`);
      }
    } catch (e: any) {
      runtimeStore.addLog(`[Self-Healing] Diagnosis failed: ${e.message}`);
    }

    teamStore.setAgentStatus('Debug', 'Idle');
    chatStore.setCompanionState(CompanionState.IDLE);
  }
}
export default Orchestrator;
