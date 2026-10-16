// ============================================================================
// resumoPreConsulta/prontuario.ts — decodifica os eventos do prontuário
// ----------------------------------------------------------------------------
// Espelha o formato gravado por pages/prontuario.tsx (local: /api/clinical-core
// /events com `note` JSON; LIVE: /api/live/events com payload). Só LÊ e
// organiza: nada é inferido nem completado. Versões anteriores (eventos
// substituídos) ficam disponíveis para comparar "o que mudou".
// ============================================================================

export interface EventoBruto {
  id?: string;
  eventType?: string;
  status?: string;
  occurredAt?: string;
  note?: unknown;
  encounterId?: unknown;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

export interface Medicacao { id: string; nome: string; dose: string; posologia: string; dataInicio: string; objetivo: string; resposta: string; efeitosAdversos: string }
export interface Terapia { id: string; tipo: string; profissional: string; frequencia: string; inicio: string; objetivo: string; evolucao: string }
export interface Exame { id: string; tipo: string; data: string; resultado: string; status: string }

export interface VersaoItem<T> { ocorridoEm: string; item: T | null; removido: boolean }

export interface ProntuarioDecodificado {
  /** Datas ISO das consultas (encontros) ativas, ordenadas. */
  encontros: string[];
  identificacao: Record<string, string>;
  anamnese: Record<string, string>;
  marcos: Record<string, string>;
  medicacoes: Medicacao[];
  terapias: Terapia[];
  exames: Exame[];
  /** Histórico de versões por chave (ex.: "exame:abc"), da mais antiga à mais nova. */
  versoes: Record<string, VersaoItem<Medicacao | Terapia | Exame>[]>;
  versoesTexto: Record<string, { ocorridoEm: string; valor: string }[]>;
}

function parse(v: unknown): Record<string, unknown> {
  if (typeof v !== "string" || !v.trim()) return {};
  try {
    const p = JSON.parse(v);
    return p && typeof p === "object" && !Array.isArray(p) ? (p as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

function chaveEItem(e: EventoBruto, remoto: boolean): { chave: string; item: Record<string, unknown> | null; removido: boolean } {
  const data = (remoto ? e.payload : e.data) ?? e.data ?? {};
  const meta = remoto ? { key: str(e.encounterId) } : parse(e.note);
  const chave = str(meta.key);
  let stored: Record<string, unknown> = {};
  if (e.eventType === "medication") stored = remoto ? parse(str(data.reason)) : parse(e.note);
  else if (e.eventType === "plan") stored = remoto ? parse(str(data.successCriterion)) : parse(e.note);
  const item = stored.item && typeof stored.item === "object" && !Array.isArray(stored.item) ? (stored.item as Record<string, unknown>) : null;
  return { chave, item, removido: stored.removed === true };
}

export function decodificarProntuario(eventos: unknown[], remoto = false): ProntuarioDecodificado {
  const lista = (Array.isArray(eventos) ? eventos : []).filter((e): e is EventoBruto => Boolean(e) && typeof e === "object");
  const ordenados = lista.map((e, i) => ({ e, i })).sort((a, b) => str(a.e.occurredAt).localeCompare(str(b.e.occurredAt)) || a.i - b.i).map((x) => x.e);

  const saida: ProntuarioDecodificado = { encontros: [], identificacao: {}, anamnese: {}, marcos: {}, medicacoes: [], terapias: [], exames: [], versoes: {}, versoesTexto: {} };

  for (const e of ordenados) {
    const { chave, item, removido } = chaveEItem(e, remoto);
    const data = (remoto ? e.payload : e.data) ?? e.data ?? {};
    const ativo = e.status === "active";

    // Histórico de versões (ativas e substituídas).
    if (chave && (chave.startsWith("medicacao:") || chave.startsWith("terapia:") || chave.startsWith("exame:"))) {
      (saida.versoes[chave] ??= []).push({ ocorridoEm: str(e.occurredAt), item: item as never, removido });
    }
    if (chave && (chave.startsWith("anamnese:") || chave.startsWith("marcos:"))) {
      (saida.versoesTexto[chave] ??= []).push({ ocorridoEm: str(e.occurredAt), valor: str(data.valueText) });
    }

    if (!ativo) continue;

    if (e.eventType === "encounter") {
      if (e.occurredAt) saida.encontros.push(e.occurredAt);
      let ident = remoto && typeof data.subjective === "string" ? parse(data.subjective).identificacao : parse(e.note).identificacao;
      if (ident && typeof ident === "object" && !Array.isArray(ident)) {
        for (const [k, v] of Object.entries(ident as Record<string, unknown>)) saida.identificacao[k] = str(v);
      }
    }
    if (e.eventType === "observation" && chave.startsWith("anamnese:")) saida.anamnese[chave.slice(9)] = str(data.valueText);
    if (e.eventType === "observation" && chave.startsWith("marcos:")) saida.marcos[chave.slice(7)] = str(data.valueText);
    if (item && !removido) {
      if (e.eventType === "medication" && chave.startsWith("medicacao:")) saida.medicacoes.push(item as unknown as Medicacao);
      if (e.eventType === "plan" && chave.startsWith("terapia:")) saida.terapias.push(item as unknown as Terapia);
      if (e.eventType === "plan" && chave.startsWith("exame:")) saida.exames.push(item as unknown as Exame);
    }
  }
  saida.encontros.sort();
  return saida;
}
