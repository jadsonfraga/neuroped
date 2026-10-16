// ============================================================================
// laudoUmClique/gerador.ts — laudo em um clique (determinístico, local)
// ----------------------------------------------------------------------------
// Estrutura do dossiê (Parte 5): quadro "Em uma página" + até 12 capítulos de
// títulos fixos + fechamento + Anexo técnico opcional (escalas pontuadas).
// O gerador NÃO redige clínica: organiza o que o médico escreveu, aplica a
// declaração de fonte (R3), mantém escala/escore fora do corpo (regra 8) e
// devolve um relatório de controle (lacunas, estilo, segunda leitura, linha de
// prontuário para IA) separado do laudo.
// ============================================================================
import { escalasSemEscore, mesAno } from "./escalas";
import { conferirEstilo } from "./estilo";
import {
  AVISO_REVISAO_MEDICA,
  NOTA_FINAL_FIXA,
  type Capitulo,
  type ControleLaudo,
  type DiagnosticoEntrada,
  type EntradaLaudoUmClique,
  type LaudoUmClique,
} from "./tipos";

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function entradaVazia(): EntradaLaudoUmClique {
  return {
    paciente: "", responsaveis: [], dataNascimento: "", sexo: "", serie: "", moraCom: "", cidade: "", dataConsulta: "",
    quemE: "", historia: "", historiaFonte: "", familia: "", escola: "", escolaFonte: "", terapias: "", terapiasFonte: "",
    exames: "", examesFonte: "", exameNeuro: "", leitura: "", diagnosticos: [], conduta: "", escolaOrienta: "", retorno: "",
    motivoResumo: "", decisaoHoje: "", proximosPassos: "", escalas: [], incluirAnexoTecnico: false, altoRisco: false,
  };
}

const t = (s: string | undefined) => (s ?? "").trim();

export function primeiroNome(nome: string): string {
  return t(nome).split(/\s+/)[0] ?? "";
}

