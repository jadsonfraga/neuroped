import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CIRCUIT_TASKS, circuitForAge, coverageStatus, notaDeEstacao, buildCircuitReport, NEURO_BASIC_DOMAINS, type CircuitRecords, type CircuitStatus } from "../../client/src/features/super-neuropad/clinicalCircuit";
import { dicaDeMissaoPorIdade } from "../../client/src/features/super-neuropad/ageAdaptation";
import { GUIAS_HIPOTESE, estadoItem, guiasAplicaveis, type ItemColeta } from "../../client/src/features/super-neuropad/hipoteses";
import { linhasDeRevisao, matrizSuficiencia, pendenciasParaRevisao, textoProntidao, urgenciaAtiva } from "../../client/src/features/super-neuropad/sufficiencia";

const records = (entries: Record<string, CircuitStatus>, source?: "examinador" | "cuidador" | "escola"): CircuitRecords =>
  Object.fromEntries(Object.entries(entries).map(([id, status]) => [id, { status, note: "", ...(source ? { source } : {}) }]));
const domain = (id: string) => {
  const found = NEURO_BASIC_DOMAINS.find((entry) => entry.id === id);
  assert.ok(found, `domínio ${id}`);
  return found;
};
const task = (id: string) => {
  const found = CIRCUIT_TASKS.find((entry) => entry.id === id);
  assert.ok(found, `estação ${id}`);
  return found;
};

test("cobertura: domínio com várias estações só fica registrado quando todas as exigidas estão preenchidas", () => {
  // Sensibilidade aos 5 anos: mapa do toque e caixa surpresa são exame direto; uma delas não basta.
  const sensibilidade = domain("sensibilidade");
  assert.equal(coverageStatus(sensibilidade, 5, records({ sensation: "observado" })), "parcial");
  assert.equal(coverageStatus(sensibilidade, 5, records({ sensation: "observado", stereognosis: "observado" }, "examinador")), "registrado");
  assert.equal(coverageStatus(sensibilidade, 5, records({ stereognosis: "achado" })), "esclarecer");
  // Coordenação aos 6 anos: só há a versão lúdica (nariz do astronauta); ela registra o que foi visto, mas não vira exame direto.
  const coordenacao = domain("coordenacao");
  assert.equal(coverageStatus(coordenacao, 6, records({ finger6: "observado" })), "parcial");
  assert.equal(coverageStatus(coordenacao, 6, records({ finger6: "achado" })), "esclarecer");
  // Marcha: a estação lúdica de cada faixa registra o domínio (não presencial); fundir Romberg não deixa lacuna.
  const marcha = domain("marcha");
  assert.equal(coverageStatus(marcha, 4, records({ gait2: "observado" })), "registrado");
  assert.equal(coverageStatus(marcha, 9, records({ gait6: "observado" })), "registrado");
});

test("resultados recusados não exportam marcadores antigos e não atribuem relatos ao examinador", () => {
  assert.equal(notaDeEstacao("observado", ["Resposta bilateral"], " teste "), "Marcado: Resposta bilateral. teste");
  assert.equal(notaDeEstacao("nao_realizado", ["Resposta bilateral"], "não foi possível"), "não foi possível");
  assert.equal(notaDeEstacao("nao_colaborou", ["Resposta bilateral"], ""), "");
  const report = buildCircuitReport(7, {
    reflex: { status: "nao_realizado", note: notaDeEstacao("nao_realizado", ["Reflexos vivos"], "sem martelo"), source: "examinador" },
    milestones: { status: "observado", note: "Relato por telefone", source: "cuidador" },
  });
  assert.doesNotMatch(report, /Marcado: Reflexos vivos/);
  assert.match(report, /Descrição registrada: Relato por telefone/);
  assert.doesNotMatch(report, /Descrição do examinador: Relato por telefone/);
});
test("urgência: achado de fundo de olho ou meninges aparece como urgência e sai da contagem de pendências", () => {
  const linhas = matrizSuficiencia(7, records({ fundus: "achado", reflex: "observado" }, "examinador"));
  assert.equal(urgenciaAtiva(linhas), true);
  const urgencia = linhas.find((linha) => linha.id === "urgencia");
  assert.ok(urgencia?.urgencia);
  assert.equal(linhasDeRevisao(linhas).some((linha) => linha.id === "urgencia"), false);
  assert.equal(pendenciasParaRevisao(linhas), linhasDeRevisao(linhas).filter((linha) => linha.status !== "examinado").length);
  const texto = textoProntidao(7, linhas).join("\n");
  assert.match(texto, /ATENÇÃO CLÍNICA: achado a esclarecer em fundo de olho ou sinais meníngeos/);
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, records({ fundus: "observado", meningeal: "observado" }))), false);
  // Item apenas pendente não é achado: não dispara alerta nem usa o texto de achado.
  const pendente = matrizSuficiencia(7, records({ fundus: "observado" }));
  const urgenciaPendente = pendente.find((entry) => entry.id === "urgencia");
  assert.equal(urgenciaPendente?.status, "pendente_execucao");
  assert.match(urgenciaPendente?.detalhe ?? "", /ainda não registrados/);
  assert.equal(urgenciaAtiva(pendente), false);
  assert.equal(textoProntidao(7, pendente).some((entry) => entry.startsWith("ATENÇÃO CLÍNICA")), false);
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, records({ meningeal: "nao_realizado" }))), false, "exame ausente não constitui achado agudo");
  assert.equal(textoProntidao(7, matrizSuficiencia(7, records({ meningeal: "nao_realizado" }))).some((entry) => entry.startsWith("ATENÇÃO CLÍNICA")), false);
  assert.match(matrizSuficiencia(7, records({ meningeal: "nao_realizado" })).find((entry) => entry.id === "urgencia")?.detalhe ?? "", /ausência de exame isolada não caracteriza urgência/);
});

