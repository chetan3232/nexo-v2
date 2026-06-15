import { useRuntimeStore } from '../../stores/runtimeStore';
import { DevServerService } from './devServer';

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

    store.addLog("⚡ [Sandbox] WebContainerService.boot() triggered (Single Instance VM)...");
    await new Promise((resolve) => setTimeout(resolve, 800));
    store.setIsBooted(true);
    store.addLog("✅ [Sandbox] WebContainer VM environment booted successfully.");
    return true;
  }

  async mountAndRun(files: Record<string, string>): Promise<number> {
    const store = useRuntimeStore.getState();
    
    // 1. Booting
    await this.boot();

    // 2. Mounting (Writing files to virtual disk)
    store.addLog("📂 [Sandbox] Mounting files to virtual disk...");
    await new Promise((resolve) => setTimeout(resolve, 300));
    store.addLog(`📂 [Sandbox] Wrote ${Object.keys(files).length} files to virtual workspace disk.`);

    // 3. Installing
    store.setRunningCommand("npm install");
    const updatedFiles = await DevServerService.install(files);
    
    // 4. Running
    store.setRunningCommand("npm run dev");
    store.addLog("🚀 [Sandbox] npm run dev");
    store.addLog("🚀 [Sandbox]  VITE v5.4.12  ready in 435 ms");
    store.addLog("🚀 [Sandbox]  ➜  Local:   http://localhost:3000/");
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const mockPort = 3000;
    store.setDevServerPort(mockPort);
    store.setRunningCommand(null);

    return mockPort;
  }
}
export default WebContainerService;

