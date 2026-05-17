export function detectDependencies(files: Record<string, string>): string[] {
  const deps = new Set<string>();
  const importRegex = /(?:import|from)\s+['"]([^' "./][^'"]+)['"]/g;

  Object.values(files).forEach((content) => {
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const pkg = match[1];
      // Ignore relative imports and built-ins
      if (
        !pkg.startsWith(".") &&
        !pkg.startsWith("/") &&
        !["react", "react-dom"].includes(pkg)
      ) {
        // Handle scoped packages or sub-paths (e.g., lucide-react/dist/...)
        const parts = pkg.split("/");
        const basePkg = pkg.startsWith("@")
          ? `${parts[0]}/${parts[1]}`
          : parts[0];
        deps.add(basePkg);
      }
    }
  });

  return Array.from(deps);
}

export function updatePackageJson(
  pkgJsonStr: string,
  detectedDeps: string[],
): string {
  try {
    const pkg = JSON.parse(pkgJsonStr);
    const currentDeps = { ...pkg.dependencies };
    let changed = false;

    detectedDeps.forEach((dep) => {
      if (!currentDeps[dep]) {
        // Assign latest or common versions for known libraries
        const versions: Record<string, string> = {
          "lucide-react": "^0.446.0",
          "framer-motion": "^11.0.0",
          clsx: "latest",
          "tailwind-merge": "latest",
          recharts: "latest",
          axios: "latest",
          express: "latest",
          prisma: "latest",
          "@prisma/client": "latest",
          sqlite3: "latest",
          cors: "latest",
        };
        currentDeps[dep] = versions[dep] || "latest";
        changed = true;
      }
    });

    if (changed) {
      pkg.dependencies = currentDeps;
      return JSON.stringify(pkg, null, 2);
    }
    return pkgJsonStr;
  } catch (e) {
    return pkgJsonStr;
  }
}
