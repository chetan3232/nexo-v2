export interface DesignConcept {
  id: string;
  name: string;
  description: string;
  designDirection: string;
  layoutStructure: string;
  colorSystem: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    [key: string]: any;
  };
  typography: {
    fontFamily: string;
    headings: string;
    body: string;
    [key: string]: any;
  };
  componentStyle: string;
  animationStyle: string;
  pageStructure: string[];
  previewFiles: Record<string, string>;
  generationMetadata: {
    model: string;
    timestamp: number;
    [key: string]: any;
  };
}
