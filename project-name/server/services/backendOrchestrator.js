const AIGateway = require('./aiGateway');
const { extractCodeFromText } = require('../utils/parser');
const { jobEvents } = require('./queueManager');
const PromptEnhancer = require('./promptEnhancer');
const ProjectMemory = require('./projectMemory');
const NexoSecurityValidator = require('./nexoValidator');
const NexoOrchestrator = require('./nexoOrchestrator');

// ─────────────────────────────────────────────────
// JSON Actions Streaming Parser and Extractor
// ─────────────────────────────────────────────────
function makeStreamParser(job) {
    const state = {
        index: 0,
        actions: [],
        currentAction: null,
        inContentString: false,
        escapeNext: false,
        contentBuffer: "",
        onActionStart: (action) => {
            if (action.type === 'create' || action.type === 'edit') {
                jobEvents.emit(job.id, { type: 'create_file', path: action.path });
            }
        },
        onActionChunk: (chunk) => {
            if (state.currentAction && (state.currentAction.type === 'create' || state.currentAction.type === 'edit')) {
                jobEvents.emit(job.id, {
                    type: 'write_code',
                    path: state.currentAction.path,
                    chunk: chunk
                });
            }
        },
        onActionEnd: (action) => {
            if (action.type === 'create' || action.type === 'edit') {
                jobEvents.emit(job.id, {
                    type: 'update_file',
                    path: action.path,
                    content: action.content
                });
                job.updateFiles({ [action.path]: action.content });
            }
        }
    };

    return (text) => {
        while (state.index < text.length) {
            if (!state.currentAction) {
                const remaining = text.substring(state.index);
                const match = remaining.match(/^\s*\{\s*"type"\s*:\s*"([^"]+)"\s*,\s*"path"\s*:\s*"([^"]+)"/);
                if (match) {
                    state.currentAction = {
                        type: match[1],
                        path: match[2],
                        content: ""
                    };
                    state.index += match[0].length;
                    state.onActionStart(state.currentAction);

                    const nextRemaining = text.substring(state.index);
                    const contentStartMatch = nextRemaining.match(/^\s*,\s*"content"\s*:\s*"/);
                    if (contentStartMatch) {
                        state.inContentString = true;
                        state.escapeNext = false;
                        state.contentBuffer = "";
                        state.index += contentStartMatch[0].length;
                    } else {
                        const closeMatch = nextRemaining.match(/^\s*\}/);
                        if (closeMatch) {
                            state.index += closeMatch[0].length;
                            state.onActionEnd(state.currentAction);
                            state.actions.push(state.currentAction);
                            state.currentAction = null;
                        }
                    }
                } else {
                    state.index++;
                }
            } else if (state.inContentString) {
                const char = text[state.index];
                if (state.escapeNext) {
                    let decodedChar = char;
                    if (char === 'n') decodedChar = '\n';
                    else if (char === 'r') decodedChar = '\r';
                    else if (char === 't') decodedChar = '\t';
                    else if (char === 'b') decodedChar = '\b';
                    else if (char === 'f') decodedChar = '\f';
                    
                    state.contentBuffer += decodedChar;
                    state.onActionChunk(decodedChar);
                    state.escapeNext = false;
                    state.index++;
                } else if (char === '\\') {
                    state.escapeNext = true;
                    state.index++;
                } else if (char === '"') {
                    state.inContentString = false;
                    state.currentAction.content = state.contentBuffer;
                    state.index++;

                    const remaining = text.substring(state.index);
                    const closeMatch = remaining.match(/^\s*\}/);
                    if (closeMatch) {
                        state.index += closeMatch[0].length;
                    }
                    state.onActionEnd(state.currentAction);
                    state.actions.push(state.currentAction);
                    state.currentAction = null;
                } else {
                    state.contentBuffer += char;
                    state.onActionChunk(char);
                    state.index++;
                }
            } else {
                const remaining = text.substring(state.index);
                const closeMatch = remaining.match(/^\s*\}/);
                if (closeMatch) {
                    state.index += closeMatch[0].length;
                    state.onActionEnd(state.currentAction);
                    state.actions.push(state.currentAction);
                    state.currentAction = null;
                } else {
                    state.index++;
                }
            }
        }
        return state.actions;
    };
}

