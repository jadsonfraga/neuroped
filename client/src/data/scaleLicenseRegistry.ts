import type { ScaleEntry } from "./scaleFilter";
import { openScaleLicenseRecords } from "./openScalesIndex";

/**
 * Registro de licença/proveniência por escala (Onda 0 do banco de escalas).
 *
 * Regras (AGENTS.md · Verdade clínica):
 *  - `verified_official_source` exige `sourceUrl` e `verifiedOn` (página oficial do detentor);
 *  - `catalog_field_unverified` apenas repete o campo legado `licencaUso`; NÃO é verificação;
 *  - `owner_decision` registra decisão do responsável clínico sobre instrumento licenciado. Em 15/10/2026
 *    alguns foram mantidos no app; em 17/10/2026 o responsável RETIROU todos (`softwareAllowed: false`):
 *    primeiro os de ASEBA, MHS, PAR e WPS, depois ASQ-3, Denver II, PedsQL, CSHQ, ABC, M-CHAT-R/F,
 *    CRAFFT, SDQ, SCARED, Vanderbilt e Vineland-3. Ficam como ficha, com alternativa no app (autoral
 *    NeuroPed ou livre verificada). Nenhum pedido de licença é feito por este projeto;
 *  - escala nova (`wave` ≥ 1) só entra com fonte verificada, URL e data.
 */
export type LicenseStatus =
  | "public_domain"
  | "open_free"
  | "free_clinical_use"
  | "authorial"
  | "proprietary"
  | "restricted";

export type LicenseBasis =
  | "verified_official_source"
  | "catalog_field_unverified"
  | "owner_decision";

export interface ScaleLicenseRecord {
  id: string;
  /** Instrumento canônico quando este id é um alias do mesmo instrumento. */
  canonicalId?: string;
  status: LicenseStatus;
  basis: LicenseBasis;
  /** true = uso em software verificado; false = verificado como NÃO permitido; "unverified" = não verificado. */
  softwareAllowed: boolean | "unverified";
  sourceUrl?: string;
  verifiedOn?: string;
  attribution?: string;
  /** Onda do plano em que o instrumento entrou (0 = existente). */
  wave?: number;
  note?: string;
}

const V = "2026-10-15";

/**
 * Instrumentos licenciados que abrem no app MANTIDOS por decisão do responsável. Vazia desde 17/10/2026:
 * os 15 ids mantidos em 15/10/2026 (ASQ-3, Denver II, PedsQL, CSHQ, ABC, M-CHAT-R/F, CRAFFT, SDQ, SCARED,
 * Vanderbilt e aliases) foram retirados e viraram ficha de referência.
 */
export const OWNER_RETAINED_LICENSED_IDS: readonly string[] = [] as const;

/** Licenciado retirado do app: só ficha de referência; aplicar exige o material licenciado do editor. */
const removed = (id: string, instrument: string, alternative: string, extra: Partial<ScaleLicenseRecord> = {}): ScaleLicenseRecord => ({
  id, status: "proprietary", basis: "owner_decision", softwareAllowed: false,
  note: `${instrument}. Retirado do app por decisão do responsável (17/10/2026): ficha de referência, sem itens nem escore. Alternativa no app: ${alternative}.`,
  ...extra,
});

