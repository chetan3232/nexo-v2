import { WebContainerService } from "./webcontainer";
import { useRuntimeStore } from "../../stores/runtimeStore";

export class DevServerService {
  private static instance: DevServerService;
  private serverProcess: any = null;

  public static getInstance() {
    if (!DevServerService.instance) {
      DevServerService.instance = new DevServerService();
    }
    return DevServerService.instance;
  }

  async start() {
    const wc = WebContainerService.getInstance();
    const runtimeStore = useRuntimeStore.getState();

    if (this.serverProcess) {
      this.serverProcess.kill();
    }

    runtimeStore.addTerminalLog("Starting dev server...");

    this.serverProcess = await wc.spawn("npm", ["run", "dev"], (data) => {
      // Listen for server URL
      if (data.includes("http://")) {
        const urlMatch = data.match(/http:\/\/[\w.-]+:\d+/);
        if (urlMatch) {
          runtimeStore.setUrl(urlMatch[0]);
        }
      }
    });

    // Error detection logic
    wc.getWebContainer()?.on("server-ready", (port, url) => {
      runtimeStore.setUrl(url);
      runtimeStore.addTerminalLog(`Server ready at ${url}`);
    });

    return this.serverProcess;
  }

  async install() {
    const wc = WebContainerService.getInstance();
    const runtimeStore = useRuntimeStore.getState();

    runtimeStore.addTerminalLog("Installing dependencies...");
    const installProcess = await wc.spawn("npm", ["install"]);
    const exitCode = await installProcess.exit;

    if (exitCode !== 0) {
      throw new Error(`npm install failed with exit code ${exitCode}`);
    }

    runtimeStore.addTerminalLog("Dependencies installed successfully.");
  }
}