function extractFilesFromJsonActions(text) {
    try {
        const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        const files = {};
        let mainFile = 'index.html';
        
        if (parsed.actions && Array.isArray(parsed.actions)) {
            parsed.actions.forEach(act => {
                if (act.type === 'create' || act.type === 'edit') {
                    files[act.path] = act.content;
                }
            });
        }
        if (parsed.preview_entry) {
            mainFile = parsed.preview_entry;
        }
        
        return { files, mainFile, explanation: parsed.explanation || "" };
    } catch (e) {
        console.error("JSON parse failed at the end of stream. Falling back to regex action extractor.", e);
        const files = {};
        const actionRegex = /\{\s*"type"\s*:\s*"(create|edit)"\s*,\s*"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        let match;
        while ((match = actionRegex.exec(text)) !== null) {
            const path = match[2];
            let content = match[3];
            try {
                content = JSON.parse(`"${content}"`);
            } catch(unescapeErr) {}
            files[path] = content;
        }
        return { files, mainFile: 'index.html', explanation: "" };
    }
}

// ─────────────────────────────────────────────────
// Smart Model Router — picks best model per task
// ─────────────────────────────────────────────────
function routeModel(taskType, requestedModel) {
    const FAST_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'groq/llama-3.3-70b-versatile'];
    const DEEP_MODELS = ['gemini-2.5-pro', 'qwen/qwen3-coder-480b-a35b-instruct', 'stepfun-ai/step-3.5-flash'];

    switch (taskType) {
        case 'planning':
            // Always use a fast model for planning — speed matters here
            return FAST_MODELS.includes(requestedModel) ? requestedModel : 'gemini-2.5-flash';

        case 'ui_generation':
            // Use user's selected model for deep UI generation
            return requestedModel || 'gemini-2.5-flash';

        case 'debug':
        case 'fix':
            // Fastest available for quick fixes
            return 'gemini-2.5-flash';

        case 'refactor':
            // Deep model for careful refactoring
            return DEEP_MODELS.includes(requestedModel) ? requestedModel : 'gemini-2.5-pro';

        case 'vision':
            // Vision-capable model for design-to-code
            return 'gemini-2.5-flash'; // Gemini supports vision

        default:
            return requestedModel || 'gemini-2.5-flash';
    }
}

// ─────────────────────────────────────────────────
// Detect if this is a refactor request vs new build
// ─────────────────────────────────────────────────
function isRefactorRequest(prompt) {
    const refactorKeywords = [
        /\b(refactor|rewrite|modernize|optimize|improve|clean up)\b/i,
        /\bconvert (to|from)\b/i,
        /\bmake (it|the|this|ui|design|code|style)\b.*(modern|better|cleaner|faster|responsive|dark|light)/i,
        /\b(fix|debug|resolve|solve)\b/i,
        /\badd (a|an|the)?\s+\w+\s+(to|into|in)\b/i,
        /\bremove|delete\b/i,
        /\bchange (the|a|an)?\b/i,
        /\bupdate\b/i,
        /\bjs to ts|javascript to typescript\b/i,
    ];
    return refactorKeywords.some(r => r.test(prompt));
}

