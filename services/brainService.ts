import { useMemoryStore } from '../stores/memoryStore';
import { useProjectStore } from '../stores/projectStore';

export class BrainService {
  private static instance: BrainService;

  private constructor() {}

  public static getInstance(): BrainService {
    if (!BrainService.instance) {
      BrainService.instance = new BrainService();
    }
    return BrainService.instance;
  }

  /**
   * Load brain files from physical directory via backend API.
   */
  async loadBrain(): Promise<Record<string, string>> {
    try {
      const response = await fetch('/api/brain/load');
      if (!response.ok) throw new Error("Failed to load brain from server");
      const data = await response.json();
      
      if (data.status === 'success' && data.files) {
        // Sync decisions and roadmap to Zustand memoryStore
        const memoryStore = useMemoryStore.getState();
        
        const decisionsFile = data.files['decisions.log'] || '';
        const decisions = decisionsFile
          .split('\n')
          .filter((l: string) => l.trim().startsWith('-'))
          .map((l: string) => l.trim().substring(2));
          
        if (decisions.length > 0) {
          memoryStore.setRoadmap(decisions);
        }
        
        try {
          const userBehavior = JSON.parse(data.files['user-behavior.json'] || '{}');
          if (userBehavior) {
            memoryStore.setPreferences(userBehavior);
            
            // Also sync custom design tokens to project store
            const projectStore = useProjectStore.getState();
            projectStore.setDesignTokens({
              themeMode: userBehavior.themeMode || 'dark',
              primaryColor: userBehavior.primaryColor || '#6366f1',
              accentColor: userBehavior.accentColor || '#f97316',
              borderRadius: userBehavior.borderRadius || 'lg',
              fontFamily: userBehavior.fontFamily || 'Inter',
            });
          }
        } catch (jsonErr) {}
        
        return data.files;
      }
    } catch (e) {
      console.warn("[BrainService] Unable to connect to local brain server. Using default brain configurations.", e);
    }
    return {};
  }

  /**
   * Save brain file to physical directory via backend API.
   */
  async saveBrainFile(filename: string, content: string): Promise<boolean> {
    try {
      const response = await fetch('/api/brain/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content }),
      });
      return response.ok;
    } catch (e) {
      console.error(`[BrainService] Failed to save brain file ${filename}:`, e);
      return false;
    }
  }

  /**
   * Post Build Analysis: Runs after every build to learn styling and preferences.
   */
  async postBuildAnalysis(prompt: string, files: Record<string, string>) {
    console.log("[BrainService] Analyzing prompt and generated codebase...");
    
    let primaryColor = '#6366f1';
    let themeMode = 'dark';
    let fontFamily = 'Inter';

    const appCode = files['App.tsx'] || '';
    const cssCode = files['index.css'] || '';

    // Color heuristics
    const hexMatch = appCode.match(/bg-\[([^\]]+)\]/);
    if (hexMatch) {
      primaryColor = hexMatch[1];
    } else if (appCode.includes('bg-indigo-')) {
      primaryColor = '#6366f1';
    } else if (appCode.includes('bg-purple-')) {
      primaryColor = '#a855f7';
    } else if (appCode.includes('bg-blue-')) {
      primaryColor = '#3b82f6';
    } else if (appCode.includes('bg-emerald-')) {
      primaryColor = '#10b981';
    }

    // Theme mode heuristic
    if (cssCode.includes('background-color: #ffffff') || (appCode.includes('bg-white') && !appCode.includes('bg-slate-900') && !appCode.includes('bg-zinc-900') && !appCode.includes('bg-black'))) {
      themeMode = 'light';
    }

    // Font heuristic
    if (cssCode.includes("font-family: 'Outfit'")) {
      fontFamily = 'Outfit';
    } else if (cssCode.includes("font-family: 'Geist'")) {
      fontFamily = 'Geist';
    }

    const behavior = {
      themeMode,
      primaryColor,
      borderRadius: 'lg',
      fontFamily,
      frequentPrompts: [prompt],
      buildFailuresCount: 0
    };

    const behaviorStr = JSON.stringify(behavior, null, 2);
    await this.saveBrainFile('user-behavior.json', behaviorStr);

    const dateStr = new Date().toISOString().split('T')[0];
    const newDecision = `- [${dateStr}] Generated application based on: "${prompt}". Applied theme color "${primaryColor}" and font "${fontFamily}".`;
    
    const loaded = await this.loadBrain();
    const existingLog = loaded['decisions.log'] || '';
    const updatedLog = existingLog.trim() + '\n' + newDecision + '\n';
    await this.saveBrainFile('decisions.log', updatedLog);

    console.log("[BrainService] Post-build analysis complete. Brain files synchronized.");
  }

  /**
   * Inject Context: Inject learned preferences and coding-style constraints into Agent Prompts.
   */
  injectContext(systemInstruction: string, behavior: any): string {
    const preferencesContext = `
[INTELLIGENCE LAYER - LEARNED USER PREFERENCES]
- Target Theme Mode: ${behavior.themeMode || 'dark'}
- Brand Primary Color Accent: ${behavior.primaryColor || '#6366f1'}
- Target Font Style Family: ${behavior.fontFamily || 'Inter'}
`;

    const codingStyleContext = `
[INTELLIGENCE LAYER - CODING STANDARDS]
- Always build layouts cleanly with modern glassmorphism design.
- Utilize strict type safety conventions for variables.
- Structure React code component blocks under clear delimiter blocks starting with ---FILE: path--- and ending with ---END---.
`;

    return `${systemInstruction}\n${preferencesContext}\n${codingStyleContext}`;
  }

  /**
   * Log Correction: Records a bug fix patch to prevent repeat compiler errors.
   */
  async logCorrection(bug: string, filename: string) {
    const loaded = await this.loadBrain();
    const goals = loaded['project-goals.md'] || '';
    
    const newLog = `\n- [BUG REPORT] Encountered runtime crash in ${filename}: "${bug}". Auto-patched via self-healing loop.`;
    const updatedGoals = goals.trim() + newLog + '\n';
    await this.saveBrainFile('project-goals.md', updatedGoals);
    console.log(`[BrainService] Logged self-healing fix for bug: "${bug}" inside ${filename}.`);
  }
}
export default BrainService;
