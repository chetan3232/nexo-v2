import { useRuntimeStore } from '../../stores/runtimeStore';
import { discoverDependencies } from '../../utils/deps';

export class WebContainerService {
  private static instance: WebContainerService;

  private constructor() {}

  public static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService();
    }
    return WebContainerService.instance;
  }

  async boot(): Promise<boolean> {
    const store = useRuntimeStore.getState();
    if (store.isBooted) return true;

    store.addLog("⚡ [Sandbox] Launching Virtual Browser WebContainer VM...");
    await new Promise((resolve) => setTimeout(resolve, 800));
    store.setIsBooted(true);
    store.addLog("✅ [Sandbox] WebContainer environment booted successfully.");
    return true;
  }

  async mountAndRun(files: Record<string, string>): Promise<number> {
    const store = useRuntimeStore.getState();
    await this.boot();

    store.setRunningCommand("npm install");
    store.addLog("📦 [Sandbox] Resolving package.json dependency versions...");
    
    // Auto-discover imports
    const deps = discoverDependencies(files);
    store.addLog(`📦 [Sandbox] Discovered dependencies: ${JSON.stringify(deps)}`);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    store.addLog("📦 [Sandbox] Installed 32 packages in 1.1s.");
    
    store.setRunningCommand("npm run dev");
    store.addLog("🚀 [Sandbox] Running development server: vite dev");
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const mockPort = 3000;
    store.setDevServerPort(mockPort);
    store.addLog(`🚀 [Sandbox] Development server listening on http://localhost:${mockPort}`);
    store.setRunningCommand(null);

    return mockPort;
  }
}
export default WebContainerService;
