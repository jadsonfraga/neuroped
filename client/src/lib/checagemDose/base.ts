import baseJson from "../../data/doses/referencias-dose.json";
import type { BaseReferencias, EntradaReferencia } from "./tipos";

export const BASE_REFERENCIAS = baseJson as unknown as BaseReferencias;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Valida a base: toda entrada precisa de fonte completa, trechos e status coerente. Devolve a lista de problemas. */
export function validarBase(base: BaseReferencias): string[] {
  const erros: string[] = [];
  const ids = new Set<string>();
  for (const e of base.entradas) {
    const p = `[${e.id}]`;
    if (ids.has(e.id)) erros.push(`${p} id duplicado`);
    ids.add(e.id);
    if (!e.medicamento || !e.indicacao) erros.push(`${p} medicamento/indicação ausente`);
    if (!e.limites.length) erros.push(`${p} sem limites`);
    const f = e.fonte;
    for (const k of ["tipo", "orgao", "titulo", "secao", "setId", "versaoSpl", "url"] as const) if (!f?.[k]) erros.push(`${p} fonte.${k} ausente`);
    if (!ISO.test(f?.dataEfetiva ?? "")) erros.push(`${p} fonte.dataEfetiva inválida`);
    if (!ISO.test(f?.dataConsulta ?? "")) erros.push(`${p} fonte.dataConsulta inválida`);
    if (f?.url && !f.url.startsWith("https://")) erros.push(`${p} fonte.url deve ser https`);
    for (const l of e.limites) {
      if (!l.trecho || l.trecho.length < 20) erros.push(`${p} limite ${l.tipo} sem trecho literal da fonte`);
      const temValor = typeof l.valor === "number";
      const temFaixa = typeof l.min === "number" && typeof l.max === "number";
      if (!temValor && !temFaixa) erros.push(`${p} limite ${l.tipo} sem valor`);
      if (temFaixa && (l.min as number) > (l.max as number)) erros.push(`${p} limite ${l.tipo} com min > max`);
      if ((temValor && (l.valor as number) <= 0) || (temFaixa && (l.min as number) <= 0)) erros.push(`${p} limite ${l.tipo} não positivo`);
    }
    const pop = e.populacao;
    if (pop.idadeMinMeses !== undefined && pop.idadeMaxMeses !== undefined && pop.idadeMinMeses >= pop.idadeMaxMeses) erros.push(`${p} faixa etária inválida`);
    if (pop.pesoMinKg !== undefined && pop.pesoMaxKg !== undefined && pop.pesoMinKg >= pop.pesoMaxKg) erros.push(`${p} faixa de peso inválida`);
    if (e.status === "validado_medico" && (!e.validacao.por || !e.validacao.em)) erros.push(`${p} validado sem responsável/data`);
    if (e.status === "aguardando_validacao_medico" && (e.validacao.por || e.validacao.em)) erros.push(`${p} aguardando validação, mas com dados de validação`);
  }
  return erros;
}

export function medicamentosDaBase(base: BaseReferencias = BASE_REFERENCIAS): string[] {
  return [...new Set(base.entradas.map((e: EntradaReferencia) => e.medicamento))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
