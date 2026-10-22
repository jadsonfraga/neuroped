// ============================================================================
// resumoPreConsulta/resumo.ts — resumo pré-consulta (somente dados salvos)
// ----------------------------------------------------------------------------
// Organiza o que JÁ está no prontuário e nas escalas: histórico, o que mudou
// desde a última visita, pendências, evolução das escalas (módulo
// evolucaoEscalas) e perguntas sugeridas. Nenhuma IA, nenhuma inferência
// clínica, nenhum texto inventado: campo vazio vira pendência, não conteúdo.
// As perguntas são modelos fixos acionados por regras sobre os dados, sempre
// rotuladas como SUGESTÃO.
// ============================================================================
import { formatIsoDateBr, localIsoDate } from "../clinicalDate";
import { calcularEvolucao, type PendenteEvolucao, type SerieEvolucao } from "../evolucaoEscalas";
import { decodificarProntuario, type Exame, type Medicacao, type ProntuarioDecodificado, type Terapia } from "./prontuario";

export const ROTULO_SUGESTAO = "Sugestão — não é conduta; escolha o que fizer sentido para esta consulta.";
export const AVISO_RESUMO = "Resumo montado apenas com dados já salvos no app. Não contém interpretação nem conduta. Confira com o prontuário antes de usar.";

export interface EntradaResumo {
  paciente: { nome: string; dataNascimento?: string; cid?: string };
  eventos: unknown[];
  remoto?: boolean;
  resultados: unknown[];
  /** Data de referência (ISO). Injetada para teste; padrão = agora. */
  hoje?: string;
}

export interface ItemMudanca { tipo: "medicacao" | "terapia" | "exame" | "anamnese" | "escala"; texto: string; data: string }
export interface ItemPendencia { tipo: string; texto: string }

export interface ResumoPreConsulta {
  paciente: { nome: string; idade: string; cid: string; hipotese: string };
  ultimaVisita: { data: string; diasDesde: number | null } | null;
  totalVisitas: number;
  historico: {
    queixa: string;
    anamnese: { rotulo: string; texto: string }[];
    marcosAlerta: string[];
    medicacoes: string[];
    terapias: string[];
    exames: string[];
  };
  mudancas: ItemMudanca[];
  pendencias: ItemPendencia[];
  evolucao: { series: SerieEvolucao[]; pendentes: PendenteEvolucao[] };
  perguntas: string[];
  texto: string;
}

const ROTULOS_ANAMNESE: Record<string, string> = {
  queixaPrincipal: "Queixa principal", gestacional: "Gestacional", perinatal: "Perinatal",
  patologicos: "Antecedentes patológicos", familiares: "Antecedentes familiares", escolar: "Escolar",
};
const t = (s: unknown) => (typeof s === "string" ? s.trim() : "");
const DIA = 86_400_000;

function br(iso: string): string {
  return formatIsoDateBr(iso) ?? "data não registrada";
}

