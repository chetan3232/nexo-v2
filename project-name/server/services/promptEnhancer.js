/**
 * PromptEnhancer — NEXO V2 Prompt Enhancement Engine
 * 
 * Transforms sparse user prompts into rich, detailed specifications
 * before they reach the main AI generation pipeline.
 * 
 * Example: "food app" →
 *   "Build a modern food delivery platform with real-time order tracking,
 *    restaurant listings, cart, auth, admin dashboard, dark mode..."
 */

const AIGateway = require('./aiGateway');
const PROJECT_MODES = require('./projectModes');

const getEnhanceSystemPrompt = () => {
    return `You are NEXO Prompt Architect — an expert at converting short, vague user prompts into detailed, production-level software specifications.

RULES:
1. Expand the user's idea into a full, rich description (3-5 sentences)
2. Add specific features, UI details, and technical requirements that make sense
3. Keep the original intent intact — don't change what they're building
4. Include: UI style (dark/light, modern/minimal), key features, tech hints
5. Output ONLY the enhanced prompt — no preamble, no explanation, no quotes

STRICT MODE RULES:
- If Project Mode is "frontend", you MUST only specify project types: ${PROJECT_MODES.frontend.allowedProjectTypes.join(', ')}. You MUST ONLY use technologies: ${PROJECT_MODES.frontend.stack.join(', ')}. You MUST NOT include any forbidden technologies: ${PROJECT_MODES.frontend.forbiddenTechnologies.join(', ')}.
- If Project Mode is "fullstack", you MUST specify project types: ${PROJECT_MODES.fullstack.allowedProjectTypes.join(', ')}. You MUST use technologies: ${PROJECT_MODES.fullstack.stack.join(', ')}. You MUST NOT include any forbidden technologies: ${PROJECT_MODES.fullstack.forbiddenTechnologies.join(', ')}.

Examples:
- "food app" → "Build a modern food delivery platform with a dark-themed UI featuring restaurant discovery, menu browsing with filters, shopping cart with quantity controls, real-time order tracking with map, user authentication, and an admin dashboard for restaurant owners."
- "portfolio" → "Build a premium developer portfolio with a cinematic dark theme, animated hero section with typing effects, skills grid with progress bars, interactive project cards with live preview links, a contact form with validation, and smooth scroll animations throughout."
- "todo" → "Build a productivity-focused todo application with a clean minimal design, drag-and-drop task reordering, priority labels (high/medium/low) with color coding, due date picker, progress tracker, local storage persistence, and dark/light mode toggle."`;
};

class PromptEnhancer {
    /**
     * Enhance a user prompt before sending to main generation pipeline
     * @param {string} prompt - Raw user input
     * @param {string} projectMode - 'frontend' | 'fullstack'
     * @param {string} techStack - 'Vanilla' | 'React' | 'Next.js' etc
     * @param {string} customApiKey - Optional custom API key
     * @returns {Promise<{enhanced: string, wasEnhanced: boolean}>}
     */
    static async enhance(prompt, projectMode = 'frontend', techStack = 'React', customApiKey) {
        // Don't enhance if already detailed (>80 chars with multiple words)
        if (prompt.length > 80 && prompt.split(' ').length > 10) {
            return { enhanced: prompt, wasEnhanced: false };
        }

        // Don't enhance follow-up commands
        const followUpPatterns = [
            /^(fix|add|remove|change|update|make|refactor|convert|optimize|improve)/i,
            /^(yes|no|ok|sure|please|thanks)/i,
        ];
        if (followUpPatterns.some(p => p.test(prompt.trim()))) {
            return { enhanced: prompt, wasEnhanced: false };
        }

        try {
            let modeRule = '';
            const modeConfig = PROJECT_MODES[projectMode];
            if (modeConfig) {
                modeRule = `\nSTRICT ${modeConfig.label.toUpperCase()} MODE RULE: The project MUST be one of these types: ${modeConfig.allowedProjectTypes.join(', ')}. It MUST ONLY use: ${modeConfig.stack.join(', ')}. Do NOT mention any of these forbidden technologies: ${modeConfig.forbiddenTechnologies.join(', ')}.`;
            }

            const enhancePrompt = `User wants to build: "${prompt}"
Project mode: ${projectMode}
Tech stack preference: ${techStack}${modeRule}

Write an enhanced, detailed prompt for this project:`;

            const enhanced = await AIGateway.streamCompletion({
                messages: [
                    { role: 'system', content: getEnhanceSystemPrompt() },
                    { role: 'user', content: enhancePrompt }
                ],
                model: 'gemini-2.5-flash',
                temperature: 0.7,
                top_p: 1.0,
                projectMode,
                techStack,
                customApiKey,
                maxTokens: 250
            });

            const cleanedEnhanced = enhanced
                .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
                .replace(/^Enhanced prompt:\s*/i, '')
                .trim();

            // Only use if we actually got something better
            if (cleanedEnhanced && cleanedEnhanced.length > prompt.length) {
                console.log(`\n\x1b[35m[PromptEnhancer]\x1b[0m Enhanced: "${prompt.substring(0, 30)}..." → ${cleanedEnhanced.length} chars\n`);
                return { enhanced: cleanedEnhanced, wasEnhanced: true, original: prompt };
            }

            return { enhanced: prompt, wasEnhanced: false };
        } catch (err) {
            console.error('[PromptEnhancer] Enhancement failed, using original:', err.message);
            return { enhanced: prompt, wasEnhanced: false };
        }
    }
}

module.exports = PromptEnhancer;
