import { useProjectStore, BuildTask } from "../stores/projectStore";
import { useChatStore } from "../stores/chatStore";
import { useAgentStore } from "../stores/agentStore";
import { useGenerationWorkflowStore } from "../stores/generationWorkflowStore";
import { ProjectAnalysisService } from "../services/projectAnalysisService";
import { DesignGenerationService } from "../services/designGenerationService";
import { DesignLockService } from "../services/designLockService";
import { SelectedDesignSnapshot } from "../types/designConcept";
import { ImplementationPlanService, ImplementationPlan } from "../services/implementationPlanService";
import { ValidationService } from "../services/validationService";
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
import { AgentEventBus } from "../utils/agentEventBus";
import { auth } from "../services/firebase";
import { saveCurrentProject } from "../services/saveService";
import { SAAS_TEMPLATES } from "../utils/saasTemplates";

export class Orchestrator {
  private static instance: Orchestrator;

  public static getInstance(): Orchestrator {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  private constructor() {
    this.setupWorkflowListener();
  }

  private setupWorkflowListener() {
    let lastPhase = useGenerationWorkflowStore.getState().currentPhase;
    useGenerationWorkflowStore.subscribe((state) => {
      const newPhase = state.currentPhase;
      if (newPhase !== lastPhase) {
        lastPhase = newPhase;
        if (newPhase === "GENERATING_IMPLEMENTATION_PLAN") {
          this.handleImplementationPlanning();
        } else if (newPhase === "IMPLEMENTING") {
          this.handleCodeGeneration();
        }
      }
    });
  }

  private async handleImplementationPlanning() {
    const workflowStore = useGenerationWorkflowStore.getState();
    const chatStore = useChatStore.getState();
    const projectStore = useProjectStore.getState();
    const agentStore = useAgentStore.getState();

    try {
      chatStore.setState(CompanionState.THINKING);
      projectStore.setSubStatus("Generating implementation plan...");

      const normalizedRequest = workflowStore.normalizedPrompt || workflowStore.userPrompt;
      const projectMode = workflowStore.projectMode;
      const snapshot = workflowStore.selectedDesignSnapshot;
      const analysis = workflowStore.analysisResult;
      const requiredFeatures = analysis ? analysis.requiredFeatures : [];

      if (!snapshot || !analysis) {
        throw new Error("Selected design snapshot or requirements analysis is missing.");
      }

      const plan = await ImplementationPlanService.getInstance().generateImplementationPlan(
        normalizedRequest,
        projectMode,
        snapshot,
        analysis,
        requiredFeatures,
        3
      );

      const bulletList = (arr: string[]) => arr.map(item => `  - ${item}`).join("\n");
      const planMarkdown = `# Implementation Plan: ${snapshot.designName}

## Project Summary
${plan.projectSummary}

## Selected Design Summary
${plan.selectedDesignSummary}

## Technology Stack
${bulletList(plan.technologyStack)}

## Architecture
${plan.architecture}

## Pages & Structure
${bulletList(plan.pages)}

## Components
${bulletList(plan.components)}

## Key Features
${bulletList(plan.features)}

## Data Flow
${plan.dataFlow}

## API Requirements
${bulletList(plan.apiRequirements)}

## Security Requirements
${bulletList(plan.securityRequirements)}

## Implementation Steps
${bulletList(plan.implementationSteps)}

## Validation Steps
${bulletList(plan.validationSteps)}

## Deployment Requirements
${bulletList(plan.deploymentRequirements)}`;

      workflowStore.setImplementationPlan(planMarkdown);
      workflowStore.setEditedImplementationPlan(planMarkdown);
      workflowStore.setParsedImplementationPlan(plan);

      // Move workflow to AWAITING_PLAN_APPROVAL
      workflowStore.transitionTo("AWAITING_PLAN_APPROVAL");
      projectStore.setSubStatus("Awaiting plan approval...");

      chatStore.setState(CompanionState.IDLE);
      projectStore.setBuildPhase("completed");
      AgentEventBus.getInstance().setGenerating(false);

      // Post plan to chat messages timeline
      chatStore.setMessages((prev: any[]) => [
        ...prev,
        {
          id: `plan_${Date.now()}`,
          role: "assistant",
          text: `📋 **Implementation Plan Ready**

I have prepared the technical implementation plan for your project. Please review the proposed architecture, components, and pages.

${planMarkdown}`,
          timestamp: Date.now(),
          model: agentStore.selectedModel
        }
      ]);

      toast.success("Implementation plan generated! 📋");

    } catch (err: any) {
      console.error("[Orchestrator] Planning failed:", err);
      toast.error(`Planning failed: ${err.message}`);
      workflowStore.transitionTo("ERROR");
      workflowStore.setError(err.message);
      chatStore.setState(CompanionState.IDLE);
      BackgroundPreserver.deactivate();
      AgentEventBus.getInstance().setGenerating(false);
    }
  }

  private async handleCodeGeneration() {
    const workflowStore = useGenerationWorkflowStore.getState();
    const chatStore = useChatStore.getState();
    const projectStore = useProjectStore.getState();
    const agentStore = useAgentStore.getState();

    // 1. Receive/retrieve snapshots before invoking agents
    const projectMode = workflowStore.projectMode;
    const analysis = workflowStore.analysisResult;
    const snapshot = workflowStore.selectedDesignSnapshot;
    const plan = (workflowStore.implementationPlanSnapshot || workflowStore.parsedImplementationPlan) as ImplementationPlan;

    if (!analysis || !snapshot || !plan) {
      toast.error("Code generation context is missing.");
      workflowStore.transitionTo("ERROR");
      return;
    }

    try {
      chatStore.setState(CompanionState.THINKING);
      projectStore.setBuildPhase("generating");
      AgentEventBus.getInstance().setGenerating(true);
      
      // Clear previous files or set building state
      projectStore.setBuildingFiles({});

      // 2. Prepare generation context containing strict guidelines
      const generationContext = `
=========================================
GENERATION CONTEXT (STRICT CONSTRAINTS)
=========================================
1. PROJECT MODE: ${projectMode.toUpperCase()}
2. USER REQUIREMENTS:
   - Request Goal: ${analysis.projectGoal}
   - Required Features: ${plan.features.join(", ")}
3. SELECTED DESIGN (Locked visual direction):
   - Name: ${snapshot.designName}
   - Layout Structure: ${snapshot.layoutStructure}
   - Color Palette: ${JSON.stringify(snapshot.colorSystem)}
   - Typography: ${JSON.stringify(snapshot.typography)}
   - Component Style: ${snapshot.componentStyle}
   - Animation Style: ${snapshot.animationStyle}
4. APPROVED IMPLEMENTATION PLAN:
   - Summary: ${plan.projectSummary}
   - Architecture: ${plan.architecture}
   - Pages: ${plan.pages.join(", ")}
   - Components: ${plan.components.join(", ")}
5. TECH STACK: ${plan.technologyStack.join(", ")}
6. SECURITY REQUIREMENTS: ${plan.securityRequirements.join(", ")}

STRICT DESIGN LOCK RULE: The generated application must visually match the selected design. Do not allow the creation of a new design. Interpret and implement ONLY the locked design.
=========================================
`;

      // 3. Batch Generation setup
      const batches = projectMode === "frontend" 
        ? [
            {
              name: "Batch 1: HTML Structure & Styles",
              files: ["index.html", "style.css"],
              prompt: `Generate the complete structure in 'index.html' and styling in 'style.css' for the project. 
The files must match the locked visual design snapshot (colors, layout, styles).`
            },
            {
              name: "Batch 2: Interactivity Script",
              files: ["script.js"],
              prompt: `Generate the complete interactive logic in 'script.js' to power the HTML pages.
Implement all features listed in the approved plan.`
            }
          ]
        : [
            {
              name: "Batch 1: Backend APIs & Server Setup",
              files: ["server.js", "package.json"],
              prompt: `Set up the server.js mock database, Express routes, and Node.js dependencies in package.json.
Include endpoints for: ${plan.apiRequirements.join(", ")}.`
            },
            {
              name: "Batch 2: Reusable UI Components",
              files: plan.components.map((c: string) => `src/components/${c.split(" ")[0]}.tsx`),
              prompt: `Generate the React Tailwind components under src/components/: ${plan.components.join(", ")}.
Ensure they implement the component styles: ${snapshot.componentStyle}.`
            },
            {
              name: "Batch 3: Pages, Router & Core App",
              files: [...plan.pages.map((p: string) => `src/pages/${p.split(" ")[0]}.tsx`), "src/App.tsx", "src/main.tsx"],
              prompt: `Generate the React pages: ${plan.pages.join(", ")} under src/pages/, along with src/App.tsx routing/layout and src/main.tsx.
Ensure page structure follows the design lock.`
            }
          ];

      let generatedFiles: Record<string, string> = { ...(projectStore.currentContent?.files || {}) };

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        projectStore.setSubStatus(`Generating ${batch.name}...`);
        
        let success = false;
        let retries = 0;
        const maxBatchRetries = 2;

        while (!success && retries <= maxBatchRetries) {
          try {
            console.log(`[Orchestrator] Generating ${batch.name} (Attempt ${retries + 1}/${maxBatchRetries + 1})`);
            
            const frontendAgent = new FrontendAgent();
            
            const promptForAgent = `${generationContext}

TASK:
You are implementing ${batch.name}.
${batch.prompt}

FILES TO GENERATE:
${batch.files.map(f => `- ${f}`).join("\n")}

Respond ONLY with code blocks in the standard format:
---FILE: filename.ext---
[code content]
---END FILE---
`;

            const agentResponse = await frontendAgent.generateUI(
              promptForAgent,
              [],
              {
                model: agentStore.selectedModel,
                projectMode: projectMode,
                techStack: plan.technologyStack.join(", "),
                selectedLanguage: projectMode === "frontend" ? "JavaScript" : "TypeScript",
                temperature: 0.2,
              }
            );

            const extracted = extractCodeFromText(agentResponse);
            if (!extracted.website || Object.keys(extracted.website.files).length === 0) {
              throw new Error("No files were generated in agent response.");
            }

            // Store successfully generated files immediately
            Object.entries(extracted.website.files).forEach(([fpath, contents]) => {
              generatedFiles[fpath] = contents as string;
              
              projectStore.setBuildingFiles(prev => ({
                ...prev,
                [fpath]: { status: "done", charCount: (contents as string).length }
              }));
            });

            projectStore.setCurrentContent({
              files: { ...generatedFiles },
              patches: {},
              mainFile: projectMode === "frontend" ? "index.html" : "src/main.tsx",
              template: projectMode === "frontend" ? "web" : "react"
            });

            success = true;
          } catch (err: any) {
            console.warn(`[Orchestrator] ${batch.name} attempt ${retries + 1} failed:`, err);
            retries++;
            if (retries > maxBatchRetries) {
              throw new Error(`Failed to generate ${batch.name} after ${maxBatchRetries + 1} attempts.`);
            }
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      // 4. Animation Batch (constrained to selected animations)
      projectStore.setSubStatus("Applying visual animations...");
      const animationAgent = new AnimationAgent();
      const animatedCodeResponse = await animationAgent.animate(
        `Apply design locked animation style '${snapshot.animationStyle}' to the UI. Do not change animation direction.`,
        [],
        { model: agentStore.selectedModel }
      );
      const animExtracted = extractCodeFromText(animatedCodeResponse);
      if (animExtracted.website) {
        Object.entries(animExtracted.website.files).forEach(([fpath, contents]) => {
          generatedFiles[fpath] = contents as string;
        });
        projectStore.setCurrentContent({
          files: { ...generatedFiles },
          patches: {},
          mainFile: projectMode === "frontend" ? "index.html" : "src/main.tsx",
          template: projectMode === "frontend" ? "web" : "react"
        });
      }

      // 5. QA Batch
      projectStore.setSubStatus("Creating automated tests...");
      const qaAgent = new QAAgent();
      const testCodeResponse = await qaAgent.runTests(
        "Generate vitest unit tests.",
        generatedFiles[projectMode === "frontend" ? "script.js" : "src/App.tsx"] || "",
        { model: agentStore.selectedModel }
      );
      const qaExtracted = extractCodeFromText(testCodeResponse);
      if (qaExtracted.website) {
        Object.entries(qaExtracted.website.files).forEach(([fpath, contents]) => {
          generatedFiles[fpath] = contents as string;
        });
        projectStore.setCurrentContent({
          files: { ...generatedFiles },
          patches: {},
          mainFile: projectMode === "frontend" ? "index.html" : "src/main.tsx",
          template: projectMode === "frontend" ? "web" : "react"
        });
      }

      // 6. Transition to VALIDATING and boot runtime
      workflowStore.transitionTo("VALIDATING");
      projectStore.setSubStatus("Running post-generation validation pipeline...");

      const validationResult = ValidationService.getInstance().validate(
        generatedFiles,
        projectMode,
        snapshot,
        plan
      );

      let currentFiles = { ...generatedFiles };
      if (!validationResult.isValid) {
        let attempts = 0;
        const maxAttempts = 3;
        let checkResult = validationResult;

        while (!checkResult.isValid && attempts < maxAttempts) {
          attempts++;
          projectStore.setSubStatus(`Running targeted repair attempt ${attempts}/${maxAttempts} for ${checkResult.failure?.errorType}...`);
          console.log(`[Orchestrator] Validation failed: ${checkResult.failure?.errorMessage}. Attempting targeted repair ${attempts}/${maxAttempts}`);
          
          toast.error(`Validation failed: ${checkResult.failure?.errorType}. Repairing... 🛠️`);

          const archAgent = new ArchitectureAgent();
          const repairResponse = await archAgent.repair(
            checkResult.failure,
            { model: agentStore.selectedModel }
          );

          const repairExtracted = extractCodeFromText(repairResponse);
          if (repairExtracted.website && Object.keys(repairExtracted.website.files).length > 0) {
            Object.entries(repairExtracted.website.files).forEach(([fpath, contents]) => {
              currentFiles[fpath] = contents as string;
            });

            projectStore.setCurrentContent({
              files: { ...currentFiles },
              patches: {},
              mainFile: projectMode === "frontend" ? "index.html" : "src/main.tsx",
              template: projectMode === "frontend" ? "web" : "react"
            });

            // Determine appropriate validation stage to rerun first
            const failedStage = checkResult.failure?.errorType === "Project Mode Violation" ? "Project Mode Validation"
              : checkResult.failure?.errorType === "Project Entrypoint Missing" ? "Project Mode Validation"
              : checkResult.failure?.errorType === "Configuration File Missing" ? "Project Mode Validation"
              : checkResult.failure?.errorType === "Design Non-Compliance" ? "Selected Design Compliance"
              : checkResult.failure?.errorType === "Implementation Plan Mismatch" ? "Implementation Plan Compliance"
              : checkResult.failure?.errorType === "Syntax / Compile Error" ? "TypeScript / Syntax Validation"
              : checkResult.failure?.errorType === "Missing Dependency" ? "Dependency Validation"
              : checkResult.failure?.errorType === "Malformed Configuration" ? "Dependency Validation"
              : checkResult.failure?.errorType === "Security Violation" ? "Security Validation"
              : checkResult.failure?.errorType === "Build Failure" ? "Build Validation"
              : "Runtime Validation";

            const stageResult = ValidationService.getInstance().rerunStage(
              failedStage,
              currentFiles,
              projectMode,
              snapshot,
              plan
            );

            if (stageResult.isValid) {
              console.log(`[Orchestrator] Targeted check passed for ${failedStage}. Running full validation...`);
              checkResult = ValidationService.getInstance().validate(
                currentFiles,
                projectMode,
                snapshot,
                plan
              );
            } else {
              checkResult = {
                isValid: false,
                failure: stageResult.failure,
                passedStages: []
              };
            }
          } else {
            console.warn("[Orchestrator] Repair agent returned no files.");
            break;
          }
        }

        if (!checkResult.isValid) {
          throw new Error(`Self-healing failed to resolve validation errors after ${maxAttempts} attempts: ${checkResult.failure?.errorMessage}`);
        }
      }

      generatedFiles = currentFiles;
      projectStore.setSubStatus("Validating build and booting runtime...");

      await this.bootRuntime();

      workflowStore.transitionTo("RUNNING");
      workflowStore.transitionTo("COMPLETED");
      projectStore.setBuildPhase("completed");
      chatStore.setState(CompanionState.IDLE);
      AgentEventBus.getInstance().setGenerating(false);

      chatStore.setMessages((prev: any[]) => [
        ...prev,
        {
          id: `done_gen_${Date.now()}`,
          role: "assistant",
          text: `🎉 **Application Created Successfully!**\n\nThe code matches the locked design **${snapshot.designName}** and the approved implementation plan. Switch to the **Preview** tab to interact with it live!`,
          timestamp: Date.now(),
          model: agentStore.selectedModel
        }
      ]);

      toast.success("Application generated successfully! 🚀");
      
    } catch (err: any) {
      console.error("[Orchestrator] Code generation failed:", err);
      toast.error(`Code generation failed: ${err.message}`);
      workflowStore.transitionTo("ERROR");
      workflowStore.setError(err.message);
      chatStore.setState(CompanionState.IDLE);
      BackgroundPreserver.deactivate();
      AgentEventBus.getInstance().setGenerating(false);
    }
  }

  private activeEventSource: EventSource | null = null;
  private activeJobId: string | null = null;
  private activeChatId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 12;
  private visibilityListenerAttached = false;
  private autoFixAttempts = 0;
  private maxAutoFixAttempts = 3;
  private snapshots: Array<{
    id: string;
    timestamp: number;
    content: WebsiteContent;
    label: string;
  }> = [];

  async executeFullFlow(prompt: string) {
    const chatStore = useChatStore.getState();
    const agentStore = useAgentStore.getState();
    const workflowStore = useGenerationWorkflowStore.getState();
    const projectStore = useProjectStore.getState();

    // Close any previous event source
    if (this.activeEventSource) {
      this.activeEventSource.close();
      this.activeEventSource = null;
    }

    try {
      // Step 1: Read selected projectMode.
      const projectMode = agentStore.projectMode;

      // Reset workflow state and start at ANALYZING
      workflowStore.resetWorkflow();
      workflowStore.setUserPrompt(prompt);
      workflowStore.setProjectMode(projectMode);
      workflowStore.transitionTo("ANALYZING");

      // Set user-visible statuses (Step 4)
      chatStore.setState(CompanionState.THINKING);
      projectStore.setSubStatus("Understanding your idea...");
      BackgroundPreserver.activate();
      AgentEventBus.getInstance().buildStart();

      // Step 2 & 3: Run Project Request Analysis with projectMode rules
      projectStore.setSubStatus("Analyzing project requirements...");

      // Max retries is configurable. Default to 3.
      const maxRetries = 3;
      const analysisResult = await ProjectAnalysisService.getInstance().analyzeProjectRequest(
        prompt,
        projectMode,
        maxRetries
      );

      // Store analysis results in store
      workflowStore.setAnalysisResult(analysisResult);
      workflowStore.setNormalizedPrompt(analysisResult.normalizedRequest);

      // Step 4: Transition to THINKING & Update Status
      workflowStore.transitionTo("THINKING");
      projectStore.setSubStatus("Planning user experience...");
      await new Promise((resolve) => setTimeout(resolve, 800));

      projectStore.setSubStatus("Choosing design direction...");
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Transition to GENERATING_DESIGNS & Update Status
      workflowStore.transitionTo("GENERATING_DESIGNS");
      projectStore.setSubStatus("Preparing two visual concepts...");

      const designs = await DesignGenerationService.getInstance().generateDesigns(
        prompt,
        analysisResult,
        projectMode,
        maxRetries
      );

      // Store both designs inside generationWorkflowStore
      workflowStore.setDesignConcepts(designs);

      // Transition to AWAITING_DESIGN_SELECTION & Update Status
      workflowStore.transitionTo("AWAITING_DESIGN_SELECTION");
      projectStore.setSubStatus("Awaiting design selection...");

      // Finish planning phase
      chatStore.setState(CompanionState.IDLE);
      projectStore.setBuildPhase("completed");
      AgentEventBus.getInstance().setGenerating(false);

      // Format markdown summary
      const bulletList = (arr: string[]) => arr.map(item => `  - ${item}`).join("\n");
      const summaryText = `🧠 **AI Request Analysis Completed**

**Core Goal:** ${analysisResult.projectGoal}
**Project Type:** ${analysisResult.projectType} (Complexity: *${analysisResult.complexity}*)
**Target Audience:** ${analysisResult.targetAudience}

**Required Pages:**
${bulletList(analysisResult.requiredPages)}

**Key Features:**
${bulletList(analysisResult.requiredFeatures)}

**Design Direction:** ${analysisResult.designDirection}

**Technical Requirements:**
${bulletList(analysisResult.technicalRequirements)}
${analysisResult.modeConflicts.length > 0 ? `\n⚠️ **Mode Conflicts Resolved:**\n${bulletList(analysisResult.modeConflicts)}` : ""}

*Design A and Design B have been generated successfully. Compare and select your preferred visual concept in the preview panel.*`;

      chatStore.setMessages((prev: any[]) => [
        ...prev,
        {
          id: `analysis_${Date.now()}`,
          role: "assistant",
          text: summaryText,
          timestamp: Date.now(),
          model: agentStore.selectedModel
        }
      ]);

      toast.success("Analysis and planning complete! 🎉");

    } catch (err: any) {
      console.error("[Orchestrator] Failed during analysis flow:", err);
      toast.error(`Analysis failed: ${err.message}`);
      workflowStore.transitionTo("ERROR");
      workflowStore.setError(err.message);
      chatStore.setState(CompanionState.IDLE);
      BackgroundPreserver.deactivate();
      AgentEventBus.getInstance().setGenerating(false);
    }
  }

  public connectToJobStream(jobId: string, chatId: string, isReconnect = false) {
    const projectStore = useProjectStore.getState();
    const chatStore = useChatStore.getState();
    const teamStore = useTeamStore.getState();
    const bus = AgentEventBus.getInstance();

    this.activeJobId = jobId;
    this.activeChatId = chatId;

    if (this.activeEventSource) {
      this.activeEventSource.close();
      this.activeEventSource = null;
    }

    BackgroundPreserver.activate();
    this.ensureVisibilityListener();

    // Set initial states (skip reset on reconnect to preserve UI progress)
    if (!isReconnect) {
      projectStore.setBuildPhase("analyzing");
      chatStore.setState(CompanionState.THINKING);
      bus.clear();
      bus.setGenerating(true);
      projectStore.setBuildingFiles({});
    } else {
      bus.setGenerating(true);
    }

    // Instantiate dynamic planning message bubble (only on fresh connect)
    if (!isReconnect) {
      chatStore.setMessages((prev: any[]) => {
        const hasPlan = prev.some(m => m.id === `plan_${jobId}`);
        if (hasPlan) return prev;
        return [
          ...prev,
          {
            id: `plan_${jobId}`,
            role: "assistant",
            text: `🧠 **Strategic Planning Phase Initiated**\n\nAI is analyzing your request and planning layout, components, and backend requirements. Code generation will begin shortly...`,
            timestamp: Date.now(),
            model: useAgentStore.getState().selectedModel
          }
        ];
      });
    }

    console.log(`[Orchestrator] Connecting to SSE stream for jobId: ${jobId}`);
    const source = new EventSource(`/api/ai/stream/${jobId}`);
    this.activeEventSource = source;

    source.addEventListener("message", async (event) => {
      try {
        const packet = JSON.parse(event.data);
        console.log(`[Orchestrator] SSE Event:`, packet.type, packet);

        switch (packet.type) {
          case "history": {
            const { job } = packet;
            
            // Sync overall tasks, steps, logs
            if (job.tasks) projectStore.setTasks(job.tasks);
            if (job.reasoningSteps) projectStore.setReasoningSteps(job.reasoningSteps);
            if (job.status) {
              projectStore.setBuildPhase(this.mapStatusToPhase(job.status));
              if (job.status === "completed") {
                chatStore.setState(CompanionState.IDLE);
              }
            }
            if (job.subStatus) projectStore.setSubStatus(job.subStatus);
            
            // Sync strategic plan (PRD)
            if (job.prd) {
              chatStore.setMessages((prev: any[]) => {
                const other = prev.filter(m => m.id !== `plan_${jobId}`);
                return [
                  ...other,
                  {
                    id: `plan_${jobId}`,
                    role: "assistant",
                    text: `🧠 **AI Generation Plan & System Specification**\n\n${job.prd}`,
                    timestamp: Date.now(),
                    model: useAgentStore.getState().selectedModel
                  }
                ];
              });
            }

            // Sync files
            if (job.files && Object.keys(job.files).length > 0) {
              projectStore.setCurrentContent({
                files: job.files,
                patches: {},
                mainFile: job.mainFile || "index.html",
                template: job.template || "web"
              });
              
              // Write files to WebContainer runtime in background
              const wc = WebContainerService.getInstance().getWebContainer();
              if (wc) {
                for (const [path, contents] of Object.entries(job.files)) {
                  try {
                    // Create parent folders if nested path
                    if (path.includes("/")) {
                      const parts = path.split("/");
                      parts.pop();
                      await wc.fs.mkdir(parts.join("/"), { recursive: true });
                    }
                    await wc.fs.writeFile(path, contents as string);
                  } catch (e) {
                    console.error(`Failed to write file ${path} to runtime:`, e);
                  }
                }
              }
            }
            break;
          }
          case "status_update": {
            projectStore.setBuildPhase(this.mapStatusToPhase(packet.status));
            if (packet.status === "completed") {
              chatStore.setState(CompanionState.IDLE);
            }
            if (packet.prd) {
              chatStore.setMessages((prev: any[]) => {
                const other = prev.filter(m => m.id !== `plan_${jobId}`);
                return [
                  ...other,
                  {
                    id: `plan_${jobId}`,
                    role: "assistant",
                    text: `🧠 **AI Generation Plan & System Specification**\n\n${packet.prd}`,
                    timestamp: Date.now(),
                    model: useAgentStore.getState().selectedModel
                  }
                ];
              });
            }
            break;
          }
          case "progress_update": {
            // Optional: Handle progress update in UI
            break;
          }
          case "tasks_update": {
            projectStore.setTasks(packet.tasks);
            break;
          }
          case "reasoning_update": {
            projectStore.addReasoningStep(packet.step);
            bus.thinking(packet.step);
            break;
          }
          case "create_file": {
            const { path } = packet;
            projectStore.setBuildingFiles((prev) => ({
              ...prev,
              [path]: { status: "writing", charCount: 0 },
            }));
            projectStore.setCurrentContent((prev) => {
              const currentFiles = prev ? { ...prev.files } : {};
              if (!(path in currentFiles)) {
                currentFiles[path] = "";
              }
              return {
                files: currentFiles,
                patches: {},
                mainFile: prev?.mainFile || path,
                template: prev?.template || "web"
              };
            });
            projectStore.setSelectedFileName(path);
            bus.fileCreate(path);

            const wc = WebContainerService.getInstance().getWebContainer();
            if (wc) {
              try {
                if (path.includes("/")) {
                  const parts = path.split("/");
                  parts.pop();
                  await wc.fs.mkdir(parts.join("/"), { recursive: true });
                }
                await wc.fs.writeFile(path, "");
              } catch (e) {
                console.error(`Failed to create file ${path} on WebContainer:`, e);
              }
            }
            break;
          }
          case "write_code": {
            const { path, chunk } = packet;
            projectStore.setBuildingFiles((prev) => ({
              ...prev,
              [path]: {
                status: "writing",
                charCount: (prev[path]?.charCount || 0) + chunk.length,
              },
            }));
            projectStore.setCurrentContent((prev) => {
              const currentFiles = prev ? { ...prev.files } : {};
              currentFiles[path] = (currentFiles[path] || "") + chunk;
              return {
                files: currentFiles,
                patches: {},
                mainFile: prev?.mainFile || path,
                template: prev?.template || "web"
              };
            });
            projectStore.setSelectedFileName(path);
            bus.fileWrite(path, chunk);

            const wc = WebContainerService.getInstance().getWebContainer();
            if (wc) {
              try {
                const currentVal = useProjectStore.getState().currentContent?.files[path] || "";
                await wc.fs.writeFile(path, currentVal);
              } catch (e) {
                console.error(`Failed to stream code to WebContainer:`, e);
              }
            }
            break;
          }
          case "update_file": {
            const { path, content } = packet;
            projectStore.setBuildingFiles((prev) => ({
              ...prev,
              [path]: { status: "done", charCount: content.length },
            }));
            projectStore.setCurrentContent((prev) => {
              const currentFiles = prev ? { ...prev.files } : {};
              currentFiles[path] = content;
              return {
                files: currentFiles,
                patches: {},
                mainFile: prev?.mainFile || path,
                template: prev?.template || "web"
              };
            });
            bus.fileDone(path);

            const wc = WebContainerService.getInstance().getWebContainer();
            if (wc) {
              try {
                if (path.includes("/")) {
                  const parts = path.split("/");
                  parts.pop();
                  await wc.fs.mkdir(parts.join("/"), { recursive: true });
                }
                await wc.fs.writeFile(path, content);
              } catch (e) {
                console.error(`Failed to update WebContainer file:`, e);
              }
            }
            break;
          }
          case "files_update": {
            const files = packet.files;
            projectStore.setBuildingFiles((prev) => {
              const next = { ...prev };
              Object.entries(files).forEach(([fpath, contents]) => {
                next[fpath] = { status: "done", charCount: (contents as string).length };
              });
              return next;
            });
            projectStore.setCurrentContent((prev) => {
              const currentFiles = prev ? prev.files : {};
              return {
                files: { ...currentFiles, ...files },
                patches: {},
                mainFile: prev?.mainFile || "index.html",
                template: prev?.template || "web"
              };
            });

            // Write files live to WebContainer
            const wc = WebContainerService.getInstance().getWebContainer();
            if (wc) {
              for (const [path, contents] of Object.entries(files)) {
                try {
                  if (path.includes("/")) {
                    const parts = path.split("/");
                    parts.pop();
                    await wc.fs.mkdir(parts.join("/"), { recursive: true });
                  }
                  await wc.fs.writeFile(path, contents as string);
                } catch (e) {
                  console.error(`Failed to write file ${path} dynamically:`, e);
                }
              }
            }
            break;
          }
          case "log": {
            // Raw thinking output from LLM streaming
            bus.thinking(packet.message);
            break;
          }
          case "done": {
            console.log("[Orchestrator] Generation done received. Booting runtime...");
            this.cleanupActiveJob(chatId);
            
            projectStore.setBuildingFiles((prev) => {
              const next = { ...prev };
              Object.keys(next).forEach((fpath) => {
                next[fpath] = { ...next[fpath], status: "done" };
              });
              return next;
            });
            
            projectStore.setBuildPhase("completed");
            chatStore.setState(CompanionState.IDLE);
            bus.setGenerating(false);
            
            // Add completion message to chat with generated file list
            const doneFiles = Object.keys(projectStore.currentContent?.files || {});
            const doneFileList = doneFiles.length > 0
              ? doneFiles.map(f => `  - \`${f}\``).join("\n")
              : "  No files generated.";
            chatStore.setMessages((prev: any[]) => [
              ...prev,
              {
                id: `done_${jobId}`,
                role: "assistant",
                text: `✅ **Build Complete!** 🎉\n\n**${doneFiles.length} file${doneFiles.length !== 1 ? "s" : ""} generated:**\n${doneFileList}\n\nYour code is ready. Switch to the **Preview** tab to see it live, or the **Code** tab to edit files.`,
                timestamp: Date.now(),
                model: useAgentStore.getState().selectedModel
              }
            ]);
            
            // Perform dependency compilation and boot local preview server
            await this.bootRuntime();
            toast.success("Build and preview ready! 🎉");
            
            // Save project immediately
            try {
              await saveCurrentProject();
            } catch (e) {
              console.error("Failed to save project on completion:", e);
            }

            source.close();
            this.activeEventSource = null;
            break;
          }
          case "done_history": {
            // Job was already complete, let's boot runtime
            console.log("[Orchestrator] Historical job was complete. Booting runtime...");
            this.cleanupActiveJob(chatId);
            projectStore.setBuildingFiles((prev) => {
              const next = { ...prev };
              Object.keys(next).forEach((fpath) => {
                next[fpath] = { ...next[fpath], status: "done" };
              });
              return next;
            });
            projectStore.setBuildPhase("completed");
            chatStore.setState(CompanionState.IDLE);
            bus.setGenerating(false);
            
            // Add completion message to chat with generated file list (only if not already present)
            const histFiles = Object.keys(projectStore.currentContent?.files || {});
            const hasDoneMsg = chatStore.messages?.some?.((m: any) => m.id === `done_${jobId}`);
            if (!hasDoneMsg && histFiles.length > 0) {
              const histFileList = histFiles.map(f => `  - \`${f}\``).join("\n");
              chatStore.setMessages((prev: any[]) => [
                ...prev,
                {
                  id: `done_${jobId}`,
                  role: "assistant",
                  text: `✅ **Build Complete!** 🎉\n\n**${histFiles.length} file${histFiles.length !== 1 ? "s" : ""} generated:**\n${histFileList}\n\nYour code is ready. Switch to the **Preview** tab to see it live, or the **Code** tab to edit files.`,
                  timestamp: Date.now(),
                  model: useAgentStore.getState().selectedModel
                }
              ]);
            }
            
            await this.bootRuntime();
            
            // Save project immediately
            try {
              await saveCurrentProject();
            } catch (e) {
              console.error("Failed to save project on completion:", e);
            }

            source.close();
            this.activeEventSource = null;
            break;
          }
          case "error": {
            toast.error(`Generation error: ${packet.error}`);
            this.cleanupActiveJob(chatId);
            projectStore.setBuildingFiles((prev) => {
              const next = { ...prev };
              Object.keys(next).forEach((fpath) => {
                next[fpath] = { ...next[fpath], status: "done" };
              });
              return next;
            });
            projectStore.setBuildPhase("idle");
            chatStore.setState(CompanionState.IDLE);
            bus.setGenerating(false);
            source.close();
            this.activeEventSource = null;
            break;
          }
        }
      } catch (err) {
        console.error("[Orchestrator] Error handling SSE message:", err);
      }
    });

    source.onopen = () => {
      this.reconnectAttempts = 0;
      console.log(`[Orchestrator] SSE connected for job ${jobId}`);
    };

    source.onerror = (err) => {
      console.warn("[Orchestrator] SSE stream error — reconnecting in background...", err);
      source.close();
      if (this.activeEventSource === source) {
        this.activeEventSource = null;
      }
      this.scheduleReconnect();
    };

    if (document.hidden) {
      this.startJobPolling(jobId);
    }
  }

  private cleanupActiveJob(chatId: string) {
    localStorage.removeItem(`nexo_active_job_${chatId}`);
    this.activeJobId = null;
    this.activeChatId = null;
    this.stopJobPolling();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    BackgroundPreserver.deactivate();
  }

  private scheduleReconnect() {
    if (!this.activeJobId || !this.activeChatId) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("[Orchestrator] Max SSE reconnect attempts reached — using polling fallback");
      this.startJobPolling(this.activeJobId);
      return;
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 12000);
    this.reconnectAttempts++;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.activeJobId && this.activeChatId) {
        this.connectToJobStream(this.activeJobId, this.activeChatId, true);
      }
    }, delay);
  }

  private startJobPolling(jobId: string) {
    if (this.pollTimer) return;
    console.log("[Orchestrator] Starting background job polling (tab may be hidden)");
    this.pollTimer = setInterval(() => {
      this.syncJobFromServer(jobId);
    }, 2500);
  }

  private stopJobPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async syncJobFromServer(jobId: string) {
    try {
      const res = await fetch(`/api/ai/job/${jobId}`);
      if (!res.ok) return;
      const job = await res.json();
      const projectStore = useProjectStore.getState();
      const chatStore = useChatStore.getState();

      if (job.tasks) projectStore.setTasks(job.tasks);
      if (job.reasoningSteps) projectStore.setReasoningSteps(job.reasoningSteps);
      if (job.subStatus) projectStore.setSubStatus(job.subStatus);

      if (job.files && Object.keys(job.files).length > 0) {
        const prevFiles = projectStore.currentContent?.files || {};
        const merged = { ...prevFiles, ...job.files };
        projectStore.setCurrentContent({
          files: merged,
          patches: {},
          mainFile: job.mainFile || projectStore.currentContent?.mainFile || "index.html",
          template: job.template || projectStore.currentContent?.template || "web",
        });

        const writingFile = Object.keys(job.files).find(
          (f) => !prevFiles[f] || prevFiles[f] !== job.files[f]
        );
        if (writingFile) {
          projectStore.setSelectedFileName(writingFile);
        }

        projectStore.setBuildingFiles((prev) => {
          const next = { ...prev };
          Object.entries(job.files).forEach(([fpath, contents]) => {
            next[fpath] = {
              status: job.status === "completed" ? "done" : "writing",
              charCount: (contents as string).length,
            };
          });
          return next;
        });
      }

      if (job.status) {
        projectStore.setBuildPhase(this.mapStatusToPhase(job.status));
      }

      if (job.status === "completed") {
        this.cleanupActiveJob(this.activeChatId || "");
        projectStore.setBuildPhase("completed");
        chatStore.setState(CompanionState.IDLE);
        AgentEventBus.getInstance().setGenerating(false);
        
        // Add completion message to chat with generated file list
        const pollFiles = Object.keys(projectStore.currentContent?.files || {});
        const hasPollDone = chatStore.messages?.some?.((m: any) => m.id === `done_${jobId}`);
        if (!hasPollDone && pollFiles.length > 0) {
          const pollFileList = pollFiles.map(f => `  - \`${f}\``).join("\n");
          chatStore.setMessages((prev: any[]) => [
            ...prev,
            {
              id: `done_${jobId}`,
              role: "assistant",
              text: `✅ **Build Complete!** 🎉\n\n**${pollFiles.length} file${pollFiles.length !== 1 ? "s" : ""} generated:**\n${pollFileList}\n\nYour code is ready. Switch to the **Preview** tab to see it live, or the **Code** tab to edit files.`,
              timestamp: Date.now(),
              model: useAgentStore.getState().selectedModel
            }
          ]);
        }
        
        await this.bootRuntime();
        toast.success("Build complete! 🎉");
        try {
          await saveCurrentProject();
        } catch (e) {
          console.error("Failed to save project on poll completion:", e);
        }
      } else if (job.status === "failed") {
        this.cleanupActiveJob(this.activeChatId || "");
        projectStore.setBuildPhase("idle");
        chatStore.setState(CompanionState.IDLE);
        AgentEventBus.getInstance().setGenerating(false);
        toast.error("Generation failed.");
      }
    } catch (e) {
      console.warn("[Orchestrator] Job poll sync failed:", e);
    }
  }

  private ensureVisibilityListener() {
    if (this.visibilityListenerAttached || typeof document === "undefined") return;
    this.visibilityListenerAttached = true;

    document.addEventListener("visibilitychange", () => {
      if (!this.activeJobId || !this.activeChatId) return;

      if (document.hidden) {
        this.startJobPolling(this.activeJobId);
      } else {
        this.stopJobPolling();
        this.reconnectAttempts = 0;
        this.syncJobFromServer(this.activeJobId);
        if (!this.activeEventSource || this.activeEventSource.readyState === EventSource.CLOSED) {
          this.connectToJobStream(this.activeJobId, this.activeChatId, true);
        }
      }
    });
  }

  private mapStatusToPhase(status: string): "idle" | "analyzing" | "planning" | "designing" | "generating" | "building" | "testing" | "fixing" | "previewing" | "deploying" | "completed" {
    switch (status) {
      case "idle":
        return "idle";
      case "analyzing":
        return "analyzing";
      case "planning":
        return "planning";
      case "designing":
        return "designing";
      case "generating":
        return "generating";
      case "building":
        return "building";
      case "testing":
        return "testing";
      case "fixing":
        return "fixing";
      case "previewing":
        return "previewing";
      case "deploying":
        return "deploying";
      case "completed":
        return "completed";
      case "failed":
      default:
        return "idle";
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

  private seenFilePaths = new Set<string>();

  private handleStream(text: string) {
    const bus = AgentEventBus.getInstance();

    // Parse file markers from the streaming text and emit events
    this.seenFilePaths = bus.parseStreamChunkForFiles(text, this.seenFilePaths);

    const parsed = extractCodeFromText(text);
    if (parsed.website) {
      useProjectStore.getState().setCurrentContent(parsed.website);
    }
  }

  public async bootRuntime() {
    const projectStore = useProjectStore.getState();
    const runtimeStore = useRuntimeStore.getState();
    const wc = WebContainerService.getInstance();
    const devServer = DevServerService.getInstance();
    const bus = AgentEventBus.getInstance();

    try {
      bus.thinking("Booting virtual runtime environment...");
      runtimeStore.setPreviewPhase("preparing");
      projectStore.updateTask("packages", { status: "running" });

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
        
        bus.thinking("Installing dependencies...");
        runtimeStore.setPreviewPhase("installing");
        await devServer.install();

        runtimeStore.setPreviewPhase("building");
        projectStore.updateTask("packages", { status: "done" });
        projectStore.updateTask("building", { status: "running" });

        await this.setupBackend();

        bus.thinking("Starting development server...");
        runtimeStore.setPreviewPhase("starting");
        projectStore.updateTask("building", { status: "done" });
        projectStore.updateTask("preview", { status: "running" });

        await devServer.start();

        runtimeStore.setPreviewPhase("ready");
        projectStore.updateTask("preview", { status: "done" });
        projectStore.updateTask("completed", { status: "done" });
        projectStore.setBuildPhase("completed");

        // Preview URL is determined by the WebContainer iframe — signal ready
        bus.previewReady("http://localhost:3111");
      }
    } catch (e: any) {
      console.error("[Orchestrator] Runtime boot failed:", e);
      bus.thinking(`Runtime boot failed: ${e.message}`);
      runtimeStore.setPreviewPhase("error");
      projectStore.updateTask("packages", { status: "error" });
      projectStore.updateTask("building", { status: "error" });
      projectStore.updateTask("preview", { status: "error" });
      projectStore.setBuildPhase("idle");
    }
  }

  public async manualFix(errorMsg: string) {
    this.autoFixAttempts = 0;
    await this.triggerSelfHealing(errorMsg);
  }

  public async triggerSelfHealing(errorMsg: string) {
    const bus = AgentEventBus.getInstance();

    if (this.autoFixAttempts >= this.maxAutoFixAttempts) {
      bus.buildError("Self-healing limit reached — rolling back to last stable snapshot...");
      toast.error("Self-healing limit reached. Attempting rollback...");
      this.rollbackToLastSnapshot();
      return;
    }

    this.autoFixAttempts++;
    bus.autoFix(this.autoFixAttempts, this.maxAutoFixAttempts, errorMsg);

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
        bus.buildSuccess();
        toast.success("Self-healing patch applied!");
      }
    } catch (e) {
      bus.buildError(`Auto-fix attempt ${this.autoFixAttempts} failed — retrying...`);
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
    if (!projectStore.currentContent) return;

    projectStore.setBuildPhase("building");
    projectStore.setSubStatus("Staging SaaS Infrastructure...");

    try {
      const wc = WebContainerService.getInstance().getWebContainer();
      const files = { ...projectStore.currentContent.files };

      // Helper to write to container
      const writeContainerFile = async (path: string, content: string) => {
        if (wc) {
          const parts = path.split("/");
          if (parts.length > 1) {
            parts.pop();
            await wc.fs.mkdir(parts.join("/"), { recursive: true });
          }
          await wc.fs.writeFile(path, content);
        }
      };

      // 1. Back up original App.tsx if it exists
      if (files["src/App.tsx"] && !files["src/App.original.tsx"]) {
        projectStore.setSubStatus("Backing up current layout to App.original.tsx...");
        files["src/App.original.tsx"] = files["src/App.tsx"];
        await writeContainerFile("src/App.original.tsx", files["src/App.tsx"]);
      }

      // 2. Inject components
      projectStore.setSubStatus("Injecting SaaS Auth component...");
      files["src/components/SaaSOnboarding.tsx"] = SAAS_TEMPLATES.Onboarding;
      await writeContainerFile("src/components/SaaSOnboarding.tsx", SAAS_TEMPLATES.Onboarding);

      files["src/components/SaaSAuth.tsx"] = SAAS_TEMPLATES.Auth;
      await writeContainerFile("src/components/SaaSAuth.tsx", SAAS_TEMPLATES.Auth);

      projectStore.setSubStatus("Injecting Stripe Billing modules...");
      files["src/components/SaaSBilling.tsx"] = SAAS_TEMPLATES.Billing;
      await writeContainerFile("src/components/SaaSBilling.tsx", SAAS_TEMPLATES.Billing);

      projectStore.setSubStatus("Injecting Admin Dashboard widgets...");
      files["src/components/SaaSDashboard.tsx"] = SAAS_TEMPLATES.Dashboard;
      await writeContainerFile("src/components/SaaSDashboard.tsx", SAAS_TEMPLATES.Dashboard);

      files["src/components/SaaSSettings.tsx"] = SAAS_TEMPLATES.Settings;
      await writeContainerFile("src/components/SaaSSettings.tsx", SAAS_TEMPLATES.Settings);

      projectStore.setSubStatus("Finalizing SaaS entry points...");
      files["src/App.tsx"] = SAAS_TEMPLATES.App;
      await writeContainerFile("src/App.tsx", SAAS_TEMPLATES.App);

      // 3. Update the global state store
      projectStore.setCurrentContent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          files
        };
      });

      projectStore.setSelectedFileName("src/App.tsx");
      projectStore.incrementPreviewKey();

      toast.success("SaaS Integration Modules Injected Successfully!");
    } catch (error) {
      console.error("SaaS Transform failed:", error);
      toast.error("Failed to inject SaaS components.");
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

      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(auth.currentUser ? {
            "x-user-id": auth.currentUser.uid,
            "x-user-email": auth.currentUser.email || ""
          } : {})
        },
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
    
    projectStore.setBuildPhase("planning");
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
        { role: "assistant", text: resultText, timestamp: Date.now(), model: useAgentStore.getState().selectedModel }
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
        { role: "assistant", text: parsed.cleanText || "Optimization applied successfully!", timestamp: Date.now(), model: useAgentStore.getState().selectedModel }
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
        { role: "assistant", text: parsed.cleanText || "Refactored successfully!", timestamp: Date.now(), model: useAgentStore.getState().selectedModel }
      ]);
    } catch (e: any) {
      toast.error("Refactoring failed");
    } finally {
      projectStore.setBuildPhase("idle");
    }
  }
}
