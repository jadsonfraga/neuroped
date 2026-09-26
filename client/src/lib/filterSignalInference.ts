/**
 * Sinais/sintomas inferidos do texto livre ("não aponta" → "Não aponta pra
 * mostrar" da queixa TEA). Usa os MESMOS rótulos que o seletor de sintomas
 * (popularSymptoms) e os sinais detalhados por queixa (signalsAndSymptoms),
 * para que o id sugerido seja exatamente o que a UI e o motor já entendem.
 *
 * Só sugere; a pessoa confirma com um toque. Um sinal só tem sentido junto
 * da sua queixa, por isso a sugestão carrega a queixa-mãe.
 */
import { getPopularSymptoms } from "@/data/popularSymptoms";
import { getAllSignalsForQueixa } from "@/data/signalsAndSymptoms";

export interface InferredSignal {
  id: string;
  label: string;
  queixaId: string;
  /** Quantos termos do rótulo apareceram no texto. */
  matched: number;
}

const STOP = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "as", "os", "em", "no", "na", "nos", "nas", "com", "para", "pra", "pro", "por", "que", "um", "uma", "ao", "aos", "se", "ou", "muito", "muita", "mais", "menos", "ja", "ainda", "quando", "como", "sem", "toda", "todo", "tudo", "vez", "vezes", "coisa", "coisas"]);

function words(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function contentWords(value: string): string[] {
  return words(value).filter((w) => w.length >= 3 && !STOP.has(w));
}

function wordMatches(labelWord: string, queryWord: string): boolean {
  if (labelWord === queryWord) return true;
  // Prefixo tolerante para flexão ("aponta"/"apontar", "brinquedo"/"brinquedos").
  const min = Math.min(labelWord.length, queryWord.length);
  if (min < 4) return false;
  return labelWord.startsWith(queryWord) || queryWord.startsWith(labelWord);
}

/**
 * Para cada queixa ativa, rótulos de sintomas populares e de sinais
 * detalhados cujos termos de conteúdo aparecem (quase) todos no texto.
 * Regra: rótulo com 1 termo exige o termo; com 2+ exige todos os termos ou
 * pelo menos 3 quando o rótulo é longo. "não" conta como termo quando o
 * rótulo o tem (negação muda o sentido).
 */
export function inferSignalIds(query: string, queixaIds: readonly string[], limit = 4): InferredSignal[] {
  const queryWords = words(query);
  if (queryWords.length === 0) return [];
  const out: Array<InferredSignal & { words: string[] }> = [];
  const seen = new Set<string>();
  for (const queixaId of queixaIds) {
    const candidates: Array<{ id: string; label: string }> = [
      ...getPopularSymptoms(queixaId).map((s) => ({ id: s.id, label: s.label })),
      ...getAllSignalsForQueixa(queixaId).map((s) => ({ id: s.id, label: s.label })),
    ];
    for (const candidate of candidates) {
      if (seen.has(candidate.id)) continue;
      const labelWords = [...new Set(contentWords(candidate.label))];
      const negated = words(candidate.label).includes("nao");
      if (labelWords.length === 0) continue;
      const matchedWords = labelWords.filter((lw) => queryWords.some((qw) => wordMatches(lw, qw)));
      const matched = matchedWords.length;
      // Metade dos termos (arredondando para cima), com ao menos um termo
      // distintivo (4+ letras): "não aponta" basta para "Não aponta pra mostrar".
      const required = Math.max(1, Math.ceil(labelWords.length / 2));
      if (matched < required || !matchedWords.some((w) => w.length >= 4)) continue;
      if (negated && !queryWords.includes("nao")) continue;
      seen.add(candidate.id);
      out.push({ id: candidate.id, label: candidate.label, queixaId, matched, words: matchedWords });
    }
  }
  out.sort((a, b) => b.matched - a.matched || a.label.localeCompare(b.label, "pt-BR"));
  // "Demora pra andar" casou {demora, andar}; "Demora pra falar" só {demora}:
  // o segundo é subconjunto estrito do primeiro na mesma queixa e sai.
  const kept = out.filter((item, index) =>
    !out.slice(0, index).some(
      (better) => better.queixaId === item.queixaId && better.matched > item.matched && item.words.every((w) => better.words.includes(w)),
    ),
  );
  return kept.slice(0, limit).map(({ words: _words, ...rest }) => rest);
}
