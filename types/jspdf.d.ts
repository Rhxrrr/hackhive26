declare module "jspdf" {
  export class jsPDF {
    constructor(orientation?: string, unit?: string, format?: string | number[]);
    text(text: string, x: number, y: number, options?: any): jsPDF;
    setFontSize(size: number): jsPDF;
    setFont(family: string, style?: string): jsPDF;
    setTextColor(r: number, g?: number, b?: number): jsPDF;
    setFillColor(r: number, g?: number, b?: number): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: string): jsPDF;
    addPage(): jsPDF;
    save(filename: string): void;
    splitTextToSize(text: string, maxWidth: number): string[];
  }
}
