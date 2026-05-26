import { useRuntimeStore } from "../../stores/runtimeStore";
import { Orchestrator } from "../../agents/Orchestrator";

export class ErrorCaptureService {
  private static instance: ErrorCaptureService;

  public static getInstance() {
    if (!ErrorCaptureService.instance) {
      ErrorCaptureService.instance = new ErrorCaptureService();
    }
    return ErrorCaptureService.instance;
  }

  // Capture console errors from the iframe
  captureIframeError(error: any) {
    const runtimeStore = useRuntimeStore.getState();
    const errorMsg = error?.message || String(error);

    // Log with severity prefix (single argument)
    runtimeStore.addConsoleLog(`[ERROR] ${errorMsg}`);

    // Trigger self-healing if it looks like a code error
    if (this.isHealableError(errorMsg)) {
      Orchestrator.getInstance().triggerSelfHealing(errorMsg);
    }
  }

  private isHealableError(msg: string) {
    const commonErrors = [
      "ReferenceError",
      "TypeError",
      "Module not found",
      "Unexpected token",
      "React is not defined",
      "Cannot read properties",
      "is not a function",
      "is not defined",
      "SyntaxError",
      "Uncaught Error",
    ];
    return commonErrors.some((err) => msg.includes(err));
  }
}
