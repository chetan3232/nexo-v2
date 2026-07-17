import { DesignConcept, SelectedDesignSnapshot } from "../types/designConcept";

export class DesignLockService {
  private static instance: DesignLockService;

  public static getInstance(): DesignLockService {
    if (!DesignLockService.instance) {
      DesignLockService.instance = new DesignLockService();
    }
    return DesignLockService.instance;
  }

  private constructor() {}

  generateFingerprint(concept: DesignConcept): string {
    const dataStr = `${concept.id}_${concept.name}_${concept.layoutStructure}_${JSON.stringify(concept.colorSystem)}_${JSON.stringify(concept.typography)}`;
    let hash = 0;
    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `lock_${Math.abs(hash).toString(16)}`;
  }

  createSnapshot(concept: DesignConcept, version: number): SelectedDesignSnapshot {
    const snapshot: SelectedDesignSnapshot = {
      designId: concept.id,
      designVersion: version,
      designName: concept.name,
      layoutStructure: concept.layoutStructure,
      colorSystem: { ...concept.colorSystem },
      typography: { ...concept.typography },
      componentStyle: concept.componentStyle,
      animationStyle: concept.animationStyle,
      pageStructure: [...concept.pageStructure],
      previewReference: { ...concept.previewFiles },
      selectedAt: Date.now(),
      fingerprint: this.generateFingerprint(concept),
    };
    
    return Object.freeze(JSON.parse(JSON.stringify(snapshot))) as SelectedDesignSnapshot;
  }

  injectDesignLockPrompt(systemPrompt: string, snapshot: SelectedDesignSnapshot | null): string {
    if (!snapshot) return systemPrompt;

    return `${systemPrompt}

==================================================
VISUAL SOURCE OF TRUTH (DESIGN LOCK SNAPSHOT)
==================================================
A design concept has been selected and locked by the user. You must STRICTLY respect the visual direction, layout architecture, color palette, typography, component styling, page structure, and animations outlined below. Do not deviate, alter, or replace them.

Design Name: ${snapshot.designName}
Design ID: ${snapshot.designId} (Version: ${snapshot.designVersion})
Layout Architecture: ${snapshot.layoutStructure}
Color System:
- Primary: ${snapshot.colorSystem.primary}
- Secondary: ${snapshot.colorSystem.secondary}
- Accent: ${snapshot.colorSystem.accent}
- Background: ${snapshot.colorSystem.background}
- Surface: ${snapshot.colorSystem.surface}
- Text: ${snapshot.colorSystem.text}

Typography:
- fontFamily: ${snapshot.typography.fontFamily}
- headings: ${snapshot.typography.headings}
- body: ${snapshot.typography.body}

Component Style: ${snapshot.componentStyle}
Animation Style: ${snapshot.animationStyle}
Page Structure: ${snapshot.pageStructure.join(", ")}
Design Fingerprint: ${snapshot.fingerprint}

STRICT REQUIREMENT: Under no circumstances can any agent change the primary design direction, replace the layout architecture, change the color system, switch the component style, ignore selected animations, or generate a visually unrelated application.
==================================================
`;
  }
}
