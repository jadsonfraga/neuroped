// Teste do motor SuperNeuroPed — perfil do laudo modelo PANT real
// Sem dependência de API externa (sem Claude)
import {
  gerarLaudoSuper,
  gerarEValidarSuper,
  laudoSuperParaTexto,
  qaSuper,
  type SuperEntrada,
} from "../../client/src/lib/laudo/modeloSuper";

let ok = 0;
let falhas = 0;
function assert(cond: boolean, descricao: string) {
  if (cond) {
    ok++;
    console.log(`  ✓ ${descricao}`);
  } else {
    falhas++;
    console.error(`  ✗ FALHOU: ${descricao}`);
  }
}

// Caso clínico real, inspirado no laudo modelo
const caso: SuperEntrada = {
  nome: "Luiza Gonçalves Silva",
  idade: "17 anos",
  tipoConsulta: "primeira consulta",
  dataConsulta: "18 de agosto de 2026",
  protocolo: "2026-08-18-0001",
  cidade: "Petrolina/PE",
  resumoCapa:
    "Adolescente de 17 anos, encaminhada por quadro de humor deprimido e retraimento social em reavaliação, com interlocução em curso com psicologia e psiquiatria.",
  caixaCid: "CID-10 F32.1 · CID-11 6A70.1, hipótese em reavaliação, não firmada nesta consulta",
  quemE:
    "Luiza é uma adolescente de dezessete anos que chega a esta consulta trazendo uma história já em andamento, construída por consultas anteriores em outras frentes.",
  acompanhadoPor: "Chega acompanhada da mãe.",
  observacaoEntrevista:
    "Comunicativa, de discurso organizado, capaz de descrever com precisão o que sente e de situar os eventos no tempo.",
  motivo: "A consulta se organiza em torno de duas queixas centrais: o humor e a rotina escolar.",
  motivoContexto:
    "Ao redor dessas duas queixas, orbita um histórico mais amplo, que este documento procura situar sem forçar uma conclusão única.",
  historiaSubsecoes: [
    { titulo: "O quadro do humor", texto: "Tristeza persistente há cerca de um ano, com piora nos últimos meses." },
    { titulo: "Sono", texto: "Latência de sono aumentada; despertares precoces aos finais de semana." },
    { titulo: "Escola e atenção", texto: "Queda no rendimento no segundo semestre; professora relata dispersão." },
  ],
  convergencia:
    "O relato da mãe e o relato da própria Luiza convergem na maior parte dos pontos centrais do quadro.",
  divergencias:
    "Divergem em aspectos de dinâmica familiar; o que é, em si, um achado clínico digno de nota, não uma inconsistência a ser resolvida.",
  documentosConvergentes:
    "Documento psicológico anterior converge com o relato clínico colhido nesta consulta.",
  funcionando: ["Mantém vínculo com grupo de amigos de longa data", "Rendimento escolar preservado nas disciplinas de exatas"],
  pedeAtencao: ["Reclusão social progressiva", "Queixas de fadiga matinal"],
  hipoteses: [
    {
      titulo: "Quadro do humor, em reavaliação",
      texto:
        "O conjunto colhido é compatível com um quadro depressivo em curso, mas permanece como leitura em investigação, condicionada a instrumento validado.",
      aFavor: ["Convergência entre os relatos", "Duração superior a um ano", "Comprometimento funcional relatado pela escola"],
      aPonderar: ["Sem instrumento validado aplicado até aqui", "Não assume qualquer hipótese etiológica"],
    },
  ],
  achadosComplementares:
    "Não há, até esta data, eletroencefalograma ou neuroimagem solicitados ou realizados no contexto deste seguimento.",
  cids: [
    { hipotese: "Episódio depressivo moderado", cid10: "F32.1", cid11: "6A70.1", status: "hipótese em reavaliação, não firmada nesta consulta" },
  ],
  planoMulti: [
    {
      titulo: "Acompanhamento psiquiátrico",
      indicacao: "Seguimento regular para revisão de sintomas e esquemas em uso.",
      evidencia: "Histórico já em curso em serviço parceiro.",
    },
    {
      titulo: "Avaliação neuropsicológica",
      indicacao: "Bateria para quantificar funções e afastar hipóteses diferenciais.",
      evidencia: "Instrumento validado específico, conforme preconizado pelo perfil deste documento.",
    },
  ],
  condutaFarmaco:
    "Mantida sertralina 75 mg ao dia, dose de origem confirmada nesta consulta — 75 mg, para o peso referido, correspondem a aproximadamente 1,4 mg por quilo, dentro da faixa habitualmente utilizada, o que por si não confirma nem afasta qualquer hipótese.",
  solicitacoes: ["Hemograma completo", "TSH livre"],
  prognosticoLeitura:
    "Falar em prognóstico, neste momento, é falar em condicionais. O conjunto de achados orienta uma trajetória que será reavaliada a cada etapa.",
  cenarioFavoravel: ["Resposta plena ao seguimento multiprofissional", "Retomada das atividades sociais em até seis meses"],
  cenarioEsperado: ["Melhora parcial com oscilações naturais do curso clínico"],
  cenarioReservado: ["Persistência dos sintomas e necessidade de intensificação terapêutica"],
  sinaisAlerta: [
    "Ideação suicida ou autolesão",
    "Recusa alimentar significativa",
    "Suspensão total da rotina escolar",
  ],
  retornoCondicao:
    "Retorno sugerido após conclusão das investigações em curso, ou antes disso, caso surja qualquer sinal de alerta listado na Seção 13.",
  sintese:
    "Luiza, este documento não fecha o que ainda está em aberto. As próximas etapas do acompanhamento seguirão o plano descrito nas seções anteriores.",
};

