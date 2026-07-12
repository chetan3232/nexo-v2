export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates a file's name/path and its contents against the active project mode rules.
 */
export function validateFileContent(
  path: string,
  content: string,
  projectMode: "frontend" | "fullstack"
): ValidationResult {
  const lowerPath = path.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Extract file extension
  const lastDotIndex = path.lastIndexOf(".");
  const ext = lastDotIndex !== -1 ? path.slice(lastDotIndex).toLowerCase() : "";

  if (projectMode === "frontend") {
    // 1. Allowed extensions: .html, .css, .js (and general web assets/configs like .json, .svg, .png, etc.)
    const allowedExts = [".html", ".css", ".js", ".json", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".ico", ".txt", ".md"];
    // Reject specific extensions
    const forbiddenExts = [".ts", ".tsx", ".jsx", ".py", ".php", ".java", ".vue"];
    
    if (forbiddenExts.includes(ext)) {
      return {
        valid: false,
        reason: `File extension '${ext}' is rejected in Frontend mode.`
      };
    }

    if (ext && !allowedExts.includes(ext)) {
      return {
        valid: false,
        reason: `Extension '${ext}' is not supported in Frontend mode. Only HTML, CSS, and JS are allowed.`
      };
    }

    // 2. Reject specific config/backend files
    const forbiddenFiles = ["package.json", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "vite.config.ts", "server.ts", "server.js", "app.js"];
    const fileName = path.split("/").pop() || "";
    if (forbiddenFiles.includes(fileName.toLowerCase())) {
      return {
        valid: false,
        reason: `File '${path}' is not allowed in Frontend mode.`
      };
    }

    // 3. Inspect package.json contents (if somehow created/sent)
    if (fileName.toLowerCase() === "package.json") {
      const forbiddenDeps = ["react", "typescript", "express", "vue", "angular", "next", "nuxt", "svelte"];
      for (const dep of forbiddenDeps) {
        if (lowerContent.includes(`"${dep}"`) || lowerContent.includes(`'${dep}'`)) {
          return {
            valid: false,
            reason: `Dependency or technology '${dep}' is forbidden in package.json in Frontend mode.`
          };
        }
      }
    }

    // 4. Inspect imports and generated code for forbidden frameworks and technologies
    const forbiddenPatterns = [
      /import\s+react/i,
      /import\s+.*\s+from\s+['"]react['"]/i,
      /from\s+['"]react['"]/i,
      /import\s+express/i,
      /require\s*\(\s*['"]express['"]\s*\)/i,
      /import\s+.*\s+from\s+['"]express['"]/i,
      /import\s+vue/i,
      /import\s+.*\s+from\s+['"]vue['"]/i,
      /import\s+@angular/i,
      /require\s*\(\s*['"]@angular/i,
      /import\s+next/i,
      /<?php/i,
      /import\s+sys/i,
      /import\s+os/i,
      /public\s+class\s+\w+\s*\{/ // java-like class structure
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        return {
          valid: false,
          reason: `Forbidden framework, technology, or import syntax detected in '${path}'.`
        };
      }
    }
  } else if (projectMode === "fullstack") {
    // 1. Expected extensions: .ts, .tsx, .json, .css, .html (and standard web assets)
    const allowedExts = [".ts", ".tsx", ".json", ".css", ".html", ".js", ".jsx", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".ico", ".txt", ".md", ".prisma"];
    const forbiddenExts = [".py", ".php", ".java", ".vue"];

    if (forbiddenExts.includes(ext)) {
      return {
        valid: false,
        reason: `File extension '${ext}' is rejected in Fullstack mode.`
      };
    }

    // 2. Reject specific languages/frameworks
    const forbiddenPatterns = [
      /<?php/i,
      /import\s+sys/i,
      /import\s+os/i,
      /public\s+class\s+\w+\s*\{/, // java class definition
      /import\s+vue/i,
      /import\s+.*\s+from\s+['"]vue['"]/i,
      /v-if=/i,
      /v-for=/i,
      /import\s+@angular/i,
      /@component\s*\(/i
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        return {
          valid: false,
          reason: `Forbidden technology (PHP/Python/Java/Vue/Angular) detected in '${path}'.`
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validates a batch of files (e.g. before updating projectStore)
 */
export function validateProjectFiles(
  files: Record<string, string>,
  projectMode: "frontend" | "fullstack"
): ValidationResult {
  // Fullstack mode validation checks for expected stack indicators (React, TypeScript, Node.js)
  if (projectMode === "fullstack") {
    let hasReact = false;
    let hasTypeScript = false;
    let hasNode = false;

    for (const [path, content] of Object.entries(files)) {
      const lowerPath = path.toLowerCase();
      const lowerContent = content.toLowerCase();

      // Extension / content check
      const fileResult = validateFileContent(path, content, "fullstack");
      if (!fileResult.valid) {
        return fileResult;
      }

      // Check for stack indicators
      if (lowerPath.endsWith(".tsx") || lowerContent.includes("react")) {
        hasReact = true;
      }
      if (lowerPath.endsWith(".ts") || lowerPath.endsWith(".tsx") || lowerContent.includes("typescript")) {
        hasTypeScript = true;
      }
      if (
        lowerPath.includes("server") || 
        lowerPath.includes("api") || 
        lowerContent.includes("express") || 
        lowerContent.includes("node")
      ) {
        hasNode = true;
      }
    }

    // We only enforce stack warning if there are files and none of the indicators are present
    const fileCount = Object.keys(files).length;
    if (fileCount > 3 && (!hasReact || !hasTypeScript)) {
      return {
        valid: false,
        reason: "Fullstack projects must align with the React + TypeScript stack."
      };
    }
  } else {
    // Frontend mode validation
    for (const [path, content] of Object.entries(files)) {
      const fileResult = validateFileContent(path, content, "frontend");
      if (!fileResult.valid) {
        return fileResult;
      }
    }
  }

  return { valid: true };
}
