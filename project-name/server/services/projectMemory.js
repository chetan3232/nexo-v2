/**
 * ProjectMemory — NEXO V2 Persistent AI Memory System
 * 
 * Stores per-project context: goals, stack decisions, bugs fixed,
 * design choices — and injects them into every AI generation call
 * so the AI always "remembers" what was built before.
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '../data/memories');

// Ensure memories directory exists
if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

class ProjectMemory {
    /**
     * Get memory file path for a chat session
     */
    static getPath(chatId) {
        // Sanitize chatId for filesystem
        const safe = String(chatId).replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.join(MEMORY_DIR, `${safe}.json`);
    }

    /**
     * Load memory for a project/chat
     */
    static load(chatId) {
        const filePath = this.getPath(chatId);
        if (!fs.existsSync(filePath)) {
            return this.createEmpty(chatId);
        }
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
            return this.createEmpty(chatId);
        }
    }

    /**
     * Save/update memory for a project
     */
    static save(chatId, updates) {
        const current = this.load(chatId);
        const updated = {
            ...current,
            ...updates,
            updatedAt: Date.now(),
        };
        fs.writeFileSync(this.getPath(chatId), JSON.stringify(updated, null, 2));
        return updated;
    }

    /**
     * Record a completed build event
     */
    static recordBuild(chatId, { prompt, files, techStack, projectMode, model }) {
        const memory = this.load(chatId);

        // Track build history (last 10)
        const buildEntry = {
            timestamp: Date.now(),
            prompt: prompt?.substring(0, 200),
            fileCount: Object.keys(files || {}).length,
            techStack,
            projectMode,
            model,
        };
        memory.buildHistory = [buildEntry, ...(memory.buildHistory || [])].slice(0, 10);

        // Extract tech stack from files
        if (files && files['package.json']) {
            try {
                const pkg = JSON.parse(files['package.json']);
                memory.detectedDependencies = Object.keys(pkg.dependencies || {}).slice(0, 20);
            } catch (e) {}
        }

        // Detect primary language/framework
        const fileKeys = Object.keys(files || {});
        if (fileKeys.some(f => f.endsWith('.tsx') || f.endsWith('.ts'))) {
            memory.detectedStack = 'React/TypeScript';
        } else if (fileKeys.some(f => f.endsWith('.jsx') || f.endsWith('.js'))) {
            memory.detectedStack = 'React/JavaScript';
        } else if (fileKeys.some(f => f.endsWith('.html'))) {
            memory.detectedStack = 'Vanilla HTML';
        }

        return this.save(chatId, memory);
    }

    /**
     * Record a bug fix event
     */
    static recordFix(chatId, errorMsg, fix) {
        const memory = this.load(chatId);
        memory.bugsFixed = [
            {
                timestamp: Date.now(),
                error: errorMsg?.substring(0, 200),
                fix: fix?.substring(0, 300),
            },
            ...(memory.bugsFixed || [])
        ].slice(0, 20);
        return this.save(chatId, memory);
    }

    /**
     * Generate a context string to inject into AI prompts
     */
    static getContextString(chatId) {
        const memory = this.load(chatId);

        if (!memory.buildHistory || memory.buildHistory.length === 0) {
            return '';
        }

        const lastBuild = memory.buildHistory[0];
        const lines = ['### 🧠 Project Memory (Previous Context):'];

        if (lastBuild.prompt) {
            lines.push(`- Last build: "${lastBuild.prompt.substring(0, 100)}..."`);
        }
        if (memory.detectedStack) {
            lines.push(`- Detected stack: ${memory.detectedStack}`);
        }
        if (memory.detectedDependencies?.length > 0) {
            lines.push(`- Active dependencies: ${memory.detectedDependencies.slice(0, 8).join(', ')}`);
        }
        if (memory.bugsFixed?.length > 0) {
            lines.push(`- Previously fixed errors: ${memory.bugsFixed.length} bugs resolved`);
            const lastBug = memory.bugsFixed[0];
            if (lastBug.error) {
                lines.push(`  - Last fix: "${lastBug.error.substring(0, 80)}"`);
            }
        }
        if (memory.userPreferences) {
            if (memory.userPreferences.darkMode !== undefined) {
                lines.push(`- User prefers: ${memory.userPreferences.darkMode ? 'dark' : 'light'} theme`);
            }
        }

        lines.push('(Maintain consistency with the above project context.)');
        return lines.join('\n');
    }

    /**
     * Create a blank memory object
     */
    static createEmpty(chatId) {
        return {
            chatId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            buildHistory: [],
            bugsFixed: [],
            detectedStack: null,
            detectedDependencies: [],
            userPreferences: {},
        };
    }

    /**
     * List all project memories
     */
    static listAll() {
        if (!fs.existsSync(MEMORY_DIR)) return [];
        return fs.readdirSync(MEMORY_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                try {
                    return JSON.parse(fs.readFileSync(path.join(MEMORY_DIR, f)));
                } catch { return null; }
            })
            .filter(Boolean);
    }
}

module.exports = ProjectMemory;
