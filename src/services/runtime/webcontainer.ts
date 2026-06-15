import { WebContainer } from "@webcontainer/api";
import { useRuntimeStore } from "../../stores/runtimeStore";

export class WebContainerService {
  private static instance: WebContainerService;
  private webcontainer: WebContainer | null = null;

  public static getInstance() {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService();
    }
    return WebContainerService.instance;
  }

  async boot() {
    const runtimeStore = useRuntimeStore.getState();
    if (this.webcontainer) {
      runtimeStore.setIsBooted(true);
      return this.webcontainer;
    }

    runtimeStore.addTerminalLog("Booting WebContainer runtime...");

    try {
      this.webcontainer = await WebContainer.boot();
      runtimeStore.setIsBooted(true);
      runtimeStore.addTerminalLog("WebContainer booted successfully.");
      return this.webcontainer;
    } catch (error) {
      runtimeStore.addTerminalLog(`Error booting WebContainer: ${error}`);
      throw error;
    }
  }

  async mount(files: any) {
    if (!this.webcontainer) await this.boot();
    await this.webcontainer!.mount(files);
  }

  async spawn(
    command: string,
    args: string[],
    onData?: (data: string) => void,
  ) {
    if (!this.webcontainer) throw new Error("WebContainer not booted");

    const process = await this.webcontainer.spawn(command, args);
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          onData?.(data);
          useRuntimeStore.getState().addTerminalLog(data);
        },
      }),
    );

    return process;
  }

  getWebContainer() {
    return this.webcontainer;
  }
}
