import { useProjectStore, BuildTask } from "../stores/projectStore";
import { useChatStore } from "../stores/chatStore";
import { useAgentStore } from "../stores/agentStore";
import { PMAgent } from "./PMAgent";
import { DesignerAgent } from "./DesignerAgent";
import { FrontendAgent } from "./FrontendAgent";
import { BackendAgent } from "./BackendAgent";
import { DevOpsAgent } from "./DevOpsAgent";
import { DebugAgent } from "./DebugAgent";
import { EnhancementAgent } from "./EnhancementAgent";
import { RefactorAgent } from "./RefactorAgent";
import { ArchitectureAgent } from "./ArchitectureAgent";
import { AnimationAgent } from "./AnimationAgent";
import { ProductionAgent } from "./ProductionAgent";
import { CloningAgent } from "./CloningAgent";
import { QAAgent } from "./QAAgent";
import { SecurityAgent } from "./SecurityAgent";
import { PlannerAgent } from "./PlannerAgent";
import {
  Message,
  WebsiteContent,
  FileProgress,
  CompanionState,
} from "../types";
import { extractCodeFromText, calculateFileProgress } from "../utils/parser";
import { detectDependencies, updatePackageJson } from "../utils/deps";
import { WebContainerService } from "../services/runtime/webcontainer";
import { DevServerService } from "../services/runtime/devServer";
import { useRuntimeStore } from "../stores/runtimeStore";
import { useTeamStore } from "../stores/teamStore";
import { ContextManager } from "../utils/context";
import { UsageManager } from "../services/usageManager";
import { BrainService } from "../services/brainService";
import { VISUAL_EDITOR_SCRIPT } from "../utils/visualEditorScript";
import { DepAnalyzer } from "../utils/depAnalyzer";
import toast from "react-hot-toast";
import { BackgroundPreserver } from "../utils/backgroundPreserver";

export class Orchestrator {
  private static instance: Orchestrator;

