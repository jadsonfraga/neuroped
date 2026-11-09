import type { jsPDF } from "jspdf";
export const sample: string;
export interface CoverMetadata {
  patient: string;
  detail: string;
  title: string;
  subtitle: string;
}
export interface RenderAssets {
  fonts: { normal: string; bold: string; italic: string };
  logo: string;
}
export interface MarkdownBlock {
  type: string;
  [key: string]: unknown;
}
export function contentFromMarkdown(md: string): MarkdownBlock[];
export function createPantPdf(
  constructor: typeof jsPDF,
  md: string,
  meta: CoverMetadata,
  assets: RenderAssets,
): jsPDF;
export function createPdfBlob(
  constructor: typeof jsPDF,
  md: string,
  meta: CoverMetadata,
  assets: RenderAssets,
): Blob;
