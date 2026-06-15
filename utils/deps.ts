/**
 * Autodetects package dependencies from code import lines.
 */
export const discoverDependencies = (files: Record<string, string>): Record<string, string> => {
  const deps: Record<string, string> = {
    'react': '^19.2.1',
    'react-dom': '^19.2.1',
    'framer-motion': '^12.23.25',
    'lucide-react': '^0.556.0',
  };

  const importRegex = /from\s+['"]([^'"]+)['"]/g;

  Object.values(files).forEach((content) => {
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const pkg = match[1];
      // Skip relative/absolute imports
      if (pkg.startsWith('.') || pkg.startsWith('/')) continue;
      
      // Get base module name (e.g. lodash/map -> lodash)
      const parts = pkg.split('/');
      const basePkg = pkg.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

      if (!deps[basePkg]) {
        // Assign standard versions for common packages
        if (basePkg === 'recharts') deps[basePkg] = '^2.12.7';
        else if (basePkg === 'canvas-confetti') deps[basePkg] = '^1.9.3';
        else if (basePkg === 'date-fns') deps[basePkg] = '^3.6.0';
        else if (basePkg === 'lodash') deps[basePkg] = '^4.17.21';
        else deps[basePkg] = 'latest';
      }
    }
  });

  return deps;
};
