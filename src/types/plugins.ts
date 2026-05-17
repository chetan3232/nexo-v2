export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  category: "database" | "auth" | "payments" | "ui" | "deployment";
  dependencies?: string[];
}

export interface PluginRuntime {
  onInstall: (context: any) => Promise<void>;
  onExecute: (prompt: string, context: any) => Promise<any>;
  onUninstall: (context: any) => Promise<void>;
}
