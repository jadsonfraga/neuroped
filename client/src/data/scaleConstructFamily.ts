/**
 * Família de instrumento e classe de informante — base do critério de
 * "escala repetitiva" do pódio do Filtro Clínico.
 *
 * Função PURA sobre metadados do catálogo. Não cria norma, ponto de corte,
 * equivalência psicométrica nem diagnóstico: apenas reconhece quando duas
 * escalas são o MESMO instrumento (outra edição, forma curta/longa, versão de
 * faixa etária vizinha, módulo da mesma bateria) ou o MESMO construto pelo
 * MESMO informante, para que o trio não gaste duas vagas na mesma pergunta.
 *
 * A mesma família respondida por informantes DIFERENTES (pais × professor ×
 * autorrelato × clínico × tarefa direta) é complementaridade legítima de
 * múltiplos informantes e continua permitida — mas no máximo duas vezes no
 * trio (ver `familyOverflow`).
 */
import { getApplicationMode } from "./advancedFilterLogic";

type ScaleLike = {
  id: string;
  name: string;
  queixas: string[];
  overlapGroup?: string;
  applicationMode?: string;
};

export type InformantClass = "pais" | "professor" | "autorrelato" | "clinico" | "direto" | "outro";

/** Quem fornece a informação. Observação, entrevista e registro clínico são o mesmo lado: o clínico. */
export function informantClass(scale: ScaleLike): InformantClass {
  switch (getApplicationMode(scale as Parameters<typeof getApplicationMode>[0])) {
    case "questionario_pais":
      return "pais";
    case "questionario_professor":
      return "professor";
    case "autoquestionario_crianca_adolescente":
      return "autorrelato";
    case "observacional_clinico":
    case "entrevista_clinica":
    case "registro_clinico":
      return "clinico";
    case "teste_direto_crianca":
      return "direto";
    default:
      return "outro";
  }
}

/**
 * Identidade curada de instrumentos cujo nome não revela o parentesco
 * (siglas com sufixo de edição/forma). Mesmo valor = mesmo instrumento ou
 * mesmo construto medido da mesma forma. Somente agrupamento; nenhuma
 * equivalência de escore.
 */
const CURATED_FAMILY: Readonly<Record<string, string>> = {
  // Mesmo instrumento: edição revisada, forma curta × longa ou cópia do catálogo mundial.
  bisq: "bisq",
  "bisq-r": "bisq",
  psc17: "psc",
  psc35: "psc",
  phq2: "phq-a",
  phqa: "phq-a",
  "world-phq-a": "phq-a",
  gad7: "gad-7",
  gad7ped: "gad-7",
  aq: "aq",
  aq10: "aq",
  "aq10-adolescente": "aq",
  snap: "snap-iv",
  "world-snap-iv-26": "snap-iv",
  cssrs: "c-ssrs",
  "world-c-ssrs": "c-ssrs",
  cybocs: "cy-bocs",
  "cybocs-sr": "cy-bocs",
  ymrs: "ymrs",
  "p-ymrs": "ymrs",
  "einpi-360": "einpi",
  "einpi-drj-v1": "einpi",
  "cgi-s": "cgi",
  "cgi-i": "cgi",
  // Mesmo construto, instrumentos diferentes, mesma forma de medir.
  "eva-ped": "dor-intensidade",
  "vas-pain": "dor-intensidade",
  "nrs-pain": "dor-intensidade",
  wongbaker: "dor-intensidade",
  "fps-r": "dor-intensidade",
  flacc: "dor-comportamental",
  rflacc: "dor-comportamental",
  cheops: "dor-comportamental",
  "comfort-b": "dor-comportamental",
  cries: "dor-comportamental",
};

/** Inventário amplo: cobre muitas queixas ao mesmo tempo (rastreio de banda larga). */
export const BROADBAND_MIN_COMPLAINTS = 10;
export function isBroadbandInventory(scale: ScaleLike): boolean {
  return scale.queixas.length >= BROADBAND_MIN_COMPLAINTS;
}

