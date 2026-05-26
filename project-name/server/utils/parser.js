/**
 * Parses code blocks from AI response text and identifies the project structure.
 * CommonJS version of the client-side parser.ts
 */
const extractCodeFromText = (text) => {
    const files = {};
    const patches = {};
    let cleanText = text;
    let hasContent = false;

    // REGEX PATCH: ---PATCH: filename.ext--- ... ---END PATCH---
    const regexPatch = /---PATCH:\s*([^\n]+?)\s*---\s*\n([\s\S]*?)(?:---END PATCH---|$)/gi;
    let match;
    while ((match = regexPatch.exec(text)) !== null) {
        const filename = match[1].trim().replace(/`/g, "");
        const diff = match[2].trim();
        patches[filename] = diff;
        hasContent = true;
        cleanText = cleanText.replace(match[0], "");
    }

    // REGEX 0: ---FILE: filename.ext--- ... ---END FILE--- (backend prompt format)
    const regex0 = /---FILE:\s*([^\n]+?)\s*---\s*\n([\s\S]*?)(?:---END FILE---|$)/gi;
    while ((match = regex0.exec(text)) !== null) {
        let filename = match[1].trim();
        filename = filename.replace(/`/g, "");
        let code = match[2];

        if (code.startsWith("```")) {
            code = code.replace(/^```[a-z]*\n/i, "");
        }

        files[filename] = code;
        hasContent = true;
    }

    // REGEX 1: ```lang filename="name" ... ```
    if (!hasContent) {
        const regex1 = /```(\w+)\s+filename=["']([^"']+)["']\s*\n([\s\S]*?)(?:```|$)/gi;
        while ((match = regex1.exec(text)) !== null) {
            const code = match[3].trim();
            if (code.length > 0) {
                files[match[2]] = code;
                hasContent = true;
                cleanText = cleanText.replace(match[0], "");
            }
        }
    }

    // REGEX 2: ```lang [name] ... ```
    if (!hasContent) {
        const regex2 = /```(\w+)\s+\[([^\]]+)\]\s*\n([\s\S]*?)```/gi;
        while ((match = regex2.exec(text)) !== null) {
            const code = match[3].trim();
            if (code.length >= 10) {
                files[match[2]] = code;
                hasContent = true;
                cleanText = cleanText.replace(match[0], "");
            }
        }
    }

    // REGEX 3: Plain ```lang ... ```
    if (!hasContent) {
        const regex3 = /```(\w+)\s*\n([\s\S]*?)```/gi;
        while ((match = regex3.exec(text)) !== null) {
            const lang = match[1].toLowerCase();
            let code = match[2].trim();
            if (code.length < 10) continue;

            const firstLine = code.split("\n")[0];
            const commentMatch = firstLine.match(
                /(?:\/\/|#|\/\*|<!--)\s*(?:filename|file|path)?:?\s*([\w./-]+\.\w+)/i
            );
            let filename = "";

            if (commentMatch) {
                filename = commentMatch[1];
                code = code.split("\n").slice(1).join("\n").trim();
            } else {
                const blockStart = text.indexOf(match[0]);
                const textBefore = text.substring(
                    Math.max(0, blockStart - 200),
                    blockStart
                );
                const headerMatch = textBefore.match(
                    /(?:#{1,4}\s+|[\*]{1,2})(\w[\w.-]*\.\w+)[\*]{0,2}\s*$/
                );
                if (headerMatch) {
                    filename = headerMatch[1];
                } else {
                    switch (lang) {
                        case "html":
                            filename = "index.html";
                            break;
                        case "css":
                            filename = "styles.css";
                            break;
                        case "javascript":
                        case "js":
                            filename = "index.js";
                            break;
                        case "typescript":
                        case "ts":
                            filename = "index.ts";
                            break;
                        case "tsx":
                            filename = "App.tsx";
                            break;
                        case "jsx":
                            filename = "App.jsx";
                            break;
                        case "json":
                            filename = code.includes('"scripts"')
                                ? "package.json"
                                : "tsconfig.json";
                            break;
                        case "python":
                        case "py":
                            filename = "main.py";
                            break;
                        default:
                            filename = `file.${lang}`;
                    }
                }
            }

            files[filename] = code;
            hasContent = true;
            cleanText = cleanText.replace(match[0], "");
        }
    }

    if (!hasContent) return { cleanText: cleanText.trim() };

    // Cleanup leftover code artifacts
    cleanText = cleanText.replace(/---FILE:\s*[^\n]+?---\s*\n[\s\S]*?---END FILE---/gi, "");
    cleanText = cleanText.replace(/---FILE:[^\n]*---/gi, "");
    cleanText = cleanText.replace(/---END FILE---/gi, "");
    cleanText = cleanText.replace(/```[\s\S]*?```/g, "");
    cleanText = cleanText.replace(/filename=["'][^"']+["']/g, "");
    cleanText = cleanText.replace(/\n{3,}/g, "\n\n");
    cleanText = cleanText.trim();

    const normalizedFiles = {};
    for (const [key, value] of Object.entries(files)) {
        let normKey = key.trim();
        if (normKey.startsWith("./")) normKey = normKey.substring(2);
        if (normKey.startsWith("src/")) normKey = normKey.substring(4);
        normalizedFiles[normKey] = value;
    }

    if (!cleanText) {
        const fileCount = Object.keys(normalizedFiles).length;
        cleanText = `✅ Generated ${fileCount} files.`;
    }

    let mainFile = Object.keys(normalizedFiles)[0];
    let template = "unknown";

    if (
        normalizedFiles["App.tsx"] ||
        normalizedFiles["index.tsx"] ||
        normalizedFiles["App.jsx"] ||
        normalizedFiles["index.jsx"]
    ) {
        mainFile = normalizedFiles["App.tsx"]
            ? "App.tsx"
            : normalizedFiles["App.jsx"]
                ? "App.jsx"
                : "index.tsx";
        template = "react";
    } else if (normalizedFiles["index.html"]) {
        mainFile = "index.html";
        template = "web";
    } else if (Object.keys(normalizedFiles).some((f) => f.endsWith(".py"))) {
        mainFile = Object.keys(normalizedFiles).find((f) => f.endsWith(".py")) || mainFile;
        template = "python";
    } else if (
        normalizedFiles["package.json"] ||
        Object.keys(normalizedFiles).some((f) => f.endsWith(".ts"))
    ) {
        template = "node";
        if (normalizedFiles["index.ts"]) mainFile = "index.ts";
    }

    return {
        website: { files: normalizedFiles, patches, mainFile, template },
        cleanText
    };
};

function applyPatch(original, patch) {
    const searchReplaceRegex = /<<<< SEARCH\n([\s\S]*?)\n==== REPLACE\n([\s\S]*?)\n>>>>/g;
    let result = original;
    let match;
    let appliedCount = 0;

    while ((match = searchReplaceRegex.exec(patch)) !== null) {
        const searchContent = match[1];
        const replaceContent = match[2];

        if (result.includes(searchContent)) {
            result = result.replace(searchContent, replaceContent);
            appliedCount++;
        } else {
            const normalizedSearch = searchContent.trim();
            if (result.includes(normalizedSearch)) {
                result = result.replace(normalizedSearch, replaceContent);
                appliedCount++;
            }
        }
    }

    return result;
}

module.exports = {
    extractCodeFromText,
    applyPatch
};
