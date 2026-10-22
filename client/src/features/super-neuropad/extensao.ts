/**
 * Extensão opcional do Super NeuroPad Game (v2026-10-21.1): 50 desafios disponíveis por idade.
 *
 * A bateria principal (18, 24, 30 ou 36 desafios, conforme a idade) não muda: limites de tempo, XP,
 * contagem, PDF e prontuário continuam os mesmos. Os opcionais completam 50 com itens dos mesmos bancos
 * de origem da idade (`OPTIONAL_BANK`), sem itens criados para a extensão. A aplicadora escolhe quais
 * aplicar conforme a finalidade e a tolerância da criança; não aplicar nenhum é uma opção válida.
 *
 * O registro dos opcionais é separado do registro da partida e fica só em memória, por idade.
 * Nada é interpretado: o texto relata o que foi aplicado e como a criança respondeu.
 */
import { DESCRIPTIVE_NOTICE } from "../../lib/descriptiveNotice";
import { DESAFIOS_DISPONIVEIS_POR_IDADE, OPTIONAL_BANK, type OptionalItem } from "./bank";
import { bandItemCount, formatDuration, itemSeconds, KIND_LABELS, ORIGIN_LABELS, phaseById, STATUS_LABELS, youngFactor, type AnswerRecord, type Item } from "./model";

export const EXTENSAO_VERSAO = "2026-10-21.1";
export { DESAFIOS_DISPONIVEIS_POR_IDADE };
export type { OptionalItem };

/** Registro dos opcionais: um por item; registrar de novo substitui o anterior. */
export type RegistrosOpcionais = Readonly<Record<string, AnswerRecord>>;

export function opcionaisDaIdade(years: number): readonly OptionalItem[] {
  return OPTIONAL_BANK[years] ?? [];
}

/** Idades em que letras e numerais ainda não são marco universal; o item continua disponível, com aviso. */
const IDADE_MAXIMA_AVISO_LETRAMENTO = 3;

/**
 * Aviso de contexto para opcionais que pedem letra ou numeral aos 2–3 anos (auditoria de 21/10/2026).
 * Não remove nem troca o item: a aplicadora decide. O aviso vai na tela e no texto copiado.
 */
export function avisoDeIdade(years: number, item: Item): string | null {
  if (years > IDADE_MAXIMA_AVISO_LETRAMENTO) return null;
  const alvo = item.kind === "toque" ? item.answer : item.kind === "montar" ? item.word : item.expected;
  const pedeLetraOuNumeral = /\b(letra|n[úu]mero)\b/i.test(item.prompt) || (item.kind === "toque" && /^[A-Za-zÀ-ÿ0-9]$/.test(alvo.trim()));
  if (!pedeLetraOuNumeral) return null;
  return `Aviso de idade: reconhecer letras ou números não é marco universal aos ${years} anos. Registre só o que ocorreu; erro, recusa ou falta de resposta não deve ser lido como achado.`;
}

export function disponiveisDaIdade(years: number): { principal: number; opcionais: number; total: number } {
  const principal = bandItemCount(String(years));
  const opcionais = opcionaisDaIdade(years).length;
  return { principal, opcionais, total: principal + opcionais };
}

/** Tempo dos opcionais aplicados em sequência, sem pausas nem adaptações (mesma régua da bateria principal). */
export function estimativaOpcionaisSegundos(years: number): number {
  const factor = youngFactor(years);
  return Math.round(opcionaisDaIdade(years).reduce((sum, entry) => sum + itemSeconds(entry.item) * factor, 0));
}

export function registrarOpcional(registros: RegistrosOpcionais, record: AnswerRecord): RegistrosOpcionais {
  return { ...registros, [record.itemId]: record };
}

export function apagarOpcional(registros: RegistrosOpcionais, itemId: string): RegistrosOpcionais {
  const { [itemId]: _removed, ...rest } = registros;
  return rest;
}

