import { SelectedDesignSnapshot } from "../types/designConcept";
import { ImplementationPlan } from "./implementationPlanService";

export interface ValidationFailure {
  errorType: string;
  errorMessage: string;
  affectedFiles: string[];
  relevantCode: string;
  expectedBehavior: string;
  selectedDesignConstraints: string;
  approvedPlanConstraints: string;
}

export interface ValidationResult {
  isValid: boolean;
  failure?: ValidationFailure;
  passedStages: string[];
}

export class ValidationService {
  private static instance: ValidationService;

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  private constructor() {}

  public validate(
    files: Record<string, string>,
    projectMode: "frontend" | "fullstack",
    designSnapshot: SelectedDesignSnapshot,
    planSnapshot: ImplementationPlan
  ): ValidationResult {
    const passedStages: string[] = [];

    // Stage 1: Project Mode Validation
    const stage1 = this.validateProjectMode(files, projectMode);
    if (!stage1.isValid) return { isValid: false, failure: stage1.failure, passedStages };
    passedStages.push("Project Mode Validation");

    // Stage 2: Selected Design Compliance
    const stage2 = this.validateDesignCompliance(files, designSnapshot);
    if (!stage2.isValid) return { isValid: false, failure: stage2.failure, passedStages };
    passedStages.push("Selected Design Compliance");

    // Stage 3: Implementation Plan Compliance
    const stage3 = this.validatePlanCompliance(files, planSnapshot);
    if (!stage3.isValid) return { isValid: false, failure: stage3.failure, passedStages };
    passedStages.push("Implementation Plan Compliance");

    // Stage 4: TypeScript / Syntax Validation
    const stage4 = this.validateSyntax(files);
    if (!stage4.isValid) return { isValid: false, failure: stage4.failure, passedStages };
    passedStages.push("TypeScript / Syntax Validation");

    // Stage 5: Dependency Validation
    const stage5 = this.validateDependencies(files, projectMode);
    if (!stage5.isValid) return { isValid: false, failure: stage5.failure, passedStages };
    passedStages.push("Dependency Validation");

    // Stage 6: Security Validation
    const stage6 = this.validateSecurity(files);
    if (!stage6.isValid) return { isValid: false, failure: stage6.failure, passedStages };
    passedStages.push("Security Validation");

    // Stage 7: Build Validation
    const stage7 = this.validateBuild(files, projectMode);
    if (!stage7.isValid) return { isValid: false, failure: stage7.failure, passedStages };
    passedStages.push("Build Validation");

    // Stage 8: Runtime Validation
    const stage8 = this.validateRuntime(files, projectMode);
    if (!stage8.isValid) return { isValid: false, failure: stage8.failure, passedStages };
    passedStages.push("Runtime Validation");

    return { isValid: true, passedStages };
  }

  // Rerun a specific validation stage by name
  public rerunStage(
    stageName: string,
    files: Record<string, string>,
    projectMode: "frontend" | "fullstack",
    designSnapshot: SelectedDesignSnapshot,
    planSnapshot: ImplementationPlan
  ): { isValid: boolean; failure?: ValidationFailure } {
    switch (stageName) {
      case "Project Mode Validation":
        return this.validateProjectMode(files, projectMode);
      case "Selected Design Compliance":
        return this.validateDesignCompliance(files, designSnapshot);
      case "Implementation Plan Compliance":
        return this.validatePlanCompliance(files, planSnapshot);
      case "TypeScript / Syntax Validation":
        return this.validateSyntax(files);
      case "Dependency Validation":
        return this.validateDependencies(files, projectMode);
      case "Security Validation":
        return this.validateSecurity(files);
      case "Build Validation":
        return this.validateBuild(files, projectMode);
      case "Runtime Validation":
        return this.validateRuntime(files, projectMode);
      default:
        return { isValid: true };
    }
  }

  private validateProjectMode(
    files: Record<string, string>,
    projectMode: "frontend" | "fullstack"
  ): { isValid: boolean; failure?: ValidationFailure } {
    const filePaths = Object.keys(files);

    if (projectMode === "frontend") {
      const forbiddenFiles = filePaths.filter(
        (f) => f.endsWith(".tsx") || f.endsWith(".jsx") || f.endsWith(".ts")
      );
      if (forbiddenFiles.length > 0) {
        return {
          isValid: false,
          failure: {
            errorType: "Project Mode Violation",
            errorMessage: `Detected React/TypeScript files in Frontend mode: ${forbiddenFiles.join(
              ", "
            )}.`,
            affectedFiles: forbiddenFiles,
            relevantCode: "Forbidden file extensions utilized.",
            expectedBehavior: "Only standard static .html, .css, and .js files are allowed in Frontend mode.",
            selectedDesignConstraints: "Design must build only static templates.",
            approvedPlanConstraints: "Technology stack restricts code to Vanilla HTML/CSS/JS.",
          },
        };
      }

      if (!files["index.html"]) {
        return {
          isValid: false,
          failure: {
            errorType: "Project Entrypoint Missing",
            errorMessage: "Frontend project requires an 'index.html' entrypoint file.",
            affectedFiles: ["index.html"],
            relevantCode: "File not found.",
            expectedBehavior: "Provide a root 'index.html' file.",
            selectedDesignConstraints: "Index html is needed to host visual preview.",
            approvedPlanConstraints: "Vite/Vanilla templates require index.html.",
          },
        };
      }
    } else {
      // Fullstack validation
      if (!files["package.json"]) {
        return {
          isValid: false,
          failure: {
            errorType: "Configuration File Missing",
            errorMessage: "Fullstack project requires a 'package.json' config file.",
            affectedFiles: ["package.json"],
            relevantCode: "File not found.",
            expectedBehavior: "Provide a root 'package.json' specifying packages.",
            selectedDesignConstraints: "React needs package configurations.",
            approvedPlanConstraints: "Must provide standard package.json file.",
          },
        };
      }
    }

    return { isValid: true };
  }

