export interface AIBlock {
  id: string;
  name: string;
  description: string;
  code: string;
  category: string;
  timestamp: number;
}

export class BlockService {
  private static instance: BlockService;
  private blocks: AIBlock[] = [];

  public static getInstance(): BlockService {
    if (!BlockService.instance) {
      BlockService.instance = new BlockService();
    }
    return BlockService.instance;
  }

  private constructor() {
    // Load from localStorage if available
    const saved = localStorage.getItem("nexo_ai_blocks");
    if (saved) this.blocks = JSON.parse(saved);
  }

  public saveBlock(
    name: string,
    description: string,
    code: string,
    category: string,
  ) {
    const block: AIBlock = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      code,
      category,
      timestamp: Date.now(),
    };
    this.blocks.push(block);
    localStorage.setItem("nexo_ai_blocks", JSON.stringify(this.blocks));
  }

  public getBlocks(): AIBlock[] {
    return this.blocks;
  }

  public getBlockContext(): string {
    if (this.blocks.length === 0) return "";
    return `
USER SAVED BLOCKS (Use these if referenced):
${this.blocks.map((b) => `- [${b.name}]: ${b.description}`).join("\n")}
        `.trim();
  }
}
