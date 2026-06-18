import { WebContainerService } from "../services/runtime/webcontainer";
import { useProjectStore } from "../stores/projectStore";

/**
 * Compiles the project inside WebContainer if a build script exists,
 * then reads index.html and inlines its local CSS and JS assets
 * into a single, self-contained HTML string.
 */
export async function compileAndBundle(): Promise<string> {
  const wc = WebContainerService.getInstance().getWebContainer();
  if (!wc) {
    throw new Error("WebContainer is not booted yet.");
  }

  // 1. Check if package.json has a build script
  let hasBuildScript = false;
  try {
    const packageJsonStr = await wc.fs.readFile("package.json", "utf-8");
    const packageJson = JSON.parse(packageJsonStr);
    if (packageJson.scripts && packageJson.scripts.build) {
      hasBuildScript = true;
    }
  } catch (e) {
    console.log("No package.json or build script found, skipping npm run build.");
  }

  if (hasBuildScript) {
    try {
      console.log("[Bundler] Running npm run build...");
      const buildProcess = await wc.spawn("npm", ["run", "build"]);
      const exitCode = await buildProcess.exit;
      if (exitCode !== 0) {
        console.warn(`[Bundler] npm run build failed with exit code ${exitCode}.`);
      } else {
        console.log("[Bundler] npm run build completed successfully.");
      }
    } catch (e) {
      console.error("[Bundler] Error running build process:", e);
    }
  }

  // 2. Check if a 'dist' directory containing index.html was created
  let useDist = false;
  try {
    const files = await wc.fs.readdir("dist");
    if (files.includes("index.html")) {
      useDist = true;
    }
  } catch (e) {
    // dist folder or index.html inside it doesn't exist
  }

  const baseDir = useDist ? "dist" : "";
  const indexHtmlPath = useDist ? "dist/index.html" : "index.html";

  console.log(`[Bundler] Loading root HTML from: ${indexHtmlPath}`);

  // Read index.html
  let html = "";
  try {
    html = await wc.fs.readFile(indexHtmlPath, "utf-8");
  } catch (e) {
    // Fallback to store state
    const storeFiles = useProjectStore.getState().currentContent?.files || {};
    html = storeFiles["index.html"] || "<html><body><h1>No index.html found</h1></body></html>";
  }

  // Helper to read file from WebContainer or store state fallback
  const readFileContent = async (filePath: string): Promise<string> => {
    // Clean and normalize paths
    let normalized = filePath.trim().replace(/^\.?\//, "");
    
    // If using dist, check if file is relative to dist/
    let targetPath = baseDir ? `${baseDir}/${normalized}` : normalized;

    try {
      return await wc.fs.readFile(targetPath, "utf-8");
    } catch (e) {
      // Fallback: search in store files
      const storeFiles = useProjectStore.getState().currentContent?.files || {};
      return storeFiles[normalized] || storeFiles[targetPath] || "";
    }
  };

  // 3. Inline CSS stylesheets
  const cssTags: { tag: string; href: string }[] = [];
  let match: RegExpExecArray | null;
  
  // Find all <link href="..."> tags
  const linkRegex = /<link\s+[^>]*?href=["']([^"']+)["'][^>]*?>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const tag = match[0];
    const href = match[1];
    if (tag.toLowerCase().includes("stylesheet") || href.endsWith(".css")) {
      cssTags.push({ tag, href });
    }
  }

  for (const cssTag of cssTags) {
    if (
      cssTag.href.startsWith("http://") ||
      cssTag.href.startsWith("https://") ||
      cssTag.href.startsWith("//")
    ) {
      continue; // Skip external stylesheets
    }
    
    console.log(`[Bundler] Inlining CSS: ${cssTag.href}`);
    const cssContent = await readFileContent(cssTag.href);
    if (cssContent) {
      html = html.replace(cssTag.tag, `<style>\n${cssContent}\n</style>`);
    }
  }

  // 4. Inline JS scripts
  const jsTags: { tag: string; src: string }[] = [];
  
  // Find all <script src="..."></script> tags (including permissive end tags like </script >)
  // codeql[js/bad-tag-filter]
  const scriptRegex = /<script\s+[^>]*?src=["']([^"']+)["'][^>]*?>\s*<\/script\b[^>]*>/gi;
  while ((match = scriptRegex.exec(html)) !== null) {
    const tag = match[0];
    const src = match[1];
    jsTags.push({ tag, src });
  }

  for (const jsTag of jsTags) {
    if (
      jsTag.src.startsWith("http://") ||
      jsTag.src.startsWith("https://") ||
      jsTag.src.startsWith("//")
    ) {
      continue; // Skip external scripts
    }

    console.log(`[Bundler] Inlining JS: ${jsTag.src}`);
    const jsContent = await readFileContent(jsTag.src);
    if (jsContent) {
      html = html.replace(
        jsTag.tag,
        `<script type="module">\n${jsContent}\n</script>`
      );
    }
  }

  return html;
}
