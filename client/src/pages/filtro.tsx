import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Award,
  Baby,
  BookOpen,
  Brain,
  ClipboardCheck,
  FileDown,
  Filter,
  GraduationCap,
  HeartPulse,
  Medal,
  MessageCircle,
  Moon,
  Pill,
  RotateCcw,
  School,
  Search,
  ShieldAlert,
  Star,
  Table,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Mascote } from "@/components/Mascote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DirectTestsRecommender } from "@/components/DirectTestsRecommender";
import { ParentTestsRecommender } from "@/components/ParentTestsRecommender";
import { OPBRecommendationCards } from "@/components/OPBRecommendationCards";
import {
  allScales,
  scales,
  faixasEtarias,
  queixas,
  QUEIXA_COOCORRENCIA,
  type ScaleEntry,
} from "@/data/scaleFilter";
import { INTERACTIVE_SCALE_IDS } from "@/data/interactiveScaleIds.generated";
import { norm, guessQueixas, guessRespondente } from "@/data/queixaMapping";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { buildUploadedReferenceCatalogForApp } from "@/data/uploadedInstrumentFilterBridge";
import { noCostWorldScales } from "@/data/noCostWorldScales";
import type {
  QueixaAgeRecommendations,
  RecommendationOPB,
} from "@/data/filterRecommendationsOPB";
import { getClinicalTiers } from "@/data/clinicalRanking";
import { selectCuratedTiers, selectPodium } from "@/data/filterPodium";
import { opbParentCopy } from "@/data/opbParentCopy";
import { PopularSymptomPicker } from "@/components/PopularSymptomPicker";
import { getAllSignalsForQueixa } from "@/data/signalsAndSymptoms";
import {
  filterScalesWithClinicalRescue,
  getBroadbandFallback,
  generateContextualRecommendation,
  getImplementationStatus,
  isAcuteRiskContext,
  SAFE_EMPTY_MESSAGE,
  type FilterContext,
  type RefinedScaleMatch,
} from "@/data/advancedFilterLogic";
import { haptic } from "@/lib/haptic";
import { softHover, softTap, softTick } from "@/lib/softSounds";
import {
  buildFilterCsv,
  buildFilterPdf,
  downloadBlob,
  type FilterExportRow,
  type FilterExportMeta,
} from "@/lib/filterExport";
import {
  loadFilterPreferences,
  saveFilterPreferences,
} from "@/lib/filterPreferences";

type Slot =
  | "Ouro"
  | "Prata"
  | "Bronze"
  | "Teste Direto"
  | "Questionário Escolar"
  | "Satisfação Medicação";
type AvailabilityMode = "complete" | "all";
type Tier = "ouro" | "prata" | "bronze";
type Row =
  | [
      number,
      string,
      string,
      string,
      string,
      string,
      "Ouro" | "Prata" | "Bronze",
      "embed" | "permission" | "link",
    ]
  | [
      number,
      string,
      string,
      string,
      string,
      string,
      "Ouro" | "Prata" | "Bronze",
      "embed" | "permission" | "link",
      string, // score — sistema de escore (referência)
      string, // cutoff — pontos de corte (referência)
      string, // diagnose — diagnóstico-alvo da escala
      string, // sintomas — sinais/sintomas-alvo separados por "|"
      string, // queixas — ids de queixa canônicos separados por "|"
      string, // pubmed — URL da referência PubMed
    ];

// Servido pela PRÓPRIA origem (client/public/data/ entra no build). Antes isto
// apontava para raw.githubusercontent.com: um app clínico offline-first buscando
// catálogo num host de terceiro a cada carga do filtro — falha sem rede, vaza o
// IP do usuário para o GitHub, e o navegador registra erro de console quando a
// requisição falha (reprovava a auditoria errors-in-console e derrubava
// best-practices para 96). A cópia local tem as mesmas 100 linhas e a mesma
// version; só troca travessão por hífen na faixa etária, e ageMonths aceita [–-].
// NOTA: client/public/data/ e data/ na raiz são cópias independentes, sem script
// que as sincronize — quem editar uma precisa editar a outra.
const REGISTRY_URL = `${import.meta.env.BASE_URL}data/neuroped_escalas_neuropsiquiatria_infantil_100.json`;
// EUSM-10 agora vive no catálogo canônico (filterableCatalog, id "eusm10") — sem
// duplicata. CORE_FILTERABLE_CATALOG já o inclui.
const CORE_FILTERABLE_CATALOG = mergeFilterableCatalog(allScales);
const REFERENCE_ONLY_CATALOG = buildUploadedReferenceCatalogForApp(scales);

// Conjunto canônico de ids que abrem como ficha técnica via catch-all
// (/generic-scale/:id renderiza qualquer escala de allScales — página real).
const ALL_SCALE_IDS = new Set(allScales.map((s) => s.id));

/**
 * Rota REAL para a qual uma escala abre (página renderizada de verdade):
 *  1. appRoute dedicado (validado contra App.tsx pelo guard audit:data — ROUTE_404);
 *  2. ficha técnica /generic-scale/:id quando o id existe em allScales (catch-all);
 *  3. catálogo mundial /escalas-neuropsiquiatria para escalas "world-*".
 * Retorna null quando a escala NÃO abre em lugar nenhum (deve sair do filtro).
 */
function resolveAppRoute(scale: ScaleEntry): string | null {
  if (scale.appRoute) return scale.appRoute;
  if (ALL_SCALE_IDS.has(scale.id)) return `/generic-scale/${scale.id}`;
  if (scale.id.startsWith("world-")) return "/escalas-neuropsiquiatria";
  return null;
}

// ids que renderizam APLICAÇÃO INTERATIVA real em /generic-scale/:id
// (itens respondíveis + cálculo de escore) — ver generic-scale.tsx. Inclui os
// Manifesto leve gerado dos dois acervos interativos. Importar os objetos
// completos aqui adicionava quase 2 MB de JavaScript à abertura do filtro.

// Rota dedicada = página implementada de verdade (ex.: /mchat, /asq3), NÃO o
// catch-all /generic-scale/:id (que pode ser só ficha técnica) nem o catálogo
// mundial.
function hasDedicatedRoute(scale: ScaleEntry): boolean {
  const r = scale.appRoute;
  return (
    !!r &&
    !r.startsWith("/generic-scale/") &&
    r !== "/escalas-neuropsiquiatria" &&
    r !== "/filtro"
  );
}

// Abre uma FERRAMENTA USÁVEL (aplicação real), não apenas uma ficha técnica.
// Usado nos rótulos/CTA do pódio e como base do ranking clínico curado.
function opensAsUsableTool(scale: ScaleEntry): boolean {
  return hasDedicatedRoute(scale) || INTERACTIVE_SCALE_IDS.has(scale.id);
}

// Só permanecem no filtro escalas que ABREM uma página própria. Escala sem rota
// real — ou cuja única rota é o catálogo mundial genérico
// (/escalas-neuropsiquiatria), que NÃO abre a escala específica — é removida.
function opensInApp(scale: ScaleEntry): boolean {
  const route = resolveAppRoute(scale);
  if (!route) return false;
  if (route === "/escalas-neuropsiquiatria") return false;
  return true;
}

// Aplicação COMPLETA e preenchível dentro do app: deve ter itens/fluxo interno
// respondível e cálculo/registro. Fichas técnicas, catálogo mundial e escalas
// externas/licenciadas não entram no filtro principal.
function isFullApp(scale: ScaleEntry): boolean {
  // Psicoeducação / portais informativos NÃO são escalas preenchíveis — abrem
  // conteúdo de leitura, não uma aplicação com itens+escore. Fora do filtro.
  if (scale.applicationMode === "psicoeducacao") return false;
  return (
    getImplementationStatus(scale) === "complete" && opensAsUsableTool(scale)
  );
}

function unique(scales: ScaleEntry[]) {
  const seen = new Set<string>();
  return scales.filter((s) =>
    seen.has(s.id) ? false : (seen.add(s.id), true),
  );
}

function ageMonths(range: string) {
  const m = range.replace(",", ".").match(/([0-9.]+)\s*[–-]\s*([0-9.]+)/);
  return m
    ? { min: Math.round(Number(m[1]) * 12), max: Math.round(Number(m[2]) * 12) }
    : { min: 0, max: 216 };
}

function rowToScale(row: Row): ScaleEntry {
  if (!Array.isArray(row) || row.length < 8) {
    throw new Error(
      `Invalid row structure: expected 8+ fields, got ${Array.isArray(row) ? row.length : "non-array"}`,
    );
  }
  const [n, sigla, nome, categoria, idade, respondente, selo, politica] = row;
  const a = ageMonths(idade);
  // Registro enriquecido (v2.0) traz queixas canônicas e sintomas curados por
  // evidência nas colunas 12 e 11; quando ausentes, mantém a inferência por
  // heurística (guessQueixas) como backup.
  const queixasCuradas =
    row.length >= 13 && String(row[12] ?? "") ? String(row[12]).split("|").filter(Boolean) : guessQueixas(categoria, `${sigla} ${nome}`);
  const sintomasCurados =
    row.length >= 12 && String(row[11] ?? "") ? String(row[11]).split("|").filter(Boolean) : undefined;
  return {
    id: `world-registry-${String(n).padStart(3, "0")}`,
    name: sigla,
    fullName: nome,
    ageMin: a.min,
    ageMax: a.max,
    queixas: queixasCuradas,
    respondente: guessRespondente(respondente),
    prioridade: selo === "Bronze" ? "monitorizacao" : "triagem",
    tempo: "3–10 min",
    description: `Escala mundial sem custo. Política: ${politica}. Usar como triagem/monitoramento, nunca diagnóstico isolado.`,
    fonte:
      "Catálogo NeuroPed 100 escalas · verificar fonte oficial antes de embutir itens",
    licencaUso: politica === "embed" ? "livre" : "restrita",
    signalTags: sintomasCurados?.length ? sintomasCurados : undefined,
  } as ScaleEntry;
}

function matchAge(scale: ScaleEntry, selectedAge: string | null) {
  const age = faixasEtarias.find((a) => a.id === selectedAge);
  return !age || (scale.ageMax >= age.min && scale.ageMin <= age.max);
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
  atraso: [
    "desenvolvimento",
    "marcos",
    "bebe",
    "bebê",
    "lactente",
    "prematuro",
  ],
  tea: ["autismo", "autista", "espectro", "social", "mchat", "m-chat"],
  tdah: [
    "adhd",
    "atencao",
    "atenção",
    "hiperatividade",
    "impulsividade",
    "desatencao",
    "desatenção",
  ],
  linguagem: [
    "fala",
    "comunicacao",
    "comunicação",
    "fonologia",
    "vocabulario",
    "vocabulário",
  ],
  aprendizagem: [
    "escola",
    "escolar",
    "leitura",
    "escrita",
    "dislexia",
    "matematica",
    "matemática",
  ],
  ansiedade: [
    "medo",
    "panico",
    "pânico",
    "fobia",
    "preocupacao",
    "preocupação",
  ],
  depressao: ["humor", "tristeza", "depressivo"],
  comportamento: [
    "conduta",
    "oposicao",
    "oposição",
    "agressividade",
    "irritabilidade",
  ],
  sono: ["dormir", "insonia", "insônia", "ronco"],
  epilepsia: ["crise", "convulsao", "convulsão"],
  pc: ["paralisia", "cerebral", "espasticidade"],
  motor: ["coordenacao", "coordenação", "motricidade", "fino", "grossa"],
  sensorial: ["sensorial", "integracao", "integração", "hipersensibilidade"],
  suicidio: ["suicidio", "suicídio", "autolesao", "autolesão", "risco"],
  efeitos: [
    "medicacao",
    "medicação",
    "remedio",
    "remédio",
    "efeito colateral",
    "adesao",
    "adesão",
  ],
};

