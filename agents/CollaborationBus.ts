type EventCallback = (data: any) => void;

export class CollaborationBus {
  private static instance: CollaborationBus;
  private listeners: Record<string, EventCallback[]> = {};

  private constructor() {}

  public static getInstance(): CollaborationBus {
    if (!CollaborationBus.instance) {
      CollaborationBus.instance = new CollaborationBus();
    }
    return CollaborationBus.instance;
  }

  public publish(event: string, data: any): void {
    console.log(`[CollaborationBus] Event: ${event}`, data);
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((cb) => cb(data));
  }

  public subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }
}
export default CollaborationBus;
