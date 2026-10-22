/**
 * Estrutura obrigatória do circuito clínico.
 *
 * Toda missão da assistente na faixa etária (as estações do médico não entram) exige: resultado ("Como foi?"), quem informou e,
 * quando a tarefa foi realizada, ao menos um marcador ou uma descrição. "Teve dificuldade"
 * (achado) exige descrição do achado. A síntese final do examinador também é obrigatória.
 *
 * Obrigatório significa: a missão só conta como concluída com esses campos, o circuito é declarado
 * COMPLETO ou INCOMPLETO no relatório e a pendência fica visível em todo o fluxo. Nenhum controle
 * é desabilitado e a navegação segue livre: o jogo não libera documento nem conclui diagnóstico.
 */
import { circuitForAssistant, type CircuitArea, type CircuitSource, type CircuitStatus } from "./clinicalCircuit";

export const DESCRICAO_ACHADO_MINIMA = 10;

export type CampoObrigatorio = "resultado" | "fonte" | "marcador_ou_descricao" | "descricao_do_achado";

export const CAMPO_LABELS: Record<CampoObrigatorio, string> = {
  resultado: "resultado (Como foi?)",
  fonte: "quem informou",
  marcador_ou_descricao: "ao menos um marcador ou uma descrição",
  descricao_do_achado: `descrição do achado (mínimo de ${DESCRICAO_ACHADO_MINIMA} caracteres)`,
};

/** O que o auxiliar informou numa missão. Tudo é opcional no estado e obrigatório para concluir. */
export interface EstadoMissao {
  status?: CircuitStatus;
  source?: CircuitSource;
  marcadores?: readonly string[];
  descricao?: string;
}

export interface PendenciaMissao {
  id: string;
  titulo: string;
  area: CircuitArea;
  faltam: CampoObrigatorio[];
}

export interface ResumoObrigatorio {
  total: number;
  concluidas: number;
  pendencias: PendenciaMissao[];
  sinteseFeita: boolean;
  completo: boolean;
}

/** Campos obrigatórios que ainda faltam numa missão. Lista vazia = missão concluída. */
export function camposPendentes(estado: EstadoMissao): CampoObrigatorio[] {
  const faltam: CampoObrigatorio[] = [];
  if (!estado.status) faltam.push("resultado");
  if (!estado.source) faltam.push("fonte");
  const descricao = (estado.descricao ?? "").trim();
  if (estado.status === "observado" && !(estado.marcadores?.length) && !descricao) faltam.push("marcador_ou_descricao");
  if (estado.status === "achado" && descricao.length < DESCRICAO_ACHADO_MINIMA) faltam.push("descricao_do_achado");
  return faltam;
}

export function resumoObrigatorio(years: number, estados: Readonly<Record<string, EstadoMissao>>, sintese: string): ResumoObrigatorio {
  const tarefas = circuitForAssistant(years);
  const pendencias: PendenciaMissao[] = [];
  for (const tarefa of tarefas) {
    const faltam = camposPendentes(estados[tarefa.id] ?? {});
    if (faltam.length) pendencias.push({ id: tarefa.id, titulo: tarefa.title, area: tarefa.area, faltam });
  }
  const sinteseFeita = sintese.trim().length > 0;
  return { total: tarefas.length, concluidas: tarefas.length - pendencias.length, pendencias, sinteseFeita, completo: pendencias.length === 0 && sinteseFeita };
}

/** Linha de status para o cabeçalho do relatório e para a tela. */
export function linhaObrigatorio(resumo: ResumoObrigatorio): string {
  return `CIRCUITO CLÍNICO OBRIGATÓRIO: ${resumo.completo ? "COMPLETO" : "INCOMPLETO"} — ${resumo.concluidas} de ${resumo.total} missões concluídas; síntese do examinador ${resumo.sinteseFeita ? "registrada" : "pendente"}.`;
}

/** Detalhe das pendências obrigatórias, uma por missão, para o corpo do relatório. */
export function detalheObrigatorio(resumo: ResumoObrigatorio): string[] {
  const linhas = [linhaObrigatorio(resumo)];
  for (const pendencia of resumo.pendencias) {
    linhas.push(`• ${pendencia.titulo}: falta ${pendencia.faltam.map((campo) => CAMPO_LABELS[campo]).join("; ")}.`);
  }
  if (!resumo.sinteseFeita) linhas.push("• Síntese final do examinador: falta registrar.");
  linhas.push("Obrigatório não trava a interface nem libera documento: a decisão de emitir o laudo é do médico, que vê este status.");
  return linhas;
}
