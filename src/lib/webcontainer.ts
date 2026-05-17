import { WebContainer } from "@webcontainer/api";

export class WebContainerManager {
  private static instance: WebContainerManager;
  private _webcontainer: WebContainer | null = null;

  public static getInstance(): WebContainerManager {
    if (!WebContainerManager.instance) {
      WebContainerManager.instance = new WebContainerManager();
    }
    return WebContainerManager.instance;
  }

  private constructor() {}

  async boot() {
    if (this._webcontainer) return this._webcontainer;
    this._webcontainer = await WebContainer.boot();
    return this._webcontainer;
  }

  async mount(files: Record<string, { file: { contents: string } } | any>) {
    const wc = await this.boot();
    await wc.mount(files);
  }

  async runInstall(onData?: (data: string) => void) {
    const wc = await this.boot();
    const process = await wc.spawn("npm", ["install"]);

    process.output.pipeTo(
      new WritableStream({
        write(data) {
          onData?.(data);
        },
      }),
    );

    return process.exit;
  }

  async runDev(
    onData?: (data: string) => void,
    onReady?: (url: string) => void,
  ) {
    const wc = await this.boot();
    const process = await wc.spawn("npm", ["run", "dev"]);

    process.output.pipeTo(
      new WritableStream({
        write(data) {
          onData?.(data);
        },
      }),
    );

    wc.on("server-ready", (port, url) => {
      onReady?.(url);
    });

    return process;
  }

  async writeFile(path: string, content: string) {
    const wc = await this.boot();
    await wc.fs.writeFile(path, content);
  }

  get webcontainer() {
    return this._webcontainer;
  }
}