  private validateDesignCompliance(
    files: Record<string, string>,
    designSnapshot: SelectedDesignSnapshot
  ): { isValid: boolean; failure?: ValidationFailure } {
    const primaryColor = designSnapshot.colorSystem.primary.toLowerCase();
    
    // Look in styling file
    const styleFiles = Object.keys(files).filter(
      (f) => f.endsWith(".css") || f.endsWith(".tsx") || f.endsWith(".jsx") || f.endsWith(".html")
    );

    let primaryColorFound = false;
    let checkedCode = "";

    for (const f of styleFiles) {
      const code = files[f];
      if (code.toLowerCase().includes(primaryColor) || code.toLowerCase().includes(primaryColor.replace("#", ""))) {
        primaryColorFound = true;
        break;
      }
      if (checkedCode.length < 500) {
        checkedCode += `\n/* ${f} */\n` + code.slice(0, 150);
      }
    }

    if (!primaryColorFound) {
      return {
        isValid: false,
        failure: {
          errorType: "Design Non-Compliance",
          errorMessage: `Locked design primary color '${primaryColor}' was not applied in styling files.`,
          affectedFiles: styleFiles.slice(0, 3),
          relevantCode: checkedCode,
          expectedBehavior: `Implement locked primary color style (${primaryColor}) in UI components or styles.`,
          selectedDesignConstraints: `Color System: Primary is ${primaryColor}, Theme: ${designSnapshot.designName}`,
          approvedPlanConstraints: "Styles must follow locked design fingerprint rules.",
        },
      };
    }

    return { isValid: true };
  }

  private validatePlanCompliance(
    files: Record<string, string>,
    planSnapshot: ImplementationPlan
  ): { isValid: boolean; failure?: ValidationFailure } {
    const missingPages: string[] = [];
    
    for (const page of planSnapshot.pages) {
      const cleanName = page.split(" ")[0].toLowerCase();
      let found = false;
      for (const filepath of Object.keys(files)) {
        if (filepath.toLowerCase().includes(cleanName)) {
          found = true;
          break;
        }
      }
      if (!found) {
        missingPages.push(page);
      }
    }

    if (missingPages.length > 0) {
      return {
        isValid: false,
        failure: {
          errorType: "Implementation Plan Mismatch",
          errorMessage: `Missing pages outlined in the approved implementation plan: ${missingPages.join(
            ", "
          )}`,
          affectedFiles: Object.keys(files).slice(0, 2),
          relevantCode: "Plan outlines pages that do not map to generated files.",
          expectedBehavior: "All pages approved in the implementation plan must be generated.",
          selectedDesignConstraints: "Must structure pages as defined in locked concepts.",
          approvedPlanConstraints: `Required pages: ${planSnapshot.pages.join(", ")}`,
        },
      };
    }

    return { isValid: true };
  }

  private validateSyntax(files: Record<string, string>): { isValid: boolean; failure?: ValidationFailure } {
    for (const [fpath, code] of Object.entries(files)) {
      if (fpath.endsWith(".js") || fpath.endsWith(".ts") || fpath.endsWith(".tsx") || fpath.endsWith(".jsx")) {
        // Brackets matching count
        const openBraceCount = (code.match(/\{/g) || []).length;
        const closeBraceCount = (code.match(/\}/g) || []).length;
        if (openBraceCount !== closeBraceCount) {
          return {
            isValid: false,
            failure: {
              errorType: "Syntax / Compile Error",
              errorMessage: `Curly braces mismatched count inside ${fpath}: ${openBraceCount} open vs ${closeBraceCount} closed.`,
              affectedFiles: [fpath],
              relevantCode: code.slice(-300),
              expectedBehavior: "All curly braces must be properly balanced.",
              selectedDesignConstraints: "N/A",
              approvedPlanConstraints: "N/A",
            },
          };
        }
      }
    }

    return { isValid: true };
  }