/** Próximo opcional ainda sem registro depois de `depoisDe` (volta ao início); `null` quando todos têm registro. */
export function proximoPendente(years: number, registros: RegistrosOpcionais, depoisDe?: string): string | null {
  const lista = opcionaisDaIdade(years);
  const start = depoisDe ? lista.findIndex((entry) => entry.item.id === depoisDe) + 1 : 0;
  for (let step = 0; step < lista.length; step++) {
    const entry = lista[(start + step) % lista.length];
    if (!registros[entry.item.id]) return entry.item.id;
  }
  return null;
}

/**
 * Registros que ainda não entraram numa cópia confirmada. A cópia guarda o retrato que foi copiado,
 * então uma resposta dada enquanto a cópia está pendente continua pendente.
 */
export function pendentesDeCopia(registros: RegistrosOpcionais, copiados: RegistrosOpcionais): number {
  return Object.values(registros).filter((record) => copiados[record.itemId] !== record).length;
}

function itemDoRegistro(years: number, record: AnswerRecord): Item | undefined {
  return opcionaisDaIdade(years).find((entry) => entry.item.id === record.itemId)?.item;
}

export function registradosNaOrdem(years: number, registros: RegistrosOpcionais): AnswerRecord[] {
  return opcionaisDaIdade(years).flatMap((entry) => (registros[entry.item.id] ? [registros[entry.item.id]] : []));
}

/** Texto do registro dos opcionais para copiar ao prontuário ou baixar em TXT. */
export function textoOpcionais(years: number, registros: RegistrosOpcionais, quando: string): string {
  const disponivel = disponiveisDaIdade(years);
  const registrados = registradosNaOrdem(years, registros);
  const naoAplicados = opcionaisDaIdade(years).filter((entry) => !registros[entry.item.id]);
  const linhas = [
    `SUPER NEUROPAD GAME — DESAFIOS OPCIONAIS (extensão v${EXTENSAO_VERSAO})`,
    `Data: ${quando} · Idade: ${years} anos (faixa anual)`,
    `Disponíveis nesta idade: ${disponivel.total} desafios (${disponivel.principal} na bateria principal + ${disponivel.opcionais} opcionais). Opcionais registrados: ${registrados.length} de ${disponivel.opcionais}.`,
    "Os opcionais ficam fora da contagem, do tempo e do XP da partida principal. Aplicação livre, a critério da aplicadora; item não aplicado não tem registro.",
    "Itens dos bancos de origem do NeuroPed (Reconhecimento Visual, Avaliação Cognitiva Infantil, Sonda 10 e OBS-10); nenhum item foi criado para a extensão.",
    "",
  ];
  if (registrados.length === 0) linhas.push("Nenhum desafio opcional registrado.");
  registrados.forEach((record, index) => {
    const mundo = phaseById(record.phaseId); // nome padrão: descreve o conteúdo do item em qualquer idade
    const extras = [`${Math.round(record.seconds)} s`, record.repeated ? "comando repetido 1x" : "", record.via === "gesto" ? "por gesto/apontar" : ""].filter(Boolean).join(" · ");
    linhas.push(`${index + 1}. [${mundo.name}] ${record.prompt}`);
    linhas.push(`   Registrado: ${record.given} (${STATUS_LABELS[record.status]}) · Critério de acerto: ${record.expected}`);
    linhas.push(`   ${KIND_LABELS[record.kind]} · ${ORIGIN_LABELS[record.origin]} · ${record.ref} · ${extras}`);
    const item = itemDoRegistro(years, record);
    const aviso = item ? avisoDeIdade(years, item) : null;
    if (aviso) linhas.push(`   ${aviso}`);
  });
  if (naoAplicados.length) {
    linhas.push("", `Opcionais não aplicados: ${naoAplicados.length}.`);
  }
  const tempo = registrados.reduce((sum, record) => sum + record.seconds, 0);
  if (registrados.length) linhas.push(`Tempo somado nos opcionais: ${formatDuration(Math.round(tempo))}.`);
  linhas.push("", DESCRIPTIVE_NOTICE);
  return linhas.join("\n");
}