const STOPWORDS = new Set(["a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "para", "com", "por", "um", "uma"]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

/**
 * Chave de família pelo NOME, para as famílias que o próprio nome declara:
 * módulos de bateria ("IPN-LFC · Escola 30"), protocolos por faixa etária
 * ("Triagem Motora 0-6 Meses") e formas de um mesmo questionário autoral
 * ("Funções executivas — versão ampliada (pais)"). Devolve tokens.
 */
export function nameFamilyTokens(scale: ScaleLike): string[] {
  let name = scale.name;
  // Bateria: o que vem antes de " · " é o instrumento; depois, o módulo.
  const battery = name.split(" · ");
  if (battery.length > 1) name = battery[0];
  // Marca autoral antes do travessão ("Protocolo Dr. Jadson — Assunto"): vale o assunto.
  name = name.replace(/^\s*(protocolo|escala)\s+dr\.?\s+jadson\s*[—–-]\s*/i, "");
  // Primeiro segmento antes de travessão com espaços ("— versão ampliada").
  name = name.split(/\s[—–]\s/)[0];
  let text = normalizeText(name);
  text = text
    .replace(/\([^)]*\)/g, " ") // (pais), (professor), (autoral), (NEXUS-001)
    .replace(/\bnexus-\d+\b/g, " ")
    .replace(/\b\d+\s*[-–]\s*\d+\s*(meses|mes|anos|ano|m|a)\b/g, " ") // 0-6 meses, 1-5 anos, 18–30 meses
    .replace(/\b\d+\s*(meses|mes|anos|ano|m|a)\b/g, " ") // 12m, 4 anos
    .replace(/\b\d+\b/g, " ") // tamanho do módulo: 20, 30, 100
    .replace(/[^a-z0-9/]+/g, " ");
  return text.split(/\s+/).filter(Boolean);
}

const contentTokens = (tokens: string[]) => tokens.filter((t) => !STOPWORDS.has(t));

/** Uma chave é prefixo da outra, com pelo menos dois termos de conteúdo em comum. */
function sameNameFamily(a: ScaleLike, b: ScaleLike): boolean {
  const ta = nameFamilyTokens(a);
  const tb = nameFamilyTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (contentTokens(short).length < 2) return false;
  return short.every((token, index) => long[index] === token);
}

/** Mesmo instrumento ou mesmo construto curado, independentemente do informante. */
export function sameInstrumentFamily(a: ScaleLike, b: ScaleLike): boolean {
  if (a.id === b.id) return true;
  // Grupo de redundância declarado no catálogo prevalece sobre qualquer inferência.
  if (a.overlapGroup && a.overlapGroup === b.overlapGroup) return true;
  const ca = CURATED_FAMILY[a.id];
  const cb = CURATED_FAMILY[b.id];
  if (ca && cb) return ca === cb;
  return sameNameFamily(a, b);
}

/**
 * Par repetitivo por identidade de instrumento: mesma família pelo mesmo
 * informante, ou dois inventários amplos pelo mesmo informante.
 */
export function repetitiveByFamily(a: ScaleLike, b: ScaleLike): boolean {
  if (a.id === b.id) return true;
  const sameInformant = informantClass(a) === informantClass(b);
  if (!sameInformant) return false;
  if (sameInstrumentFamily(a, b)) return true;
  return isBroadbandInventory(a) && isBroadbandInventory(b);
}

/**
 * Trio inteiro de uma só família (mesmo com informantes diferentes) não
 * complementa: falta outro construto. Conta 1 por família que ocupa 3 vagas.
 */
export function familyOverflow(scales: ScaleLike[]): number {
  if (scales.length < 3) return 0;
  let overflow = 0;
  for (let i = 0; i < scales.length; i++) {
    for (let j = i + 1; j < scales.length; j++) {
      for (let k = j + 1; k < scales.length; k++) {
        if (
          sameInstrumentFamily(scales[i], scales[j]) &&
          sameInstrumentFamily(scales[i], scales[k]) &&
          sameInstrumentFamily(scales[j], scales[k])
        ) {
          overflow++;
        }
      }
    }
  }
  return overflow;
}