test("hipóteses: guias por faixa etária, itens com estações reais e nenhum item marcado como coletado sem estação", () => {
  assert.deepEqual(guiasAplicaveis(2).map((guia) => guia.id), ["linguagem_comunicacao"]);
  assert.deepEqual(guiasAplicaveis(7).map((guia) => guia.id), ["aprendizagem_atencao"]);
  assert.deepEqual(guiasAplicaveis(14).map((guia) => guia.id), ["aprendizagem_atencao", "saude_mental_adolescencia"]);
  const ids = new Set(CIRCUIT_TASKS.map((entry) => entry.id));
  for (const guia of GUIAS_HIPOTESE) for (const item of guia.itens) for (const id of item.estacoes) assert.ok(ids.has(id), `${guia.id}.${item.id} → ${id}`);
  const externo: ItemColeta = { id: "escola", texto: "relato escolar", estacoes: [], fonteExterna: "relatório escolar" };
  assert.equal(estadoItem(externo, 9, records({ milestones: "observado" }, "escola")), "fonte_externa");
  assert.equal(estadoItem({ id: "x", texto: "x", estacoes: ["attention6"] }, 9, records({ attention6: "observado" })), "coletado");
  assert.equal(estadoItem({ id: "x", texto: "x", estacoes: ["attention6"] }, 9, records({ attention6: "achado" })), "achado_a_esclarecer");
  assert.equal(estadoItem({ id: "x", texto: "x", estacoes: ["attention6"] }, 9, {}), "pendente");
});

test("hipóteses: texto de apoio não pontua, não cria corte nem norma", () => {
  const source = readFileSync("client/src/features/super-neuropad/hipoteses.ts", "utf8");
  assert.doesNotMatch(source, /pontuação|escore|percentil|ponto de corte|norma formal/i);
  assert.doesNotMatch(source, /\bdiagnóstico:\s*[A-Z]/);
});

test("adaptação de procedimentos: técnica específica por estação, sem convite genérico, e o auxiliar não realiza manobras", () => {
  const fundus = dicaDeMissaoPorIdade(3, task("fundus"));
  assert.ok(fundus);
  assert.match(fundus, /oftalmoscopia direta/);
  assert.match(fundus, /examinador.*o auxiliar não realiza manobras/);
  assert.doesNotMatch(fundus, /convite/i);
  assert.match(dicaDeMissaoPorIdade(10, task("meningeal")) ?? "", /Febre, confusão ou convulsão associadas são urgência/);
  assert.match(dicaDeMissaoPorIdade(3, task("rapport")) ?? "", /observação contínua/);
  assert.match(dicaDeMissaoPorIdade(15, task("growth")) ?? "", /perímetro cefálico/);
  assert.match(dicaDeMissaoPorIdade(3, task("fundus")) ?? "", /Tolerância curta/);
  assert.match(dicaDeMissaoPorIdade(10, task("fundus")) ?? "", /respeite a recusa/);
  assert.equal(dicaDeMissaoPorIdade(10, task("risk")), null);
});

test("cada faixa etária tem composição de estações íntegra (2 a 17 anos)", () => {
  for (let age = 2; age <= 17; age++) {
    assert.ok(circuitForAge(age).length >= 19, `idade ${age}`);
  }
});

test("hipóteses: item de fonte externa não mistura estação, para não virar coletado com um só registro", () => {
  for (const guia of GUIAS_HIPOTESE) {
    for (const item of guia.itens) assert.ok(!(item.estacoes.length && item.fonteExterna), `${guia.id}.${item.id} mistura estação e fonte externa`);
  }
  const itens = GUIAS_HIPOTESE.flatMap((guia) => guia.itens);
  const audiologia = itens.find((item) => item.id === "avaliacao_audiologica");
  assert.ok(audiologia);
  assert.equal(estadoItem(audiologia, 3, records({ hearing: "observado" })), "fonte_externa");
  const contextos = itens.find((item) => item.id === "multiplos_contextos");
  assert.ok(contextos);
  assert.equal(estadoItem(contextos, 9, records({ milestones: "observado" }, "cuidador")), "fonte_externa");
  const sinteticamenteMisto: ItemColeta = { id: "misto", texto: "proveniência externa e estação", estacoes: ["attention6"], fonteExterna: "entrevista em dois contextos" };
  assert.equal(estadoItem(sinteticamenteMisto, 9, records({ attention6: "observado" })), "fonte_externa", "mesmo um item misto criado no futuro não deve autorizar coleta por toque");
  assert.equal(estadoItem(sinteticamenteMisto, 9, records({ attention6: "achado" })), "fonte_externa", "achado não substitui fonte externa");
});