  public static getInstance(): Orchestrator {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  private constructor() {}

  private autoFixAttempts = 0;
  private maxAutoFixAttempts = 3;
  private snapshots: Array<{
    id: string;
    timestamp: number;
    content: WebsiteContent;
    label: string;
  }> = [];

  async executeFullFlow(prompt: string) {
    const projectStore = useProjectStore.getState();
    const chatStore = useChatStore.getState();
    const agentStore = useAgentStore.getState();
    const runtimeStore = useRuntimeStore.getState();
    const teamStore = useTeamStore.getState();

    const options = {
      model: agentStore.selectedModel,
      projectMode: agentStore.projectMode,
      techStack: agentStore.techStack,
      selectedLanguage: agentStore.selectedLanguage,
      temperature: agentStore.temperature,
      topP: agentStore.topP,
    };

    UsageManager.getInstance().trackGeneration();
    UsageManager.getInstance().startRuntimeTracking();
    chatStore.setState(CompanionState.THINKING);

    projectStore.setBuildPhase("building");
    BackgroundPreserver.activate().catch(() => {});
    projectStore.setReasoningSteps([]);
    projectStore.addReasoningStep(
      "Analyzing your prompt and project context...",
    );
    projectStore.setSubStatus("Initializing parallel engine...");

    // Initialize Task List for Parallel Execution
    projectStore.setTasks([
      {
        id: "strategy",
        label: "Strategic Planning (PM, Designer, DevOps)",
        status: "pending",
      },
      {
        id: "implementation",
        label: "Application Implementation (Frontend, Backend)",
        status: "pending",
      },
      {
        id: "verification",
        label: "Verification (QA, Security Scan)",
        status: "pending",
      },
      { id: "runtime", label: "Virtual Runtime Deployment", status: "pending" },
    ]);

    try {
      // Background boot runtime to speed up streaming previews
      WebContainerService.getInstance().boot().catch(() => {});

      const history = await ContextManager.getInstance().compress(
        chatStore.messages,
        options.model,
      );

      // 1. STRATEGIC PHASE (Parallel)
      projectStore.setSubStatus("Strategic planning...");
      projectStore.updateTask("strategy", { status: "running" });
      projectStore.addReasoningStep(
        "Strategizing architecture and design tokens (PM + Designer + DevOps)...",
      );
      teamStore.updateStatus("pm-agent", "thinking");
      teamStore.updateStatus("designer-agent", "thinking");

      const pm = new PMAgent();
      const designer = new DesignerAgent();
      const devops = new DevOpsAgent();

      teamStore.updateStatus("pm-agent", "thinking");
      teamStore.updateStatus("designer-agent", "thinking");
      teamStore.updateStatus("devops-agent", "thinking");

      const [prd, designSystem, envConfig] = await Promise.all([
        pm.generatePRD(prompt, history, options),
        designer.generateDesignTokens(prompt, options),
        devops.configureEnvironment(prompt, options.techStack, options),
      ]);

      this.updateProjectStore(prd + designSystem + envConfig);
      projectStore.updateTask("strategy", { status: "done" });
      teamStore.updateStatus("pm-agent", "idle");
      teamStore.updateStatus("designer-agent", "idle");
      teamStore.updateStatus("devops-agent", "idle");

      // 2. IMPLEMENTATION PHASE (Parallel & Collaborative)
      projectStore.setSubStatus("Building application layers...");
      projectStore.updateTask("implementation", { status: "running" });
      projectStore.addReasoningStep(
        "Generating full-stack implementation (Frontend + Backend)...",
      );
      teamStore.updateStatus("pm-agent", "idle");
      teamStore.updateStatus("designer-agent", "idle");
      teamStore.updateStatus("nexo-core", "coding");

      const frontend = new FrontendAgent();
      const backend = new BackendAgent();

      teamStore.updateStatus("frontend-agent", "coding");
      teamStore.updateStatus("backend-agent", "coding");

      const implementationResults = await Promise.all([
        frontend.generateUI(prompt, history, options, undefined, (text) =>
          this.handleStream(text),
        ),
        backend.generateLogic(prompt, history, options),
      ]);

      this.updateProjectStore(implementationResults.join("\n"));
      projectStore.updateTask("implementation", { status: "done" });
      teamStore.updateStatus("frontend-agent", "idle");
      teamStore.updateStatus("backend-agent", "idle");

      // 3. VERIFICATION PHASE (Parallel)
      projectStore.setSubStatus("Verifying security and quality...");
      projectStore.updateTask("verification", { status: "running" });
      projectStore.addReasoningStep(
        "Running security scans and quality verification (QA + Security)...",
      );

      const qa = new QAAgent();
      const security = new SecurityAgent();

      teamStore.updateStatus("qa-agent", "thinking");
      teamStore.updateStatus("nexo-core", "thinking");

      const allCode = projectStore.currentContent?.files
        ? Object.values(projectStore.currentContent.files).join("\n")
        : "";

      const [testSuite, securityReport] = await Promise.all([
        qa.runTests(prompt, allCode, options),
        security.scanVulnerabilities(allCode, options),
      ]);

      this.updateProjectStore(testSuite + securityReport);
      projectStore.updateTask("verification", { status: "done" });
      teamStore.updateStatus("qa-agent", "idle");

      // 4. RUNTIME BOOT
      projectStore.updateTask("runtime", { status: "running" });
      await this.bootRuntime();
      projectStore.addReasoningStep("Deploying to virtual browser runtime...");
      projectStore.updateTask("runtime", { status: "done" });

      this.createSnapshot(prompt);

      projectStore.setSubStatus("Build successful!");

      // Run Dependency Analysis
      if (projectStore.currentContent) {
        const nodes = DepAnalyzer.analyze(projectStore.currentContent.files);
        projectStore.setDepNodes(nodes);
      }

      await BrainService.getInstance().learnFromSession(
        prompt,
        projectStore.currentContent,
        true,
      );
      teamStore.updateStatus("nexo-core", "idle");
    } catch (error: any) {
      teamStore.updateStatus("nexo-core", "idle");
      teamStore.updateStatus("pm-agent", "idle");
      teamStore.updateStatus("designer-agent", "idle");
      console.error("Parallel Flow failed:", error);
      projectStore.setSubStatus("Build failed.");
      toast.error(`Build Error: ${error.message}`);

      // Update current running task to error
      const runningTask = projectStore.tasks.find(
        (t) => t.status === "running",
      );
      if (runningTask)
        projectStore.updateTask(runningTask.id, { status: "error" });

      await BrainService.getInstance().learnFromSession(prompt, null, false);
    } finally {
      BackgroundPreserver.deactivate();
      projectStore.setBuildPhase("idle");
      chatStore.setState(CompanionState.IDLE);
      UsageManager.getInstance().stopRuntimeTracking();
    }
  }

  private updateProjectStore(text: string) {
    const parsed = extractCodeFromText(text);
    if (parsed.website) {
      useProjectStore.getState().setCurrentContent((prev) => {
        if (!prev) return parsed.website!;
        return {
          ...prev,
          files: { ...prev.files, ...parsed.website!.files },
        };
      });
    }
  }

  private handleStream(text: string) {
    const parsed = extractCodeFromText(text);
    if (parsed.website) {
      useProjectStore.getState().setCurrentContent(parsed.website);
      // Real-time dynamic file write for instant preview update
      const wc = WebContainerService.getInstance().getWebContainer();
      if (wc) {
        Object.entries(parsed.website.files).forEach(([path, contents]) => {
          wc.fs.writeFile(path, contents as string).catch(() => {});
        });
      }
    }
  }

  private async bootRuntime() {
    const projectStore = useProjectStore.getState();
    const wc = WebContainerService.getInstance();
    const devServer = DevServerService.getInstance();

    await wc.boot();
    const content = projectStore.currentContent;
    if (content) {
      const detected = detectDependencies(content.files);
      const pkgJson = content.files["package.json"] || '{"dependencies": {}}';
      content.files["package.json"] = updatePackageJson(pkgJson, detected);

      // Inject Visual Editor Script into index.html
      if (content.files["index.html"]) {
        content.files["index.html"] = content.files["index.html"].replace(
          "</body>",
          `<script>${VISUAL_EDITOR_SCRIPT}</script></body>`,
        );
      }

      const wcFiles: any = {};
      Object.entries(content.files).forEach(([path, contents]) => {
        wcFiles[path] = { file: { contents } };
      });
      await wc.mount(wcFiles);
      await devServer.install();
      await this.setupBackend();
      await devServer.start();
    }
  }

  public async manualFix(errorMsg: string) {
    this.autoFixAttempts = 0;
    await this.triggerSelfHealing(errorMsg);
  }

  public async triggerSelfHealing(errorMsg: string) {
    if (this.autoFixAttempts >= this.maxAutoFixAttempts) {
      toast.error("Self-healing limit reached. Attempting rollback...");
      this.rollbackToLastSnapshot();
      return;
    }

    this.autoFixAttempts++;
    useProjectStore
      .getState()
      .setSubStatus(
        `Self-healing attempt ${this.autoFixAttempts}/${this.maxAutoFixAttempts}...`,
      );

    const debugAgent = new DebugAgent();
    const chatStore = useChatStore.getState();
    const agentStore = useAgentStore.getState();
    const wc = WebContainerService.getInstance();

    try {
      const resultText = await debugAgent.fix(errorMsg, chatStore.messages, {
        model: agentStore.selectedModel,
        projectMode: agentStore.projectMode,
        techStack: agentStore.techStack,
        selectedLanguage: agentStore.selectedLanguage,
        temperature: 0.1,
        topP: 1,
      });

      const parsed = extractCodeFromText(resultText);
      if (parsed.website) {
        const wcInstance = wc.getWebContainer();
        if (wcInstance) {
          for (const [path, contents] of Object.entries(parsed.website.files)) {
            await wcInstance.fs.writeFile(path, contents as string);
          }
        }
        this.updateProjectStore(resultText);
        toast.success("Self-healing patch applied!");
      }
    } catch (e) {
      console.error("Healing failed:", e);
    }
  }

  private rollbackToLastSnapshot() {
    if (this.snapshots.length > 0) {
      const lastGoodState = this.snapshots.pop();
      if (lastGoodState) {
        useProjectStore.getState().setCurrentContent(lastGoodState.content);
        toast.success("Rolled back to last working state.");
      }
    }
  }

  public async regenerateComponent(
    componentDescription: string,
    currentCode: string,
  ) {
    const projectStore = useProjectStore.getState();
    const chatStore = useChatStore.getState();
    const agentStore = useAgentStore.getState();

    projectStore.setBuildPhase("building");
    projectStore.setSubStatus(
      `Regenerating ${componentDescription.split(":")[0]}...`,
    );

    try {
      const enhancer = new EnhancementAgent();
      const resultText = await enhancer.enhance(
        `REGENERATE SELECTED COMPONENT: ${componentDescription}\n\nCURRENT COMPONENT CODE:\n${currentCode}`,
        chatStore.messages,
        {
          model: agentStore.selectedModel,
          projectMode: agentStore.projectMode,
          techStack: agentStore.techStack,
          selectedLanguage: agentStore.selectedLanguage,
          temperature: 0.8,
          topP: 1,
        },
      );

      const parsed = extractCodeFromText(resultText);
      if (parsed.website) {
        const wc = WebContainerService.getInstance().getWebContainer();
        if (wc) {
          for (const [path, contents] of Object.entries(parsed.website.files)) {
            await wc.fs.writeFile(path, contents as string);
          }
        }
        this.updateProjectStore(resultText);
        toast.success("Component updated!");
      }
    } catch (error: any) {
      toast.error("Regeneration failed.");
      console.error(error);
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }

  public async handleRefactor(prompt: string) {
    const projectStore = useProjectStore.getState();
    const chatStore = useChatStore.getState();
    const agentStore = useAgentStore.getState();

    if (!projectStore.currentContent) {
      toast.error("No project found to refactor.");
      return;
    }

    projectStore.setBuildPhase("building");
    projectStore.setSubStatus(`Migrating project: ${prompt}...`);

    try {
      const refactor = new RefactorAgent();
      const resultText = await refactor.migrate(
        prompt,
        projectStore.currentContent.files,
        chatStore.messages,
        {
          model: agentStore.selectedModel,
          projectMode: agentStore.projectMode,
          techStack: agentStore.techStack,
          selectedLanguage: agentStore.selectedLanguage,
          temperature: 0.1,
          topP: 1,
        },
      );

      const parsed = extractCodeFromText(resultText);
      if (parsed.website) {
        const wc = WebContainerService.getInstance().getWebContainer();
        if (wc) {
          for (const [path, contents] of Object.entries(parsed.website.files)) {
            await wc.fs.writeFile(path, contents as string);
          }
        }
        this.updateProjectStore(resultText);
        toast.success("Project migrated successfully!");
      }
    } catch (error: any) {
      toast.error("Migration failed.");
      console.error(error);
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }

  public async runArchitectureAudit() {
    const projectStore = useProjectStore.getState();
    const chatStore = useChatStore.getState();
    const agentStore = useAgentStore.getState();

    if (!projectStore.currentContent) return;

    projectStore.setSubStatus("Auditing architecture...");

    try {
      const auditor = new ArchitectureAgent();
      const resultText = await auditor.analyze(
        projectStore.currentContent.files,
        chatStore.messages,
        {
          model: agentStore.selectedModel,
          projectMode: agentStore.projectMode,
          techStack: agentStore.techStack,
          selectedLanguage: agentStore.selectedLanguage,
          temperature: 0.1,
          topP: 1,
        },
      );

      // Clean JSON response
      const jsonStr = resultText.replace(/```json|```/g, "").trim();
      const report = JSON.parse(jsonStr);

      if (report.score && report.metrics) {
        projectStore.setHealthData(report.score, report.metrics);
        toast.success(`Architecture Audit Complete: ${report.score}/100`);
      }
    } catch (error) {
      console.error("Audit failed:", error);
    }
  }

  public async handleSaaSExport() {
    const projectStore = useProjectStore.getState();
    const chatStore = useChatStore.getState();
    const agentStore = useAgentStore.getState();

    if (!projectStore.currentContent) return;

    projectStore.setBuildPhase("building");
    projectStore.setSubStatus("Injecting SaaS Intelligence...");

    try {
      const enhancer = new EnhancementAgent();
      const resultText = await enhancer.enhance(
        `TRANSFORM THIS PROJECT INTO A FULL SAAS STARTER. 
                MANDATORY ADDITIONS:
                1. Authentication (Supabase/Firebase)
                2. Stripe Payment Integration (Pricing page + Checkout)
                3. User Dashboard
                4. Settings Panel
                5. Onboarding Flow`,
        chatStore.messages,
        {
          model: agentStore.selectedModel,
          projectMode: agentStore.projectMode,
          techStack: agentStore.techStack,
          selectedLanguage: agentStore.selectedLanguage,
          temperature: 0.7,
          topP: 1,
        },
      );

      const parsed = extractCodeFromText(resultText);
      if (parsed.website) {
        const wc = WebContainerService.getInstance().getWebContainer();
        if (wc) {
          for (const [path, contents] of Object.entries(parsed.website.files)) {
            await wc.fs.writeFile(path, contents as string);
          }
        }
        this.updateProjectStore(resultText);
        toast.success("SaaS Transformation Complete!");
      }
    } catch (error) {
      console.error("SaaS Transform failed:", error);
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }

  public createSnapshot(label: string) {
    const projectStore = useProjectStore.getState();
    if (!projectStore.currentContent) return;

    const snapshot = {
      id: `v${this.snapshots.length + 1}`,
      timestamp: Date.now(),
      content: JSON.parse(JSON.stringify(projectStore.currentContent)),
      label,
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > 20) this.snapshots.shift(); // Keep last 20

    projectStore.setSnapshots(this.snapshots);
  }

  public async restoreSnapshot(snapshotId: string) {
    const projectStore = useProjectStore.getState();
    const snapshot = this.snapshots.find((s) => s.id === snapshotId);

    if (!snapshot) {
      toast.error("Snapshot not found.");
      return;
    }

    projectStore.setCurrentContent(snapshot.content);
    projectStore.setBuildPhase("building");
    projectStore.setSubStatus(`Rolling back to ${snapshot.id}...`);

    try {
      const wc = WebContainerService.getInstance().getWebContainer();
      if (wc) {
        // Clear and re-write
        for (const [path, contents] of Object.entries(snapshot.content.files)) {
          await wc.fs.writeFile(path, contents as string);
        }
      }
      toast.success(`Successfully rolled back to ${snapshot.id}`);
    } catch (error) {
      toast.error("Rollback failed.");
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }

  public async applyAnimations(
    prompt: string = "Add premium Apple-level animations to the whole UI",
  ) {
    const projectStore = useProjectStore.getState();
    const chatStore = useChatStore.getState();
    const agentStore = useAgentStore.getState();

    if (!projectStore.currentContent) return;

    projectStore.setBuildPhase("building");
    projectStore.setSubStatus("Injecting Motion Intelligence...");

    try {
      const animator = new AnimationAgent();
      const resultText = await animator.animate(prompt, chatStore.messages, {
        model: agentStore.selectedModel,
        projectMode: agentStore.projectMode,
        techStack: agentStore.techStack,
        selectedLanguage: agentStore.selectedLanguage,
        temperature: 0.7,
        topP: 1,
      });

      const parsed = extractCodeFromText(resultText);
      if (parsed.website) {
        const wc = WebContainerService.getInstance().getWebContainer();
        if (wc) {
          for (const [path, contents] of Object.entries(parsed.website.files)) {
            await wc.fs.writeFile(path, contents as string);
          }
        }
        this.updateProjectStore(resultText);
        toast.success("UI Animations Applied!");
      }
    } catch (error) {
      console.error("Animation injection failed:", error);
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }

  private async setupBackend() {
    const wc = WebContainerService.getInstance().getWebContainer();
    if (!wc) return;

    const files = await wc.fs.readdir(".", { withFileTypes: true });
    const hasPrisma = files.some((f) => f.name === "prisma");

    if (hasPrisma) {
      useProjectStore
        .getState()
        .setSubStatus("Initializing Prisma database...");
      const process = await wc.spawn("npx", [
        "prisma",
        "db",
        "push",
        "--accept-data-loss",
      ]);
      await process.exit;
    }
  }

  public async runProductionScan() {
    const projectStore = useProjectStore.getState();
    const chatStore = useChatStore.getState();
    const agentStore = useAgentStore.getState();

    if (!projectStore.currentContent) return;

    projectStore.setSubStatus("Performing Production Scan...");

    try {
      const scanner = new ProductionAgent();
      const resultText = await scanner.scan(
        projectStore.currentContent.files,
        chatStore.messages,
        {
          model: agentStore.selectedModel,
          projectMode: agentStore.projectMode,
          techStack: agentStore.techStack,
          selectedLanguage: agentStore.selectedLanguage,
          temperature: 0.1,
        },
      );

      const jsonStr = resultText.replace(/```json|```/g, "").trim();
      const checks = JSON.parse(jsonStr);
      projectStore.setProductionChecks(checks);
      toast.success("Production Scan Complete!");
    } catch (error) {
      console.error("Scan failed:", error);
    }
  }

  public async handleObserve(url: string) {
    const projectStore = useProjectStore.getState();
    const agentStore = useAgentStore.getState();

    projectStore.setBuildPhase("building");
    projectStore.setSubStatus(`Observing ${url}...`);
    projectStore.addReasoningStep(`Scanning UI at ${url}...`);

    try {
      // Call the real Firecrawl scraping backend
      projectStore.addReasoningStep(
        `Initiating high-fidelity Firecrawl scraper for ${url}...`,
      );

      const response = await fetch("http://127.0.0.1:5000/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || `Scraping failed with status ${response.status}`,
        );
      }

      const scrapeData = await response.json();
      projectStore.addReasoningStep(
        "Extracting styles, colors, and site markdown layout...",
      );

      const visualData = {
        screenshot: scrapeData.screenshot || "data:image/png;base64,...",
        styles: {
          fontFamily: "Inter, sans-serif",
          layoutType: "Modern Landing Page",
        },
        colors: ["#000000", "#FFFFFF", "#F5F5F7"],
        markdown: scrapeData.markdown,
      };

      projectStore.addReasoningStep(
        "Recreating high-fidelity editable clone...",
      );

      const cloner = new CloningAgent();
      const resultText = await cloner.clone(url, visualData, {
        model: agentStore.selectedModel,
        selectedLanguage: agentStore.selectedLanguage,
        temperature: 0.2,
      });

      projectStore.addReasoningStep(
        "Recreating editable high-fidelity clone...",
      );

      const parsed = extractCodeFromText(resultText);
      if (parsed.website) {
        const wc = WebContainerService.getInstance().getWebContainer();
        if (wc) {
          for (const [path, contents] of Object.entries(parsed.website.files)) {
            await wc.fs.writeFile(path, contents as string);
          }
        }
        this.updateProjectStore(resultText);
        toast.success(`Successfully cloned ${url}!`);
      }
    } catch (error) {
      console.error("Observe failed:", error);
      toast.error("Observe Mode failed.");
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }

  public async explainCode(filename: string, code: string) {
    const chatStore = useChatStore.getState();
    const projectStore = useProjectStore.getState();
    
    chatStore.setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", text: `Explain this code in ${filename}:\n\`\`\`\n${code}\n\`\`\``, timestamp: Date.now() }
    ]);
    
    projectStore.setBuildPhase("thinking");
    projectStore.setSubStatus("Analyzing code block...");
    
    try {
      const enhancer = new EnhancementAgent();
      const resultText = await enhancer.enhance(
        `EXPLAIN THE FOLLOWING CODE IN DETAIL:\nFile: ${filename}\n\`\`\`\n${code}\n\`\`\``,
        chatStore.messages,
        {
          model: useAgentStore.getState().selectedModel,
          projectMode: useAgentStore.getState().projectMode,
          techStack: useAgentStore.getState().techStack,
          selectedLanguage: useAgentStore.getState().selectedLanguage,
          temperature: 0.5,
          topP: 1,
        }
      );
      
      chatStore.setMessages((prev: Message[]) => [
        ...prev,
        { role: "assistant", text: resultText, timestamp: Date.now() }
      ]);
    } catch (e: any) {
      toast.error("Explanation failed");
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }

  public async optimizeCode(filename: string, code: string) {
    const chatStore = useChatStore.getState();
    const projectStore = useProjectStore.getState();
    
    chatStore.setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", text: `Optimize this code in ${filename}:\n\`\`\`\n${code}\n\`\`\``, timestamp: Date.now() }
    ]);
    
    projectStore.setBuildPhase("building");
    projectStore.setSubStatus("Optimizing code...");
    
    try {
      const enhancer = new EnhancementAgent();
      const resultText = await enhancer.enhance(
        `OPTIMIZE THE FOLLOWING CODE. IMPROVE PERFORMANCE, ACCESSIBILITY, STYLING AND READABILITY. RETURN THE FULL MODIFIED CODE:\nFile: ${filename}\n\`\`\`\n${code}\n\`\`\``,
        chatStore.messages,
        {
          model: useAgentStore.getState().selectedModel,
          projectMode: useAgentStore.getState().projectMode,
          techStack: useAgentStore.getState().techStack,
          selectedLanguage: useAgentStore.getState().selectedLanguage,
          temperature: 0.2,
          topP: 1,
        }
      );
      
      const parsed = extractCodeFromText(resultText);
      if (parsed.website) {
        const wc = WebContainerService.getInstance().getWebContainer();
        if (wc) {
          for (const [path, contents] of Object.entries(parsed.website.files)) {
            await wc.fs.writeFile(path, contents as string);
          }
        }
        this.updateProjectStore(resultText);
        toast.success("Code optimization applied!");
      }
      
      chatStore.setMessages((prev: Message[]) => [
        ...prev,
        { role: "assistant", text: parsed.cleanText || "Optimization applied successfully!", timestamp: Date.now() }
      ]);
    } catch (e: any) {
      toast.error("Optimization failed");
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }

  public async refactorSelection(filename: string, code: string, instruction: string) {
    const chatStore = useChatStore.getState();
    const projectStore = useProjectStore.getState();
    
    chatStore.setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", text: `Refactor code in ${filename} based on: ${instruction}`, timestamp: Date.now() }
    ]);
    
    projectStore.setBuildPhase("building");
    projectStore.setSubStatus("Refactoring code block...");
    
    try {
      const refactor = new RefactorAgent();
      const resultText = await refactor.migrate(
        `REFACTOR INSTRUCTION: ${instruction}\nTarget Code:\n\`\`\`\n${code}\n\`\`\``,
        { [filename]: code },
        chatStore.messages,
        {
          model: useAgentStore.getState().selectedModel,
          projectMode: useAgentStore.getState().projectMode,
          techStack: useAgentStore.getState().techStack,
          selectedLanguage: useAgentStore.getState().selectedLanguage,
          temperature: 0.3,
          topP: 1,
        }
      );
      
      const parsed = extractCodeFromText(resultText);
      if (parsed.website) {
        const wc = WebContainerService.getInstance().getWebContainer();
        if (wc) {
          for (const [path, contents] of Object.entries(parsed.website.files)) {
            await wc.fs.writeFile(path, contents as string);
          }
        }
        this.updateProjectStore(resultText);
        toast.success("Refactoring complete!");
      }
      
      chatStore.setMessages((prev: Message[]) => [
        ...prev,
        { role: "assistant", text: parsed.cleanText || "Refactored successfully!", timestamp: Date.now() }
      ]);
    } catch (e: any) {
      toast.error("Refactoring failed");
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }
}
