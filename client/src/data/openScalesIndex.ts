import type { ScaleEntry } from "./scaleFilter";
import { swycSpecs } from "./openScalesSwyc";
import { dupCheck, toInteractiveDefs, toLicenseRecord, toScaleEntry, type OpenScaleSpec } from "./openScaleKit";

/** Todas as escalas ABERTAS das ondas 1–3 (fonte oficial verificada; ver scaleLicenseRegistry). */
export const openScaleSpecs: readonly OpenScaleSpec[] = [...swycSpecs];
dupCheck(openScaleSpecs);
export const openScaleCatalog: ScaleEntry[] = openScaleSpecs.map(toScaleEntry);
export const openScaleItems = toInteractiveDefs(openScaleSpecs);
export const openScaleLicenseRecords = openScaleSpecs.map(toLicenseRecord);
