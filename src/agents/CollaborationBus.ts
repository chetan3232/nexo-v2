export interface AgentRequest {
  from: string;
  to: string;
  content: string;
  status: "pending" | "fulfilled";
  response?: string;
}

export class CollaborationBus {
  private static instance: CollaborationBus;
  private requests: AgentRequest[] = [];
  private listeners: ((req: AgentRequest) => void)[] = [];

  public static getInstance(): CollaborationBus {
    if (!CollaborationBus.instance) {
      CollaborationBus.instance = new CollaborationBus();
    }
    return CollaborationBus.instance;
  }

  private constructor() {}

  public postRequest(from: string, to: string, content: string) {
    const request: AgentRequest = { from, to, content, status: "pending" };
    this.requests.push(request);
    console.log(`[Bus] ${from} requested ${to}: ${content}`);
    this.listeners.forEach((l) => l(request));
    return request;
  }

  public fulfillRequest(request: AgentRequest, response: string) {
    request.status = "fulfilled";
    request.response = response;
    console.log(`[Bus] ${request.to} fulfilled request for ${request.from}`);
  }

  public onNewRequest(listener: (req: AgentRequest) => void) {
    this.listeners.push(listener);
  }

  public getRequestsFor(agentName: string) {
    return this.requests.filter(
      (r) => r.to === agentName && r.status === "pending",
    );
  }

  public clear() {
    this.requests = [];
  }
}
