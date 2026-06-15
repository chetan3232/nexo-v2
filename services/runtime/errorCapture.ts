import { Orchestrator } from '../../agents/Orchestrator';

const errorPatterns = [
  /Cannot read properties of/i,
  /is not a function/i,
  /SyntaxError/i,
  /ReferenceError/i,
  /is not defined/i,
  /Failed to compile/i,
  /Module not found/i,
  /Unexpected token/i,
  /React is not defined/i,
  /Cannot find module/i,
];

export const checkErrorAndTriggerHeal = (errorMsg: string, orchestrator: Orchestrator): boolean => {
  const isBug = errorPatterns.some((pattern) => pattern.test(errorMsg));
  if (isBug) {
    console.warn("[ErrorCapture] Detected crash pattern. Triggering Self-Healing loop...", errorMsg);
    // Execute async self healing
    orchestrator.runSelfHealing(errorMsg);
    return true;
  }
  return false;
};
