# Security Policy

## Supported Versions

We actively provide security updates for the following versions of NEXO V2:

| Version | Supported          |
| ------- | ------------------ |
| 2.2.x   | ✅ Yes              |
| 2.1.x   | ❌ No               |
| 1.x.x   | ❌ No               |

## Reporting a Vulnerability

We take the security of NEXO V2 and its users seriously. If you believe you have found a security vulnerability, please report it to us as soon as possible.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please follow this process:
1. Email your findings to **security@nexo.studio**.
2. Include a detailed description of the vulnerability, steps to reproduce it, and any potential impact.
3. Our team will acknowledge your report within 48 hours and provide a timeline for resolution.

## Our Commitment

- **Confidentiality**: We will keep your report confidential while we investigate and fix the issue.
- **Credit**: If you are the first to report a unique vulnerability, we will credit you in our security advisories (unless you prefer to remain anonymous).
- **No Legal Action**: We will not pursue legal action against researchers who act in good faith and follow this policy.

## Sandbox & Isolation

NEXO V2 uses **StackBlitz WebContainer technology** to execute code. This provides a high level of security:
- **Process Isolation**: Generated code runs in a separate browser process.
- **No System Access**: Code running in the sandbox cannot access your local file system or network outside of the browser's capabilities.
- **Sensitive Data**: Your API keys are stored only in your local browser storage and are never sent to our servers except for proxying to the AI provider.

Thank you for helping keep NEXO V2 safe for everyone!