  private validateDependencies(
    files: Record<string, string>,
    projectMode: "frontend" | "fullstack"
  ): { isValid: boolean; failure?: ValidationFailure } {
    if (projectMode === "frontend") return { isValid: true };

    const packageJson = files["package.json"];
    if (!packageJson) return { isValid: true };

    try {
      const parsed = JSON.parse(packageJson);
      const deps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };

      // Check imports
      for (const [fpath, code] of Object.entries(files)) {
        if (fpath.endsWith(".tsx") || fpath.endsWith(".ts")) {
          const importMatches = code.matchAll(/from\s+['"]([^'"]+)['"]/g);
          for (const match of importMatches) {
            const moduleName = match[1];
            if (moduleName.startsWith(".") || moduleName.startsWith("/")) continue;
            
            // Extract base package name
            const baseModule = moduleName.startsWith("@")
              ? moduleName.split("/").slice(0, 2).join("/")
              : moduleName.split("/")[0];

            if (!deps[baseModule]) {
              return {
                isValid: false,
                failure: {
                  errorType: "Missing Dependency",
                  errorMessage: `File '${fpath}' imports '${baseModule}' which is missing in package.json dependencies.`,
                  affectedFiles: ["package.json", fpath],
                  relevantCode: `import from "${moduleName}"`,
                  expectedBehavior: `Add '${baseModule}' into package.json dependencies.`,
                  selectedDesignConstraints: "N/A",
                  approvedPlanConstraints: "Verify that all imports are defined in configuration files.",
                },
              };
            }
          }
        }
      }
    } catch (e: any) {
      return {
        isValid: false,
        failure: {
          errorType: "Malformed Configuration",
          errorMessage: `Failed to parse package.json: ${e.message}`,
          affectedFiles: ["package.json"],
          relevantCode: packageJson,
          expectedBehavior: "package.json must be a valid JSON object.",
          selectedDesignConstraints: "N/A",
          approvedPlanConstraints: "N/A",
        },
      };
    }

    return { isValid: true };
  }

  private validateSecurity(files: Record<string, string>): { isValid: boolean; failure?: ValidationFailure } {
    const keyPatterns = [
      /AIzaSy[A-Za-z0-9_\-]{33}/, // Google Key
      /sk-or-v1-[A-Za-z0-9]{64}/, // OpenRouter
      /gsk_[A-Za-z0-9]{48}/,       // Groq Key
      /nvapi-[A-Za-z0-9_\-]{64}/   // NVIDIA Key
    ];

    for (const [fpath, code] of Object.entries(files)) {
      for (const pattern of keyPatterns) {
        if (pattern.test(code)) {
          return {
            isValid: false,
            failure: {
              errorType: "Security Violation",
              errorMessage: `Detected exposed private API credentials matching pattern inside '${fpath}'.`,
              affectedFiles: [fpath],
              relevantCode: "[REDACTED API KEY PATTERN MATCH]",
              expectedBehavior: "Frontend code must never contain private keys or server tokens.",
              selectedDesignConstraints: "N/A",
              approvedPlanConstraints: "Ensure complete safety and key privacy in browser bundles.",
            },
          };
        }
      }
    }

    return { isValid: true };
  }

  private validateBuild(
    files: Record<string, string>,
    projectMode: "frontend" | "fullstack"
  ): { isValid: boolean; failure?: ValidationFailure } {
    if (projectMode === "frontend") {
      if (!files["index.html"]) {
        return {
          isValid: false,
          failure: {
            errorType: "Build Failure",
            errorMessage: "Frontend missing 'index.html' file.",
            affectedFiles: ["index.html"],
            relevantCode: "Empty directory",
            expectedBehavior: "Provide entry point index.html.",
            selectedDesignConstraints: "N/A",
            approvedPlanConstraints: "N/A",
          },
        };
      }
    } else {
      if (!files["src/main.tsx"] && !files["src/index.tsx"] && !files["src/App.tsx"]) {
        return {
          isValid: false,
          failure: {
            errorType: "Build Failure",
            errorMessage: "Missing main React bootstrap files in 'src/' directory (App.tsx / main.tsx).",
            affectedFiles: ["src/App.tsx"],
            relevantCode: "Missing main boot scripts.",
            expectedBehavior: "Create src/App.tsx and bootstrap rendering scripts.",
            selectedDesignConstraints: "N/A",
            approvedPlanConstraints: "React TypeScript applications require src/App.tsx.",
          },
        };
      }
    }

    return { isValid: true };
  }

  private validateRuntime(
    files: Record<string, string>,
    projectMode: "frontend" | "fullstack"
  ): { isValid: boolean; failure?: ValidationFailure } {
    // Check that entry point has valid non-empty bootstrap code
    const mainFile = projectMode === "frontend" ? "index.html" : "src/App.tsx";
    const mainCode = files[mainFile] || "";

    if (mainCode.trim().length < 50) {
      return {
        isValid: false,
        failure: {
          errorType: "Runtime Failure",
          errorMessage: `Entry point file '${mainFile}' is empty or contains insufficient bootstrap code.`,
          affectedFiles: [mainFile],
          relevantCode: mainCode,
          expectedBehavior: `Provide working code inside the main entrypoint file '${mainFile}'.`,
          selectedDesignConstraints: "Visual layouts must load fully.",
          approvedPlanConstraints: "Must follow approved architectural outlines.",
        },
      };
    }

    return { isValid: true };
  }
}
