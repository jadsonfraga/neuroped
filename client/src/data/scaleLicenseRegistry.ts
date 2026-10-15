import type { ScaleEntry } from "./scaleFilter";

/**
 * Registro de licença/proveniência por escala (Onda 0 do banco de escalas).
 *
 * Regras (AGENTS.md · Verdade clínica):
 *  - `verified_official_source` exige `sourceUrl` e `verifiedOn` (página oficial do detentor);
 *  - `catalog_field_unverified` apenas repete o campo legado `licencaUso`; NÃO é verificação;
 *  - `owner_decision` registra instrumento licenciado MANTIDO no app por decisão do responsável
 *    clínico (15/10/2026). A decisão não equivale a licença: `softwareAllowed` fica "unverified"
 *    e nenhum pedido de licença é feito por este projeto;
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

/** Instrumentos licenciados que abrem no app e foram MANTIDOS por decisão do responsável (15/10/2026). */
export const OWNER_RETAINED_LICENSED_IDS: readonly string[] = [
  "cbcl", "conners", "brief2", "cdi2", "asq3", "denver", "pedsql", "cshq", "abc", "cars",
  "mchat", "world-mchat-rf", "crafft", "world-crafft-21", "sdq", "world-sdq",
  "scared", "world-scared-child-parent", "vanderbilt", "world-vanderbilt-parent-teacher",
] as const;

const retained = (id: string, status: LicenseStatus, note: string, extra: Partial<ScaleLicenseRecord> = {}): ScaleLicenseRecord => ({
  id, status, basis: "owner_decision", softwareAllowed: "unverified", note, ...extra,
});

export const SCALE_LICENSE_RECORDS: readonly ScaleLicenseRecord[] = [
  // ---- Licenciados mantidos por decisão do responsável (sem licença verificada) ----
  retained("cbcl", "proprietary", "ASEBA (proprietário). Mantido por decisão do responsável; sem licença verificada."),
  retained("conners", "proprietary", "Conners 3 (MHS, proprietário). Mantido por decisão do responsável; sem licença verificada."),
  retained("brief2", "proprietary", "BRIEF-2 (PAR, proprietário). Mantido por decisão do responsável; sem licença verificada."),
  retained("cdi2", "proprietary", "CDI-2 (MHS, proprietário). Mantido por decisão do responsável; sem licença verificada."),
  retained("asq3", "proprietary", "ASQ-3 (Brookes): reprodução eletrônica vedada pelo editor. Mantido por decisão do responsável.", { sourceUrl: "https://agesandstages.com", verifiedOn: V }),
  retained("denver", "proprietary", "Denver II (proprietário). Mantido por decisão do responsável; sem licença verificada."),
  retained("pedsql", "proprietary", "PedsQL (Mapi Research Trust). Mantido por decisão do responsável; sem licença verificada."),
  retained("cshq", "restricted", "CSHQ (autora; uso sob permissão). Mantido por decisão do responsável; sem licença verificada."),
  retained("abc", "proprietary", "Aberrant Behavior Checklist (comercial). Mantido por decisão do responsável; sem licença verificada."),
  retained("cars", "proprietary", "CARS (WPS). Mantido por decisão do responsável; sem licença verificada."),
  retained("mchat", "free_clinical_use", "M-CHAT-R/F: gratuito para uso clínico; embutir em software distribuído a terceiros exige licença (Robins). Mantido por decisão do responsável.", { canonicalId: "mchat", sourceUrl: "https://mchatscreen.com", verifiedOn: V, attribution: "© 2009 Robins, Fein & Barton" }),
  retained("world-mchat-rf", "free_clinical_use", "Alias de `mchat`.", { canonicalId: "mchat", sourceUrl: "https://mchatscreen.com", verifiedOn: V }),
  retained("sdq", "restricted", "SDQ: copyright; versão eletrônica só com licença da Youth in Mind. Mantido por decisão do responsável.", { canonicalId: "sdq", sourceUrl: "https://www.sdqinfo.org", verifiedOn: V, attribution: "© Robert Goodman" }),
  retained("world-sdq", "restricted", "Alias de `sdq`.", { canonicalId: "sdq", sourceUrl: "https://www.sdqinfo.org", verifiedOn: V }),
  retained("scared", "restricted", "SCARED: uso livre em clínica sem fins lucrativos; SaaS exige permissão da autora. Mantido por decisão do responsável.", { canonicalId: "scared", sourceUrl: "https://www.pediatricbipolar.pitt.edu/resources/instruments", verifiedOn: V }),
  retained("world-scared-child-parent", "restricted", "Alias de `scared`.", { canonicalId: "scared", sourceUrl: "https://www.pediatricbipolar.pitt.edu/resources/instruments", verifiedOn: V }),
  retained("vanderbilt", "restricted", "Vanderbilt: copyright AAP/NICHQ. Mantido por decisão do responsável.", { canonicalId: "vanderbilt", sourceUrl: "https://www.nichq.org", verifiedOn: V }),
  retained("world-vanderbilt-parent-teacher", "restricted", "Alias de `vanderbilt`.", { canonicalId: "vanderbilt", sourceUrl: "https://www.nichq.org", verifiedOn: V }),

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
  retained("crafft", "restricted", "CRAFFT: sem verificação oficial própria; mantida a classificação mais restritiva entre as duas entradas duplicadas (`world-crafft-21` = restrita). Mantido por decisão do responsável.", { canonicalId: "crafft" }),
  retained("world-crafft-21", "restricted", "Alias de `crafft`.", { canonicalId: "crafft" }),
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
];

/**
 * Pares/grupos de ids que são o MESMO instrumento. A chave é o id canônico (o que o filtro mostra);
 * os demais ficam fora do catálogo filtrável (página e dados permanecem acessíveis).
 */
export const CANONICAL_ALIASES: Readonly<Record<string, readonly string[]>> = {
  mchat: ["world-mchat-rf"],
  snap: ["world-snap-iv-26"],
  vanderbilt: ["world-vanderbilt-parent-teacher"],
  sdq: ["world-sdq"],
  scared: ["world-scared-child-parent"],
  phqa: ["world-phq-a"],
  cssrs: ["world-c-ssrs"],
  ygtss: ["world-ygtss"],
  crafft: ["world-crafft-21"],
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
  if (rec.basis === "owner_decision" || rec.status === "restricted" || rec.status === "proprietary") {
    return legacyRestricted ? scale.licencaUso : "restrita";
  }
  if (rec.basis === "verified_official_source" && rec.softwareAllowed === true) return "livre";
  return scale.licencaUso;
}
