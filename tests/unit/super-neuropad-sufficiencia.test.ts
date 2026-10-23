import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { circuitForAge, type CircuitRecords, type CircuitStatus } from "../../client/src/features/super-neuropad/clinicalCircuit";
import {
  linhasDeRevisao, urgenciaAtiva, pendenciasParaRevisao, matrizSuficiencia, REQUISITOS_LAUDO, resumoDaBateria, SUFICIENCIA_LABELS,
  textoProntidao, type BateriaResumo, type LinhaSuficiencia, type SuficienciaStatus,
} from "../../client/src/features/super-neuropad/sufficiencia";
import type { GameSummary } from "../../client/src/features/super-neuropad/model";

const records = (entries: Record<string, CircuitStatus>, source?: "examinador" | "auxiliar" | "cuidador" | "escola" | "outra"): CircuitRecords =>
  Object.fromEntries(Object.entries(entries).map(([id, status]) => [id, { status, note: "", ...(source ? { source } : {}) }]));

const linha = (linhas: readonly LinhaSuficiencia[], id: string): LinhaSuficiencia => {
  const found = linhas.find((entry) => entry.id === id);
  assert.ok(found, `linha ${id} ausente`);
  return found;
};

const STATUS_VALIDOS: readonly SuficienciaStatus[] = Object.keys(SUFICIENCIA_LABELS) as SuficienciaStatus[];

test("matriz: mesma estrutura em todas as faixas de 2 a 17 anos, com status válido e ids únicos", () => {
  const ids = REQUISITOS_LAUDO.map((requisito) => requisito.id);
  assert.equal(new Set(ids).size, ids.length);
  for (let age = 2; age <= 17; age++) {
    const linhas = matrizSuficiencia(age, {});
    assert.equal(linhas.length, REQUISITOS_LAUDO.length, `idade ${age}`);
    for (const entry of linhas) assert.ok(STATUS_VALIDOS.includes(entry.status), `${entry.id} em ${age}`);
  }
});

test("não preenche: sem registro nenhum item de jogo vira examinado, e fontes externas e decisão médica nunca viram examinado", () => {
  const linhas = matrizSuficiencia(7, {});
  assert.equal(linhas.filter((entry) => entry.status === "examinado").length, 0);
  assert.equal(linha(linhas, "bateria").status, "pendente_execucao");
  assert.equal(linha(linhas, "escolar").status, "depende_fonte_externa");
  for (const id of ["identificacao", "motivo", "gestacao", "escalas", "documentos", "exames"]) {
    assert.equal(linha(linhas, id).status, "depende_fonte_externa", id);
  }
  for (const id of ["impressao", "fundamentacao", "conduta", "liberacao"]) {
    assert.equal(linha(linhas, id).status, "depende_decisao_medica", id);
  }
});

test("mesmo com todas as estações da faixa registradas, decisão médica e fontes externas continuam pendentes", () => {
  const todas: Record<string, CircuitStatus> = Object.fromEntries(circuitForAge(7).map((task) => [task.id, "observado" as const]));
  const linhas = matrizSuficiencia(7, records(todas, "examinador"));
  assert.equal(linha(linhas, "reflexos").status, "examinado");
  assert.equal(linha(linhas, "urgencia").status, "examinado");
  assert.equal(linha(linhas, "impressao").status, "depende_decisao_medica");
  assert.equal(linha(linhas, "liberacao").status, "depende_decisao_medica");
  assert.equal(linha(linhas, "identificacao").status, "depende_fonte_externa");
  assert.equal(linha(linhas, "escolar").status, "depende_fonte_externa");
  assert.ok(pendenciasParaRevisao(linhas) > 0, "ainda há pendências para revisão após o exame do jogo");
});

test("urgência: achado ou não realização em fundo de olho ou sinais meníngeos bloqueia a linha", () => {
  assert.equal(linha(matrizSuficiencia(7, records({ fundus: "achado" })), "urgencia").status, "a_esclarecer");
  assert.equal(linha(matrizSuficiencia(7, records({ consciencia: "observado", fundus: "observado", meningeal: "nao_realizado" })), "urgencia").status, "nao_obtido");
  assert.equal(linha(matrizSuficiencia(7, records({ consciencia: "observado", fundus: "observado" })), "urgencia").status, "pendente_execucao");
});

