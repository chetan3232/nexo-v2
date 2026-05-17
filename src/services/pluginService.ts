import { PluginManifest, PluginRuntime } from "../types/plugins";

export class PluginService {
  private static instance: PluginService;
  private installedPlugins: Map<string, PluginManifest> = new Map();

  public static getInstance(): PluginService {
    if (!PluginService.instance) {
      PluginService.instance = new PluginService();
    }
    return PluginService.instance;
  }

  private constructor() {
    // Load default plugins for demo
    this.installPlugin({
      id: "supabase-core",
      name: "Supabase Integration",
      description: "Auto-configure Supabase auth and database.",
      version: "1.0.0",
      author: "Nexo Team",
      icon: "database",
      category: "database",
    });

    this.installPlugin({
      id: "stripe-payments",
      name: "Stripe Setup",
      description: "One-click checkout and subscription setup.",
      version: "1.0.0",
      author: "Nexo Team",
      icon: "credit-card",
      category: "payments",
    });

    this.installPlugin({
      id: "shadcn-ui",
      name: "Shadcn Installer",
      description: "Auto-install and configure Shadcn/UI components.",
      version: "1.2.0",
      author: "Nexo Team",
      icon: "layout",
      category: "ui",
    });
  }

  public installPlugin(manifest: PluginManifest) {
    this.installedPlugins.set(manifest.id, manifest);
    console.log(`Plugin installed: ${manifest.name}`);
  }

  public getInstalledPlugins(): PluginManifest[] {
    return Array.from(this.installedPlugins.values());
  }

  public isPluginInstalled(id: string): boolean {
    return this.installedPlugins.has(id);
  }

  /**
   * Injects plugin-specific logic into the AI context.
   */
  public getPluginContext(): string {
    const plugins = this.getInstalledPlugins();
    if (plugins.length === 0) return "";

    return `
INSTALLED PLUGINS:
${plugins.map((p) => `- ${p.name}: ${p.description}`).join("\n")}

When generating code, use the patterns provided by these plugins.
        `.trim();
  }
}
