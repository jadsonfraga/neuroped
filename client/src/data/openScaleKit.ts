import type { ScaleEntry } from "./scaleFilter";
import type { InteractiveScaleDef } from "./interactiveScaleItems";
import type { ScaleLicenseRecord } from "./scaleLicenseRegistry";

/**
 * Kit das escalas ABERTAS das ondas 1–3 (domínio público / uso livre verificado na fonte).
 * Uma especificação gera: entrada do catálogo + definição interativa + registro de licença.
 * Texto dos itens = texto oficial em português da fonte citada; só correções tipográficas.
 */
export interface OpenScaleSpec {
  wave: 1 | 2 | 3;
  id: string;
  name: string;
  fullName: string;
  ageMin: number;
  ageMax: number;
  queixas: string[];
  respondente: ScaleEntry["respondente"];
  prioridade: ScaleEntry["prioridade"];
  tempo: string;
  description: string;
  /** Citação da fonte oficial (instrumento + texto em português). */
  fonte: string;
  validacaoBrasil: string;
  scoringCutoff: string;
  assessmentUse: NonNullable<ScaleEntry["assessmentUse"]>;
  applicationMode: NonNullable<ScaleEntry["applicationMode"]>;
  primaryDomain: string;
  overlapGroup: string;
  signalTags: string[];
  verbalRequirement?: ScaleEntry["verbalRequirement"];
  literacyRequirement?: ScaleEntry["literacyRequirement"];
  license: {
    status: ScaleLicenseRecord["status"];
    sourceUrl: string;
    verifiedOn: string;
    attribution: string;
    note?: string;
  };
  def: InteractiveScaleDef;
}

export function toScaleEntry(spec: OpenScaleSpec): ScaleEntry {
  return {
    id: spec.id, name: spec.name, fullName: spec.fullName, ageMin: spec.ageMin, ageMax: spec.ageMax,
    queixas: spec.queixas, respondente: spec.respondente, prioridade: spec.prioridade, tempo: spec.tempo,
    appRoute: `/generic-scale/${spec.id}`, description: spec.description, fonte: spec.fonte,
    validacaoBrasil: spec.validacaoBrasil, scoringCutoff: spec.scoringCutoff,
    licencaUso: "livre", suicideRiskInstrument: false, psychosisRiskInstrument: false,
    assessmentUse: spec.assessmentUse, applicationMode: spec.applicationMode, implementationStatus: "complete",
    verbalRequirement: spec.verbalRequirement ?? "indiferente", literacyRequirement: spec.literacyRequirement ?? "indiferente",
    signalTags: spec.signalTags, primaryDomain: spec.primaryDomain, overlapGroup: spec.overlapGroup,
  };
}

export function toLicenseRecord(spec: OpenScaleSpec): ScaleLicenseRecord {
  return {
    id: spec.id, status: spec.license.status, basis: "verified_official_source", softwareAllowed: true,
    sourceUrl: spec.license.sourceUrl, verifiedOn: spec.license.verifiedOn, attribution: spec.license.attribution,
    wave: spec.wave, note: spec.license.note,
  };
}

export function toInteractiveDefs(specs: readonly OpenScaleSpec[]): Record<string, InteractiveScaleDef> {
  return Object.fromEntries(specs.map((s) => [s.id, s.def]));
}

export function dupCheck(specs: readonly OpenScaleSpec[]): void {
  const ids = new Set<string>();
  for (const s of specs) { if (ids.has(s.id)) throw new Error(`id duplicado nas escalas abertas: ${s.id}`); ids.add(s.id); }
}
