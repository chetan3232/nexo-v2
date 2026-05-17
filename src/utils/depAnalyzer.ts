export interface DepNode {
  id: string;
  label: string;
  dependencies: string[];
  isUnused: boolean;
}

export class DepAnalyzer {
  public static analyze(files: Record<string, string>): DepNode[] {
    const nodes: DepNode[] = [];
    const fileNames = Object.keys(files);
    const allImports = new Set<string>();

    fileNames.forEach((fileName) => {
      const content = files[fileName];
      const dependencies: string[] = [];

      // Basic regex for imports
      const importRegex = /import\s+.*\s+from\s+['"](.+?)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        let dep = match[1];
        // Clean relative paths
        if (dep.startsWith("./") || dep.startsWith("../")) {
          // This is a simplified resolver
          dependencies.push(dep);
          allImports.add(dep);
        }
      }

      nodes.push({
        id: fileName,
        label: fileName.split("/").pop() || fileName,
        dependencies,
        isUnused: false,
      });
    });

    // Detect unused (simplified: if not imported by anyone and not index.html/main file)
    nodes.forEach((node) => {
      if (
        node.id !== "index.html" &&
        node.id !== "src/main.tsx" &&
        node.id !== "src/App.tsx"
      ) {
        const isImported = nodes.some((n) =>
          n.dependencies.some((d) => node.id.includes(d.replace("./", ""))),
        );
        if (!isImported) node.isUnused = true;
      }
    });

    return nodes;
  }
}
