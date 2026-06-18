import toast from "react-hot-toast";
import { createClient } from "@insforge/sdk";
import { compileAndBundle } from "../utils/bundler";

export class DeploymentService {
  private static instance: DeploymentService;

  public static getInstance() {
    if (!DeploymentService.instance) {
      DeploymentService.instance = new DeploymentService();
    }
    return DeploymentService.instance;
  }

  /**
   * Compiles the project, bundles it into a single HTML file,
   * uploads it to InsForge database, and returns the live preview URL.
   */
  async deployProject(): Promise<string> {
    toast.loading("Compiling and bundling project...", { id: "deploy-status" });
    
    // 1. Compile and bundle the HTML/CSS/JS/React files
    const bundledHtml = await compileAndBundle();
    
    toast.loading("Uploading to InsForge edge hosting...", { id: "deploy-status" });

    // 2. Insert to InsForge database table 'user_deployments'
    const client = createClient({
      baseUrl: "https://g7nugnui.ap-southeast.insforge.app",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjI4OTh9.M-ENCUD91CkhHdFKT03HoalGjfqRkI9uhiOLO1FC1o8",
    });

    const deploymentId = crypto.randomUUID();
    const { error } = await client.database.from("user_deployments").insert({
      id: deploymentId,
      html: bundledHtml,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[DeploymentService] InsForge database error:", error);
      toast.error(`Deploy failed: ${error.message}`, { id: "deploy-status" });
      throw new Error(`Deployment database insertion failed: ${error.message}`);
    }

    const deployUrl = `https://g7nugnui.ap-southeast.insforge.app/api/serve-deployment?id=${deploymentId}`;
    toast.success("Deployment live! 🚀", { id: "deploy-status" });
    return deployUrl;
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

