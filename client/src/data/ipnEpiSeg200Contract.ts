// Conteúdo integral e contrato clínico do IPN-EPI/SEG 200.
// Fonte: PDF autoral de 02/08/2026. Não validado psicometricamente.

import { ipnEpiSegFamiliaItems } from "./ipnEpiSeg200ItemsFamilia";
import { ipnEpiSegEscolaItems } from "./ipnEpiSeg200ItemsEscola";
import { ipnEpiSegAutopercepcaoItems } from "./ipnEpiSeg200ItemsAutopercepcao";
import { ipnEpiSegObservacaoItems } from "./ipnEpiSeg200ItemsObservacao";
import { ipnEpiSegAnamneseItems } from "./ipnEpiSeg200ItemsAnamnese";
import { ipnEpiSegDiferenciaisItems } from "./ipnEpiSeg200ItemsDiferenciais";
import { ipnEpiSegSegurancaItems } from "./ipnEpiSeg200ItemsSeguranca";
import { ipnEpiSegSinteseItems } from "./ipnEpiSeg200ItemsSintese";

export type IpnEpiSegModuleKey =
  | "familia" | "escola" | "autopercepcao" | "observacao"
  | "anamnese" | "diferenciais" | "seguranca" | "sintese";

export type IpnEpiSegInformant = "pais" | "professor" | "autoaplicavel" | "clinico" | "todos";
export type IpnEpiSegAssessmentUse = "triagem" | "diagnostico" | "monitorizacao";

export interface IpnEpiSegItemContract {
  id: string; module: IpnEpiSegModuleKey; domain: string; title: string; prompt: string;
  ageMin: number; ageMax: number; informant: IpnEpiSegInformant;
  scored: boolean; redFlag: boolean; contextTags: string[]; signalTags: string[];
}

export interface IpnEpiSegModuleContract {
  key: IpnEpiSegModuleKey; id: string; label: string; expectedItems: number;
  ageMin: number; ageMax: number; informants: Exclude<IpnEpiSegInformant, "todos">[];
  assessmentUse: IpnEpiSegAssessmentUse; communication: "indiferente" | "nao_verbal_compativel";
  literacy: "indiferente"; contextTags: string[]; implementationStatus: "complete";
  scored: boolean; redFlagsOutsideScore: boolean;
}

export const IPN_EPI_SEG_PROVENANCE = {
  slug: "ipn-epi-seg-200",
  title: "IPN-EPI/SEG 200 — Epilepsia, Eventos Paroxísticos e Segurança",
  version: "1.0", generatedAt: "2026-08-02",
  sourcePdf: "2026-08-02 — Epilepsia, Eventos Paroxísticos e Segurança — NeuroPed.pdf",
  license: "autoral", validation: "Pendente de validação psicométrica formal",
  scoring: "Pontuação autoral de necessidade clínica; sem ponto de corte diagnóstico",
  redFlags: "Independentes do escore",
  driveFileId: "1hY-9PY3WCIoaqUSmUQ5cLbRN5e5IidbB",
  sha256: "326e2186e04cbdc36cc8b094c3d41fa497dd75133c2a3b95c21a36f2a09837c6",
  bytes: 904919, pages: 200,
} as const;