export const SCALE_LICENSE_RECORDS: readonly ScaleLicenseRecord[] = [
  // ---- Retirados do app por decisão do responsável (17/10/2026): ficha de referência, sem itens nem escore ----
  removed("cbcl", "CBCL (ASEBA, proprietário)", "Perfil emocional e comportamental (pais/professor)"),
  removed("conners", "Conners 3 (MHS, proprietário)", "Atenção, atividade e autocontrole (pais/professor)"),
  removed("brief2", "BRIEF-2 (PAR, proprietário)", "Funções executivas — versão ampliada (pais) e na escola (professor)"),
  removed("cdi2", "CDI-2 (MHS, proprietário)", "Como eu me sinto (criança) e Humor depressivo (adolescente)"),
  removed("cars", "CARS-2 (WPS, proprietário)", "Observação clínica de sinais do espectro autista"),
  removed("asq3", "ASQ-3 (Brookes, proprietário; reprodução eletrônica vedada pelo editor)", "SWYC Marcos do desenvolvimento, formulário da idade (livre, Tufts)", { sourceUrl: "https://agesandstages.com", verifiedOn: V }),
  removed("denver", "Denver II (Denver Developmental Materials, proprietário)", "SWYC Marcos do desenvolvimento, formulário da idade (livre, Tufts)"),
  removed("pedsql", "PedsQL (Mapi Research Trust, licenciado)", "Qualidade de vida (pais) e (criança e adolescente)"),
  removed("cshq", "CSHQ (autora; uso sob permissão)", "Sono da criança (pais)", { status: "restricted" }),
  removed("abc", "Aberrant Behavior Checklist (Slosson, comercial)", "Comportamentos que preocupam em TEA e deficiência intelectual"),
  removed("mchat", "M-CHAT-R/F (Robins, Fein & Barton): gratuito para uso clínico, mas embutir em software distribuído a terceiros exige licença", "Sinais precoces do espectro autista (pais) e Interação social precoce (pais)", { status: "free_clinical_use", canonicalId: "mchat", sourceUrl: "https://mchatscreen.com", verifiedOn: V, attribution: "© 2009 Robins, Fein & Barton" }),
  removed("sdq", "SDQ (© Robert Goodman; versão eletrônica só com licença da Youth in Mind)", "Perfil emocional e comportamental (pais, professor e adolescente) e SWYC PPSC", { status: "restricted", canonicalId: "sdq", sourceUrl: "https://www.sdqinfo.org", verifiedOn: V, attribution: "© Robert Goodman" }),
  removed("scared", "SCARED (uso livre em clínica sem fins lucrativos; software como serviço exige permissão da autora)", "Ansiedade (criança e adolescente) e Ansiedade no seguimento (pais)", { status: "restricted", canonicalId: "scared", sourceUrl: "https://www.pediatricbipolar.pitt.edu/resources/instruments", verifiedOn: V }),
  removed("vanderbilt", "NICHQ Vanderbilt (© AAP/NICHQ)", "Atenção, atividade e autocontrole (pais/professor)", { status: "restricted", canonicalId: "vanderbilt", sourceUrl: "https://www.nichq.org", verifiedOn: V }),
  removed("vineland", "Vineland-3 (Pearson, proprietário)", "Comportamento adaptativo (pais)"),

  // ---- Livres verificados nas fontes oficiais (diagnóstico de 15/10/2026) ----
  { id: "phqa", canonicalId: "phqa", status: "public_domain", basis: "verified_official_source", softwareAllowed: true, sourceUrl: "https://www.phqscreeners.com", verifiedOn: V, note: "PHQ-A/PHQ-9: domínio público (Pfizer)." },
  { id: "world-phq-a", canonicalId: "phqa", status: "public_domain", basis: "verified_official_source", softwareAllowed: true, sourceUrl: "https://www.phqscreeners.com", verifiedOn: V, note: "Alias de `phqa`; rótulo anterior `restrita` estava incorreto." },
  { id: "snap", canonicalId: "snap", status: "open_free", basis: "verified_official_source", softwareAllowed: true, sourceUrl: "https://www.adhd.net", verifiedOn: V, note: "SNAP-IV (MTA, 26 itens): uso livre. Tradução BR (Mattos 2006) é apresentação da versão, não validação psicométrica completa." },
  { id: "world-snap-iv-26", canonicalId: "snap", status: "open_free", basis: "verified_official_source", softwareAllowed: true, sourceUrl: "https://www.adhd.net", verifiedOn: V, note: "Alias de `snap`; rótulo anterior `restrita` estava incorreto." },
  { id: "cssrs", canonicalId: "cssrs", status: "free_clinical_use", basis: "verified_official_source", softwareAllowed: true, sourceUrl: "https://cssrs.columbia.edu", verifiedOn: V, note: "C-SSRS: livre em saúde/comunidade, inclusive embutido em prontuário; ensaios clínicos eletrônicos exigem licença." },
  { id: "world-c-ssrs", canonicalId: "cssrs", status: "free_clinical_use", basis: "verified_official_source", softwareAllowed: true, sourceUrl: "https://cssrs.columbia.edu", verifiedOn: V, note: "Alias de `cssrs`." },
  { id: "psc17", canonicalId: "psc17", status: "open_free", basis: "verified_official_source", softwareAllowed: true, sourceUrl: "https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist", verifiedOn: V, note: "PSC: livre para baixar e usar. PSC-17 em português não consta no site; sem corte BR próprio." },
  { id: "world-psc17", canonicalId: "psc17", status: "open_free", basis: "verified_official_source", softwareAllowed: true, sourceUrl: "https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist", verifiedOn: V, note: "Alias de `psc17`." },

  // ---- Duplicatas sem verificação oficial própria (conservador: o campo legado prevalece) ----
  { id: "ygtss", canonicalId: "ygtss", status: "open_free", basis: "catalog_field_unverified", softwareAllowed: "unverified" },
  { id: "world-ygtss", canonicalId: "ygtss", status: "open_free", basis: "catalog_field_unverified", softwareAllowed: "unverified", note: "Alias de `ygtss`." },
  removed("crafft", "CRAFFT 2.1 (Boston Children's Hospital; uso em software sob permissão)", "Uso de substâncias (adolescente)", { status: "restricted", canonicalId: "crafft" }),
  { id: "bears", canonicalId: "bears", status: "open_free", basis: "catalog_field_unverified", softwareAllowed: "unverified" },
  { id: "world-bears", canonicalId: "bears", status: "open_free", basis: "catalog_field_unverified", softwareAllowed: "unverified", note: "Alias de `bears` (alias sem aplicação própria)." },
  { id: "asq-suicide", canonicalId: "asq-suicide", status: "public_domain", basis: "catalog_field_unverified", softwareAllowed: "unverified" },
  { id: "world-asq-suicide", canonicalId: "asq-suicide", status: "public_domain", basis: "catalog_field_unverified", softwareAllowed: "unverified", note: "Alias de `asq-suicide`." },
  ...["pant-v7-067", "pant-v7-068", "pant-v7-074", "pant-v7-078"].map((id): ScaleLicenseRecord => ({
    id, status: "authorial", basis: "catalog_field_unverified", softwareAllowed: true,
    note: "Escala passiva autoral (Dr. Jadson Fraga, e-book PANT); `licencaUso` ausente no catálogo legado.",
  })),
  { id: "cats", canonicalId: "cats", status: "open_free", basis: "catalog_field_unverified", softwareAllowed: "unverified" },
  { id: "world-cats", canonicalId: "cats", status: "restricted", basis: "catalog_field_unverified", softwareAllowed: false, note: "Alias de `cats` marcado restrito/external_only; fora do filtro." },
  // ---- Ondas 1–3: escalas abertas com fonte oficial verificada (geradas das especificações) ----
  ...openScaleLicenseRecords,
];