class BackendOrchestrator {
    static async runWorkflow(job) {
        const { prompt, messages = [], options = {}, existingFiles = {} } = job.data;
        const chatId = job.data.chatId || `job_${job.id}`;
        const userId = job.data.userId || "anonymous";
        const isRefactor = options.isRefactor || isRefactorRequest(prompt);
        const hasImage = options.hasImage || false;

        // ───────────────────────────────────────────
        // INIT: Load project memory
        // ───────────────────────────────────────────
        const memory = ProjectMemory.load(chatId);
        const memoryContext = ProjectMemory.getContextString(chatId);
        
        job.updateStatus('planning');
        job.updateProgress(5);
        job.log('Initializing Nexo V2 Dual Engine...');

        // Notify if memory loaded
        if (memory.buildHistory?.length > 0) {
            job.addReasoningStep(`🧠 Memory loaded: ${memory.buildHistory.length} previous build(s) found for this project.`);
        }

        // Aligned with Multi-Agent Pipeline
        const tasks = [
            { id: "planner", label: "Planner Agent (Strategy & Architecture)", status: "pending" },
            { id: "ui_code", label: "UI & Code Agent (Generation & Implementation)", status: "pending" },
            { id: "build_fix", label: "Build & Fixer Agent (Auto-Healing Checks)", status: "pending" },
            { id: "preview", label: "Preview Agent (Sandbox Deployment)", status: "pending" }
        ];
        job.updateTasks(tasks);

        try {
            // ==========================================
            // 0. PROMPT ENHANCEMENT (Pre-Planning)
            // ==========================================
            let finalPrompt = prompt;
            let wasEnhanced = false;

            if (!isRefactor && !hasImage) {
                job.addReasoningStep('✨ Prompt Enhancement Engine: Analyzing and enriching your request...');
                
                const enhancement = await PromptEnhancer.enhance(
                    prompt,
                    options.projectMode || 'frontend',
                    options.techStack || 'React',
                    options.customApiKey
                );

                finalPrompt = enhancement.enhanced;
                wasEnhanced = enhancement.wasEnhanced;

                if (wasEnhanced) {
                    job.addReasoningStep(`✨ Prompt enhanced: Expanded from ${prompt.length} to ${finalPrompt.length} characters for better results.`);
                    // Notify UI about enhancement
                    jobEvents.emit(job.id, {
                        type: 'prompt_enhanced',
                        original: prompt,
                        enhanced: finalPrompt
                    });
                }
            }

            // ==========================================
            // 1. FAST PLANNER AGENT (FAST THINKER - Phase 1)
            // ==========================================
            job.addReasoningStep('🧠 Strategic planning: Analyzing requirements and generating UI architecture...');
            tasks[0].status = 'running';
            job.updateTasks(tasks);
            job.updateProgress(10);

            // Smart Model Router for planning
            const plannerModel = routeModel('planning', options.model);

            // Build context-aware plan prompt
            let fastPlanPrompt;
            
            if (isRefactor && Object.keys(existingFiles).length > 0) {
                // Refactor mode: analyze existing code
                const existingFileList = Object.keys(existingFiles).join(', ');
                fastPlanPrompt = `You are a fast AI refactor architect.
User wants to: "${finalPrompt}"
Existing files in project: ${existingFileList}
${memoryContext}

You must respond with a JSON object. Return ONLY raw JSON, no markdown blocks.
The JSON must contain:
1. "plan": Array of 3-5 refactoring steps (e.g. "Update color scheme in App.tsx", "Modernize Navbar component")
2. "files": Array of ONLY the files that need to be modified (from existing files list above)
3. "isRefactor": true`;
            } else if (hasImage) {
                // Design-to-Code mode
                fastPlanPrompt = `You are a fast AI UI architect specializing in design reconstruction.
User wants to build UI based on a screenshot/image: "${finalPrompt}"
${memoryContext}

Respond with ONLY raw JSON containing:
1. "plan": Array of 3-5 steps for reconstructing the UI (e.g. "Analyze layout structure", "Create Navbar component")
2. "files": Array of files needed (package.json, src/App.tsx, src/components/[detected-components].tsx, src/index.css)
3. "isDesignToCode": true`;
            } else {
                // Standard new build mode
                fastPlanPrompt = `You are a fast AI architect.
Analyze the user request: "${finalPrompt}"
${memoryContext}
You must respond with a JSON object. Return ONLY raw JSON, do not include markdown blocks or any text outside of it.
The JSON must contain two keys:
1. "plan": An array of 3-5 short steps describing the milestones.
2. "files": An array of relative file paths of the files that will be needed to implement the project. Include App.tsx, index.html, components, styling, config files, package.json etc. as appropriate.

Example output:
{
  "plan": ["Setup Tailwind base design", "Build Landing Hero", "Add custom animation hooks"],
  "files": ["package.json", "index.html", "src/App.tsx", "src/components/Hero.tsx", "src/components/Navbar.tsx"]
}`;
            }

            const fastPlanOutput = await AIGateway.streamCompletion({
                messages: [{ role: 'user', content: fastPlanPrompt }],
                model: plannerModel,
                temperature: 0.1,
                top_p: 1.0,
                projectMode: options.projectMode,
                techStack: options.techStack,
                systemPrompt: options.systemPrompt,
                enabledTools: options.enabledTools,
                customApiKey: options.customApiKey,
                userId,
                maxTokens: 400
            });

            let planData = { plan: [], files: [] };
            try {
                const cleanJson = fastPlanOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
                planData = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse fast plan JSON. Generating fallback plan.", e);
                planData = {
                    plan: ["Strategic layout setup", "Component generation", "QA build check"],
                    files: ["package.json", "index.html", "src/App.tsx"]
                };
            }

            // Instantly update the files in the workspace with empty skeletons
            const initialFiles = {};
            planData.files.forEach(filepath => {
                initialFiles[filepath] = "";
            });
            job.updateFiles(initialFiles);

            // Emit create_file event for each planned file to update UI immediately
            planData.files.forEach(filepath => {
                jobEvents.emit(job.id, { type: 'create_file', path: filepath });
            });

            const planLabel = isRefactor ? '🛠️ Refactor Plan' : wasEnhanced ? '✨ Enhanced Build Plan' : '📋 Build Plan';
            const formattedPrd = `### ${planLabel}\n${planData.plan.map(step => `- ${step}`).join('\n')}\n\n### 📁 ${isRefactor ? 'Files to Modify' : 'Planned File Structure'}\n${planData.files.map(file => `- \`${file}\``).join('\n')}${wasEnhanced ? `\n\n### 💡 Enhanced Prompt\n> ${finalPrompt}` : ''}`;

            job.addReasoningStep('Fast planning completed successfully. Initializing workspace...');
            tasks[0].status = 'done';
            job.updateTasks(tasks);
            job.updateProgress(25);

            // ==========================================
            // 2. UI & CODE AGENT (DEEP THINKER - Phase 2)
            // ==========================================
            job.updateStatus('generating', { prd: formattedPrd });
            job.addReasoningStep('⚡ Deep coding started: Generating component details, styling, and application logic...');
            tasks[1].status = 'running';
            job.updateTasks(tasks);
            job.updateProgress(35);

            // Smart Model Router for code generation
            const codeModel = hasImage 
                ? routeModel('vision', options.model) 
                : isRefactor 
                    ? routeModel('refactor', options.model)
                    : routeModel('ui_generation', options.model);

            let finalFiles = {};
            const isFullstack = options.projectMode === 'fullstack';
            const hasBackendFiles = planData.files.some(f => !f.startsWith('src/') && f !== 'index.html' && f !== 'package.json' && f !== 'vite.config.ts' && f !== 'tsconfig.json');

            if (isFullstack && hasBackendFiles && !isRefactor && !hasImage) {
                job.addReasoningStep('🤝 Multi-Agent Collaboration: Splitting build into Frontend and Backend phases...');
                
                const frontendFiles = planData.files.filter(f => f.startsWith('src/') || f === 'index.html' || f === 'package.json');
                const backendFiles = planData.files.filter(f => !frontendFiles.includes(f));

                job.addReasoningStep(`🎨 Frontend Agent: Starting UI construction for: ${frontendFiles.join(', ')}...`);
                
                const frontendPrompt = `You are a deep coding Frontend Agent.
We have planned the following frontend files to implement the user request "${finalPrompt}":
${frontendFiles.map(f => `- ${f}`).join('\n')}

We require you to output valid JSON for the file actions.
Ensure the frontend is fully responsive and modern.`;

                const frontendMessages = [
                    ...messages,
                    { role: 'user', content: frontendPrompt }
                ];

                let streamedText = "";
                const parseStream = makeStreamParser(job);

                const frontendOutput = await AIGateway.streamCompletion({
                    messages: frontendMessages,
                    model: codeModel,
                    temperature: options.temperature || 0.8,
                    top_p: options.topP || 1.0,
                    projectMode: options.projectMode,
                    techStack: options.techStack,
                    systemPrompt: options.systemPrompt,
                    enabledTools: options.enabledTools,
                    customApiKey: options.customApiKey,
                    userId
                }, (chunk) => {
                    streamedText += chunk;
                    job.log(chunk);
                    parseStream(streamedText);
                });

                const parsedFrontend = extractFilesFromJsonActions(frontendOutput);
                const finalFrontendFiles = parsedFrontend.files;
                if (Object.keys(finalFrontendFiles).length > 0) {
                    job.updateFiles(finalFrontendFiles);
                }

                // Scan Collaboration Bus requests from Frontend
                const backendRequests = [];
                const requestRegex = /BACKEND_REQUEST:\s*([^\n\r"]+)/gi;
                let match;
                while ((match = requestRegex.exec(frontendOutput)) !== null) {
                    backendRequests.push(match[1].trim());
                }

                if (backendRequests.length > 0) {
                    job.addReasoningStep(`🤝 Collaboration Bus: Frontend Agent requested ${backendRequests.length} backend API endpoint(s):\n${backendRequests.map(r => `  - ${r}`).join('\n')}`);
                } else {
                    job.addReasoningStep('🤝 Collaboration Bus: Frontend Agent requested no custom API endpoints. Proceeding with default backend routes.');
                    backendRequests.push("Create standard CRUD database routes and server setup matching the front-end features");
                }

                // Backend Agent Generation
                job.addReasoningStep(`⚙️ Backend Agent: Starting logic & API implementation for: ${backendFiles.join(', ')}...`);

                const backendPrompt = `You are a deep coding Backend Agent.
We need to generate the backend code for the user request "${finalPrompt}".
The planned backend files to implement are:
${backendFiles.map(f => `- ${f}`).join('\n')}

COLLABORATION CONTEXT (REQUESTS FROM FRONTEND AGENT):
${backendRequests.map((req, i) => `REQUEST ${i+1}: ${req}`).join('\n')}

Follow the Nexo Protocol: write complete files enclosed in ---FILE: path--- and ---END FILE--- markers.
Implement these files completely, ensuring they fulfill the requests made by the Frontend Agent.`;

                const backendMessages = [
                    ...messages,
                    { role: 'user', content: backendPrompt }
                ];

                streamedText = "";
                const parseBackendStream = makeStreamParser(job);

                const backendOutput = await AIGateway.streamCompletion({
                    messages: backendMessages,
                    model: codeModel,
                    temperature: options.temperature || 0.8,
                    top_p: options.topP || 1.0,
                    projectMode: options.projectMode,
                    techStack: options.techStack,
                    systemPrompt: options.systemPrompt,
                    enabledTools: options.enabledTools,
                    customApiKey: options.customApiKey,
                    userId
                }, (chunk) => {
                    streamedText += chunk;
                    job.log(chunk);
                    parseBackendStream(streamedText);
                });

                const parsedBackend = extractFilesFromJsonActions(backendOutput);
                const finalBackendFiles = parsedBackend.files;
                if (Object.keys(finalBackendFiles).length > 0) {
                    job.updateFiles(finalBackendFiles);
                }

                finalFiles = { ...finalFrontendFiles, ...finalBackendFiles };
                if (Object.keys(finalFiles).length > 0) {
                    job.updateFiles(finalFiles);
                }

                job.addReasoningStep('Application layers (Frontend & Backend) compiled collaboratively.');
                tasks[1].status = 'done';
                job.updateTasks(tasks);
                job.updateProgress(75);
            } else {
                let implementationPrompt;

                if (isRefactor && Object.keys(existingFiles).length > 0) {
                    // Refactor: provide existing code as context
                    const existingCodeContext = Object.entries(existingFiles)
                        .filter(([f]) => planData.files.includes(f))
                        .slice(0, 8) // Limit to 8 files to avoid token overflow
                        .map(([f, c]) => `---EXISTING FILE: ${f}---\n${c}\n---END EXISTING FILE---`)
                        .join('\n\n');

                    implementationPrompt = `You are a deep AI refactoring engineer.
User wants to: "${prompt}"
${memoryContext}

Here are the existing files to modify:
${existingCodeContext}

${planData.plan.map((step, i) => `${i+1}. ${step}`).join('\n')}

Modify ONLY the necessary files. Keep unchanged sections intact.
Use the Nexo Protocol: write complete modified files enclosed in ---FILE: path--- and ---END FILE--- markers.
Ensure the refactored code is better than the original.`;
                } else if (hasImage) {
                    implementationPrompt = `You are a deep AI UI reconstruction engineer specializing in design-to-code.
User wants to recreate this UI: "${finalPrompt}"
${memoryContext}

Analyze the design screenshot and generate production-ready code.
Files to generate:
${planData.files.map(f => `- ${f}`).join('\n')}

Follow the Nexo Protocol: write complete files enclosed in ---FILE: path--- and ---END FILE--- markers.
Recreate the exact layout, colors, spacing, and components visible in the design.
Use modern React with Tailwind CSS. Make it pixel-perfect.`;
                } else {
                    implementationPrompt = `You are a deep coding AI engineer.
We have planned the following file structure for the user request: "${finalPrompt}".
${memoryContext}
Please generate the complete production-ready source code for these files:
${planData.files.map(f => `- ${f}`).join('\n')}

Follow the Nexo Protocol: write complete files enclosed in ---FILE: path--- and ---END FILE--- markers.
Do not truncate or omit any files. Ensure package.json has all necessary dependencies.`;
                }

                const implementationMessages = [
                    ...messages,
                    { role: 'user', content: implementationPrompt }
                ];

                let streamedText = "";
                const parseImplStream = makeStreamParser(job);

                const implementationOutput = await AIGateway.streamCompletion({
                    messages: implementationMessages,
                    model: codeModel,
                    temperature: options.temperature || 0.8,
                    top_p: options.topP || 1.0,
                    projectMode: options.projectMode,
                    techStack: options.techStack,
                    systemPrompt: options.systemPrompt,
                    enabledTools: options.enabledTools,
                    customApiKey: options.customApiKey,
                    userId
                }, (chunk) => {
                    streamedText += chunk;
                    job.log(chunk);
                    parseImplStream(streamedText);
                });

                // Final parse sanity check
                const finalParsed = extractFilesFromJsonActions(streamedText);
                finalFiles = finalParsed.files;
                if (Object.keys(finalFiles).length > 0) {
                    job.updateFiles(finalFiles);
                }

                job.addReasoningStep('Application layer generated successfully.');
                tasks[1].status = 'done';
                job.updateTasks(tasks);
                job.updateProgress(75);
            }

            // ==========================================
            // 3. BUILD & FIXER AGENT (VERIFICATION PHASE)
            // ==========================================
            job.updateStatus('fixing');
            job.addReasoningStep('🔧 Running security compliance audits with Nexo Security Validator...');
            tasks[2].status = 'running';
            job.updateTasks(tasks);
            job.updateProgress(80);

            let currentFiles = { ...existingFiles, ...finalFiles };
            let validationResult = await NexoSecurityValidator.validate(
                options.projectMode || 'frontend',
                currentFiles,
                null,
                options.customApiKey
            );

            const validationAttemptHistory = [];
            
            while (validationResult.deployment_decision === 'blocked') {
                const criticalHighFindings = validationResult.findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
                const findingsSummary = criticalHighFindings.map(f => `${f.category} in ${f.file}: ${f.issue}`).join('; ');
                
                job.addReasoningStep(`⚠️ Security Validation Blocked: Detected ${criticalHighFindings.length} critical/high vulnerability(ies).`);
                
                validationAttemptHistory.push({
                    attempt: validationAttemptHistory.length + 1,
                    failure_type: 'CONTENT_FAILURE',
                    error_message: findingsSummary
                });

                const decision = NexoOrchestrator.decide(
                    options.model || 'gemini-2.5-flash',
                    options.projectMode || 'frontend',
                    'validation',
                    validationAttemptHistory,
                    { findings: validationResult.findings }
                );

                if (decision.decision === 'retry') {
                    job.addReasoningStep(`🔧 Auto-healing: Nexo Security Validator is attempting to fix the security issues. (Attempt ${validationAttemptHistory.length})`);
                    
                    const remediationPrompt = `You are a deep AI security remediation engineer.
The project codebase has failed security validation. You MUST fix the identified security vulnerabilities.

Codebase files:
${Object.entries(currentFiles).map(([path, content]) => `---FILE: ${path}---\n${content}\n---END FILE---`).join('\n\n')}

Vulnerability findings to fix:
${criticalHighFindings.map((f, i) => `
Finding #${i+1}:
- Severity: ${f.severity}
- Category: ${f.category}
- File: ${f.file}
- Context: ${f.line_context}
- Issue: ${f.issue}
- Fix Recommendation: ${f.fix_recommendation}
`).join('\n')}

Please output the corrected files using the Nexo Protocol: write complete files enclosed in ---FILE: path--- and ---END FILE--- markers.
Only output the files that need changes to address these security issues. Keep all other parts of the application intact.`;

                    let streamedText = "";
                    const parseFixStream = makeStreamParser(job);
                    const codeModel = routeModel('fix', options.model);

                    const fixOutput = await AIGateway.streamCompletion({
                        messages: [{ role: 'user', content: remediationPrompt }],
                        model: codeModel,
                        temperature: 0.2,
                        top_p: 1.0,
                        projectMode: options.projectMode,
                        systemPrompt: "You are a professional AI security patching expert. Output code using Nexo Protocol ---FILE: path---",
                        customApiKey: options.customApiKey,
                        userId
                    }, (chunk) => {
                        streamedText += chunk;
                        job.log(chunk);
                        parseFixStream(streamedText);
                    });

                    const parsedFix = extractFilesFromJsonActions(streamedText);
                    if (Object.keys(parsedFix.files).length > 0) {
                        finalFiles = { ...finalFiles, ...parsedFix.files };
                        currentFiles = { ...currentFiles, ...parsedFix.files };
                        job.updateFiles(parsedFix.files);
                    }

                    // Re-validate after fixing
                    validationResult = await NexoSecurityValidator.validate(
                        options.projectMode || 'frontend',
                        currentFiles,
                        null,
                        options.customApiKey
                    );
                } else {
                    // Escalation case
                    job.addReasoningStep(`❌ Security Auto-Healing failed: ${decision.escalation_message}`);
                    tasks[2].status = 'error';
                    job.updateTasks(tasks);
                    throw new Error(decision.escalation_message || 'Security validation blocked deployment');
                }
            }

            job.addReasoningStep('✅ Security checks passed. No high-severity security vulnerabilities remain.');
            tasks[2].status = 'done';
            job.updateTasks(tasks);
            job.updateProgress(90);

            // ==========================================
            // 4. PREVIEW AGENT (RUNTIME DEPLOY PHASE)
            // ==========================================
            job.updateStatus('deploying');
            job.addReasoningStep('🚀 Runtime boot: Readying preview environment deployment...');
            tasks[3].status = 'running';
            job.updateTasks(tasks);
            job.updateProgress(95);

            tasks[3].status = 'done';
            job.updateTasks(tasks);

            // ==========================================
            // 5. SAVE TO PROJECT MEMORY
            // ==========================================
            try {
                const allGeneratedFiles = Object.keys(finalFiles).length > 0 
                    ? finalFiles 
                    : initialFiles;

                ProjectMemory.recordBuild(chatId, {
                    prompt: finalPrompt,
                    files: allGeneratedFiles,
                    techStack: options.techStack,
                    projectMode: options.projectMode,
                    model: codeModel,
                });
                job.addReasoningStep('🧠 Project memory updated for future context.');
            } catch (memErr) {
                console.error('[BackendOrchestrator] Memory save failed (non-critical):', memErr.message);
            }

            const fileCount = Object.keys(finalFiles).length;
            const modeLabel = isRefactor ? 'Refactored' : hasImage ? 'Design reconstructed into' : 'Generated';
            job.complete(
                `${modeLabel} ${fileCount} files successfully. Ready to build runtime preview!`,
                fileCount,
                {
                    mainFile: finalParsed.mainFile || 'index.html',
                    template: 'web',
                    wasEnhanced,
                    isRefactor,
                    hasImage,
                    plannerModel,
                    codeModel,
                }
            );

        } catch (error) {
            console.error('[BackendOrchestrator] Error during generation workflow:', error);
            tasks.forEach(t => {
                if (t.status === 'running' || t.status === 'pending') {
                    t.status = 'error';
                }
            });
            job.updateTasks(tasks);
            job.fail(error.message || 'Workflow process crashed');
        }
    }
}

module.exports = BackendOrchestrator;