export const ipnEpiSegModules: IpnEpiSegModuleContract[] = [
  {
    "key": "familia",
    "id": "ipn-epi-seg-familia-50",
    "label": "Família e Cuidadores",
    "expectedItems": 50,
    "ageMin": 0,
    "ageMax": 215,
    "informants": ["pais"],
    "assessmentUse": "triagem",
    "communication": "indiferente",
    "literacy": "indiferente",
    "contextTags": ["casa", "sono", "banho", "alimentação", "medicação", "transporte", "segurança"],
    "implementationStatus": "complete",
    "scored": true,
    "redFlagsOutsideScore": false
  },
  {
    "key": "escola",
    "id": "ipn-epi-seg-escola-30",
    "label": "Escola e Equipe Terapêutica",
    "expectedItems": 30,
    "ageMin": 24,
    "ageMax": 215,
    "informants": ["professor"],
    "assessmentUse": "triagem",
    "communication": "indiferente",
    "literacy": "indiferente",
    "contextTags": ["escola", "AEE", "transporte escolar", "educação física", "recreio", "excursão"],
    "implementationStatus": "complete",
    "scored": true,
    "redFlagsOutsideScore": false
  },
  {
    "key": "autopercepcao",
    "id": "ipn-epi-seg-autopercepcao-20",
    "label": "Autopercepção Apoiada",
    "expectedItems": 20,
    "ageMin": 96,
    "ageMax": 215,
    "informants": ["autoaplicavel"],
    "assessmentUse": "triagem",
    "communication": "nao_verbal_compativel",
    "literacy": "indiferente",
    "contextTags": ["casa", "escola", "amizades", "sono", "atividade física", "privacidade"],
    "implementationStatus": "complete",
    "scored": true,
    "redFlagsOutsideScore": false
  },
  {
    "key": "observacao",
    "id": "ipn-epi-seg-observacao-20",
    "label": "Observação Clínica",
    "expectedItems": 20,
    "ageMin": 0,
    "ageMax": 215,
    "informants": ["clinico"],
    "assessmentUse": "triagem",
    "communication": "indiferente",
    "literacy": "indiferente",
    "contextTags": ["consulta", "vídeo", "exame", "pós-evento", "estado interictal"],
    "implementationStatus": "complete",
    "scored": true,
    "redFlagsOutsideScore": false
  },
  {
    "key": "anamnese",
    "id": "ipn-epi-seg-anamnese-20",
    "label": "Anamnese",
    "expectedItems": 20,
    "ageMin": 0,
    "ageMax": 215,
    "informants": ["clinico"],
    "assessmentUse": "diagnostico",
    "communication": "indiferente",
    "literacy": "indiferente",
    "contextTags": ["pré-consulta", "história clínica", "documentos", "tratamentos", "exames"],
    "implementationStatus": "complete",
    "scored": false,
    "redFlagsOutsideScore": false
  },
  {
    "key": "diferenciais",
    "id": "ipn-epi-seg-diferenciais-20",
    "label": "Diferenciais",
    "expectedItems": 20,
    "ageMin": 0,
    "ageMax": 215,
    "informants": ["clinico"],
    "assessmentUse": "diagnostico",
    "communication": "indiferente",
    "literacy": "indiferente",
    "contextTags": ["consulta", "urgência", "sono", "cardiovascular", "metabólico", "comportamental"],
    "implementationStatus": "complete",
    "scored": false,
    "redFlagsOutsideScore": false
  },
  {
    "key": "seguranca",
    "id": "ipn-epi-seg-seguranca-20",
    "label": "Segurança e Red Flags",
    "expectedItems": 20,
    "ageMin": 0,
    "ageMax": 215,
    "informants": ["pais", "professor", "autoaplicavel", "clinico"],
    "assessmentUse": "triagem",
    "communication": "indiferente",
    "literacy": "indiferente",
    "contextTags": ["urgência", "casa", "escola", "água", "altura", "trânsito", "medicação"],
    "implementationStatus": "complete",
    "scored": false,
    "redFlagsOutsideScore": true
  },
  {
    "key": "sintese",
    "id": "ipn-epi-seg-sintese-20",
    "label": "Síntese e Plano",
    "expectedItems": 20,
    "ageMin": 0,
    "ageMax": 215,
    "informants": ["clinico"],
    "assessmentUse": "monitorizacao",
    "communication": "indiferente",
    "literacy": "indiferente",
    "contextTags": ["devolutiva", "plano de ação", "escola", "encaminhamentos", "seguimento"],
    "implementationStatus": "complete",
    "scored": false,
    "redFlagsOutsideScore": false
  }
] as IpnEpiSegModuleContract[];

export const ipnEpiSegItems: IpnEpiSegItemContract[] = [
  ...ipnEpiSegFamiliaItems,
  ...ipnEpiSegEscolaItems,
  ...ipnEpiSegAutopercepcaoItems,
  ...ipnEpiSegObservacaoItems,
  ...ipnEpiSegAnamneseItems,
  ...ipnEpiSegDiferenciaisItems,
  ...ipnEpiSegSegurancaItems,
  ...ipnEpiSegSinteseItems
];

export interface IpnEpiSegFilterInput {
  ageMonths: number;
  informant?: Exclude<IpnEpiSegInformant, "todos">;
  assessmentUse?: IpnEpiSegAssessmentUse;
  isVerbal?: boolean; isLiterate?: boolean; signals?: string[]; contexts?: string[];
  implementationStatus?: "complete";
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Filtro determinístico dos oito módulos, sem inferência diagnóstica. */
export function filterIpnEpiSegModules(input: IpnEpiSegFilterInput): IpnEpiSegModuleContract[] {
  const selectedSignals = (input.signals ?? []).map(normalize);
  const selectedContexts = (input.contexts ?? []).map(normalize);
  return ipnEpiSegModules.filter((module) => {
    if (input.ageMonths < module.ageMin || input.ageMonths > module.ageMax) return false;
    if (input.informant && !module.informants.includes(input.informant)) return false;
    if (input.assessmentUse && module.assessmentUse !== input.assessmentUse) return false;
    if (input.implementationStatus && module.implementationStatus !== input.implementationStatus) return false;
    if (input.isVerbal === false && module.communication !== "indiferente" && module.communication !== "nao_verbal_compativel") return false;
    if (input.isLiterate === false && module.literacy !== "indiferente") return false;
    const moduleItems = ipnEpiSegItems.filter((item) => item.module === module.key);
    const signalHaystack = moduleItems.flatMap((item) => item.signalTags).map(normalize);
    const contextHaystack = [...module.contextTags, ...moduleItems.flatMap((item) => item.contextTags)].map(normalize);
    if (selectedSignals.length && !selectedSignals.some((s) => signalHaystack.some((tag) => tag.includes(s) || s.includes(tag)))) return false;
    if (selectedContexts.length && !selectedContexts.some((s) => contextHaystack.some((tag) => tag.includes(s) || s.includes(tag)))) return false;
    return true;
  });
}

export const IPN_EPI_SEG_EXPECTED_TOTAL = 200 as const;
