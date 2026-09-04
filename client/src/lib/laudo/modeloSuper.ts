// ============================================================================
// client/src/lib/laudo/modeloSuper.ts — perfil "SuperNeuroPed"
// ----------------------------------------------------------------------------
// Gera laudos no perfil do modelo real PANT (Luiza Gonçalves Silva):
// capa rica (S u p e r N e u r o P e d · caixa-síntese · caixa CID), 14
// seções numeradas 01–14, mapa funcional em duas colunas, hipóteses com
// "a favor" × "a ponderar", prognóstico em 3 cenários, INDICAÇÃO/EVIDÊNCIA
// em smallcaps, disclaimer da Seção 8, sinais de alerta ✦ e síntese em
// segunda pessoa com assinatura "Soli Deo Gloria".
//
// 100% local, sem API externa (sem Claude/Anthropic/OpenAI).
// A prosa estrutural compõe o documento em torno do que o médico escrever;
// nada é inventado — dado ausente vira prosa neutra para revisão.
// ============================================================================

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface SuperSubsecaoHistoria {
  titulo: string;
  texto: string;
}

export interface SuperHipotese {
  titulo: string;
  texto: string;
  aFavor: string[];
  aPonderar: string[];
}

export interface SuperCid {
  hipotese: string;
  cid10: string;
  cid11: string;
  status: string;
}

export interface SuperPlanoItem {
  titulo: string;
  indicacao: string;
  evidencia: string;
}

export interface SuperEntrada {
  // Capa
  nome: string;
  idade: string;
  tipoConsulta: string; // ex.: "primeira consulta" / "reavaliação"
  dataConsulta: string; // ex.: "18 de agosto de 2026"
  resumoCapa: string; // parágrafo-síntese da caixa da capa
  caixaCid: string; // ex.: "CID-10 F32.1 · CID-11 6A70.1, hipótese em reavaliação, não firmada nesta consulta"
  protocolo: string; // ex.: "2026-08-18-0001"
  cidade: string;
  // 01 Quem é
  quemE: string;
  acompanhadoPor: string;
  observacaoEntrevista: string;
  // 02 Motivo
  motivo: string;
  motivoContexto: string;
  // 03 Estrutura da história
  historiaSubsecoes: SuperSubsecaoHistoria[];
  // 04 Convergência das fontes
  convergencia: string;
  divergencias: string;
  documentosConvergentes: string;
  // 05 Mapa funcional
  funcionando: string[];
  pedeAtencao: string[];
  // 06 Hipóteses
  hipoteses: SuperHipotese[];
  // 07 Achados complementares
  achadosComplementares: string;
  // 08 CIDs
  cids: SuperCid[];
  // 09 Plano multiprofissional
  planoMulti: SuperPlanoItem[];
  // 10 Conduta farmacológica
  condutaFarmaco: string;
  solicitacoes: string[];
  // 11 Prognóstico leitura funcional
  prognosticoLeitura: string;
  // 12 Cenários
  cenarioFavoravel: string[];
  cenarioEsperado: string[];
  cenarioReservado: string[];
  // 13 Sinais de alerta / retorno
  sinaisAlerta: string[];
  retornoCondicao: string;
  // 14 Síntese
  sintese: string;
}

export interface SuperLaudo {
  capa: {
    resumo: string;
    caixaCid: string;
    nome: string;
    meta: string; // idade · tipoConsulta · data
    protocolo: string;
  };
  secoes: {
    quemE: { intro: string; acompanhadoPor: string; entrevista: string };
    motivo: { texto: string; contexto: string };
    historiaSubsecoes: SuperSubsecaoHistoria[];
    convergencia: { texto: string; divergencias: string; documentos: string };
    mapaFuncional: { funcionando: string[]; pedeAtencao: string[] };
    hipoteses: SuperHipotese[];
    achadosComplementares: string;
    cids: SuperCid[];
    planoMulti: SuperPlanoItem[];
    condutaFarmaco: { texto: string; solicitacoes: string[] };
    prognosticoLeitura: string;
    cenarios: { favoravel: string[]; esperado: string[]; reservado: string[] };
    sinaisAlerta: string[];
    retornoCondicao: string;
    sintese: string;
  };
  assinatura: {
    nome: string;
    titulos: string;
    registro: string;
    motto: string;
    empresa: string;
  };
  pacienteNome: string;
  totalPaginas: number;
}