export function idadeEm(nasc: string | undefined, ref: string): string {
  const a = new Date(nasc ?? "");
  const b = new Date(ref);
  if (!nasc || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return "";
  let anos = b.getUTCFullYear() - a.getUTCFullYear();
  let meses = b.getUTCMonth() - a.getUTCMonth();
  if (b.getUTCDate() < a.getUTCDate()) meses -= 1;
  if (meses < 0) { anos -= 1; meses += 12; }
  if (anos <= 0) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"}${meses > 0 && anos < 6 ? ` e ${meses} ${meses === 1 ? "mês" : "meses"}` : ""}`;
}

function resumoMed(m: Medicacao): string {
  return [t(m.nome), t(m.dose), t(m.posologia)].filter(Boolean).join(" · ") + (t(m.dataInicio) ? ` (desde ${br(m.dataInicio)})` : "");
}
function resumoTer(x: Terapia): string {
  return [t(x.tipo), t(x.profissional), t(x.frequencia)].filter(Boolean).join(" · ");
}
function resumoEx(x: Exame): string {
  return `${t(x.tipo)}${t(x.data) ? ` (${br(x.data)})` : ""}: ${t(x.status) || "sem status"}${t(x.resultado) ? `, ${t(x.resultado)}` : ""}`;
}

function mudancasDeVersoes(p: ProntuarioDecodificado): ItemMudanca[] {
  const out: ItemMudanca[] = [];
  for (const [chave, vs] of Object.entries(p.versoes)) {
    if (vs.length < 2) {
      continue;
    }
    const antes = vs[vs.length - 2];
    const depois = vs[vs.length - 1];
    const tipo = chave.startsWith("medicacao:") ? "medicacao" : chave.startsWith("terapia:") ? "terapia" : "exame";
    const nome = (depois.item as { nome?: string; tipo?: string } | null)?.nome ?? (depois.item as { tipo?: string } | null)?.tipo ?? (antes.item as { nome?: string; tipo?: string } | null)?.nome ?? (antes.item as { tipo?: string } | null)?.tipo ?? "item";
    if (depois.removido) { out.push({ tipo, data: depois.ocorridoEm, texto: `${nome}: removido do prontuário.` }); continue; }
    if (!antes.item || !depois.item) continue;
    const campos: [string, string][] = tipo === "medicacao"
      ? [["dose", "dose"], ["posologia", "posologia"], ["resposta", "resposta"], ["efeitosAdversos", "efeitos adversos"]]
      : tipo === "terapia" ? [["frequencia", "frequência"], ["evolucao", "evolução"], ["profissional", "profissional"]]
      : [["status", "status"], ["resultado", "resultado"], ["data", "data"]];
    for (const [k, rotulo] of campos) {
      const a = t((antes.item as unknown as Record<string, unknown>)[k]);
      const b = t((depois.item as unknown as Record<string, unknown>)[k]);
      if (a !== b) out.push({ tipo, data: depois.ocorridoEm, texto: `${nome}: ${rotulo} mudou de "${a || "vazio"}" para "${b || "vazio"}".` });
    }
  }
  for (const [chave, vs] of Object.entries(p.versoesTexto)) {
    if (vs.length < 2) continue;
    const a = t(vs[vs.length - 2].valor);
    const b = t(vs[vs.length - 1].valor);
    if (a !== b && chave.startsWith("anamnese:")) {
      const campo = chave.slice(9);
      out.push({ tipo: "anamnese", data: vs[vs.length - 1].ocorridoEm, texto: `${ROTULOS_ANAMNESE[campo] ?? campo}: registro alterado na última edição.` });
    }
  }
  return out;
}

export function montarResumo(e: EntradaResumo): ResumoPreConsulta {
  const hoje = e.hoje ?? new Date().toISOString();
  const p = decodificarProntuario(e.eventos, e.remoto ?? false);
  const ultima = p.encontros.length ? p.encontros[p.encontros.length - 1] : "";
  const dias = ultima ? Math.max(0, Math.floor((new Date(hoje).getTime() - new Date(ultima).getTime()) / DIA)) : null;

  const evolucao = calcularEvolucao(e.resultados);

  // ── histórico ──
  const anamnese = Object.entries(ROTULOS_ANAMNESE)
    .map(([k, rotulo]) => ({ rotulo, texto: t(p.anamnese[k]) }))
    .filter((a) => a.texto);
  const marcosAlerta: string[] = [];
  if (t(p.marcos.regressao) === "Sim") marcosAlerta.push(`Regressão registrada${t(p.marcos.regressaoDesc) ? `: ${t(p.marcos.regressaoDesc)}` : "."}`);
  if (t(p.marcos.crises) === "Sim") marcosAlerta.push(`Crises registradas${t(p.marcos.crisesDesc) ? `: ${t(p.marcos.crisesDesc)}` : "."}`);

  // ── mudanças desde a última visita ──
  const mudancas: ItemMudanca[] = mudancasDeVersoes(p);
  const corte = ultima ? new Date(ultima).getTime() : null;
  if (corte !== null) {
    for (const s of evolucao.series) {
      for (const pt of s.pontos) {
        if (new Date(pt.data).getTime() > corte) {
          mudancas.push({ tipo: "escala", data: pt.data, texto: `${s.instrumento.nome} aplicada em ${br(pt.data)}: escore ${pt.escore} (${pt.faixa}).` });
        }
      }
      for (const a of s.alertas) {
        if (new Date(a.data).getTime() > corte && (a.codigo === "piora-de-faixa" || a.codigo === "melhora-de-faixa" || a.codigo === "variacao-expressiva")) {
          mudancas.push({ tipo: "escala", data: a.data, texto: a.mensagem });
        }
      }
    }
    for (const m of p.medicacoes) {
      if (t(m.dataInicio) && new Date(m.dataInicio).getTime() > corte) mudancas.push({ tipo: "medicacao", data: m.dataInicio, texto: `${t(m.nome)}: início registrado em ${br(m.dataInicio)}, depois da última consulta.` });
    }
    for (const x of p.exames) {
      if (t(x.data) && new Date(x.data).getTime() > corte) mudancas.push({ tipo: "exame", data: x.data, texto: `${t(x.tipo)}: exame datado de ${br(x.data)}, depois da última consulta.` });
    }
  }
  mudancas.sort((a, b) => b.data.localeCompare(a.data));

  // ── pendências ──
  const pendencias: ItemPendencia[] = [];
  if (!p.encontros.length) pendencias.push({ tipo: "prontuario", texto: "Nenhuma consulta registrada no prontuário." });
  if (!t(p.anamnese.queixaPrincipal)) pendencias.push({ tipo: "anamnese", texto: "Queixa principal sem registro." });
  if (!t(e.paciente.cid) && !t(p.identificacao.cid) && !t(p.identificacao.hipoteseDiagnostica)) pendencias.push({ tipo: "diagnostico", texto: "Sem CID nem hipótese diagnóstica registrados." });
  for (const x of p.exames) {
    const st = t(x.status);
    if (!st || st === "Pendente") pendencias.push({ tipo: "exame", texto: `Exame "${t(x.tipo)}" sem resultado concluído (status: ${st || "vazio"}).` });
    else if (!t(x.resultado)) pendencias.push({ tipo: "exame", texto: `Exame "${t(x.tipo)}" com status ${st}, mas sem resultado descrito.` });
  }
  for (const m of p.medicacoes) {
    if (!t(m.resposta)) pendencias.push({ tipo: "medicacao", texto: `Medicação "${t(m.nome)}" sem resposta registrada.` });
    if (!t(m.dose)) pendencias.push({ tipo: "medicacao", texto: `Medicação "${t(m.nome)}" sem dose registrada.` });
  }
  for (const x of p.terapias) if (!t(x.evolucao)) pendencias.push({ tipo: "terapia", texto: `Terapia "${t(x.tipo)}" sem evolução registrada.` });
  for (const pend of evolucao.pendentes) pendencias.push({ tipo: "escala", texto: `${pend.nome}: sem regra de evolução validada no app (escores listados, sem gráfico).` });
  for (const s of evolucao.series) for (const a of s.alertas) if (a.codigo === "escore-fora-do-intervalo") pendencias.push({ tipo: "escala", texto: a.mensagem });

  // ── perguntas sugeridas (modelos fixos, acionados por regras) ──
  const perguntas: string[] = [];
  perguntas.push("Houve alguma mudança de saúde, sono, alimentação ou comportamento desde a última consulta?");
  for (const m of p.medicacoes) {
    perguntas.push(`Como tem sido o uso de ${t(m.nome)} (adesão, resposta percebida e efeitos indesejados)?`);
  }
  for (const x of p.terapias) perguntas.push(`Como está a frequência e a evolução em ${t(x.tipo)}?`);
  for (const x of p.exames) {
    const st = t(x.status);
    if (!st || st === "Pendente") perguntas.push(`O exame "${t(x.tipo)}" foi realizado? Os resultados já chegaram?`);
  }
  if (t(p.marcos.crises) === "Sim") perguntas.push("Houve novas crises ou mudança no padrão das crises desde a última consulta?");
  if (t(p.marcos.regressao) === "Sim") perguntas.push("Houve perda de alguma habilidade já adquirida desde a última consulta?");
  for (const s of evolucao.series) {
    const piora = s.alertas.filter((a) => a.codigo === "piora-de-faixa").pop();
    if (piora) perguntas.push(`Entre as duas últimas aplicações de ${s.instrumento.nome}, o que a família e a escola percebem de diferente?`);
  }
  if (t(p.anamnese.escolar)) perguntas.push("Houve novidade na escola (desempenho, queixas, adaptações) desde a última consulta?");
  const perguntasUnicas = [...new Set(perguntas)];

  const resumo: ResumoPreConsulta = {
    paciente: { nome: e.paciente.nome, idade: idadeEm(e.paciente.dataNascimento, localIsoDate(new Date(hoje))), cid: t(e.paciente.cid) || t(p.identificacao.cid), hipotese: t(p.identificacao.hipoteseDiagnostica) },
    ultimaVisita: ultima ? { data: ultima, diasDesde: dias } : null,
    totalVisitas: p.encontros.length,
    historico: {
      queixa: t(p.anamnese.queixaPrincipal),
      anamnese,
      marcosAlerta,
      medicacoes: p.medicacoes.map(resumoMed),
      terapias: p.terapias.map(resumoTer),
      exames: p.exames.map(resumoEx),
    },
    mudancas,
    pendencias,
    evolucao,
    perguntas: perguntasUnicas,
    texto: "",
  };
  resumo.texto = resumoParaTexto(resumo);
  return resumo;
}

export function resumoParaTexto(r: ResumoPreConsulta): string {
  const L: string[] = [];
  L.push("RESUMO PRÉ-CONSULTA", AVISO_RESUMO, "");
  L.push(`Paciente: ${r.paciente.nome}${r.paciente.idade ? `, ${r.paciente.idade}` : ""}`);
  if (r.paciente.cid) L.push(`CID registrado: ${r.paciente.cid}`);
  if (r.paciente.hipotese) L.push(`Hipótese registrada: ${r.paciente.hipotese}`);
  L.push(r.ultimaVisita ? `Última consulta: ${br(r.ultimaVisita.data)} (há ${r.ultimaVisita.diasDesde} dia(s)); ${r.totalVisitas} consulta(s) registrada(s).` : "Última consulta: nenhuma registrada.");
  L.push("", "HISTÓRICO");
  if (r.historico.queixa) L.push(`Queixa principal: ${r.historico.queixa}`);
  for (const a of r.historico.anamnese.filter((x) => x.rotulo !== "Queixa principal")) L.push(`${a.rotulo}: ${a.texto}`);
  for (const m of r.historico.marcosAlerta) L.push(`Atenção: ${m}`);
  if (r.historico.medicacoes.length) L.push("Medicações:", ...r.historico.medicacoes.map((x) => `- ${x}`));
  if (r.historico.terapias.length) L.push("Terapias:", ...r.historico.terapias.map((x) => `- ${x}`));
  if (r.historico.exames.length) L.push("Exames:", ...r.historico.exames.map((x) => `- ${x}`));
  L.push("", "O QUE MUDOU DESDE A ÚLTIMA VISITA");
  L.push(...(r.mudancas.length ? r.mudancas.map((m) => `- ${m.texto}`) : ["- Nenhuma mudança registrada."]));
  L.push("", "PENDÊNCIAS");
  L.push(...(r.pendencias.length ? r.pendencias.map((m) => `- ${m.texto}`) : ["- Nenhuma pendência identificada nos dados salvos."]));
  L.push("", "EVOLUÇÃO DAS ESCALAS");
  if (!r.evolucao.series.length) L.push("- Sem escalas com regra de evolução validada.");
  for (const s of r.evolucao.series) L.push(`- ${s.instrumento.nome}: ${s.pontos.map((p) => `${br(p.data)} ${p.escore} (${p.faixa})`).join(" → ")}`);
  L.push("", `PERGUNTAS SUGERIDAS (${ROTULO_SUGESTAO})`, ...r.perguntas.map((q) => `- ${q}`));
  return L.join("\n");
}
