// Mapeamento textual → queixa/respondente para o registro mundial de escalas.
// Extraído de filtro.tsx para ser testável isoladamente (sem React/assets).

import type { ScaleEntry } from "./scaleFilter";

export function norm(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/**
 * Classifica um instrumento em queixas a partir de categoria + nome.
 *
 * Cuidado clínico (ASQ): "ASQ-3 / Ages & Stages" = desenvolvimento; "Ask
 * Suicide-Screening (ASQ)" = suicídio (capturado por "suic"). O token "asq"
 * isolado NÃO classifica como suicídio.
 */
export function guessQueixas(category: string, name: string): string[] {
  const t = norm(`${category} ${name}`);
  const set = new Set<string>();
  // TEA: estrito — só quando TEA/autismo explícito ou instrumentos diagnósticos.
  if (/tea|autis|ados|m-chat|assq|q-chat|cast|aq-10|cat-q|3di/.test(t)) set.add("tea");
  // ASQ-3 / Ages & Stages = desenvolvimento (NÃO confundir com ASQ suicídio).
  if (/desenvolvimento|milestone|swyc|cdc|gmcd|atraso|bayley|denver|asq-?3|ages ?& ?stages|ages and stages/.test(t)) set.add("atraso");
  // TDAH: exclui contexto de tiques/psicose.
  if (/tdah|adhd|snap(?!-)?|(?<!srs)vanderbilt|weiss|wfirs|aten|brief|conners/.test(t)) {
    if (!/tic|tourette|psicos|mania|bipolar/.test(t)) set.add("tdah");
  }
  if (/comport|external|agress|moas|nisonger|psc|sdq/.test(t)) set.add("comportamento");
  if (/ansiedade|anxiety|scared|scas|rcads|gad|pas/.test(t)) set.add("ansiedade");
  if (/depress|mood|phq|mfq|smfq|columbia depression/.test(t)) set.add("depressao");
  // Suicídio: "suic" já cobre "Ask Suicide-Screening (ASQ)". O token "asq" isolado
  // foi REMOVIDO daqui para não classificar o ASQ-3 (desenvolvimento) como suicídio.
  if (/suic|ask suicide|c-ssrs|safe-t/.test(t)) set.add("suicidio");
  if (/trauma|tept|ptsd|cats|cries|cpss|tesi/.test(t)) set.add("trauma");
  if (/tic|tourette|ygtss|puts|moves|twstrs/.test(t)) set.add("tiques");
  // Psicose: inclui mania/bipolar, mas NÃO Vanderbilt/TDAH a menos que explicitamente psicótico.
  if (/mania|bipolar|cmrs|ymrs|pgbi|mdq|gbi|psicos|delir|alucin/.test(t)) set.add("psicose");
  if (/eat|scoff|aliment/.test(t)) set.add("alimentacao");
  if (/sono|sleep|psq|bears/.test(t)) set.add("sono");
  if (/pain|dor/.test(t)) set.add("dor");
  if (/medic|remedio|farmaco|dose|efeito|side effect|adesao|tolerab|satisfacao/.test(t)) set.add("efeitos");
  if (/evolu|monitor|retorno|follow/.test(t)) set.add("evolucao");
  if (/cogn|promis|toolbox|life|family|peer|relationship|mobility|upper/.test(t)) set.add("funcionalidade");
  if (/school|professor|teacher|aprendiz/.test(t)) set.add("aprendizagem");
  return set.size ? Array.from(set) : ["funcionalidade"];
}

export function guessRespondente(value: string): ScaleEntry["respondente"] {
  const t = norm(value);
  const set = new Set<ScaleEntry["respondente"][number]>();
  if (/pais|cuidador|parent|caregiver/.test(t)) set.add("pais");
  if (/professor|teacher|escola/.test(t)) set.add("professor");
  if (/clinico|entrevista|clinical/.test(t)) set.add("clinico");
  if (/crianca|adolescente|paciente|auto/.test(t)) set.add("autoaplicavel");
  return set.size ? Array.from(set) : ["pais"];
}
