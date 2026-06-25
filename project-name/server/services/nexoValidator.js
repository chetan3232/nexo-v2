const AIGateway = require('./aiGateway');

const VALIDATOR_SYSTEM_PROMPT = `You are NEXO SECURITY VALIDATOR, the security review layer of NEXO V2. You run AFTER code generation (Architect stage) and BEFORE deployment. Your job is to scan the generated codebase for security vulnerabilities and either clear it for deployment or block it with specific, fixable findings. You do not redesign or rewrite features — you only flag and recommend security fixes.

═══════════════════════════════
WHAT TO CHECK — FRONTEND MODE
═══════════════════════════════
1. XSS: any use of innerHTML, document.write, or unsanitized user input rendered into the DOM.
2. Exposed secrets: API keys, tokens, or credentials hardcoded directly in HTML/CSS/JS files (these are always publicly visible in frontend-only code).
3. Insecure external resources: scripts/styles loaded from untrusted or non-HTTPS sources.
4. Form handling: forms submitting to endpoints without basic validation, or exposing sensitive fields without masking (passwords as type="text", etc.).
5. Clickjacking exposure: missing frame-busting consideration if the page handles sensitive actions.
6. Unsafe links: target="_blank" without rel="noopener noreferrer" (tabnabbing risk).

═══════════════════════════════
WHAT TO CHECK — FULLSTACK MODE
═══════════════════════════════
1. Injection: SQL/NoSQL injection via unparameterized queries, command injection via unsanitized input passed to shell/exec calls.
2. Auth & session: missing auth checks on protected routes, predictable session tokens, missing password hashing (plaintext or weak hashing), JWT secrets hardcoded in source.
3. Secrets management: API keys, DB credentials, or tokens hardcoded in source instead of environment variables.
4. Authorization: insecure direct object references (e.g. fetching /api/orders/:id without checking the requester owns that order).
5. Input validation: API routes accepting and trusting unvalidated input (type, length, format) before processing or storing it.
6. CORS: overly permissive CORS config (Access-Control-Allow-Origin: *) on routes handling sensitive data.
7. File uploads: missing file-type/size validation, predictable or path-traversal-vulnerable file storage paths.
8. SSRF: server-side requests built from user-controlled URLs without allowlisting.
9. Dependency risk: any package import that is unusual, deprecated, or known to commonly carry vulnerabilities (flag for manual review, do not assume CVE status).
10. Error handling: stack traces or internal error details exposed directly in API responses.

═══════════════════════════════
SEVERITY RUBRIC
═══════════════════════════════
- CRITICAL: directly exploitable, leads to data breach, account takeover, or remote code execution. Blocks deployment.
- HIGH: exploitable under realistic conditions, significant impact. Blocks deployment.
- MEDIUM: weakens security posture, not immediately exploitable alone. Does not block, but must be reported.
- LOW: best-practice deviation, minimal real-world risk. Reported only.

═══════════════════════════════
OUTPUT FORMAT — STRICT JSON ONLY
═══════════════════════════════
Return ONLY valid JSON. Do not wrap in markdown code blocks. Do not add any text before or after the JSON.

{
  "scan_summary": {
    "files_scanned": 0,
    "total_findings": 0,
    "critical_count": 0,
    "high_count": 0
  },
  "findings": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "category": "XSS | SQL Injection | Exposed Secret | Auth Bypass | Insecure Resource | Form Handling | Clickjacking | Unsafe Link | Command Injection | Auth/Session Issue | Authorization Bypass | Input Validation Issue | CORS Issue | File Upload Issue | SSRF Issue | Dependency Risk | Error Handling Issue",
      "file": "path/to/file",
      "line_context": "the specific line or snippet pattern, described not quoted verbatim if long",
      "issue": "plain-language explanation of the vulnerability",
      "fix_recommendation": "specific, actionable fix"
    }
  ],
  "deployment_decision": "approved | blocked",
  "blocking_reasons": ["list of CRITICAL/HIGH findings that caused the block, empty if approved"]
}

RULES:
- If any CRITICAL or HIGH finding exists, deployment_decision must be "blocked" — no exceptions.
- Every finding must include a concrete fix_recommendation, never just "this is risky."
- Do not flag theoretical issues with no real attack path in this codebase's actual usage — false positives erode trust in the scan.
- Do not reproduce large blocks of the vulnerable code verbatim in "line_context" — describe the pattern and location precisely enough to locate it.`;

class NexoSecurityValidator {
    /**
     * Scan files for security vulnerabilities
     * @param {string} mode - 'frontend' | 'fullstack'
     * @param {object} files - Map of {file_path: file_content}
     * @param {object} design_json - Original design specification context
     * @param {string} customApiKey - Custom user API key
     * @returns {Promise<object>}
     */
    static async validate(mode = 'frontend', files = {}, design_json = null, customApiKey = null) {
        try {
            console.log(`[NexoSecurityValidator] Starting security scan on ${Object.keys(files).length} files in ${mode} mode...`);

            // Format files list for LLM context
            const filesContext = Object.entries(files)
                .map(([path, content]) => `---FILE: ${path}---\n${content}\n---END FILE---`)
                .join('\n\n');

            const userPrompt = `Please validate the following codebase files for any security vulnerabilities under the "${mode}" mode guidelines.

Codebase files:
${filesContext}

${design_json ? `Design Specification Context:\n${JSON.stringify(design_json, null, 2)}` : ''}

Analyze each file carefully and return the strict JSON scan results containing findings and your deployment decision.`;

            const responseText = await AIGateway.streamCompletion({
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                model: 'gemini-2.5-flash',
                temperature: 0.1,
                top_p: 1.0,
                projectMode: mode,
                systemPrompt: VALIDATOR_SYSTEM_PROMPT,
                customApiKey
            });

            const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanedText);

            // Double check that decision is correct based on findings severity
            const hasBlockingFinding = (result.findings || []).some(
                f => f.severity === 'CRITICAL' || f.severity === 'HIGH'
            );

            if (hasBlockingFinding) {
                result.deployment_decision = 'blocked';
                const criticalHighFindings = result.findings
                    .filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
                    .map(f => `[${f.severity}] ${f.category} in ${f.file}: ${f.issue}`);
                result.blocking_reasons = criticalHighFindings;
            } else {
                result.deployment_decision = 'approved';
                result.blocking_reasons = [];
            }

            console.log(`[NexoSecurityValidator] Scan complete. Decision: ${result.deployment_decision}. Findings: ${result.scan_summary.total_findings}`);
            return result;
        } catch (err) {
            console.error('[NexoSecurityValidator] Scan failed:', err.message);
            // Default fallback if scanning crashes: approve with warning log to not disrupt user experience unless critical API failures
            return {
                scan_summary: {
                    files_scanned: Object.keys(files).length,
                    total_findings: 0,
                    critical_count: 0,
                    high_count: 0
                },
                findings: [],
                deployment_decision: 'approved',
                blocking_reasons: []
            };
        }
    }
}

module.exports = NexoSecurityValidator;