function expandSearchText(query: string): string {
  if (typeof query !== "string" || query.length === 0) return "";
  const normalized = norm(query);
  const extra: string[] = [];
  for (const [queixa, words] of Object.entries(SEARCH_SYNONYMS)) {
    if (
      normalized.includes(queixa) ||
      words.some((w) => normalized.includes(norm(w)))
    ) {
      extra.push(queixa, ...words);
    }
  }
  return `${query} ${extra.join(" ")}`;
}

function inferQueixasFromSearch(query: string): string[] {
  const normalized = norm(query);
  if (normalized.length < 2) return [];
  return queixas
    .filter((q) => {
      const words = SEARCH_SYNONYMS[q.id] ?? [];
      return (
        normalized.includes(norm(q.id)) ||
        normalized.includes(norm(q.label)) ||
        words.some((w) => normalized.includes(norm(w)))
      );
    })
    .map((q) => q.id);
}

function inferAgeMonthsFromSearch(query: string): number | null {
  const normalized = norm(query).replace(",", ".");
  const month = normalized.match(/\b(\d{1,2})\s*(m|mes|meses)\b/);
  if (month) return Number(month[1]);
  const year = normalized.match(/\b(\d{1,2})(?:\s*(a|ano|anos)|a\b)/);
  if (year) return Number(year[1]) * 12;
  return null;
}
// Realce textual leve para a busca livre. NÃO decide pertinência clínica —
// apenas reordena, dentro dos candidatos já validados pelo motor, os que casam
// com o termo digitado. (A segurança/score clínico vem do advancedFilterLogic.)
function searchBoost(scale: ScaleEntry, query: string) {
  const tokens = norm(expandSearchText(query)).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const text = norm(
    `${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")} ${scale.respondente.join(" ")} ${scale.fonte ?? ""}`,
  );
  let value = 0;
  for (const token of tokens)
    if (text.includes(token)) value += norm(scale.name).includes(token) ? 7 : 2;
  return value;
}

// Idade representativa (meses) da faixa selecionada — usada para consultar o
// ranking clínico curado (clinicalRanking). null quando a idade não foi escolhida.
function ageMonthsFromBand(selectedAge: string | null): number | null {
  const band = selectedAge
    ? faixasEtarias.find((a) => a.id === selectedAge)
    : null;
  return band ? Math.round((band.min + band.max) / 2) : null;
}

// Primeira frase de uma descrição (corta em quebra de linha ou ponto).
function firstSentence(text?: string): string {
  return (text ?? "").split(/[\n.]/)[0].trim();
}

const RESP_LABEL: Record<string, string> = {
  pais: "os pais/cuidadores",
  clinico: "o clínico",
  professor: "o professor",
  autoaplicavel: "o próprio adolescente",
  crianca: "a criança",
  teste_direto_crianca: "a criança (teste direto)",
};

// Monta um card OPB (parent-friendly). Usa o texto curado à mão (opbParentCopy)
// quando existe; senão, deriva um fallback honesto dos dados da própria escala.
// whyUseful do OURO vem da regra (racional contextual); PRATA/BRONZE preferem o
// texto curado da escala e caem para o genérico passado.
function buildOPB(
  seal: "ouro" | "prata" | "bronze",
  scale: ScaleEntry,
  whyUsefulFallback: string,
  queixaLabel: string,
): RecommendationOPB {
  const copy = opbParentCopy[scale.id];
  const resp =
    scale.respondente
      .map((r) => RESP_LABEL[r] ?? r)
      .filter(Boolean)
      .join(", ") || "o avaliador";
  return {
    seal,
    scaleId: scale.id,
    scaleName: scale.name,
    time: scale.tempo || "—",
    mainQuestion:
      copy?.mainQuestion ||
      firstSentence(scale.description) ||
      scale.fullName ||
      scale.name,
    parentExample:
      copy?.parentExample ||
      // Exemplo concreto em linguagem de pais (auditoria escala-a-escala 2026-07):
      // o que observar no dia a dia ao responder — melhor que o fallback genérico.
      scale.exemploPais ||
      `Aplicada com ${resp}; os itens avaliam ${queixaLabel.toLowerCase()} de forma ajustada à faixa etária da criança.`,
    whyUseful:
      seal === "ouro"
        ? whyUsefulFallback
        : copy?.whyUseful || whyUsefulFallback,
  };
}

const OPB_WHY: Record<"prata" | "bronze", string> = {
  prata:
    "Complementa o OURO com outra modalidade, respondente ou domínio de avaliação.",
  bronze:
    "Perspectiva adicional, aprofundamento ou monitorização quando OURO + PRATA deixam dúvidas.",
};

const FLASH_STORAGE_KEY = "neuroped:filter-flash";

