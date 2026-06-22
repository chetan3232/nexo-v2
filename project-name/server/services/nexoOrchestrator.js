class NexoOrchestrator {
    /**
     * Determine execution path, routing, retry decisions, and escalations
     * @param {string} requested_model - User selected model ID
     * @param {string} mode - 'frontend' | 'fullstack'
     * @param {string} stage - 'analysis' | 'design' | 'code_generation' | 'validation'
     * @param {array} attempt_history - List of previous failures: [{ attempt: 1, failure_type: '...', error_message: '...' }]
     * @param {object} payload - Target stage payload metadata
     * @returns {object} Decision payload conforming to strict JSON schema
     */
    static decide(requested_model, mode, stage, attempt_history = [], payload = {}) {
        const decisionPayload = {
            decision: "proceed",
            model_to_use: requested_model,
            suggested_alternative: null,
            failure_type: null,
            correction_note: null,
            escalation_message: null
        };

        // 1. Model Selection Policy (Coder-specific suggestions)
        if (stage === "code_generation") {
            const modelLower = (requested_model || "").toLowerCase();
            if (modelLower.includes("nvidia") || modelLower.includes("nemotron") || modelLower.includes("llama")) {
                decisionPayload.suggested_alternative = "qwen/qwen3-coder-480b-a35b-instruct";
            } else if (modelLower.includes("gemini") || modelLower.includes("flash")) {
                decisionPayload.suggested_alternative = "gemini-2.5-pro";
            }
        }

        // If no failures yet, proceed with default choice
        if (!attempt_history || attempt_history.length === 0) {
            return decisionPayload;
        }

        // 2. Failure Classification & Retry Policy
        const lastAttempt = attempt_history[attempt_history.length - 1];
        const lastFailureType = lastAttempt.failure_type || this.classifyFailure(lastAttempt.error_message);
        
        decisionPayload.failure_type = lastFailureType;

        // Count how many times this specific failure occurred in history
        const failureCount = attempt_history.filter(h => h.failure_type === lastFailureType || this.classifyFailure(h.error_message) === lastFailureType).length;

        const whatAttempted = `running the ${stage} stage for your ${mode} project`;

        switch (lastFailureType) {
            case "TRANSIENT":
                if (failureCount < 3) {
                    decisionPayload.decision = "retry";
                    // Backoff delay calculated based on count (e.g. 1s, 2s, 4s)
                    const delay = Math.pow(2, failureCount - 1);
                    decisionPayload.correction_note = `Infrastructure hiccup detected. Retrying attempt ${failureCount + 1} after ${delay}s...`;
                } else {
                    decisionPayload.decision = "escalate";
                    decisionPayload.escalation_message = `Nexo aborted ${whatAttempted} because the connection repeatedly timed out or hit rate limits. Target server returned: "${lastAttempt.error_message}". Please retry in a few moments.`;
                }
                break;

            case "SCHEMA_VIOLATION":
                if (failureCount < 2) {
                    decisionPayload.decision = "retry";
                    decisionPayload.correction_note = `Correction: Your previous response was invalid. It did not match the required JSON structure. Error: "${lastAttempt.error_message}". Please generate valid JSON matching the schema strictly, with no markdown code blocks or wrapper text.`;
                } else {
                    decisionPayload.decision = "escalate";
                    decisionPayload.escalation_message = `Nexo failed while ${whatAttempted} because the AI model could not format its output as structured JSON. Retries were exhausted. Next step: Try switching to a different model (e.g., Gemini Pro or Claude) or simplify your prompt.`;
                }
                break;

            case "CONTENT_FAILURE":
                if (failureCount < 2) {
                    decisionPayload.decision = "retry";
                    decisionPayload.correction_note = `Correction: The code or plan you generated has compile/validation errors. Issues: "${lastAttempt.error_message}". Please apply a targeted fix to resolve these errors while preserving the rest of the file layout.`;
                } else {
                    decisionPayload.decision = "escalate";
                    decisionPayload.escalation_message = `Nexo stopped while ${whatAttempted} because the code contains persistent errors: "${lastAttempt.error_message}". Next step: Review the build errors under the Editor logs, or reduce the complexity of the feature.`;
                }
                break;

            case "CONTEXT_OVERFLOW":
                if (failureCount < 1) {
                    decisionPayload.decision = "retry";
                    decisionPayload.correction_note = "Warning: The previous request exceeded the model context window. Context has been optimized and compressed. Please compile the next chunks.";
                } else {
                    decisionPayload.decision = "escalate";
                    decisionPayload.escalation_message = `Nexo stopped while ${whatAttempted} due to memory limits (Context Window Overflow). Next step: Try deleting unused files from the workspace tree or breaking down your app into smaller separate components.`;
                }
                break;

            case "AUTH_OR_CONFIG":
            default:
                decisionPayload.decision = "escalate";
                decisionPayload.escalation_message = `Nexo was unable to start ${whatAttempted} because of a credentials or quota configuration issue: "${lastAttempt.error_message}". Next step: Check your Settings page to verify your API Keys, or ensure you have remaining credits on your account.`;
                break;
        }

        return decisionPayload;
    }

    /**
     * Helper to classify a raw error message string into a failure type
     * @param {string} errorMsg - Raw error message
     * @returns {string}
     */
    static classifyFailure(errorMsg = "") {
        const msg = errorMsg.toLowerCase();
        if (msg.includes("429") || msg.includes("rate limit") || msg.includes("timeout") || msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("555") || msg.includes("network") || msg.includes("econnreset")) {
            return "TRANSIENT";
        }
        if (msg.includes("json") || msg.includes("parse") || msg.includes("format") || msg.includes("schema") || msg.includes("violation") || msg.includes("bracket")) {
            return "SCHEMA_VIOLATION";
        }
        if (msg.includes("context") || msg.includes("token limit") || msg.includes("overflow") || msg.includes("length exceeded")) {
            return "CONTEXT_OVERFLOW";
        }
        if (msg.includes("api key") || msg.includes("auth") || msg.includes("unauthorized") || msg.includes("quota") || msg.includes("model not found") || msg.includes("key missing")) {
            return "AUTH_OR_CONFIG";
        }
        // Default to content failure if it's code/compilation/logical related
        return "CONTENT_FAILURE";
    }
}

module.exports = NexoOrchestrator;