console.log("\n=== Motor SuperNeuroPed — perfil do laudo modelo ===\n");

const r = gerarEValidarSuper(caso);
console.log(`\nQA: ${r.qa}\n`);
assert(r.qa.startsWith("APROVADO"), "QA de perfil aprova o caso completo");

const t = laudoSuperParaTexto(r.laudo);
assert(t.includes("SUPER NEURO PED — LAUDO NEUROPEDIÁTRICO"), "cabeçalho da capa");
assert(t.includes("[SÍNTESE DA CONSULTA]"), "caixa-síntese da capa");
assert(t.includes("[CAIXA CID] CID-10 F32.1 · CID-11 6A70.1"), "caixa CID da capa com paralelo");
assert(t.includes("01  Quem é Luiza"), "Seção 01 com nome");
assert(t.includes("02  Motivo da avaliação"), "Seção 02");
assert(t.includes("03  Estrutura da história"), "Seção 03");
assert(t.includes("— O quadro do humor"), "subseção temática da história");
assert(t.includes("04  Convergência das fontes"), "Seção 04");
assert(t.includes("05  Mapa funcional"), "Seção 05");
assert(t.includes("[O QUE ESTÁ FUNCIONANDO]"), "coluna ◆ do mapa");
assert(t.includes("[O QUE AINDA PEDE ATENÇÃO]"), "coluna ■ do mapa");
assert(t.includes("06  Leitura diagnóstica, hipóteses em avaliação"), "Seção 06");
assert(t.includes("[A FAVOR DA CONTINUIDADE]"), "coluna a favor");
assert(t.includes("[A PONDERAR ANTES DE QUALQUER CONCLUSÃO]"), "coluna a ponderar");
assert(t.includes("07  Achados complementares"), "Seção 07");
assert(t.includes("08  Diagnósticos firmados"), "Seção 08");
assert(t.includes("Nenhum diagnóstico é firmado por este documento"), "disclaimer obrigatório da Seção 8");
assert(t.includes("CID-10 F32.1 · CID-11 6A70.1 — hipótese em reavaliação"), "CID paralelo na tabela");
assert(t.includes("09  Plano terapêutico multiprofissional"), "Seção 09");
assert(t.includes("INDICAÇÃO:"), "rótulo INDICAÇÃO em smallcaps");
assert(t.includes("EVIDÊNCIA:"), "rótulo EVIDÊNCIA em smallcaps");
assert(t.includes("10  Conduta farmacológica e exames"), "Seção 10");
assert(t.includes("[SOLICITAÇÕES DESTA CONSULTA]"), "caixa de solicitações");
assert(t.includes("1,4 mg por quilo, dentro da faixa habitualmente utilizada"), "quantificação farmacológica");
assert(t.includes("11  Prognóstico, leitura funcional"), "Seção 11");
assert(t.includes("12  Prognóstico em cenários"), "Seção 12");
assert(t.includes("[FAVORÁVEL]") && t.includes("[ESPERADO]") && t.includes("[RESERVADO]"), "os 3 cenários");
assert(t.includes("13  Acompanhamento e retorno"), "Seção 13");
assert(t.includes("✦ Ideação suicida ou autolesão"), "sinal de alerta com ✦");
assert(t.includes("14  Síntese e encaminhamento"), "Seção 14");
assert(t.includes("Luiza, este documento não fecha o que ainda está em aberto"), "síntese em 2ª pessoa");
assert(t.includes("Soli Deo Gloria"), "motto na assinatura");
assert(t.includes("Fraga Serviços Médicos LTDA · CNPJ 33.158.207/0001-48"), "assinatura institucional");

// QA reprovado em caso mínimo
const minimo: SuperEntrada = { ...caso, historiaSubsecoes: [], hipoteses: [], cids: [], planoMulti: [], cenarioFavoravel: [], cenarioEsperado: [], cenarioReservado: [], sinaisAlerta: [], funcionando: [], pedeAtencao: [] };
const rm = gerarEValidarSuper(minimo);
assert(rm.qa.startsWith("REPROVADO"), "QA reprova caso mínimo sem as caixas obrigatórias");

console.log(`\nResultado: ${ok} aprovadas, ${falhas} falhas\n`);
process.exit(falhas > 0 ? 1 : 0);
