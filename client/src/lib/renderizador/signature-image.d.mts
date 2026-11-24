export const SIGNATURE_STORED_MAX_BYTES: number;
export const SIGNATURE_INPUT_MAX_BYTES: number;
export const SIGNATURE_MAX_WIDTH: number;
export const SIGNATURE_MIN_WIDTH: number;
export const SIGNATURE_PADDING: number;
export interface InkBox { x: number; y: number; w: number; h: number }
export function inkBounds(rgba: ArrayLike<number>, width: number, height: number, threshold?: number): InkBox | null;
export function paddedCrop(bounds: InkBox, width: number, height: number, padding?: number): InkBox;
export function scaledSize(width: number, height: number, maxWidth: number): { w: number; h: number };
export function hasTransparency(rgba: ArrayLike<number>): boolean;
export function dataUrlBytes(dataUrl: string): number;
export function prepareSignaturePng(file: File): Promise<{ dataUrl: string; opaque: boolean; cropped: boolean; resized: boolean }>;
