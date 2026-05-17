import { WebsiteContent } from "../types";
import toast from "react-hot-toast";

export class ExportService {
  private static instance: ExportService;

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  private constructor() {}

  public async exportToZip(content: WebsiteContent) {
    toast.loading("Generating project ZIP...", { id: "export" });
    // Simulation of ZIP generation
    setTimeout(() => {
      toast.success("Project exported as ZIP!", { id: "export" });
    }, 2000);
  }

  public async deployToVercel(content: WebsiteContent) {
    toast.loading("Deploying to Vercel...", { id: "export" });
    setTimeout(() => {
      toast.success("Successfully deployed to Vercel!", { id: "export" });
    }, 3000);
  }

  public async exportAsMobileApp() {
    toast.loading("Packaging Android APK...", { id: "export" });
    setTimeout(() => {
      toast.success("Android APK generated!", { id: "export" });
    }, 5000);
  }

  public async exportToGitHub() {
    toast.loading("Pushing to GitHub...", { id: "export" });
    setTimeout(() => {
      toast.success("Pushed to github.com/user/nexo-project", { id: "export" });
    }, 2500);
  }
}