/** Idade por extenso a partir de datas ISO (sem depender do relógio do sistema). */
export function idadePorExtenso(nasc: string, ref: string): string {
  const a = new Date(nasc);
  const b = new Date(ref);
  if (!nasc || !ref || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return "";
  let anos = b.getUTCFullYear() - a.getUTCFullYear();
  let meses = b.getUTCMonth() - a.getUTCMonth();
  if (b.getUTCDate() < a.getUTCDate()) meses -= 1;
  if (meses < 0) { anos -= 1; meses += 12; }
  const pl = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;
  if (anos <= 0) return pl(meses, "mês", "meses");
  return meses > 0 && anos < 6 ? `${pl(anos, "ano", "anos")} e ${pl(meses, "mês", "meses")}` : pl(anos, "ano", "anos");
}

function pontuar(s: string): string {
  const x = t(s);
  if (!x) return "";
  return /[.!?"”]$/.test(x) ? x : `${x}.`;
}

function dataExtensa(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${d.getUTCDate()} de ${meses[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** Declarações de fonte variadas (R3), nunca repetindo trecho de 12 palavras. */
function declaracaoFonte(variante: number, origem: string): string {
  const o = t(origem) || "o documento recebido";
  const v = [
    `Isto é o que ${o} descreve, sem verificação direta nesta consulta.`,
    `Esse registro, de ${o}, entra aqui como foi descrito pela fonte, sem verificação direta nesta consulta.`,
    `O que consta em ${o} vale como relato de terceiros, sem verificação direta nesta consulta.`,
    `Os dados vêm de ${o} e seguem como a fonte os registrou, sem verificação direta nesta consulta.`,
  ];
  return v[variante % v.length];
}

function listaDx(dx: DiagnosticoEntrada[], camada: DiagnosticoEntrada["camada"]): DiagnosticoEntrada[] {
  return dx.filter((d) => d.camada === camada && t(d.nome));
}

function linhaDx(d: DiagnosticoEntrada, comCid: boolean): string {
  const nome = t(d.nome);
  if (comCid && d.camada === "firmado" && t(d.cid10) && t(d.cid11)) return `${nome} (CID-10 ${t(d.cid10)}; CID-11 ${t(d.cid11)})`;
  return nome;
}

function textoDiagnostico(dx: DiagnosticoEntrada[]): string {
  const partes: string[] = [];
  const f = listaDx(dx, "firmado");
  const i = listaDx(dx, "investigacao");
  const s = listaDx(dx, "suspeita");
  if (f.length) partes.push(`Diagnóstico firmado: ${f.map((d) => linhaDx(d, true)).join("; ")}.`);
  if (i.length) partes.push(`Em investigação: ${i.map((d) => linhaDx(d, false)).join("; ")}.`);
  if (s.length) partes.push(`Suspeita: ${s.map((d) => linhaDx(d, false)).join("; ")}.`);
  return partes.join(" ");
}

function primeirasFrases(texto: string, n: number): string {
  const frases = t(texto).split(/(?<=[.!?])\s+/).filter(Boolean);
  return frases.slice(0, n).join(" ");
}

export function montarCapitulos(e: EntradaLaudoUmClique): { capitulos: Capitulo[]; lacunas: string[] } {
  const nome = primeiroNome(e.paciente) || "a criança";
  const idade = idadePorExtenso(e.dataNascimento, e.dataConsulta);
  const lacunas: string[] = [];
  const caps: Omit<Capitulo, "numero">[] = [];
  const omitir = (titulo: string, motivo: string) => lacunas.push(`Capítulo "${titulo}" omitido: ${motivo}`);

  // I. Quem é — primeira frase sempre sobre a criança.
  const abertura = [
    idade ? `${nome} tem ${idade}` : "",
    t(e.serie) ? `cursa ${t(e.serie)}` : "",
    t(e.moraCom) ? `e mora com ${t(e.moraCom)}` : "",
  ].filter(Boolean);
  const aberturaFrase = abertura.length ? pontuar(abertura.join(", ").replace(/, e mora/, " e mora")) : "";
  const quemE = [aberturaFrase, pontuar(e.quemE)].filter(Boolean).join(" ");
  if (quemE) caps.push({ titulo: `Quem é ${nome}`, texto: quemE });
  else omitir(`Quem é ${nome}`, "sem texto sobre a criança (capítulo de título fixo; preencher é recomendado).");
  if (t(e.quemE) && !/\b(gosta|consegue|faz bem|sabe|aprende|brinca|desenha|lê|conta|adora|tem facilidade)\b/i.test(e.quemE)) {
    lacunas.push("Força concreta da criança não identificada no capítulo I (R8): acrescentar ao menos uma, vinda do material.");
  }

  // II. Como chegou até aqui
  if (t(e.historia)) {
    const fonte = t(e.historiaFonte) ? ` ${declaracaoFonte(0, e.historiaFonte)}` : "";
    caps.push({ titulo: `Como ${nome} chegou até aqui`, texto: `${pontuar(e.historia)}${fonte}` });
    if (!t(e.historiaFonte)) lacunas.push("Capítulo II: informar a fonte da história (caderneta, laudo anterior) para a declaração de fonte.");
  } else omitir(`Como ${nome} chegou até aqui`, "sem história registrada.");

  // III. Família
  if (t(e.familia)) caps.push({ titulo: "O que a família contou nesta consulta", texto: pontuar(e.familia) });
  else omitir("O que a família contou nesta consulta", "sem anamnese registrada.");

  // IV–VI terceiros (fonte obrigatória)
  const terceiros: [string, string, string, string, number][] = [
    ["O que a escola descreve", e.escola, e.escolaFonte, "relatório da escola", 1],
    ["O que as terapias registram", e.terapias, e.terapiasFonte, "relatório das terapias", 2],
    ["O que a avaliação neuropsicológica e os exames trazem", e.exames, e.examesFonte, "documento dos exames", 3],
  ];
  for (const [titulo, corpo, fonte, rotuloPadrao, v] of terceiros) {
    if (t(corpo)) {
      if (!t(fonte)) lacunas.push(`Capítulo "${titulo}": informar quem produziu e quando (declaração de fonte obrigatória, R3).`);
      caps.push({ titulo, texto: `${pontuar(corpo)} ${declaracaoFonte(v, t(fonte) || rotuloPadrao)}` });
    } else omitir(titulo, "fonte ausente no material (não vira capítulo vazio).");
  }

  // VII exame neuro
  if (t(e.exameNeuro)) caps.push({ titulo: "O exame neurológico e o estado mental nesta consulta", texto: pontuar(e.exameNeuro) });
  else omitir("O exame neurológico e o estado mental nesta consulta", "sem exame registrado.");

  // VIII leitura
  if (t(e.leitura)) caps.push({ titulo: "O que esses achados significam quando lidos juntos", texto: pontuar(e.leitura) });
  else omitir("O que esses achados significam quando lidos juntos", "sem leitura integrada escrita pelo médico.");

  // IX diagnóstico
  const dx = textoDiagnostico(e.diagnosticos);
  if (dx) caps.push({ titulo: "O diagnóstico, firmado, em investigação e suspeita", texto: dx });
  else omitir("O diagnóstico, firmado, em investigação e suspeita", "nenhum diagnóstico informado.");

  // X conduta
  if (t(e.conduta)) caps.push({ titulo: "O que fazer a partir de agora", texto: pontuar(e.conduta) });
  else omitir("O que fazer a partir de agora", "sem conduta informada.");

  // XI escola precisa saber
  if (t(e.escolaOrienta)) caps.push({ titulo: "O que a escola precisa saber", texto: pontuar(e.escolaOrienta) });
  else omitir("O que a escola precisa saber", "sem orientação à escola informada.");

  // XII retorno
  if (t(e.retorno)) caps.push({ titulo: "Quando nos revemos", texto: pontuar(e.retorno) });
  else omitir("Quando nos revemos", "sem retorno ou sinal-gatilho informado (a última frase do laudo deve ser uma decisão com data ou sinal).");

  if (caps.length < 10) lacunas.push(`Apenas ${caps.length} capítulos com material; abaixo de 10 é meta em aberto, nunca enchimento.`);

  // Numeração romana segue a ordem canônica dos capítulos presentes.
  return { capitulos: caps.map((c, i) => ({ ...c, numero: ROMANOS[i] ?? String(i + 1) })), lacunas };
}

function quadro(e: EntradaLaudoUmClique): { rotulo: string; texto: string }[] {
  const dx = textoDiagnostico(e.diagnosticos);
  const decisao = t(e.decisaoHoje) || primeirasFrases(e.conduta, 1);
  return [
    { rotulo: "Motivo", texto: t(e.motivoResumo) || primeirasFrases(e.familia, 2) || "Motivo a completar pelo médico." },
    { rotulo: "Diagnóstico", texto: dx || "Sem diagnóstico informado." },
    { rotulo: "Decisão de hoje", texto: decisao || "Decisão a completar pelo médico." },
    { rotulo: "Próximos passos", texto: t(e.proximosPassos) || primeirasFrases(e.conduta, 3) || "Próximos passos a completar pelo médico." },
    { rotulo: "Retorno", texto: t(e.retorno) || "Retorno a completar pelo médico." },
  ].map((l) => ({ ...l, texto: l.texto }));
}

function anexoTecnico(e: EntradaLaudoUmClique): string | null {
  if (!e.incluirAnexoTecnico) return null;
  const sel = e.escalas.filter((s) => s.incluir);
  if (!sel.length) return null;
  const cab = "| Instrumento | Data | Respondente | Resultado | Leitura em uma linha |\n|---|---|---|---|---|";
  const linhas = sel.map((s) => {
    const res = [s.escore !== null ? `escore ${s.escore}` : "", s.classificacao].filter(Boolean).join("; ") || "resultado sem escore registrado";
    return `| ${s.nome} | ${mesAno(s.data)} | ${s.respondente || "não registrado"} | ${res} | ${t(s.leitura) || "leitura a completar pelo médico"} |`;
  });
  return `Anexo técnico\n\n${cab}\n${linhas.join("\n")}`;
}

export function gerarLaudoUmClique(e: EntradaLaudoUmClique): { laudo: LaudoUmClique; controle: ControleLaudo } {
  const { capitulos, lacunas } = montarCapitulos(e);
  const q = quadro(e);
  const anexo = anexoTecnico(e);

  const quadroTxt = q.map((l) => `${l.rotulo}: ${l.texto}`).join("\n");
  const corpo = capitulos.map((c) => `${c.numero}. ${c.titulo}\n${c.texto}`).join("\n\n");
  const fechamento = [...NOTA_FINAL_FIXA];

  const texto = [
    `Em uma página\n${quadroTxt}`,
    corpo,
    fechamento.join("\n"),
    anexo ?? "",
  ].filter(Boolean).join("\n\n");

  // Conferência de prosa: títulos entram como "texto"? Não — só prosa e quadro.
  const prosa = capitulos.map((c) => c.texto).join("\n");
  const estilo = conferirEstilo({ corpo: prosa, quadro: quadroTxt, capitulos: capitulos.length });

  const lacunasFinais = [...lacunas];
  if (!e.diagnosticos.length) lacunasFinais.push("Nenhum diagnóstico informado.");
  for (const d of e.diagnosticos) {
    if (d.camada === "firmado" && (!t(d.cid10) || !t(d.cid11))) lacunasFinais.push(`Diagnóstico firmado "${t(d.nome)}" sem CID-10 e CID-11 em paralelo (R11).`);
  }
  if (!t(e.dataConsulta)) lacunasFinais.push("Data da consulta não informada.");
  if (e.incluirAnexoTecnico && !e.escalas.some((s) => s.incluir)) lacunasFinais.push("Anexo técnico pedido, mas nenhuma escala selecionada.");
  for (const s of escalasSemEscore(e.escalas)) lacunasFinais.push(`Escala "${s.nome}" sem escore registrado: o anexo não inventa número.`);

  const segundaLeitura = e.altoRisco
    ? [
        "Cada dose confere com o peso, a idade e a receita emitida?",
        "Há interação ou contraindicação com outro fármaco em uso, ou condição clínica que mude a dose?",
        "Cada diagnóstico firmado tem critério completo e o dado que o sustenta está no laudo?",
        "Os sinais de alarme e a conduta de urgência estão claros para a família?",
        "Existe algum número, data, exame ou resultado no laudo que não esteja no material trazido?",
      ]
    : [];

  return {
    laudo: { capitulos, quadro: q, fechamento, anexoTecnico: anexo, texto },
    controle: {
      lacunas: lacunasFinais,
      estilo,
      segundaLeitura,
      linhaProntuarioIA:
        "Redação do laudo com apoio de ferramenta computacional; conteúdo revisado, editado e assumido pelo médico responsável. Registrar informação à família conforme decisão do médico (CFM 2.454/2026, a confirmar no texto oficial).",
      avisoRevisao: AVISO_REVISAO_MEDICA,
    },
  };
}

export { dataExtensa };