test("exame direto: lúdico não registra força presencial, e a estação presencial registra", () => {
  assert.equal(linha(matrizSuficiencia(3, records({ strength2: "observado" })), "forca").status, "falta_exame_direto");
  assert.equal(linha(matrizSuficiencia(3, records({ strength2: "observado" }, "examinador")), "forca").status, "falta_exame_direto", "aos 3 anos só há a versão lúdica: força graduada é do médico");
  assert.equal(linha(matrizSuficiencia(9, records({ strength2: "observado", strength6: "observado" }, "examinador")), "forca").status, "examinado");
});

test("proveniência do exame físico: terceiros e fonte ausente nunca completam domínio", () => {
  for (const age of [2, 7, 17]) {
    for (const source of [undefined, "cuidador", "escola"] as const) {
      assert.equal(linha(matrizSuficiencia(age, records({ reflex: "observado" }, source)), "reflexos").status, "falta_exame_direto");
    }
    assert.equal(linha(matrizSuficiencia(age, records({ reflex: "observado" }, "examinador")), "reflexos").status, "examinado");
  }
  assert.equal(linha(matrizSuficiencia(7, records({ consciencia: "observado", fundus: "observado", meningeal: "observado" }, "escola")), "urgencia").status, "pendente_execucao");
});
test("fonte escolar: só conta com descrição do funcionamento escolar; fonte marcada sem texto não basta", () => {
  const semTexto = records({ milestones: "observado" }, "escola");
  assert.equal(linha(matrizSuficiencia(9, semTexto), "escolar").status, "depende_fonte_externa");
  assert.match(linha(matrizSuficiencia(9, semTexto), "escolar").detalhe, /sem descrição do funcionamento escolar/);
  const curto: CircuitRecords = { milestones: { status: "observado", note: "", source: "escola", descricao: "curto" } };
  assert.equal(linha(matrizSuficiencia(9, curto), "escolar").status, "depende_fonte_externa");
  const comTexto: CircuitRecords = { milestones: { status: "observado", note: "Marcado: Relatou sentar.", source: "escola", descricao: "Relatório da escola descreve leitura adequada e atenção oscilante em tarefas longas." } };
  assert.equal(linha(matrizSuficiencia(9, comTexto), "escolar").status, "examinado");
  assert.equal(linha(matrizSuficiencia(9, records({ milestones: "observado" }, "cuidador")), "escolar").status, "depende_fonte_externa");
});

test("faixa: itens sem estação na idade informada ficam fora do jogo, não pendentes", () => {
  assert.equal(linha(matrizSuficiencia(2, {}), "par11").status, "fora_do_jogo");
  assert.equal(linha(matrizSuficiencia(7, {}), "par11").status, "pendente_execucao");
  assert.equal(linha(matrizSuficiencia(7, {}), "seguranca").status, "fora_do_jogo");
  assert.equal(linha(matrizSuficiencia(9, {}), "seguranca").status, "pendente_execucao");
  assert.equal(linha(matrizSuficiencia(7, {}), "juizo").status, "fora_do_jogo");
});

test("bateria principal: resumo por mundos aplicados, sem pontuação, e status coerente", () => {
  const summary = {
    complete: false,
    phases: [
      { applied: true, skipReason: null, phase: { name: "Mundo A" } },
      { applied: false, skipReason: "sem tempo", phase: { name: "Mundo B" } },
    ],
  } as unknown as GameSummary;
  const resumo = resumoDaBateria(summary);
  assert.deepEqual(resumo, { complete: false, total: 2, aplicados: 1, naoAplicados: ["Mundo B (sem tempo)"] });
  assert.equal(linha(matrizSuficiencia(7, {}, resumo), "bateria").status, "nao_obtido");
  const completa: BateriaResumo = { complete: true, total: 6, aplicados: 6, naoAplicados: [] };
  assert.equal(linha(matrizSuficiencia(7, {}, completa), "bateria").status, "examinado");
  assert.equal(linha(matrizSuficiencia(7, {}, null), "bateria").status, "pendente_execucao");
});

