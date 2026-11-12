export interface StructuredText {
  markdown: string;
  mode: "markdown" | "plain";
  headings: number;
  tables: number;
  lists: number;
  titles: string[];
  changed: boolean;
}
export function wordsOf(text: string): string[];
export function structurePastedText(input: string): StructuredText;