/**
 * Pares/grupos de ids que são o MESMO instrumento. A chave é o id canônico (o que o filtro mostra);
 * os demais ficam fora do catálogo filtrável (página e dados permanecem acessíveis).
 */
// Os aliases world-* de M-CHAT-R/F, Vanderbilt, SDQ, SCARED e CRAFFT saíram com os originais (17/10/2026):
// duplicavam a ficha de referência e se apresentavam como "sem custo".
export const CANONICAL_ALIASES: Readonly<Record<string, readonly string[]>> = {
  snap: ["world-snap-iv-26"],
  phqa: ["world-phq-a"],
  cssrs: ["world-c-ssrs"],
  ygtss: ["world-ygtss"],
  psc17: ["world-psc17"],
  bears: ["world-bears"],
  "asq-suicide": ["world-asq-suicide"],
  cats: ["world-cats", "world-cts"],
};

export const CANONICAL_ALIAS_IDS: ReadonlySet<string> = new Set(Object.values(CANONICAL_ALIASES).flat());

const BY_ID = new Map(SCALE_LICENSE_RECORDS.map((r) => [r.id, r]));

export function getExplicitLicenseRecord(id: string): ScaleLicenseRecord | undefined {
  return BY_ID.get(id);
}

/** Licença legada que exige registro explícito (qualquer coisa além de autoral/livre). */
export function requiresExplicitLicenseRecord(scale: Pick<ScaleEntry, "licencaUso">): boolean {
  return scale.licencaUso !== "autoral" && scale.licencaUso !== "livre";
}

/**
 * Registro efetivo: explícito quando existe; senão derivado do campo legado, sempre com
 * basis `catalog_field_unverified` (nunca apresentado como verificação).
 */
export function resolveLicenseRecord(scale: Pick<ScaleEntry, "id" | "licencaUso">): ScaleLicenseRecord | null {
  const explicit = BY_ID.get(scale.id);
  if (explicit) return explicit;
  if (scale.licencaUso === "autoral") return { id: scale.id, status: "authorial", basis: "catalog_field_unverified", softwareAllowed: true };
  if (scale.licencaUso === "livre") return { id: scale.id, status: "open_free", basis: "catalog_field_unverified", softwareAllowed: "unverified" };
  return null;
}

/**
 * Licença efetiva mais conservadora entre a entrada do catálogo e o registro, usada no
 * dedupe canônico: se o registro diz restrito/proprietário, o filtro trata como restrita.
 */
export function effectiveLicencaUso(scale: ScaleEntry): ScaleEntry["licencaUso"] {
  const rec = BY_ID.get(scale.id);
  if (!rec) return scale.licencaUso;
  const legacyRestricted = scale.licencaUso === "comercial" || scale.licencaUso === "restrita" || scale.licencaUso === "contato_autor";
  // Mantidos por decisão do responsável: o app segue como está (sem rebaixar nem promover a licença legada).
  if (rec.basis === "owner_decision") return scale.licencaUso;
  if (rec.status === "restricted" || rec.status === "proprietary") {
    return legacyRestricted ? scale.licencaUso : "restrita";
  }
  if (rec.basis === "verified_official_source" && rec.softwareAllowed === true) return "livre";
  return scale.licencaUso;
}