test("texto de prontidão: declara ausência de emissão automática, conta pendências e não usa normal como status", () => {
  const linhas = matrizSuficiencia(7, records({ reflex: "observado" }, "examinador"));
  const texto = textoProntidao(7, linhas).join("\n");
  assert.match(texto, /PRONTIDÃO PARA O LAUDO — MATRIZ DE SUFICIÊNCIA \(7 anos\)/);
  assert.match(texto, /Emissão automática: não\./);
  assert.match(texto, new RegExp(`Pendências para revisão: ${pendenciasParaRevisao(linhas)} de ${linhasDeRevisao(linhas).length}\\.`));
  assert.match(texto, /Registrado — não equivale a normal/);
  assert.match(texto, /Depende de decisão médica/);
  assert.doesNotMatch(texto, /: normal\b/i);
  assert.doesNotMatch(texto, /Emissão automática: sim/);
});

test("integridade estática: módulo puro, sem armazenamento, rede ou captura", () => {
  const source = readFileSync("client/src/features/super-neuropad/sufficiencia.ts", "utf8");
  assert.doesNotMatch(source, /(localStorage|sessionStorage|MediaRecorder|getUserMedia|fetch\(|XMLHttpRequest)/);
  assert.doesNotMatch(source, /https?:\/\//);
});

const acolhimento = (status: CircuitStatus, note: string): CircuitRecords => ({ rapport: { status, note, source: "auxiliar" } });

test("achado no acolhimento sem marcador de consciência não dispara urgência; fonte da auxiliar não vale como exame direto do médico", () => {
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, records({ rapport: "achado" }, "auxiliar"))), false);
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, acolhimento("achado", "Marcado: Agitada ou inquieta; Contato reduzido."))), false);
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, acolhimento("achado", "Marcado: Alerta e atenta; Procura o adulto."))), false);
  assert.notEqual(linha(matrizSuficiencia(9, records({ strength6: "observado" }, "auxiliar")), "forca").status, "examinado");
});

test("consciência alterada no acolhimento dispara ATENÇÃO CLÍNICA, em achado ou em observado com o marcador", () => {
  for (const nota of ["Marcado: Sonolenta.", "Marcado: Responde com demora; Sonolenta.", "Marcado: Responde com demora.", "Marcado: Sonolenta. Relato sintético."]) {
    assert.equal(urgenciaAtiva(matrizSuficiencia(7, acolhimento("achado", nota))), true, `achado: ${nota}`);
    assert.equal(urgenciaAtiva(matrizSuficiencia(7, acolhimento("observado", nota))), true, `observado: ${nota}`);
  }
  // Texto livre digitado pela auxiliar também conta: o alerta prefere falso positivo a urgência não sinalizada.
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, acolhimento("achado", "Sonolenta ao chegar, sem marcador tocado."))), true);
});

test("consciência: sem estação realizada, sem registro ou com recusa, o alerta não é emitido", () => {
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, acolhimento("nao_realizado", "Marcado: Sonolenta."))), false);
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, acolhimento("nao_colaborou", "Marcado: Sonolenta."))), false);
  assert.equal(urgenciaAtiva(matrizSuficiencia(7, {})), false);
});

test("alerta de urgência menciona consciência, fundo de olho e sinais meníngeos", () => {
  const linhas = matrizSuficiencia(7, acolhimento("achado", "Marcado: Sonolenta."));
  const alerta = linhas.find((linha) => linha.urgencia && linha.status === "a_esclarecer");
  assert.ok(alerta, "linha de urgência a esclarecer");
  assert.match(alerta.label, /consciência/);
  assert.match(alerta.detalhe, /Achado a esclarecer/);
  assert.match(readFileSync("client/src/features/super-neuropad/sufficiencia.ts", "utf8"), /ATENÇÃO CLÍNICA: achado a esclarecer em consciência, fundo de olho ou sinais meníngeos/);
});
