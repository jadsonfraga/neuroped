import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
export const sample: string;
export interface CoverMetadata {
  patient: string;
  detail: string;
  title: string;
  subtitle: string;
}
export function contentFromMarkdown(md: string): Content[];
export function definition(
  md: string,
  meta: CoverMetadata,
  logo: string,
): TDocumentDefinitions;
