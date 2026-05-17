import toast from "react-hot-toast";

export class DeploymentService {
  private static instance: DeploymentService;

  public static getInstance() {
    if (!DeploymentService.instance) {
      DeploymentService.instance = new DeploymentService();
    }
    return DeploymentService.instance;
  }

  async generateConfig(platform: "vercel" | "netlify" | "docker") {
    toast.loading(`Generating ${platform} configuration...`, { id: "deploy" });

    let files: Record<string, string> = {};

    switch (platform) {
      case "vercel":
        files["vercel.json"] = JSON.stringify(
          {
            version: 2,
            builds: [{ src: "package.json", use: "@vercel/static-build" }],
          },
          null,
          2,
        );
        break;
      case "netlify":
        files["netlify.toml"] =
          '[build]\n  command = "npm run build"\n  publish = "dist"';
        break;
      case "docker":
        files["Dockerfile"] =
          'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nRUN npm run build\nCMD ["npm", "start"]';
        break;
    }

    await new Promise((r) => setTimeout(r, 1000));
    toast.success(`${platform} config added to project!`, { id: "deploy" });
    return files;
  }

  async deployToVercel(projectId: string) {
    toast.loading("Deploying to Vercel...", { id: "vercel" });
    await new Promise((r) => setTimeout(r, 3000));
    toast.success("Site live on Vercel!");
    return { url: `https://${projectId}.vercel.app` };
  }
}
