import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CIRCUIT_TASKS, circuitForAge, coverageStatus, NEURO_BASIC_DOMAINS, type CircuitRecords, type CircuitStatus } from "../../client/src/features/super-neuropad/clinicalCircuit";
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
  assert.equal(coverageStatus(sensibilidade, 5, records({ sensation: "observado", stereognosis: "observado" })), "registrado");
  assert.equal(coverageStatus(sensibilidade, 5, records({ stereognosis: "achado" })), "esclarecer");
  // Marcha aos 4 anos: marcha em linha e Romberg são exigidas; a estação lúdica sozinha não completa o domínio.
  const marcha = domain("marcha");
  assert.equal(coverageStatus(marcha, 4, records({ gait2: "observado" })), "parcial");
  assert.equal(coverageStatus(marcha, 4, records({ gait2: "observado", romberg: "observado" })), "registrado");
});

test("urgência: achado de consciência, fundo de olho ou meninges aparece como urgência e sai da contagem de pendências", () => {
  const linhas = matrizSuficiencia(7, records({ fundus: "achado", reflex: "observado" }, "examinador"));
  assert.equal(urgenciaAtiva(linhas), true);
  const urgencia = linhas.find((linha) => linha.id === "urgencia");
  assert.ok(urgencia?.urgencia);
  assert.equal(linhasDeRevisao(linhas).some((linha) => linha.id === "urgencia"), false);
  assert.equal(pendenciasParaRevisao(linhas), linhasDeRevisao(linhas).filter((linha) => linha.status !== "examinado").length);
  const texto = textoProntidao(7, linhas).join("\n");
  assert.match(texto, /URGÊNCIA: achado, ou exame não realizado, em consciência, fundo de olho ou sinais meníngeos exige avaliação imediata fora do jogo/);
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, records({ consciencia: "observado", fundus: "observado", meningeal: "observado" }))), false);
  // Item apenas pendente não é achado: não dispara alerta nem usa o texto de achado.
  const pendente = matrizSuficiencia(7, records({ consciencia: "observado", fundus: "observado" }));
  const urgenciaPendente = pendente.find((entry) => entry.id === "urgencia");
  assert.equal(urgenciaPendente?.status, "pendente_execucao");
  assert.match(urgenciaPendente?.detalhe ?? "", /ainda não registrados/);
  assert.equal(urgenciaAtiva(pendente), false);
  assert.equal(textoProntidao(7, pendente).some((entry) => entry.startsWith("URGÊNCIA")), false);
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, records({ meningeal: "nao_realizado" }))), true);
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
  assert.match(dicaDeMissaoPorIdade(3, task("consciencia")) ?? "", /observação contínua/);
  assert.match(dicaDeMissaoPorIdade(15, task("growth")) ?? "", /perímetro cefálico/);
  assert.match(dicaDeMissaoPorIdade(3, task("fundus")) ?? "", /Tolerância curta/);
  assert.match(dicaDeMissaoPorIdade(10, task("fundus")) ?? "", /respeite a recusa/);
  assert.equal(dicaDeMissaoPorIdade(10, task("risk")), null);
});

test("cada faixa etária tem composição de estações íntegra (2 a 17 anos)", () => {
  for (let age = 2; age <= 17; age++) {
    assert.ok(circuitForAge(age).length >= 22, `idade ${age}`);
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
});
