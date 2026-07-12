const fs = require('fs');
const path = require('path');

function loadProjectModes() {
    try {
        const filePath = path.resolve(__dirname, '../../../src/config/projectModes.ts');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Extract the object literal from the file content
        const startIdx = fileContent.indexOf('{');
        const endIdx = fileContent.lastIndexOf('}');
        if (startIdx === -1 || endIdx === -1) {
            throw new Error("Could not find configuration object bounds in projectModes.ts");
        }
        const objectStr = fileContent.substring(startIdx, endIdx + 1);
        
        // Safe evaluation of the static configuration object
        return new Function(`return ${objectStr}`)();
    } catch (e) {
        console.error("[projectModes] Failed to read projectModes.ts, using fallback:", e.message);
        // Direct fallback copy to ensure resilience
        return {
            frontend: {
                id: "frontend",
                label: "Frontend",
                stack: ["HTML5", "CSS3", "Vanilla JavaScript"],
                allowedProjectTypes: ["portfolio", "landing-page"],
                forbiddenTechnologies: ["React", "TypeScript", "Node.js", "Express", "Python", "PHP", "Java", "Vue", "Angular", "Next.js"]
            },
            fullstack: {
                id: "fullstack",
                label: "Fullstack",
                stack: ["React", "TypeScript", "Node.js"],
                allowedProjectTypes: ["fullstack-application"],
                forbiddenTechnologies: ["PHP", "Python", "Java", "Vue", "Angular"]
            }
        };
    }
}

module.exports = loadProjectModes();