function isFlashRoute(): boolean {
  if (typeof window === "undefined") return false;
  const raw = `${window.location.hash || ""}${window.location.search || ""}`;
  // A rota /filtro-escalas ("Triar sem cadastrar", no menu) é SEMPRE efêmera:
  // o clínico que escolhe triar sem cadastrar não deve ter nada persistido em
  // localStorage. Sem esta linha o link caía no filtro normal COM persistência
  // ligada — quebrando a promessa de "sem cadastro" (privacidade/LGPD). O modo
  // flash usa apenas sessionStorage e é apagado ao sair da tela.
  if (/\/filtro-escalas(?:[/?#&]|$)/.test(raw)) return true;
  return /[?&]mode=flash(?:&|$)/.test(raw);
}

// Fonte ÚNICA de verdade: roda o motor clínico (advancedFilterLogic) sobre o
// catálogo e, dentro dos candidatos seguros, aplica o realce de busca.
// Pode retornar [] — NUNCA cai para o catálogo inteiro (sem fallback perigoso).
function rankSafely(
  catalog: ScaleEntry[],
  ctx: FilterContext,
  query: string,
): RefinedScaleMatch[] {
  const uniq = unique(catalog);
  let matches = filterScalesWithClinicalRescue(uniq, ctx);
  if (query.trim()) {
    // Busca FILTRA de verdade: entre os candidatos seguros, mantém só os que casam
    // com o termo digitado. Se nada casar (ex.: erro de digitação), não esvazia —
    // cai para o conjunto seguro completo, reordenado por relevância.
    const scored = matches.map((m) => ({ m, b: searchBoost(m.scale, query) }));
    const anyMatch = scored.some((x) => x.b > 0);
    const kept = anyMatch ? scored.filter((x) => x.b > 0) : scored;
    matches = kept
      .sort((a, b) => b.m.relevanceScore + b.b - (a.m.relevanceScore + a.b))
      .map((x) => x.m);
  }
  // Nunca dar vazio para uma queixa+idade real: se não há instrumento específico
  // seguro, oferece rastreio AMPLO apropriado à idade (escalas reais), rotulado.
  if (
    matches.length === 0 &&
    (ctx.queixas.length > 0 || ctx.ageBand != null || ctx.ageMonths != null)
  ) {
    matches = getBroadbandFallback(uniq, ctx);
  }
  return matches;
}

function tierFromSlot(slot: Slot): Tier | null {
  if (slot === "Ouro") return "ouro";
  if (slot === "Prata") return "prata";
  if (slot === "Bronze") return "bronze";
  return null;
}

// Label reflects the podium slot, not the score-based tier, so the badge on
// the Ouro card always reads "1ª linha clínica" regardless of the raw score.
const SLOT_CLINICAL_LABEL: Partial<Record<Slot, string>> = {
  Ouro: "1ª linha clínica",
  Prata: "complementar",
  Bronze: "apoio adicional",
  "Teste Direto": "teste direto",
  "Questionário Escolar": "perspectiva escolar",
};

// Selo de licença do instrumento — deixa explícito ao clínico se a escala
// recomendada é gratuita, autoral (Dr. Jadson) ou licenciada/comercial. Agora
// que o filtro nomeia instrumentos padrão-ouro licenciados (Denver, CBCL…),
// a origem/licença precisa ficar visível em cada card.
function licenseChip(
  scale?: ScaleEntry,
): { label: string; cls: string } | null {
  const lic = scale?.licencaUso;
  if (!lic) return null;
  if (lic === "livre")
    return {
      label: "Gratuita",
      cls: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    };
  if (lic === "autoral")
    return {
      label: "Autoral",
      cls: "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
    };
  return {
    label: "Licenciada",
    cls: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  };
}

// QUALIFICAÇÃO CLÍNICA — sinal de validação brasileira derivado do campo REAL
// `validacaoBrasil` (nunca inventado). Para um neuropediatra no Brasil, saber se
// a escala tem adaptação/validação nacional é o principal marcador de confiança.
// Ausência do campo NÃO vira "sem validação": simplesmente não exibimos o selo
// (metadado ausente ≠ escala não validada) — evita esconder bons instrumentos.
function brValidationChip(
  scale?: ScaleEntry,
): { label: string; cls: string } | null {
  const v = scale?.validacaoBrasil?.trim();
  if (!v) return null;
  const head = norm(v).split(/[\s\-—]+/)[0];
  if (head === "sim")
    return {
      label: "🇧🇷 Validada no Brasil",
      cls: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    };
  if (head === "parcial")
    return {
      label: "🇧🇷 Adaptação parcial (BR)",
      cls: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    };
  if (head === "nao")
    return {
      label: "Sem validação BR",
      cls: "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
    };
  // Autoral / observacional / outros textos curados — mostra o próprio rótulo.
  return {
    label: `🇧🇷 ${v.length > 26 ? v.slice(0, 26) + "…" : v}`,
    cls: "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  };
}

// Tempo de aplicação como chip curto — carga do instrumento num relance.
function timeChip(scale?: ScaleEntry): string | null {
  const t = scale?.tempo?.trim();
  return t && t !== "—" ? t : null;
}

// Link PubMed a partir do campo REAL `pubmedId` (ex.: "PMID 24422648"). O dado
// já existe no catálogo mas nunca era exibido no filtro — para um neuropediatra,
// poder abrir o estudo de validação é o que separa uma "recomendação" de uma
// decisão embasada. Só retorna link quando há um PMID numérico real.
function pubmedRef(scale?: ScaleEntry): { pmid: string; href: string } | null {
  const raw = scale?.pubmedId?.trim();
  if (!raw) return null;
  const digits = raw.match(/\d{4,}/)?.[0];
  if (!digits) return null;
  return { pmid: digits, href: `https://pubmed.ncbi.nlm.nih.gov/${digits}/` };
}

// Atalhos clínicos comuns — 1 toque preenche idade + queixa e já traz o pódio.
// Reduz a fricção do primeiro uso e faz o filtro parecer "esperto".
const QUICK_STARTS: {
  emoji: string;
  label: string;
  sub: string;
  age: string;
  queixas: string[];
}[] = [
  {
    emoji: "⚡",
    label: "TDAH",
    sub: "6–12 anos",
    age: "6-12a",
    queixas: ["tdah"],
  },
  { emoji: "🧩", label: "TEA", sub: "2–4 anos", age: "2-4a", queixas: ["tea"] },
  {
    emoji: "🌱",
    label: "Atraso",
    sub: "1–2 anos",
    age: "1-2a",
    queixas: ["atraso"],
  },
  {
    emoji: "🌙",
    label: "Sono",
    sub: "4–6 anos",
    age: "4-6a",
    queixas: ["sono"],
  },
  {
    emoji: "💭",
    label: "Ansiedade",
    sub: "12–18 anos",
    age: "12-18a",
    queixas: ["ansiedade"],
  },
];

function rec(
  slot: Slot,
  match: RefinedScaleMatch | undefined,
  reason: string,
  tone: string,
) {
  const scale = match?.scale;
  // Estado HONESTO vindo do motor (req. 3): aplicação completa vs ficha vs externo.
  const state = match
    ? match.implementationLabel
    : "Sem opção complementar segura para este perfil.";
  return {
    slot,
    tier: tierFromSlot(slot),
    // A própria escala (quando há match) — usada para derivar os motivos sem
    // refazer busca frágil por nome no pool.
    scale,
    // Toda escala recomendada abre uma página real: aplicação completa, ficha
    // técnica (/generic-scale/:id) ou catálogo mundial. Nunca mais o loop /filtro.
    route: scale
      ? (resolveAppRoute(scale) ?? `/generic-scale/${scale.id}`)
      : "/filtro",
    title: scale?.name || "Sem escala segura",
    subtitle:
      scale?.fullName ||
      (slot === "Ouro"
        ? "Sem instrumento padrão-ouro para este perfil"
        : "Refine idade, queixa ou respondente"),
    reason,
    state,
    source: scale?.fonte,
    tone,
    hasScale: Boolean(scale),
    // Saída do motor de filtragem avançada (advancedFilterLogic)
    clinicalTier: match
      ? (SLOT_CLINICAL_LABEL[slot] ?? slot.toLowerCase())
      : null,
    confidence: match?.confidenceLevel ?? null,
    warnings: match?.warningFlags ?? [],
    clinicalReason: match?.clinicalReason ?? null,
    implementationStatus: match?.implementationStatus ?? null,
    isBroadbandFallback: match?.isBroadbandFallback ?? false,
  };
}

// Slot vazio HONESTO: explica ao clínico POR QUE aquele lugar do pódio ficou
// sem escala e o que ajustar — em vez de sumir ou mostrar card genérico.
function emptySlotReason(
  slot: Slot,
  sel: {
    hasQueixa: boolean;
    hasAge: boolean;
    respondente: string | null;
    communication: "verbal" | "nonverbal" | null;
  },
): string {
  if (slot === "Questionário Escolar") {
    if (sel.respondente && sel.respondente !== "professor")
      return "Nenhum questionário com o professor como respondente bate com o filtro atual — remova o filtro “Quem responde” para incluir a perspectiva escolar.";
    return "Sem questionário escolar (professor) preenchível para esta idade/queixa. A perspectiva escolar pode entrar por relato livre.";
  }
  if (slot === "Teste Direto") {
    if (sel.communication === "nonverbal")
      return "Nenhum teste aplicado diretamente com a criança é compatível com perfil não-verbal aqui — priorize instrumentos respondidos por pais/clínico.";
    return "Nenhum teste aplicado diretamente com a criança para este perfil (comum quando a queixa depende do relato de pais/escola ou a criança é muito nova).";
  }
  if (slot === "Ouro") {
    if (!sel.hasQueixa && !sel.hasAge)
      return "Selecione idade e/ou queixa para o filtro encontrar o instrumento principal.";
    return "Nenhum instrumento padrão-ouro preenchível cruza idade + queixa + respondente selecionados. Amplie a faixa etária ou remova o filtro de respondente para ver mais opções aplicáveis.";
  }
  return "Sem complementar seguro além dos já listados para este perfil — os instrumentos acima cobrem o essencial, ou faltam escalas preenchíveis validadas nesta faixa.";
}

function icon(slot: Slot) {
  if (slot === "Ouro") return <Award className="h-5 w-5" />;
  if (slot === "Prata") return <Medal className="h-5 w-5" />;
  if (slot === "Bronze") return <Star className="h-5 w-5" />;
  if (slot === "Teste Direto") return <ClipboardCheck className="h-5 w-5" />;
  return <School className="h-5 w-5" />;
}

// Emoji didático da medalha — reforça visualmente a prioridade do ranking.
function slotEmoji(slot: Slot): string {
  if (slot === "Ouro") return "🥇";
  if (slot === "Prata") return "🥈";
  if (slot === "Bronze") return "🥉";
  if (slot === "Teste Direto") return "🧒";
  if (slot === "Questionário Escolar") return "🏫";
  if (slot === "Satisfação Medicação") return "💊";
  return "🏅";
}

interface ScaleVisual {
  label: string;
  Icon: LucideIcon;
  tone: string;
}

function getScaleVisual(scale: ScaleEntry): ScaleVisual {
  const t = norm(
    `${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")} ${scale.respondente.join(" ")}`,
  );

  if (/tea|autis|social|assq|m-chat|q-chat|cast|aq/.test(t))
    return {
      label: "TEA / social",
      Icon: Brain,
      tone: "from-violet-600 via-purple-700 to-slate-950",
    };
  if (/tdah|adhd|snap|vanderbilt|aten|weiss|wfirs/.test(t))
    return {
      label: "atenção",
      Icon: Activity,
      tone: "from-amber-500 via-orange-600 to-red-800",
    };
  if (/linguagem|fala|comunic|language|speech/.test(t))
    return {
      label: "linguagem",
      Icon: MessageCircle,
      tone: "from-cyan-600 via-blue-700 to-slate-950",
    };
  if (
    /school|professor|teacher|aprendiz|leitura|escrita|aritmet|academ/.test(t)
  )
    return {
      label: "escola",
      Icon: GraduationCap,
      tone: "from-emerald-600 via-teal-700 to-slate-950",
    };
  if (/sono|sleep|bears|psq|cshq/.test(t))
    return {
      label: "sono",
      Icon: Moon,
      tone: "from-indigo-700 via-blue-900 to-slate-950",
    };
  if (/ansiedade|depress|humor|mood|phq|gad|scared|rcads|scas/.test(t))
    return {
      label: "humor",
      Icon: HeartPulse,
      tone: "from-rose-600 via-red-700 to-slate-950",
    };
  if (/desenvolvimento|milestone|cdc|swyc|atraso|motor|gmfcs/.test(t))
    return {
      label: "desenvolvimento",
      Icon: Baby,
      tone: "from-blue-600 via-indigo-700 to-slate-950",
    };
  if (
    /eusm|medic|dose|farmaco|risperidona|metilfenidato|tolerab|adesao|efeito/.test(
      t,
    )
  )
    return {
      label: "medicação",
      Icon: Pill,
      tone: "from-teal-600 via-cyan-700 to-slate-950",
    };
  if (/pais|parent|cuidador|family/.test(t))
    return {
      label: "família",
      Icon: Users,
      tone: "from-slate-600 via-slate-800 to-slate-950",
    };

  return {
    label: "clínico",
    Icon: ClipboardCheck,
    tone: "from-primary via-chart-2 to-slate-950",
  };
}

function getRecommendationReasons(
  scale: ScaleEntry | undefined,
  selectedQueixas: string[],
  selectedAge: string | null,
): string[] {
  if (!scale) return [];
  const reasons: string[] = [];

  // Motivo contextual por idade
  if (selectedAge && matchAge(scale, selectedAge)) {
    if (scale.ageMin > 0) {
      const minYears = Math.round(scale.ageMin / 12);
      reasons.push(`✓ Recomendado a partir de ${minYears} anos`);
    } else {
      reasons.push("✓ Aplicável nesta faixa etária");
    }
  } else if (selectedAge && !matchAge(scale, selectedAge)) {
    const minYears = Math.round(scale.ageMin / 12);
    reasons.push(`⚠ Recomendado apenas a partir de ${minYears} anos`);
  }

  // Motivo contextual por queixa
  if (selectedQueixas.length > 0) {
    const matchedQueixas = scale.queixas.filter((q) =>
      selectedQueixas.includes(q),
    );
    if (matchedQueixas.length > 0) {
      if (matchedQueixas.length === 1) {
        reasons.push(`✓ Cobre sintoma: ${matchedQueixas[0]}`);
      } else {
        reasons.push(`✓ Cobre ${matchedQueixas.length} sintomas selecionados`);
      }
    }
  }

  // Motivo contextual por respondente
  if (scale.respondente.includes("professor")) {
    reasons.push("✓ Respondente: Professor");
  } else if (scale.respondente.includes("pais")) {
    reasons.push("✓ Respondente: Pais/Cuidador");
  } else if (scale.respondente.includes("clinico")) {
    reasons.push("✓ Respondente: Clínico (observação direta)");
  }

  // Toda escala do filtro abre uma ferramenta usável: rota dedicada,
  // itens interativos ou marcada "complete".
  if (
    opensAsUsableTool(scale) ||
    getImplementationStatus(scale) === "complete"
  ) {
    reasons.push("✓ Aplicação completa no app");
  } else if (resolveAppRoute(scale)) {
    reasons.push("✓ Ficha técnica no app");
  }
  if (scale.prioridade === "triagem") reasons.push("✓ Instrumento de triagem");

  return reasons.length ? reasons : ["✓ Compatibilidade geral"];
}

type RecommendationItem = ReturnType<typeof rec>;
type AssessmentFilterType = "diagnostic" | "monitoring" | null;

const QUAL_RESP_LABEL: Record<ScaleEntry["respondente"][number], string> = {
  pais: "pais/cuidadores",
  clinico: "clínico",
  professor: "professor/escola",
  autoaplicavel: "autorrelato",
  crianca: "criança/adolescente",
  teste_direto_crianca: "teste direto com a criança",
};

function tidySentence(value?: string | null): string {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;:]+$/g, "");
}

function joinNatural(items: string[]): string {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} e ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} e ${clean[clean.length - 1]}`;
}

function getAgeLabel(selectedAge: string | null): string {
  return selectedAge
    ? (faixasEtarias.find((a) => a.id === selectedAge)?.label ?? selectedAge)
    : "idade não especificada";
}

function getQueixaLabels(selectedQueixas: string[]): string[] {
  return selectedQueixas.map(
    (id) => queixas.find((q) => q.id === id)?.label ?? id,
  );
}

function getSignalLabels(
  selectedQueixas: string[],
  selectedSignalIds: string[],
): string[] {
  if (selectedSignalIds.length === 0 || selectedQueixas.length === 0) return [];
  const selected = new Set(selectedSignalIds);
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const queixaId of selectedQueixas) {
    for (const signal of getAllSignalsForQueixa(queixaId)) {
      if (!selected.has(signal.id) || seen.has(signal.id)) continue;
      seen.add(signal.id);
      labels.push(signal.label);
    }
  }
  return labels;
}

function scaleDetailLine(scale: ScaleEntry | undefined): string {
  if (!scale) return "";
  const details = [
    scale.validacaoBrasil ? `validação BR: ${scale.validacaoBrasil}` : "",
    scale.tempo ? `tempo: ${scale.tempo}` : "",
    scale.scoringCutoff ? `interpretação/corte: ${scale.scoringCutoff}` : "",
  ].filter(Boolean);
  return details.length ? ` Metadados úteis: ${details.join("; ")}.` : "";
}

function itemCoverageLabel(
  item: RecommendationItem,
  selectedQueixas: string[],
): string {
  if (!item.scale || selectedQueixas.length === 0) return "";
  const covered = selectedQueixas
    .filter((queixaId) => item.scale?.queixas.includes(queixaId))
    .map(
      (queixaId) => queixas.find((q) => q.id === queixaId)?.label ?? queixaId,
    );
  return covered.length ? `Cobre ${joinNatural(covered)}.` : "";
}

function buildQualitativeFilterReport(args: {
  ranking: RecommendationItem[];
  refinedMatches: RefinedScaleMatch[];
  clinicalRecommendation: string;
  selectedQueixas: string[];
  selectedAge: string | null;
  selectedRespondente: ScaleEntry["respondente"][number] | null;
  selectedAssessmentType: AssessmentFilterType;
  selectedSignalIds: string[];
  usingBroadbandFallback: boolean;
}): string {
  const {
    ranking,
    refinedMatches,
    clinicalRecommendation,
    selectedQueixas,
    selectedAge,
    selectedRespondente,
    selectedAssessmentType,
    selectedSignalIds,
    usingBroadbandFallback,
  } = args;
  if (refinedMatches.length === 0) return "";

  const ageLabel = getAgeLabel(selectedAge);
  const queixaLabel = selectedQueixas.length
    ? joinNatural(getQueixaLabels(selectedQueixas))
    : "queixa não especificada";
  const respondentLabel = selectedRespondente
    ? QUAL_RESP_LABEL[selectedRespondente]
    : "sem restringir respondente";
  const assessmentLabel =
    selectedAssessmentType === "diagnostic"
      ? "avaliação diagnóstica/estruturação inicial"
      : selectedAssessmentType === "monitoring"
        ? "monitoramento evolutivo"
        : "triagem e apoio à decisão";
  const signalLabels = getSignalLabels(
    selectedQueixas,
    selectedSignalIds,
  ).slice(0, 6);

  const ouro = ranking.find((item) => item.slot === "Ouro" && item.hasScale);
  const prata = ranking.find((item) => item.slot === "Prata" && item.hasScale);
  const bronze = ranking.find(
    (item) => item.slot === "Bronze" && item.hasScale,
  );
  const direct = ranking.find(
    (item) => item.slot === "Teste Direto" && item.hasScale,
  );
  const school = ranking.find(
    (item) => item.slot === "Questionário Escolar" && item.hasScale,
  );
  const paragraphs: string[] = [];

  paragraphs.push(
    `Para este perfil (${ageLabel}; ${queixaLabel}; ${respondentLabel}; finalidade: ${assessmentLabel}), o filtro priorizou escalas que cruzam segurança por idade, aderência à queixa, modo de aplicação e disponibilidade real dentro do app. ${tidySentence(clinicalRecommendation)}.`,
  );

  if (signalLabels.length > 0) {
    paragraphs.push(
      `Os sinais refinados selecionados (${joinNatural(signalLabels)}) aumentaram o peso das escalas mais específicas para o padrão descrito, em vez de favorecer apenas instrumentos amplos.`,
    );
  }

  if (usingBroadbandFallback) {
    paragraphs.push(
      "Como não havia instrumento específico seguro e preenchível para esta combinação, a recomendação foi rebaixada para triagem ampla apropriada à idade. Use esse resultado como porta de entrada e complemente com anamnese, exame neurológico e dados escolares/terapêuticos.",
    );
  } else {
    const broadbandComplements = [ouro, prata, bronze].filter(
      (item): item is RecommendationItem =>
        Boolean(item?.scale && item.isBroadbandFallback),
    );
    if (broadbandComplements.length > 0) {
      paragraphs.push(
        `Para manter três escolhas clinicamente utilizáveis sem forçar escala inadequada, o pódio foi completado com ${joinNatural(broadbandComplements.map((item) => item.title))}, usado aqui como complemento de banda larga apropriado à idade. Esse complemento ajuda a medir impacto global, funcionamento e carga emocional/comportamental enquanto a escala principal responde à queixa central.`,
      );
    }
  }

  if (ouro?.scale) {
    const coverage = itemCoverageLabel(ouro, selectedQueixas);
    const reason = tidySentence(
      ouro.reason || ouro.clinicalReason || ouro.scale.description,
    );
    paragraphs.push(
      `A melhor primeira escolha é ${ouro.title}: ${reason}. ${coverage} Por isso ela deve ser aplicada primeiro, pois tende a responder a pergunta clínica central antes de abrir instrumentos secundários.${scaleDetailLine(ouro.scale)}`,
    );
  }

  const complements = [prata, bronze].filter(
    (item): item is RecommendationItem => Boolean(item?.scale),
  );
  if (complements.length > 0) {
    const complementText = complements
      .map((item) => {
        const reason = tidySentence(
          item.reason || item.clinicalReason || item.scale?.description,
        );
        const coverage = itemCoverageLabel(item, selectedQueixas);
        return `${item.slot}: ${item.title}${reason ? ` (${reason})` : ""}${coverage ? ` ${coverage}` : ""}`;
      })
      .join(" ");
    paragraphs.push(
      `Como composição qualitativa, ${complementText} Essas escolhas evitam uma leitura estreita do caso: uma escala ancora a prioridade principal e as demais acrescentam perspectiva funcional, comportamental, escolar ou de acompanhamento.`,
    );
  }

  if (selectedQueixas.length > 1) {
    const coveredQueixas = selectedQueixas.filter((queixaId) =>
      ranking.some((item) => item.scale?.queixas.includes(queixaId)),
    );
    const missingQueixas = selectedQueixas.filter(
      (queixaId) => !coveredQueixas.includes(queixaId),
    );
    const coveredLabel = coveredQueixas.length
      ? joinNatural(getQueixaLabels(coveredQueixas))
      : "nenhuma queixa principal";
    const missingLabel = missingQueixas.length
      ? joinNatural(getQueixaLabels(missingQueixas))
      : "";
    paragraphs.push(
      missingQueixas.length
        ? `Cobertura das queixas: o pódio cobre ${coveredLabel}. Ainda fica menos coberto: ${missingLabel}; nesse caso, use a prévia do catálogo ou uma escala complementar dirigida depois da primeira rodada.`
        : `Cobertura das queixas: o pódio cobre todas as queixas marcadas (${coveredLabel}), reduzindo o risco de escolher três instrumentos bons isoladamente, mas redundantes entre si.`,
    );
  }

  const perspectiveItems = [direct, school].filter(
    (item): item is RecommendationItem => Boolean(item?.scale),
  );
  if (perspectiveItems.length > 0) {
    paragraphs.push(
      `Perspectivas adicionais disponíveis: ${perspectiveItems.map((item) => `${item.slot}: ${item.title}`).join("; ")}. Use-as quando houver divergência entre relato familiar, observação em consulta e funcionamento escolar.`,
    );
  }

  paragraphs.push(
    "Leitura prática final: aplique o Ouro primeiro, use Prata/Bronze para confirmar gravidade, impacto e contexto, e interprete divergências entre respondentes como dado clínico relevante. O resultado organiza a escolha das escalas, mas não substitui julgamento clínico, entrevista, exame e seguimento.",
  );

  return paragraphs.join("\n\n");
}

interface FilterNavigationPrefill {
  age: string | null;
  queixas: string[];
  present: boolean;
}

function readFilterNavigationPrefill(): FilterNavigationPrefill {
  if (typeof window === "undefined")
    return { age: null, queixas: [], present: false };

  const state = window.history.state as {
    filterPrefill?: { age?: unknown; queixas?: unknown };
  } | null;
  const prefill = state?.filterPrefill;
  if (!prefill) return { age: null, queixas: [], present: false };

  const age =
    typeof prefill.age === "string" &&
    faixasEtarias.some((item) => item.id === prefill.age)
      ? prefill.age
      : null;
  const validQueixaIds = new Set(queixas.map((item) => item.id));
  const selectedQueixas = Array.isArray(prefill.queixas)
    ? prefill.queixas.filter(
        (id): id is string => typeof id === "string" && validQueixaIds.has(id),
      )
    : [];

  return { age, queixas: selectedQueixas, present: true };
}

function clearFilterNavigationPrefill(): void {
  if (typeof window === "undefined") return;
  const state = window.history.state;
  if (!state || typeof state !== "object" || !("filterPrefill" in state))
    return;

  const nextState = { ...state } as Record<string, unknown>;
  delete nextState.filterPrefill;
  window.history.replaceState(
    Object.keys(nextState).length > 0 ? nextState : null,
    "",
    window.location.href,
  );
}

export default function FiltroPage() {
  const flashMode = isFlashRoute();
  const [preferences] = useState(loadFilterPreferences);
  const [navigationPrefill] = useState(readFilterNavigationPrefill);
  const [search, setSearch] = useState<string>("");
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>(
    flashMode ? [] : navigationPrefill.queixas,
  );
  const [selectedAge, setSelectedAge] = useState<string | null>(
    flashMode ? null : navigationPrefill.age,
  );
  const [selectedRespondente, setSelectedRespondente] = useState<
    ScaleEntry["respondente"][number] | null
  >(null);
  const [selectedCommunication, setSelectedCommunication] = useState<
    "verbal" | "nonverbal" | null
  >(null);
  const [selectedLiteracy, setSelectedLiteracy] = useState<
    "literate" | "preliterate" | null
  >(null);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<
    "diagnostic" | "monitoring" | null
  >(null);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>(
    flashMode ? "complete" : preferences.availability,
  );
  const [copiedRec, setCopiedRec] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [world, setWorld] = useState<ScaleEntry[]>(noCostWorldScales);
  const [, setStatus] = useState<"loading" | "ok" | "fallback">("loading");

  useEffect(() => {
    if (flashMode || !navigationPrefill.present) return;
    clearFilterNavigationPrefill();
  }, [flashMode, navigationPrefill.present]);

  useEffect(() => {
    if (!flashMode) return;
    return () => {
      try {
        sessionStorage.removeItem(FLASH_STORAGE_KEY);
      } catch {
        /* sessionStorage indisponível — nada a limpar */
      }
    };
  }, [flashMode]);

  useEffect(() => {
    if (!flashMode) return;
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(FLASH_STORAGE_KEY) || "{}",
      ) as {
        search?: string;
        selectedAge?: string | null;
        selectedQueixas?: string[];
      };
      if (typeof saved.search === "string") setSearch(saved.search);
      if (typeof saved.selectedAge === "string" || saved.selectedAge === null)
        setSelectedAge(saved.selectedAge);
      if (Array.isArray(saved.selectedQueixas))
        setSelectedQueixas(saved.selectedQueixas);
    } catch {
      /* sessionStorage indisponível — modo flash segue sem persistir */
    }
  }, [flashMode]);

  useEffect(() => {
    if (!flashMode) return;
    try {
      sessionStorage.setItem(
        FLASH_STORAGE_KEY,
        JSON.stringify({ search, selectedAge, selectedQueixas }),
      );
    } catch {
      /* sessionStorage indisponível — modo flash segue sem persistir */
    }
  }, [flashMode, search, selectedAge, selectedQueixas]);

  // Auto-close welcome tour on /filtro — ensures filter content is visible immediately
  useEffect(() => {
    try {
      localStorage.setItem("np_tour_v2_done", "1");
      localStorage.setItem("np_tour_intro_v2", "1");
    } catch {
      /* tour é best-effort */
    }
  }, []);

  // Persiste somente a preferência não clínica de disponibilidade. Busca,
  // idade, queixas e contexto assistencial permanecem apenas em memória.
  useEffect(() => {
    if (flashMode) return;
    saveFilterPreferences(availabilityMode);
  }, [flashMode, availabilityMode]);

  useEffect(() => {
    let alive = true;
    fetch(REGISTRY_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: { escalas?: Row[] }) => {
        const parsed = (data.escalas || []).map(rowToScale);
        if (parsed.length < 100) throw new Error("registro incompleto");
        if (alive) {
          setWorld(unique([...noCostWorldScales, ...parsed]));
          setStatus("ok");
        }
      })
      .catch(() => {
        if (alive) setStatus("fallback");
      });
    return () => {
      alive = false;
    };
  }, []);

  // Dedup de instrumento: uma escala mundial (world-*) que duplica um instrumento
  // já presente no app (mesmo nome — ex.: SDQ, M-CHAT-R/F, Vanderbilt, SCARED…) é
  // redundante. A versão do app é a canônica; a cópia mundial sai do catálogo do
  // filtro para não contar/aparecer o mesmo instrumento duas vezes.
  const dedupedWorld = useMemo(() => {
    const appNames = new Set(CORE_FILTERABLE_CATALOG.map((s) => norm(s.name)));
    return world.filter(
      (s) => !(s.id.startsWith("world-") && appNames.has(norm(s.name))),
    );
  }, [world]);

  // O padrão preserva somente aplicações completas. A opção "Todas" acrescenta
  // fichas/referências que possuem rota real, sempre rotuladas como não
  // preenchíveis; itens sem destino continuam excluídos.
  const catalog = useMemo(() => {
    const references = availabilityMode === "all" ? REFERENCE_ONLY_CATALOG : [];
    const routed = unique([
      ...CORE_FILTERABLE_CATALOG,
      ...dedupedWorld,
      ...references,
    ]).filter(opensInApp);
    return availabilityMode === "all" ? routed : routed.filter(isFullApp);
  }, [dedupedWorld, availabilityMode]);

  const hasSearch =
    search.trim().length >= 2 ||
    selectedQueixas.length > 0 ||
    Boolean(selectedAge) ||
    Boolean(selectedRespondente) ||
    Boolean(selectedCommunication) ||
    Boolean(selectedLiteracy) ||
    Boolean(selectedAssessmentType) ||
    selectedSignalIds.length > 0 ||
    availabilityMode === "all";

  // === MOTOR CLÍNICO (advancedFilterLogic) — fonte ÚNICA de verdade ===
  const filterContext = useMemo<FilterContext>(() => {
    const ageRange = selectedAge
      ? faixasEtarias.find((a) => a.id === selectedAge)
      : null;
    const inferredAgeMonths = !ageRange
      ? inferAgeMonthsFromSearch(search)
      : null;
    const ageMonths = ageRange
      ? Math.round((ageRange.min + ageRange.max) / 2)
      : inferredAgeMonths;
    const inferredQueixas =
      selectedQueixas.length === 0 ? inferQueixasFromSearch(search) : [];
    return {
      queixas: selectedQueixas.length > 0 ? selectedQueixas : inferredQueixas,
      ageMonths,
      ageBand: ageRange ? { min: ageRange.min, max: ageRange.max } : null,
      respondente: selectedRespondente ?? null,
      isVerbal:
        selectedCommunication === "verbal"
          ? true
          : selectedCommunication === "nonverbal"
            ? false
            : null,
      isLiterate:
        selectedLiteracy === "literate"
          ? true
          : selectedLiteracy === "preliterate"
            ? false
            : null,
      assessmentUse:
        selectedAssessmentType === "diagnostic"
          ? "diagnostico"
          : selectedAssessmentType === "monitoring"
            ? "monitorizacao"
            : null,
      selectedSignals: selectedSignalIds,
    };
  }, [
    selectedQueixas,
    selectedAge,
    selectedRespondente,
    selectedCommunication,
    selectedLiteracy,
    selectedAssessmentType,
    selectedSignalIds,
    search,
  ]);

  // Candidatos seguros, já ordenados por pertinência clínica. PODE SER VAZIO.
  const refinedMatches = useMemo(
    () => {
      if (!hasSearch) return [];
      return rankSafely(catalog, filterContext, search);
    },
    [catalog, filterContext, search, hasSearch],
  );
  const refinedById = useMemo(
    () => new Map(refinedMatches.map((m) => [m.scale.id, m])),
    [refinedMatches],
  );
  // Idade para a curadoria do pódio/OPB: uma faixa larga (ex.: "2–4 anos") vira
  // um único ponto (midpoint) ao consultar o fluxograma, o que pode pular o
  // rastreio de 1ª linha do extremo mais novo (ex.: M-CHAT numa criança de 2a).
  // Se o profissional digitou a idade exata na busca (ex.: "24 meses"), usamos
  // ela — mais precisa; senão, o midpoint da faixa (comportamento padrão).
  const curatedAgeMonths = useMemo(
    () => inferAgeMonthsFromSearch(search) ?? ageMonthsFromBand(selectedAge),
    [search, selectedAge],
  );
  const rankedPool = useMemo(
    () => refinedMatches.map((m) => m.scale),
    [refinedMatches],
  );
  const hasSafeResults = refinedMatches.length > 0;
  const acuteRiskContext = isAcuteRiskContext(filterContext);
  // Resultado veio do fallback de triagem ampla (sem instrumento específico).
  const usingBroadbandFallback =
    refinedMatches.length > 0 &&
    refinedMatches.every((m) => m.isBroadbandFallback);

  // Ranking clínico curado (clinicalRanking) para a queixa primária + idade.
  // É a FONTE de verdade do pódio: define explicitamente quem é ouro/prata/bronze
  // por idade×queixa. Cai para null quando não há queixa selecionada.
  const curatedTiers = useMemo(
    () =>
      selectCuratedTiers(
        selectedQueixas,
        curatedAgeMonths,
        refinedById,
        selectedRespondente,
      ),
    [selectedQueixas, curatedAgeMonths, selectedRespondente, refinedById],
  );

  // === PÓDIO: score-ordered, curated tiers as soft tiebreaker, quality threshold ≥60 ===
  const auditedPodium = useMemo(
    () =>
      selectPodium(hasSafeResults ? refinedMatches : [], curatedTiers, {
        selectedQueixas,
        ageMonths: curatedAgeMonths,
        selectedSignals: selectedSignalIds,
      }),
    [
      refinedMatches,
      hasSafeResults,
      curatedTiers,
      selectedQueixas,
      curatedAgeMonths,
      selectedSignalIds,
    ],
  );

  // Síntese clínica referencia o Ouro do pódio directamente (elimina divergência).
  const clinicalRecommendation = useMemo(
    () => generateContextualRecommendation(refinedMatches, auditedPodium.ouro),
    [refinedMatches, auditedPodium],
  );

  // Ouro veio da tabela curada? Então mostramos o racional clínico específico.
  const podium = auditedPodium;
  const isCuratedOuro = Boolean(
    curatedTiers?.ouro && podium.ouro?.scale.id === curatedTiers.ouro,
  );
  const ranking = [
    rec(
      "Ouro",
      podium.ouro,
      isCuratedOuro
        ? curatedTiers!.reason
        : "Melhor instrumento para idade, queixa, finalidade e respondente.",
      "from-amber-500 via-yellow-600 to-red-800",
    ),
    rec(
      "Prata",
      podium.prata,
      "Complementar: domínio ou modo de aplicação diferente do Ouro.",
      "from-slate-400 via-slate-500 to-slate-700",
    ),
    rec(
      "Bronze",
      podium.bronze,
      "Apoio secundário ou triagem breve adicional.",
      "from-orange-500 via-amber-700 to-stone-800",
    ),
    rec(
      "Teste Direto",
      podium.direct,
      "Instrumento aplicado diretamente com a criança.",
      "from-blue-600 via-indigo-700 to-slate-950",
    ),
    rec(
      "Questionário Escolar",
      podium.school,
      "Questionário respondido por professor/contexto escolar.",
      "from-emerald-600 via-teal-700 to-slate-950",
    ),
  ];
  const qualitativeReportText = hasSafeResults
    ? buildQualitativeFilterReport({
        ranking,
        refinedMatches,
        clinicalRecommendation,
        selectedQueixas,
        selectedAge,
        selectedRespondente,
        selectedAssessmentType,
        selectedSignalIds,
        usingBroadbandFallback,
      })
    : "";
  const qualitativeReportParagraphs = qualitativeReportText
    .split(/\n\n+/)
    .filter(Boolean);

  // Texto pronto para o laudo — pódio recomendado + contexto do filtro.
  // Cálculo direto (barato) para não depender do array `ranking` recriado a cada render.
  const recommendationText = ((): string => {
    if (!hasSafeResults) return "";
    const ageLbl = selectedAge
      ? (faixasEtarias.find((a) => a.id === selectedAge)?.label ?? selectedAge)
      : "não especificada";
    const queixasLbl = selectedQueixas.length
      ? selectedQueixas
          .map((id) => queixas.find((q) => q.id === id)?.label ?? id)
          .join(", ")
      : "não especificada";
    const respLbl = selectedRespondente ?? "qualquer";
    const lines = ranking
      .filter((r) => r.hasScale)
      .map(
        (r) =>
          `• ${r.slot}${r.clinicalTier ? ` (${r.clinicalTier})` : ""}: ${r.title}${r.source ? ` — ${r.source}` : ""}`,
      );
    return [
      "Recomendação de escalas — NeuroPed",
      `Idade: ${ageLbl} · Queixa(s): ${queixasLbl} · Respondente: ${respLbl}`,
      "",
      ...lines,
      "",
      "Relato qualitativo por extenso",
      qualitativeReportText,
      "",
      "Gerado pelo Filtro Clínico Inteligente — triagem de apoio; não substitui o julgamento clínico.",
    ].join("\n");
  })();

  const copyRecommendation = () => {
    if (!recommendationText) return;
    softTick();
    haptic.select();
    navigator.clipboard?.writeText(recommendationText).then(
      () => {
        setCopiedRec(true);
        setTimeout(() => setCopiedRec(false), 1800);
      },
      () => {
        /* clipboard indisponível — best-effort */
      },
    );
  };

  // Linhas estruturadas para exportação (PDF/CSV) — só escalas que abrem, com
  // os mesmos qualificadores clínicos exibidos nos cards.
  const exportRows: FilterExportRow[] = ranking
    .filter((r) => r.hasScale && r.scale)
    .map((r) => {
      const s = r.scale!;
      return {
        slot: r.slot,
        clinicalTier: r.clinicalTier ?? "",
        name: s.name,
        fullName: s.fullName,
        ageRange: `${Math.round(s.ageMin / 12)}–${Math.round(s.ageMax / 12)} anos`,
        respondente: s.respondente.join(" · "),
        validacaoBrasil: s.validacaoBrasil ?? "",
        tempo: s.tempo ?? "",
        scoringCutoff: s.scoringCutoff ?? "",
        fonte: s.fonte ?? "",
        reason: r.reason ?? "",
      };
    });

  const buildExportMeta = (): FilterExportMeta => ({
    age: selectedAge
      ? (faixasEtarias.find((a) => a.id === selectedAge)?.label ?? selectedAge)
      : "não especificada",
    queixas: selectedQueixas.length
      ? selectedQueixas
          .map((id) => queixas.find((q) => q.id === id)?.label ?? id)
          .join(", ")
      : "não especificada",
    respondente: selectedRespondente ?? "qualquer",
    generatedAtLabel: new Date().toLocaleDateString("pt-BR"),
    qualitativeReport: qualitativeReportText,
  });

  const exportCsv = () => {
    if (!exportRows.length) return;
    softTick();
    haptic.select();
    downloadBlob(
      "neuroped-recomendacao-escalas.csv",
      "text/csv;charset=utf-8",
      buildFilterCsv(buildExportMeta(), exportRows),
    );
  };

  const exportPdf = async () => {
    if (!exportRows.length) return;
    softTick();
    haptic.select();
    try {
      const bytes = await buildFilterPdf(buildExportMeta(), exportRows);
      downloadBlob(
        "neuroped-recomendacao-escalas.pdf",
        "application/pdf",
        bytes,
      );
    } catch {
      /* exportação best-effort — não quebra a página */
    }
  };

  // Pool comparável = escalas preenchíveis do pódio, deduplicadas. Permite
  // comparar, p.ex., SCARED-pais × SCARED-criança — só instrumentos aplicáveis.
  const comparablePool: ScaleEntry[] = (() => {
    const seen = new Set<string>();
    const out: ScaleEntry[] = [];
    for (const r of ranking)
      if (r.hasScale && r.scale && !seen.has(r.scale.id)) {
        seen.add(r.scale.id);
        out.push(r.scale);
      }
    return out;
  })();
  const comparing = compareIds
    .map((id) => comparablePool.find((s) => s.id === id))
    .filter(Boolean) as ScaleEntry[];
  const toggleCompare = (id: string) => {
    softTick();
    haptic.select();
    setCompareIds((cur) =>
      cur.includes(id)
        ? cur.filter((x) => x !== id)
        : cur.length >= 3
          ? cur
          : [...cur, id],
    );
  };
  // Linhas do quadro comparativo — mesmos qualificadores clínicos dos cards.
  const COMPARE_ATTRS: { label: string; get: (s: ScaleEntry) => string }[] = [
    {
      label: "Faixa etária",
      get: (s) =>
        `${Math.round(s.ageMin / 12)}–${Math.round(s.ageMax / 12)} anos`,
    },
    { label: "Respondente", get: (s) => s.respondente.join(" · ") },
    {
      label: "⏱️ Tempo",
      get: (s) => (s.tempo && s.tempo !== "—" ? s.tempo : "—"),
    },
    { label: "🇧🇷 Validação BR", get: (s) => s.validacaoBrasil || "—" },
    { label: "🎯 Ponto de corte", get: (s) => s.scoringCutoff || "—" },
    { label: "Licença", get: (s) => licenseChip(s)?.label || "—" },
    {
      label: "Aplicação",
      get: (s) =>
        isFullApp(s) ? "Preenchível no app" : "Ficha técnica / referência",
    },
    { label: "Fonte", get: (s) => s.fonte || "—" },
  ];

  const toggleQueixa = (id: string) => {
    softTick();
    haptic.select();
    setSelectedQueixas((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  };

  // Sugestão de co-ocorrência (comorbidade): ao marcar uma queixa, sugere marcar
  // TAMBÉM outra que costuma vir junto (ex.: autismo → sensorial). Agrega as
  // companheiras de todas as queixas marcadas, tira as já selecionadas, e mostra
  // as 3 mais comuns como chips clicáveis. Ajuda o pai/mãe a não perder o quadro
  // associado que quase sempre acompanha a queixa principal.
  const suggestedCompanions = useMemo(() => {
    if (selectedQueixas.length === 0) return [] as typeof queixas;
    const selected = new Set(selectedQueixas);
    const seen = new Set<string>();
    const out: typeof queixas = [];
    for (const qid of selectedQueixas) {
      for (const compId of QUEIXA_COOCORRENCIA[qid] || []) {
        if (selected.has(compId) || seen.has(compId)) continue;
        const cat = queixas.find((q) => q.id === compId);
        if (cat) {
          seen.add(compId);
          out.push(cat);
        }
      }
    }
    return out.slice(0, 3);
  }, [selectedQueixas]);

  const clearAll = () => {
    softTap();
    haptic.tap();
    setSearch("");
    setSelectedAge(null);
    setSelectedQueixas([]);
    setSelectedRespondente(null);
    setSelectedCommunication(null);
    setSelectedLiteracy(null);
    setSelectedAssessmentType(null);
    setSelectedSignalIds([]);
    setAvailabilityMode("complete");
  };

  return (
    <div className="page-enter container-filtro filter-260-shell pb-4 sm:pb-8">
      {/* Full-width header — premium calmo (consistente com a Home) */}
      <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-b from-primary/[0.06] via-card/40 to-card/20 p-5 sm:p-7 shadow-sm backdrop-blur mb-4 sm:mb-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-primary/15 to-chart-2/10 blur-3xl"
        />
        <div className="relative flex items-center gap-3.5 sm:gap-4">
          <div className="filter-260-iconbox flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/15 shadow-sm">
            <Filter
              className="h-[20px] w-[20px] sm:h-[22px] sm:w-[22px]"
              strokeWidth={1.9}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] sm:text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              Ranking clínico
            </p>
            <h1
              className="mt-0.5 text-2xl sm:text-[30px] leading-tight tracking-[-0.01em] text-foreground"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Filtro Clínico Inteligente
            </h1>
            <p className="mt-1 text-[13px] sm:text-sm leading-relaxed text-muted-foreground">
              {flashMode
                ? "Triagem rápida sem cadastro: informe idade e queixa para receber o ranking imediato."
                : "Cruze idade, queixa, respondente e contexto — incluindo 100 escalas mundiais sem custo."}
            </p>
          </div>
        </div>
      </header>

      {flashMode && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
          Modo efêmero — saia da tela e os dados somem
        </div>
      )}

      {/* Métricas — faixa fina com divisores (consistente com a Home) */}
      <section
        className="mb-4 sm:mb-6 flex divide-x divide-border/50 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/70 to-card/30 shadow-sm"
        aria-label="Métricas do filtro"
      >
        <div className="flex-1 px-3.5 py-3 sm:px-4 transition-colors hover:bg-muted/30">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {catalog.length}
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Filtráveis
          </p>
        </div>
        <div className="flex-1 px-3.5 py-3 sm:px-4 transition-colors hover:bg-muted/30">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {dedupedWorld.length}
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Mundiais
          </p>
        </div>
        <div className="flex-1 px-3.5 py-3 sm:px-4 transition-colors hover:bg-muted/30">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {catalog.filter((s) => s.licencaUso === "livre").length}
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Gratuitas
          </p>
        </div>
      </section>

      {/* Two-column grid: Controls (left) + Results (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-max">
        {/* LEFT COLUMN — Controls (Sticky on Desktop) */}
        <div
          className={
            hasSearch
              ? "lg:col-span-1 space-y-3 sm:space-y-4 lg:sticky lg:top-5 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto"
              : "lg:col-span-3 space-y-3 sm:space-y-4"
          }
        >
          {/* Search & Filters */}
          <section className="space-y-2 sm:space-y-3 rounded-[1.5rem] border border-border/70 bg-card/80 p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={
                  flashMode
                    ? "Idade e queixa para triagem sem cadastro"
                    : "Buscar por medicação, queixa ou nome da escala"
                }
                placeholder={
                  flashMode
                    ? "Ex.: 7 anos, não dorme, crise, desatenção..."
                    : "Medicação, autismo, TDAH, ansiedade..."
                }
                className="h-9 sm:h-11 rounded-2xl pl-10 pr-10 text-sm"
                data-testid="input-search"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {!hasSearch && (
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  ✨ Sugestões rápidas
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {QUICK_STARTS.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onMouseEnter={() => softHover()}
                      onClick={() => {
                        softTap();
                        haptic.tap();
                        setSelectedAge(q.age);
                        setSelectedQueixas(q.queixas);
                      }}
                      className="group flex items-center gap-1.5 rounded-2xl border border-border bg-background px-2.5 py-1.5 text-xs font-bold transition hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]"
                    >
                      <span
                        aria-hidden="true"
                        className="text-sm leading-none transition-transform group-hover:scale-110"
                      >
                        {q.emoji}
                      </span>
                      <span className="text-foreground">{q.label}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        · {q.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Idade da criança
                </p>
                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground/75 sm:hidden" aria-hidden="true">
                  Deslize →
                </span>
              </div>
              <div className="np-horizontal-chips flex gap-1 sm:gap-2 overflow-x-auto pb-1" data-testid="age-band-scroll" aria-label="Faixas etárias; deslize horizontalmente para ver todas">
                {faixasEtarias.map((age) => (
                  <button
                    key={age.id}
                    type="button"
                    aria-pressed={selectedAge === age.id}
                    aria-label={`Faixa etária ${age.label}`}
                    onMouseEnter={() => softHover()}
                    onClick={() =>
                      setSelectedAge((v) => (v === age.id ? null : age.id))
                    }
                    className={`shrink-0 rounded-2xl border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold transition ${selectedAge === age.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                  >
                    {age.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
                    O que você observa · sintomas
                  </p>
                  {isCuratedOuro && podium.ouro && (
                    <span className="shrink-0 inline-block px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-[9px] sm:text-[10px] font-bold text-amber-900 dark:text-amber-200 whitespace-nowrap">
                      🧠 1ª linha: {podium.ouro.scale.name}
                    </span>
                  )}
                </div>
                {hasSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-6 sm:h-7 gap-1 px-2 text-xs"
                  >
                    <RotateCcw className="h-3 sm:h-3.5 w-3 sm:w-3.5" />{" "}
                    <span className="hidden sm:inline">limpar</span>
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {queixas.map((q) => {
                  const sel = selectedQueixas.includes(q.id);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      aria-pressed={sel}
                      onMouseEnter={() => softHover()}
                      onClick={() => toggleQueixa(q.id)}
                      className={`rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 min-h-9 sm:min-h-auto ${sel ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"}`}
                    >
                      {q.emoji && (
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-sm sm:text-base leading-none"
                        >
                          {q.emoji}
                        </span>
                      )}
                      {/* Sem truncate: rótulo POR EXTENSO + dica em linguagem de pai/mãe
                  (o que a criança faz), pra um leigo escolher a queixa certa. */}
                      <span className="min-w-0 flex flex-col">
                        <span className="whitespace-normal break-words text-[10px] sm:text-xs leading-tight">
                          {q.label}
                        </span>
                        {q.parentHint && (
                          <span
                            className={`whitespace-normal break-words text-[8px] sm:text-[9px] font-medium leading-tight ${sel ? "text-primary-foreground/75" : "text-muted-foreground"}`}
                          >
                            {q.parentHint}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              {suggestedCompanions.length > 0 && (
                <div
                  className="flex flex-wrap items-center gap-1.5 pt-1"
                  aria-label="Queixas que costumam vir junto"
                >
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    💡 Costuma vir junto:
                  </span>
                  {suggestedCompanions.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => toggleQueixa(q.id)}
                      onMouseEnter={() => softHover()}
                      aria-label={`Adicionar também a queixa ${q.label}`}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary transition hover:-translate-y-0.5 hover:bg-primary/20"
                    >
                      {q.emoji && <span aria-hidden="true">{q.emoji}</span>}
                      {q.label}
                      <span aria-hidden="true" className="text-primary/70">
                        ＋
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Quem responde
              </p>
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
                <button
                  key="crianca"
                  type="button"
                  aria-pressed={selectedRespondente === "teste_direto_crianca"}
                  aria-label="Respondente: criança (teste direto preenchível)"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedRespondente((v) =>
                      v === "teste_direto_crianca"
                        ? null
                        : "teste_direto_crianca",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "teste_direto_crianca" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">🧒</span>{" "}
                  <span className="hidden sm:inline">Direto</span>
                </button>
                <button
                  key="pais"
                  type="button"
                  aria-pressed={selectedRespondente === "pais"}
                  aria-label="Respondente: pais ou cuidador"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedRespondente((v) =>
                      v === "pais" ? null : "pais",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "pais" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">👨‍👩‍👧</span>{" "}
                  <span className="hidden sm:inline">Pais</span>
                </button>
                <button
                  key="professor"
                  type="button"
                  aria-pressed={selectedRespondente === "professor"}
                  aria-label="Respondente: professor ou escola"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedRespondente((v) =>
                      v === "professor" ? null : "professor",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "professor" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">👨‍🏫</span>{" "}
                  <span className="hidden sm:inline">Escola</span>
                </button>
                <button
                  key="clinico"
                  type="button"
                  aria-pressed={selectedRespondente === "clinico"}
                  aria-label="Respondente: clínico (observação direta)"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedRespondente((v) =>
                      v === "clinico" ? null : "clinico",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "clinico" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">👨‍⚕️</span>{" "}
                  <span className="hidden sm:inline">Clínico</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Comunicação
              </p>
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
                <button
                  key="verbal"
                  type="button"
                  aria-pressed={selectedCommunication === "verbal"}
                  aria-label="Comunicação: criança verbal (fala)"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedCommunication((v) =>
                      v === "verbal" ? null : "verbal",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedCommunication === "verbal" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">🗣️</span>{" "}
                  <span className="hidden sm:inline">Fala</span>
                </button>
                <button
                  key="nonverbal"
                  type="button"
                  aria-pressed={selectedCommunication === "nonverbal"}
                  aria-label="Comunicação: criança não-verbal"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedCommunication((v) =>
                      v === "nonverbal" ? null : "nonverbal",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedCommunication === "nonverbal" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">🤐</span>{" "}
                  <span className="hidden sm:inline">Não-Verbal</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Alfabetização
              </p>
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
                <button
                  key="literate"
                  type="button"
                  aria-pressed={selectedLiteracy === "literate"}
                  aria-label="Alfabetização: criança alfabetizada"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedLiteracy((v) =>
                      v === "literate" ? null : "literate",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedLiteracy === "literate" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">📖</span>{" "}
                  <span className="hidden sm:inline">Alfabetizada</span>
                </button>
                <button
                  key="preliterate"
                  type="button"
                  aria-pressed={selectedLiteracy === "preliterate"}
                  aria-label="Alfabetização: criança pré-alfabetizada"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedLiteracy((v) =>
                      v === "preliterate" ? null : "preliterate",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedLiteracy === "preliterate" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">👶</span>{" "}
                  <span className="hidden sm:inline">Pré-Alfab.</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Tipo de avaliação
              </p>
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
                <button
                  key="diagnostic"
                  type="button"
                  aria-pressed={selectedAssessmentType === "diagnostic"}
                  aria-label="Tipo de avaliação: diagnóstico"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedAssessmentType((v) =>
                      v === "diagnostic" ? null : "diagnostic",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedAssessmentType === "diagnostic" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">🔍</span>{" "}
                  <span className="hidden sm:inline">Diagnóstico</span>
                </button>
                <button
                  key="monitoring"
                  type="button"
                  aria-pressed={selectedAssessmentType === "monitoring"}
                  aria-label="Tipo de avaliação: monitorização"
                  onMouseEnter={() => softHover()}
                  onClick={() =>
                    setSelectedAssessmentType((v) =>
                      v === "monitoring" ? null : "monitoring",
                    )
                  }
                  className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedAssessmentType === "monitoring" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">📊</span>{" "}
                  <span className="hidden sm:inline">Monitorização</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Disponibilidade no app
              </p>
              <div
                className="grid grid-cols-2 gap-1.5 sm:gap-2"
                role="group"
                aria-label="Filtrar escalas pela forma de uso"
              >
                <button
                  type="button"
                  aria-pressed={availabilityMode === "complete"}
                  onMouseEnter={() => softHover()}
                  onClick={() => setAvailabilityMode("complete")}
                  className={`min-h-10 rounded-xl border px-2 py-2 text-left text-xs font-bold transition sm:rounded-2xl sm:px-3 ${availabilityMode === "complete" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">✅</span> Completas
                  <span className="mt-0.5 block text-[10px] font-semibold">
                    preenchíveis
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={availabilityMode === "all"}
                  onMouseEnter={() => softHover()}
                  onClick={() => setAvailabilityMode("all")}
                  className={`min-h-10 rounded-xl border px-2 py-2 text-left text-xs font-bold transition sm:rounded-2xl sm:px-3 ${availabilityMode === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <span aria-hidden="true">📚</span> Todas
                  <span className="mt-0.5 block text-[10px] font-semibold">
                    inclui fichas
                  </span>
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                {availabilityMode === "all"
                  ? "Fichas técnicas aparecem com identificação clara; nenhuma é apresentada como aplicação completa."
                  : "Mostrando somente instrumentos com aplicação preenchível dentro do app."}
              </p>
            </div>
          </section>

          {/* Mascote Inteligente — muda com padrão detectado */}
          {!hasSearch && (
            <div className="flex justify-center mt-4">
              <Mascote
                contexto="home"
                size="md"
                fala="Conte a idade e os sinais observados. Eu ajudo a organizar as opções mais adequadas."
              />
            </div>
          )}

          {/* Sintomas populares — aparece assim que uma queixa é marcada (não exige
          idade). Muitos sinais em linguagem de pai/mãe, tocáveis, estilo Lovable. */}
          {selectedQueixas.length >= 1 && (
            <div className="mt-4">
              <PopularSymptomPicker
                selectedQueixas={selectedQueixas}
                selectedSignalIds={selectedSignalIds}
                onToggle={(signalId) => {
                  softTick();
                  haptic.select();
                  setSelectedSignalIds((prev) =>
                    prev.includes(signalId)
                      ? prev.filter((x) => x !== signalId)
                      : [...prev, signalId],
                  );
                }}
                onClear={() => {
                  softTap();
                  haptic.tap();
                  setSelectedSignalIds([]);
                }}
                onHover={() => softHover()}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Results (lg:col-span-2) */}
        {hasSearch && (
          <section className="space-y-3 lg:col-span-2">
            {acuteRiskContext && (
              <div
                className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-950 dark:border-red-800 dark:bg-red-950/35 dark:text-red-100"
                role="alert"
              >
                <p className="font-black">
                  Priorize a segurança antes de qualquer escala.
                </p>
                <p className="mt-1 leading-relaxed">
                  Se houver perigo imediato, tentativa em curso ou risco de a
                  pessoa se machucar, não a deixe sozinha: acione o SAMU 192 ou
                  procure um serviço de emergência. O ranking é apenas apoio e
                  não substitui avaliação clínica imediata.
                </p>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  saída obrigatória
                </p>
                <h2
                  className="text-xl text-foreground"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                >
                  Recomendações por prioridade clínica
                </h2>
              </div>
              {hasSafeResults && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyRecommendation}
                    className="gap-1.5"
                    aria-label="Copiar recomendação para o laudo"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {copiedRec ? "Copiado!" : "Copiar"}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPdf}
                    className="gap-1.5"
                    aria-label="Exportar recomendação em PDF"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCsv}
                    className="gap-1.5"
                    aria-label="Exportar recomendação em CSV (Excel)"
                  >
                    <Table className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">CSV</span>
                  </Button>
                </div>
              )}
            </div>
            {usingBroadbandFallback && (
              <div
                className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100"
                role="note"
              >
                Sem instrumento <strong>específico</strong> validado para esta
                combinação nesta idade. Mostrando <strong>triagem ampla</strong>{" "}
                apropriada à idade (instrumentos reais) — use como rastreio
                inicial, não como avaliação específica.
              </div>
            )}
            <p className="sr-only" role="status" aria-live="polite">
              {hasSafeResults
                ? `${refinedMatches.length} escala${refinedMatches.length === 1 ? "" : "s"} segura${refinedMatches.length === 1 ? "" : "s"} encontrada${refinedMatches.length === 1 ? "" : "s"} para este perfil.`
                : "Nenhuma escala segura para este perfil. Refine idade, queixa ou respondente."}
            </p>

            {/* Síntese clínica do motor de filtragem avançada */}
            {refinedMatches.length > 0 && (
              <div
                className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 p-3 sm:p-4"
                data-testid="filter-safe-results-summary"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  síntese clínica
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {clinicalRecommendation}
                </p>
              </div>
            )}

            {/* Recomendações OPB Estruturadas (queixa única) — derivadas do ranking
            clínico curado; só aparecem quando o trio inteiro já passou pelo
            motor clínico para este perfil. */}
            {(() => {
              if (!hasSafeResults || selectedQueixas.length !== 1) return null;
              const queixaId = selectedQueixas[0];
              const rule = getClinicalTiers(queixaId, curatedAgeMonths);
              if (!rule || !rule.prata || !rule.bronze) return null;

              // Não contorna idade, respondente, licença nem bloqueios clínicos:
              // uma escala curada só entra no OPB se estiver no resultado refinado.
              const resolveScale = (id: string) => refinedById.get(id)?.scale;
              const sOuro = resolveScale(rule.ouro);
              const sPrata = resolveScale(rule.prata);
              const sBronze = resolveScale(rule.bronze);
              if (!sOuro || !sPrata || !sBronze) return null;

              const refNote = (s: ScaleEntry) => {
                if (opensAsUsableTool(s)) return "";
                return " · Abre como recurso complementar ou ficha, não como escala de itens preenchível aqui.";
              };

              const queixaLabel =
                queixas.find((q) => q.id === queixaId)?.label ?? queixaId;
              const ageBand = selectedAge
                ? faixasEtarias.find((a) => a.id === selectedAge)
                : null;
              const ageRangeLabel = ageBand
                ? ageBand.label
                : `${rule.ageMin}–${rule.ageMax} meses`;

              const recommendations: QueixaAgeRecommendations = {
                queixa: queixaId,
                ageRange: ageRangeLabel,
                ageMin: rule.ageMin,
                ageMax: rule.ageMax,
                ouro: buildOPB(
                  "ouro",
                  sOuro,
                  rule.reason + refNote(sOuro),
                  queixaLabel,
                ),
                prata: buildOPB(
                  "prata",
                  sPrata,
                  OPB_WHY.prata + refNote(sPrata),
                  queixaLabel,
                ),
                bronze: buildOPB(
                  "bronze",
                  sBronze,
                  OPB_WHY.bronze + refNote(sBronze),
                  queixaLabel,
                ),
              };

              return (
                <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 sm:p-6">
                  <OPBRecommendationCards recommendations={recommendations} />
                </div>
              );
            })()}

            {/* Testes Diretos / para Pais — só quando o motor achou escala segura.
            Coerência: não sugerir testes quando a saída é "nenhuma escala segura". */}
            {hasSafeResults && (
              <>
                <DirectTestsRecommender
                  selectedQueixas={selectedQueixas}
                  selectedAge={selectedAge}
                  faixasEtarias={faixasEtarias}
                />
                <ParentTestsRecommender
                  selectedQueixas={selectedQueixas}
                  selectedAge={selectedAge}
                  faixasEtarias={faixasEtarias}
                />
              </>
            )}

            {hasSafeResults && (
              <div className="flex items-center gap-2.5 px-0.5 pt-1">
                <span className="text-lg" aria-hidden="true">
                  🎯
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Pódio clínico para este perfil
                  </p>
                  <p className="text-[12px] leading-snug text-muted-foreground">
                    Priorizado por idade, queixa e respondente. Cada card mostra{" "}
                    <strong className="text-foreground">
                      🇧🇷 validação no Brasil
                    </strong>
                    , <strong className="text-foreground">⏱️ tempo</strong> e{" "}
                    <strong className="text-foreground">
                      🎯 ponto de corte
                    </strong>{" "}
                    quando disponíveis — toque para abrir.
                  </p>
                </div>
              </div>
            )}

            {!hasSafeResults ? (
              <Card className="border-2 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <CardContent className="flex items-start gap-3 p-5 text-sm font-bold text-amber-900 dark:text-amber-100">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <span>{SAFE_EMPTY_MESSAGE}</span>
                </CardContent>
              </Card>
            ) : (
              <div className="filter-260-grid">
                {ranking.map((item) => {
                  const reasons = item.hasScale
                    ? getRecommendationReasons(
                        item.scale,
                        selectedQueixas,
                        selectedAge,
                      )
                    : [];
                  const ctaLabel = !item.hasScale
                    ? "—"
                    : item.implementationStatus === "complete" ||
                        (item.scale && opensAsUsableTool(item.scale))
                      ? "Abrir aplicação"
                      : "Abrir uso interno";
                  const cardInner = (
                    <Card
                      className={`filter-260-card group h-full border-border/70 bg-card/90 transition-all duration-200 ${item.hasScale ? "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0" : "opacity-70"} ${item.tier ? `tier-${item.tier}` : ""}`}
                    >
                      <CardContent className="filter-260-card-content">
                        <div className="filter-260-medalrow flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`filter-260-medal ${item.tier ? `medal-${item.tier}` : "medal-direto"}`}
                          >
                            <span aria-hidden="true">
                              {slotEmoji(item.slot)}
                            </span>{" "}
                            {item.slot}
                          </Badge>
                          {item.clinicalTier && (
                            <Badge
                              variant="secondary"
                              className="filter-260-badge text-[10px]"
                            >
                              {item.clinicalTier}
                            </Badge>
                          )}
                          {item.confidence !== null && (
                            <span
                              className="inline-block rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground"
                              title="Aderência ao perfil informado — combina a força do casamento clínico (idade, queixa, respondente) com quantos filtros você preencheu. NÃO é sensibilidade/especificidade do instrumento."
                            >
                              {item.confidence}% aderência
                            </span>
                          )}
                          {(() => {
                            const lc = licenseChip(item.scale);
                            return lc ? (
                              <span
                                className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${lc.cls}`}
                              >
                                {lc.label}
                              </span>
                            ) : null;
                          })()}
                          {(() => {
                            const bv = brValidationChip(item.scale);
                            return bv ? (
                              <span
                                className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${bv.cls}`}
                              >
                                {bv.label}
                              </span>
                            ) : null;
                          })()}
                          {(() => {
                            const t = timeChip(item.scale);
                            return t ? (
                              <span className="inline-block rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                                ⏱️ {t}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {item.warnings.length > 0 && (
                          <div className="rounded-lg border border-red-300 bg-red-50 px-2 py-1.5 text-[11px] font-bold leading-snug text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                            {item.warnings.map((w) => (
                              <p key={w}>{w}</p>
                            ))}
                          </div>
                        )}
                        <div className="filter-260-head">
                          <div
                            className={`filter-260-symbol bg-gradient-to-br ${item.tone}`}
                          >
                            {icon(item.slot)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="filter-260-title group-hover:text-primary">
                              {item.title}
                            </h3>
                            <p className="filter-260-subtitle">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        {reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {reasons.map((r) => (
                              <Badge
                                key={r}
                                variant="secondary"
                                className="filter-260-badge text-[10px]"
                              >
                                {r}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {!item.hasScale && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-snug text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            <strong>Por que vazio:</strong>{" "}
                            {emptySlotReason(item.slot, {
                              hasQueixa: selectedQueixas.length > 0,
                              hasAge: Boolean(selectedAge),
                              respondente: selectedRespondente,
                              communication: selectedCommunication,
                            })}
                          </div>
                        )}
                        {item.hasScale && (
                          <div className="filter-260-evidence">
                            <strong>Motivo:</strong> {item.reason}
                          </div>
                        )}
                        {item.hasScale && item.clinicalReason && (
                          <div className="filter-260-evidence">
                            <strong>Por que ranqueou:</strong>{" "}
                            {item.clinicalReason}
                          </div>
                        )}
                        {item.hasScale && (
                          <div className="filter-260-why">
                            <strong>Estado:</strong> {item.state}
                          </div>
                        )}
                        {item.scale?.scoringCutoff && (
                          <div className="filter-260-source line-clamp-2">
                            <strong>🎯 Ponto de corte:</strong>{" "}
                            {item.scale.scoringCutoff}
                          </div>
                        )}
                        {item.source && (
                          <div className="filter-260-source">
                            <strong>Fonte:</strong> {item.source}
                          </div>
                        )}
                        {(() => {
                          const pm = pubmedRef(item.scale);
                          return pm ? (
                            <div className="filter-260-source">
                              <a
                                href={pm.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-primary underline underline-offset-2 hover:opacity-80"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📄 Estudo (PubMed {pm.pmid})
                              </a>
                            </div>
                          ) : null;
                        })()}
                        <div className="mt-auto flex items-center justify-between text-xs font-bold text-primary">
                          <span>{ctaLabel}</span>
                          {item.hasScale && <ArrowRight className="h-4 w-4" />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                  return item.hasScale ? (
                    <Link
                      key={item.slot}
                      href={item.route}
                      className="block h-full"
                    >
                      {cardInner}
                    </Link>
                  ) : (
                    <div key={item.slot} className="block h-full">
                      {cardInner}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Comparação lado a lado — 2 a 3 escalas recomendadas, atributo a
            atributo (idade, respondente, tempo, validação BR, corte, licença). */}
            {hasSafeResults && comparablePool.length >= 2 && (
              <section className="space-y-2.5 rounded-2xl border border-border/70 bg-card/60 p-3 sm:p-4">
                <div className="flex items-center gap-2.5 px-0.5">
                  <span className="text-lg" aria-hidden="true">
                    ⚖️
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Comparar lado a lado
                    </p>
                    <p className="text-[12px] leading-snug text-muted-foreground">
                      Escolha 2 a 3 escalas para comparar atributo a atributo
                      (ex.: versão dos pais × da criança).
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {comparablePool.map((s) => {
                    const on = compareIds.includes(s.id);
                    const disabled = !on && compareIds.length >= 3;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleCompare(s.id)}
                        disabled={disabled}
                        aria-pressed={on}
                        onMouseEnter={() => softHover()}
                        className={`rounded-2xl border px-2.5 py-1.5 text-xs font-bold transition ${on ? "border-primary bg-primary text-primary-foreground shadow-sm" : disabled ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground/60" : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"}`}
                      >
                        {on ? "✓ " : ""}
                        {s.name}
                      </button>
                    );
                  })}
                  {compareIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        softTap();
                        haptic.tap();
                        setCompareIds([]);
                      }}
                      className="rounded-2xl border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-primary/40"
                    >
                      limpar
                    </button>
                  )}
                </div>
                {comparing.length >= 2 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-left text-xs">
                      <thead>
                        <tr>
                          <th className="w-28 border-b border-border/60 px-2 py-2 align-bottom text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Atributo
                          </th>
                          {comparing.map((s) => (
                            <th
                              key={s.id}
                              className="border-b border-border/60 px-2 py-2 align-bottom"
                            >
                              <span className="block font-black leading-tight text-foreground">
                                {s.name}
                              </span>
                              <span className="block text-[10px] font-medium leading-tight text-muted-foreground line-clamp-2">
                                {s.fullName}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {COMPARE_ATTRS.map((attr) => (
                          <tr key={attr.label} className="align-top">
                            <td className="border-b border-border/40 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">
                              {attr.label}
                            </td>
                            {comparing.map((s) => (
                              <td
                                key={s.id}
                                className="border-b border-border/40 px-2 py-1.5 text-[11px] leading-snug text-foreground"
                              >
                                {attr.get(s)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-0.5 text-[11px] italic text-muted-foreground">
                    Selecione pelo menos 2 escalas acima para ver o quadro
                    comparativo.
                  </p>
                )}
              </section>
            )}

            {hasSafeResults && qualitativeReportParagraphs.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-primary/20 bg-card/70 p-4 sm:p-5">
                <div className="flex items-start gap-2.5">
                  <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      relato qualitativo final
                    </p>
                    <h3 className="text-sm font-black text-foreground">
                      Interpretação por extenso do pódio
                    </h3>
                  </div>
                </div>
                <div className="space-y-2.5 text-[12px] leading-relaxed text-foreground">
                  {qualitativeReportParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </section>
            )}

            <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20">
              <CardContent className="p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
                <strong>Leitura prudente:</strong>{" "}
                {availabilityMode === "all"
                  ? "o modo Todas inclui aplicações e fichas técnicas com rota real; confirme o selo antes de abrir."
                  : "o modo Completas mostra apenas instrumentos preenchíveis no app."}{" "}
                O filtro organiza opções e não substitui avaliação clínica.
              </CardContent>
            </Card>
          </section>
        )}

        {!hasSearch && (
          <section className="lg:col-span-2 space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <Card className="border-dashed">
                <CardContent className="space-y-2 p-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-black text-foreground">
                    Só o que abre pra usar
                  </h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    O filtro mostra apenas escalas que abrem como ferramenta
                    aplicável — itens preenchíveis e cálculo de escore. Nada de
                    ficha que só dá pra ler.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardContent className="space-y-2 p-4">
                  <School className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-black text-foreground">
                    Escola aparece
                  </h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    O bloco escolar prioriza instrumentos com professor como
                    respondente.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardContent className="space-y-2 p-4">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-black text-foreground">
                    Licença visível
                  </h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Escalas restritas não têm itens protegidos reproduzidos. O
                    app sinaliza a licença e, quando disponível, oferece
                    adaptação autoral ou encaminha para a fonte oficial.
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 p-5 sm:p-6">
              <CardContent className="space-y-5 p-0">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="text-4xl sm:text-5xl">🧠</div>
                  <div className="flex-1">
                    <h3 className="font-black text-foreground">
                      Como usar o Filtro em 4 passos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Combine os critérios à esquerda e o filtro monta o ranking
                      de escalas para você. 😉
                    </p>
                  </div>
                </div>

                {/* Passo a passo ilustrado */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                    <span className="text-2xl leading-none" aria-hidden="true">
                      1️⃣
                    </span>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="text-base" aria-hidden="true">
                        🎂
                      </span>{" "}
                      Escolha a{" "}
                      <strong className="text-foreground">idade</strong> da
                      criança.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                    <span className="text-2xl leading-none" aria-hidden="true">
                      2️⃣
                    </span>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="text-base" aria-hidden="true">
                        🩺
                      </span>{" "}
                      Marque a{" "}
                      <strong className="text-foreground">queixa</strong> e os
                      sintomas observados.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                    <span className="text-2xl leading-none" aria-hidden="true">
                      3️⃣
                    </span>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="text-base" aria-hidden="true">
                        🙋
                      </span>{" "}
                      Diga{" "}
                      <strong className="text-foreground">
                        quem vai responder
                      </strong>{" "}
                      (criança, pais, escola ou clínico).
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                    <span className="text-2xl leading-none" aria-hidden="true">
                      4️⃣
                    </span>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="text-base" aria-hidden="true">
                        👆
                      </span>{" "}
                      <strong className="text-foreground">
                        Toque na escala
                      </strong>{" "}
                      recomendada para abri-la.
                    </p>
                  </div>
                </div>

                {/* Legenda didática das medalhas */}
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3 sm:p-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                    Como ler o ranking 🏅
                  </p>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                    <li>
                      <span aria-hidden="true">🥇</span>{" "}
                      <strong className="text-foreground">Ouro</strong> — a
                      escala principal, que melhor responde à sua dúvida.
                    </li>
                    <li>
                      <span aria-hidden="true">🥈</span>{" "}
                      <strong className="text-foreground">Prata</strong> —
                      complementa e detalha o que o Ouro não cobre.
                    </li>
                    <li>
                      <span aria-hidden="true">🥉</span>{" "}
                      <strong className="text-foreground">Bronze</strong> — uma
                      perspectiva adicional, quando ainda restam dúvidas.
                    </li>
                  </ul>
                </div>

                {/* Aviso prudente, em tom acolhedor */}
                <p className="flex items-start gap-2 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:text-amber-100">
                  <span aria-hidden="true">💡</span>
                  <span>
                    O filtro <strong>organiza e sugere</strong> instrumentos —
                    ele nunca substitui a avaliação clínica nem fecha
                    diagnóstico sozinho.
                  </span>
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* Catálogo resumido — Full Width */}
      <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              prévia do catálogo filtrado
            </p>
            <h2 className="text-sm font-black text-foreground">
              {rankedPool.slice(0, 24).length} principais resultados
            </h2>
          </div>
          <Link
            href="/escalas-neuropsiquiatria"
            className="text-xs font-bold text-primary"
          >
            Ver catálogo mundial
          </Link>
        </div>
        <div className="filter-260-grid compact">
          {rankedPool.slice(0, 24).map((s) => {
            const visual = getScaleVisual(s);
            const Icon = visual.Icon;
            return (
              <Link
                key={s.id}
                href={resolveAppRoute(s) ?? `/generic-scale/${s.id}`}
                className="filter-260-card compact block rounded-2xl border border-border/70 bg-background/70 transition-all duration-200 cursor-pointer hover:border-primary/30 hover:bg-background hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="filter-260-card-content compact">
                  <div className="filter-260-head">
                    <div
                      className={`filter-260-symbol small bg-gradient-to-br ${visual.tone}`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.9} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="filter-260-title small">{s.name}</p>
                          <p className="filter-260-subtitle line-clamp-2">
                            {s.fullName}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge variant="outline" className="filter-260-badge">
                            {isFullApp(s)
                              ? "Aplicação completa"
                              : "Ficha técnica"}
                          </Badge>
                          <Badge variant="outline" className="filter-260-badge">
                            {visual.label}
                          </Badge>
                          {s.id.startsWith("world-") && (
                            <Badge
                              variant="outline"
                              className="filter-260-badge"
                            >
                              mundial
                            </Badge>
                          )}
                          {(() => {
                            const lc = licenseChip(s);
                            return lc ? (
                              <span
                                className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${lc.cls}`}
                              >
                                {lc.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {s.respondente.join(" · ")} ·{" "}
                        {Math.round(s.ageMin / 12)}–{Math.round(s.ageMax / 12)}{" "}
                        anos
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