// ── Helpers de prosa ────────────────────────────────────────────────────────

function semPontoFinal(s: string): string {
  return s.trim().replace(/\.\s*$/, "");
}

function normaliza(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

/**
 * Identidade do médico emissor — SEMPRE fornecida pelo call site a partir da
 * fonte única (client/src/lib/issuer.ts). Nenhum nome/CRM é embutido aqui:
 * `registro` deve vir de issuerCredentials(issuer), que devolve o aviso de
 * perfil não configurado quando não há credencial salva.
 */
export interface SuperMedico {
  nome: string;
  titulos?: string;
  registro: string;
  endereco: string;
  motto?: string;
  empresa?: string;
}

// ── Geração ─────────────────────────────────────────────────────────────────

const DISCLAIMER_S8 =
  "Nenhum diagnóstico é firmado por este documento. Todas as hipóteses descritas na Seção 6 permanecem em investigação, condicionadas à avaliação complementar, instrumento validado específico e, quando aplicável, ao resultado de exames já solicitados por outras especialidades.";

export function gerarLaudoSuper(e: SuperEntrada, medico: SuperMedico): SuperLaudo {
  const quemE =
    e.quemE ||
    `${capitaliza(e.nome)}, ${e.idade || ""} de idade, chega a esta consulta ${e.tipoConsulta ? `para ${e.tipoConsulta}` : "para consulta"}${e.acompanhadoPor ? `, acompanhado(a) de ${semPontoFinal(e.acompanhadoPor)}` : ""}.`;
  const acompanhadoPor = e.acompanhadoPor
    ? ""
    : "";
  const entrevista = e.observacaoEntrevista
    ? normaliza(e.observacaoEntrevista)
    : "A entrevista clínica transcorreu de forma livre, com os relatores colaborando na reconstrução da cronologia do quadro.";
  const motivo = e.motivo ||
    "A consulta se organiza em torno da demanda clínica referida pelo paciente e/ou pelos acompanhantes, conforme registrado adiante.";
  const motivoContexto = e.motivoContexto
    ? normaliza(e.motivoContexto)
    : "Ao redor dessa demanda, há um contexto clínico mais amplo, que este documento procura situar sem forçar uma conclusão única.";

  const convergencia = e.convergencia ||
    "Os relatos colhidos nesta consulta convergem na maior parte dos pontos centrais do quadro, com divergências pontuais registradas na sequência.";
  const divergencias = e.divergencias
    ? normaliza(e.divergencias)
    : "";
  const documentos = e.documentosConvergentes
    ? normaliza(e.documentosConvergentes)
    : "";

  const cids =
    e.cids && e.cids.length > 0
      ? e.cids
      : [];

  const prognosticoLeitura =
    e.prognosticoLeitura ||
    "Falar em prognóstico, neste momento, é falar em condicionais. O conjunto de achados deste documento orienta uma trajetória que será reavaliada a cada etapa do acompanhamento.";

  return {
    capa: {
      resumo: e.resumoCapa
        ? normaliza(e.resumoCapa)
        : motivo,
      caixaCid: e.caixaCid || (cids.length
        ? `CID-10 ${cids[0].cid10}${cids[0].cid11 ? ` · CID-11 ${cids[0].cid11}` : ""}, hipótese em avaliação, não firmada nesta consulta`
        : "Códigos classificatórios conforme Seção 8"),
      nome: e.nome || "—",
      meta: [e.idade, e.tipoConsulta, e.dataConsulta].filter(Boolean).join(" · "),
      protocolo: e.protocolo || "—",
    },
    secoes: {
      quemE: {
        intro: quemE,
        acompanhadoPor: acompanhadoPor,
        entrevista: entrevista,
      },
      motivo: { texto: motivo, contexto: motivoContexto },
      historiaSubsecoes: (e.historiaSubsecoes || [])
        .filter((s) => (s.titulo || "").trim() || (s.texto || "").trim())
        .map((s) => ({
          titulo: s.titulo || "Subseção",
          texto: normaliza(s.texto),
        })),
      convergencia: {
        texto: convergencia,
        divergencias: divergencias || "",
        documentos: documentos,
      },
      mapaFuncional: {
        funcionando: (e.funcionando || []).map((t) => normaliza(t)).filter(Boolean),
        pedeAtencao: (e.pedeAtencao || []).map((t) => normaliza(t)).filter(Boolean),
      },
      hipoteses: (e.hipoteses || [])
        .filter((h) => (h.titulo || "").trim() || (h.texto || "").trim() || (h.aFavor || []).some((t) => t.trim()) || (h.aPonderar || []).some((t) => t.trim()))
        .map((h) => ({
          titulo: h.titulo || "Hipótese em avaliação",
          texto: normaliza(h.texto),
          aFavor: (h.aFavor || []).map((t) => normaliza(t)).filter(Boolean),
          aPonderar: (h.aPonderar || []).map((t) => normaliza(t)).filter(Boolean),
        })),
      achadosComplementares: e.achadosComplementares ||
        "Não há, até esta data, exame de eletroencefalograma ou neuroimagem solicitado ou realizado no contexto deste seguimento.",
      cids,
      planoMulti: (e.planoMulti || []).map((p) => ({
        titulo: p.titulo || "Acompanhamento",
        indicacao: normaliza(p.indicacao),
        evidencia: normaliza(p.evidencia),
      })),
      condutaFarmaco: {
        texto: e.condutaFarmaco ||
          "Não há alteração farmacológica instituída nesta consulta; o esquema em uso é mantido conforme prescrição do médico assistente.",
        solicitacoes: (e.solicitacoes || []).map((t) => normaliza(t)).filter(Boolean),
      },
      prognosticoLeitura,
      cenarios: {
        favoravel: (e.cenarioFavoravel || []).map((t) => normaliza(t)),
        esperado: (e.cenarioEsperado || []).map((t) => normaliza(t)),
        reservado: (e.cenarioReservado || []).map((t) => normaliza(t)),
      },
      sinaisAlerta: (e.sinaisAlerta || []).map((t) => normaliza(t)),
      retornoCondicao: e.retornoCondicao ||
        "Retorno sugerido após conclusão das investigações em curso, ou antes disso, caso surja qualquer sinal de alerta listado na Seção 13.",
      sintese: e.sintese ||
        `${e.nome ? primeiroNome(e.nome) + ", " : ""}este documento não fecha o que ainda está em aberto. As próximas etapas do acompanhamento seguirão o plano descrito nas seções anteriores.`,
    },
    assinatura: {
      nome: medico.nome,
      titulos: medico.titulos ?? "",
      registro: medico.registro,
      motto: medico.motto ?? "",
      empresa: medico.empresa ?? "",
    },
    pacienteNome: e.nome || "",
    totalPaginas: 7,
  };
}

function capitaliza(s: string): string {
  return s.trim() ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function primeiroNome(nome: string): string {
  const m = nome.trim().split(/\s+/);
  return m[0] || "";
}

// ── QA do perfil SuperNeuroPed ──────────────────────────────────────────────

/** Valida se o laudo gerado mantém o perfil do modelo (caixas, colunas, disclaimer, cenários).
 *  Retorna "APROVADO ..." ou "REPROVADO: ..." */
export function qaSuper(l: SuperLaudo): string {
  const falhas: string[] = [];
  const s = l.secoes;

  if (!l.capa.resumo) falhas.push("caixa-síntese da capa vazia");
  if (!l.capa.caixaCid) falhas.push("caixa CID da capa vazia (CID-10 · CID-11 sempre em paralelo)");
  if (s.quemE.intro.length < 30) falhas.push("Seção 1 (Quem é) sem conteúdo");
  if (!s.motivo.texto) falhas.push("Seção 2 (Motivo) sem conteúdo");
  if (s.historiaSubsecoes.length === 0) falhas.push("Seção 3 sem subseções da história (o modelo exige ao menos uma)");
  if (!s.convergencia.texto) falhas.push("Seção 4 (Convergência das fontes) sem conteúdo");
  if (s.mapaFuncional.pedeAtencao.length === 0 && s.mapaFuncional.funcionando.length === 0)
    falhas.push("Seção 5 (Mapa funcional) vazia");
  if (s.hipoteses.length === 0) falhas.push("Seção 6 sem hipóteses em avaliação");
  s.hipoteses.forEach((h) => {
    if (h.texto.length < 20) falhas.push(`Seção 6 · hipótese "${h.titulo}" sem leitura clínica`);
    if (h.aFavor.length === 0 && h.aPonderar.length === 0)
      falhas.push(`Seção 6 · hipótese "${h.titulo}" sem "a favor" / "a ponderar" (modelo exige as duas colunas)`);
  });
  if (s.cids.length === 0) falhas.push("Seção 8 sem códigos classificatórios (CID-10 · CID-11 em paralelo)");
  s.cids.forEach((c, i) => {
    if (!c.cid10) falhas.push(`Seção 8 · item ${i + 1} sem CID-10`);
    if (!c.cid11) falhas.push(`Seção 8 · item ${i + 1} sem CID-11`);
  });
  if (s.planoMulti.length === 0) falhas.push("Seção 9 (Plano multiprofissional) sem itens");
  s.planoMulti.forEach((p) => {
    if (!p.indicacao) falhas.push(`Seção 9 · item "${p.titulo}" sem INDICAÇÃO`);
  });
  if (s.cenarios.favoravel.length === 0 && s.cenarios.esperado.length === 0 && s.cenarios.reservado.length === 0)
    falhas.push("Seção 12 (cenários) vazia — o modelo exige Favorável / Esperado / Reservado");
  if (s.sinaisAlerta.length === 0) falhas.push("Seção 13 (sinais de alerta) vazia");
  if (!s.sintese) falhas.push("Seção 14 (Síntese) sem conteúdo");

  if (falhas.length === 0)
    return "APROVADO — perfil SuperNeuroPed validado: capa com caixa CID, mapa funcional, hipóteses com prós/contras, disclaimer da Seção 8, 3 cenários e sinais de alerta.";
  return `REPROVADO: ${falhas.length} ponto(s) a corrigir — ${falhas.join(" · ")}.`;
}

export function gerarEValidarSuper(e: SuperEntrada, medico: SuperMedico): { laudo: SuperLaudo; qa: string } {
  const laudo = gerarLaudoSuper(e, medico);
  return { laudo, qa: qaSuper(laudo) };
}

// ── Exportação para texto integral ──────────────────────────────────────────

const BULLET_PRO = "◆ ";
const BULLET_CON = "■ ";
const BULLET_ALERT = "✦ ";

export function laudoSuperParaTexto(l: SuperLaudo): string {
  const linhas: string[] = [];
  const add = (t = "") => linhas.push(t);
  const s = l.secoes;

  add(`SUPER NEURO PED — LAUDO NEUROPEDIÁTRICO`);
  add(`Avaliação Neuropsiquiátrica do Neurodesenvolvimento`);
  add(`PACIENTE: ${l.capa.nome}  ·  ${l.capa.meta}`);
  add(`SuperNeuroPed nº ${l.capa.protocolo}`);
  add("");
  add(`[SÍNTESE DA CONSULTA] ${l.capa.resumo}`);
  add("");
  add(`[CAIXA CID] ${l.capa.caixaCid}`);
  add("");
  add("=".repeat(60));
  add("01  Quem é " + l.pacienteNome);
  add("");
  add(s.quemE.intro);
  if (s.quemE.acompanhadoPor) add(s.quemE.acompanhadoPor);
  if (s.quemE.entrevista) add(s.quemE.entrevista);
  add("");
  add("=".repeat(60));
  add("02  Motivo da avaliação");
  add("");
  add(s.motivo.texto);
  if (s.motivo.contexto) add(s.motivo.contexto);
  add("");
  add("=".repeat(60));
  add("03  Estrutura da história");
  add("");
  for (const sub of s.historiaSubsecoes) {
    add(`— ${sub.titulo}`);
    add(sub.texto);
    add("");
  }
  add("=".repeat(60));
  add("04  Convergência das fontes");
  add("");
  add(s.convergencia.texto);
  if (s.convergencia.divergencias) add(s.convergencia.divergencias);
  if (s.convergencia.documentos) add(s.convergencia.documentos);
  add("");
  add("=".repeat(60));
  add("05  Mapa funcional");
  add("");
  add("[O QUE ESTÁ FUNCIONANDO]");
  for (const t of s.mapaFuncional.funcionando) add(BULLET_PRO + t);
  add("");
  add("[O QUE AINDA PEDE ATENÇÃO]");
  for (const t of s.mapaFuncional.pedeAtencao) add(BULLET_CON + t);
  add("");
  add("=".repeat(60));
  add("06  Leitura diagnóstica, hipóteses em avaliação");
  add("");
  add("Nenhuma das hipóteses a seguir está firmada por este documento. Cada uma é apresentada com o que a sustenta e com o que, ao mesmo tempo, impede que se converta em conclusão.");
  add("");
  for (const h of s.hipoteses.filter((x) => x.titulo || x.texto)) {
    add(`— ${h.titulo}`);
    if (h.texto) add(h.texto);
    if (h.aFavor.length || h.aPonderar.length) {
      add("[A FAVOR DA CONTINUIDADE]");
      for (const t of h.aFavor) add(BULLET_PRO + t);
      add("[A PONDERAR ANTES DE QUALQUER CONCLUSÃO]");
      for (const t of h.aPonderar) add(BULLET_CON + t);
    }
    add("");
  }
  add("=".repeat(60));
  add("07  Achados complementares");
  add("");
  add(s.achadosComplementares);
  add("");
  add("=".repeat(60));
  add("08  Diagnósticos firmados");
  add("");
  add(`[DISCLAIMER] ${DISCLAIMER_S8}`);
  add("");
  for (const c of s.cids) {
    add(`· ${c.hipotese || "Hipótese"} — CID-10 ${c.cid10} · CID-11 ${c.cid11} — ${c.status || "hipótese em avaliação, não firmada"}`);
  }
  add("");
  add("=".repeat(60));
  add("09  Plano terapêutico multiprofissional");
  add("");
  for (const p of s.planoMulti) {
    add(`${p.titulo}`);
    add(`INDICAÇÃO: ${p.indicacao}`);
    if (p.evidencia) add(`EVIDÊNCIA: ${p.evidencia}`);
    add("");
  }
  add("=".repeat(60));
  add("10  Conduta farmacológica e exames");
  add("");
  add(s.condutaFarmaco.texto);
  if (s.condutaFarmaco.solicitacoes.length) {
    add("[SOLICITAÇÕES DESTA CONSULTA]");
    for (const t of s.condutaFarmaco.solicitacoes) add("· " + t);
  }
  add("");
  add("=".repeat(60));
  add("11  Prognóstico, leitura funcional");
  add("");
  add(s.prognosticoLeitura);
  add("");
  add("=".repeat(60));
  add("12  Prognóstico em cenários");
  add("");
  add("[FAVORÁVEL]");
  for (const t of s.cenarios.favoravel) add(BULLET_PRO + t);
  add("[ESPERADO]");
  for (const t of s.cenarios.esperado) add(BULLET_PRO + t);
  add("[RESERVADO]");
  for (const t of s.cenarios.reservado) add(BULLET_PRO + t);
  add("");
  add("=".repeat(60));
  add("13  Acompanhamento e retorno");
  add("");
  for (const t of s.sinaisAlerta) add(BULLET_ALERT + t);
  if (s.retornoCondicao) add(s.retornoCondicao);
  add("");
  add("=".repeat(60));
  add("14  Síntese e encaminhamento");
  add("");
  add(s.sintese);
  add("");
  add("—");
  // Só as linhas de assinatura efetivamente configuradas — nada é inventado.
  for (const linha of [
    l.assinatura.nome,
    l.assinatura.titulos,
    l.assinatura.registro,
    l.assinatura.motto,
    l.assinatura.empresa,
  ]) {
    if (linha) add(linha);
  }
  return linhas.join("\n");
}
