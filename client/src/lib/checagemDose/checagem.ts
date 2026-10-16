// ============================================================================
// checagemDose/checagem.ts — dose registrada vs. faixa de referência da fonte
// ----------------------------------------------------------------------------
// APOIO, nunca decisão: devolve só comparações com números que estão na fonte
// (com o trecho literal). Não calcula dose recomendada, não sugere ajuste, não
// usa faixa que não esteja na base. Sem entrada correspondente (medicamento,
// idade ou peso fora das populações da fonte) → "sem dado validado".
// ============================================================================
import { BASE_REFERENCIAS } from "./base";
import type { AlertaDose, BaseReferencias, EntradaDose, EntradaReferencia, LimiteFonte, ResultadoChecagem } from "./tipos";

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function encontrarMedicamento(nome: string, base: BaseReferencias = BASE_REFERENCIAS): string | null {
  const n = norm(nome);
  if (!n) return null;
  for (const e of base.entradas) {
    if ([e.medicamento, ...e.aliases].some((a) => norm(a) === n)) return e.medicamento;
  }
  return null;
}

function naPopulacao(e: EntradaReferencia, idadeMeses: number, pesoKg: number): boolean {
  const p = e.populacao;
  return (
    (p.idadeMinMeses === undefined || idadeMeses >= p.idadeMinMeses) &&
    (p.idadeMaxMeses === undefined || idadeMeses < p.idadeMaxMeses) &&
    (p.pesoMinKg === undefined || pesoKg >= p.pesoMinKg) &&
    (p.pesoMaxKg === undefined || pesoKg < p.pesoMaxKg)
  );
}

const fmt = (n: number) => String(Number(n.toFixed(2))).replace(".", ",");

function valorDe(l: LimiteFonte): string {
  return l.valor !== undefined ? `${fmt(l.valor)} ${l.unidade}` : `${fmt(l.min as number)} a ${fmt(l.max as number)} ${l.unidade}`;
}

const NOME_TIPO: Record<LimiteFonte["tipo"], string> = {
  dose_inicial: "dose inicial descrita na fonte",
  dose_alvo_recomendada: "dose-alvo recomendada na fonte",
  limite_maximo: "limite máximo descrito na fonte",
  limite_seguranca_documentado: "limite de segurança documentado na fonte (acima dele a fonte não faz recomendação)",
};

export function checarDose(entrada: EntradaDose, base: BaseReferencias = BASE_REFERENCIAS): ResultadoChecagem {
  const { doseMg, dosesPorDia, pesoKg, idadeMeses } = entrada;
  if (![doseMg, dosesPorDia, pesoKg, idadeMeses].every((n) => Number.isFinite(n))) return { situacao: "entrada-invalida", motivo: "Preencha dose, número de doses por dia, peso e idade com números." };
  if (doseMg <= 0 || dosesPorDia <= 0 || pesoKg <= 0 || idadeMeses < 0) return { situacao: "entrada-invalida", motivo: "Dose, doses por dia e peso devem ser maiores que zero; idade não pode ser negativa." };
  if (!Number.isInteger(dosesPorDia) || dosesPorDia > 12) return { situacao: "entrada-invalida", motivo: "Doses por dia deve ser um número inteiro entre 1 e 12." };
  if (pesoKg > 250 || idadeMeses > 1200) return { situacao: "entrada-invalida", motivo: "Peso ou idade fora de um intervalo plausível; confira os valores." };

  const med = encontrarMedicamento(entrada.medicamento, base);
  if (!med) return { situacao: "sem-dado-validado", medicamentoConhecido: false, motivo: "Sem dado validado: este medicamento não está na base de referências." };

  const candidatas = base.entradas.filter((e) => e.medicamento === med && e.status !== "rejeitado_medico");
  const entradaRef = candidatas.find((e) => naPopulacao(e, idadeMeses, pesoKg));
  if (!entradaRef) return { situacao: "sem-dado-validado", medicamentoConhecido: true, motivo: "Sem dado validado: não há faixa na base para esta idade e peso (a fonte não cobre esta população ou a entrada foi rejeitada)." };

  const doseDiariaMg = doseMg * dosesPorDia;
  const doseMgKgDia = doseDiariaMg / pesoKg;
  const alertas: AlertaDose[] = [];

  for (const l of entradaRef.limites) {
    const medido = l.unidade === "mg/kg/dia" ? doseMgKgDia : doseDiariaMg;
    const ref = `${NOME_TIPO[l.tipo]}: ${valorDe(l)}${l.condicao ? ` (${l.condicao})` : ""}`;
    const dose = `${fmt(medido)} ${l.unidade}`;
    if (l.tipo === "limite_maximo" || l.tipo === "limite_seguranca_documentado") {
      if (l.valor !== undefined && medido > l.valor) {
        alertas.push({ codigo: "acima-do-limite-da-fonte", nivel: "atencao", limite: l, mensagem: `Dose registrada de ${dose} está acima do ${ref}.` });
      }
    } else if (l.tipo === "dose_alvo_recomendada") {
      if (l.valor !== undefined && medido > l.valor) {
        alertas.push({ codigo: "acima-da-dose-alvo-da-fonte", nivel: "atencao", limite: l, mensagem: `Dose registrada de ${dose} está acima da ${ref}.` });
      }
    } else if (l.tipo === "dose_inicial") {
      const piso = l.min ?? l.valor;
      if (piso !== undefined && medido < piso) {
        alertas.push({ codigo: "abaixo-da-dose-inicial-da-fonte", nivel: "informativo", limite: l, mensagem: `Dose registrada de ${dose} está abaixo da ${ref}. Pode refletir titulação, o que este apoio não avalia.` });
      }
    }
  }
  if (alertas.length === 0) {
    const teto = entradaRef.limites.filter((l) => l.tipo !== "dose_inicial");
    alertas.push({
      codigo: "dentro-da-faixa-da-fonte",
      nivel: "informativo",
      limite: teto[0] ?? entradaRef.limites[0],
      mensagem: `Dose registrada de ${fmt(doseMgKgDia)} mg/kg/dia (${fmt(doseDiariaMg)} mg/dia) não ultrapassa os limites descritos na fonte para esta população. Isso não confirma que a dose seja adequada.`,
    });
  }
  return { situacao: "avaliada", doseDiariaMg, doseMgKgDia, entrada: entradaRef, alertas, aguardandoValidacao: entradaRef.status !== "validado_medico" };
}
