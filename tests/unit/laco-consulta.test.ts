/** Onda 1 — laço da consulta. Dados fictícios. Sem escore inventado e sem PHI. */
import assert from "node:assert/strict";
import test from "node:test";
import {
  LACO_AVISO,
  parCasaEscola,
  resumirLaco,
  tempoAteLaudo,
  textoParCasaEscola,
  type CasoLaco,
} from "../../shared/laco-consulta";

test("casa e escola ausentes não viram zero nem concordância", () => {
  assert.deepEqual(parCasaEscola(null, null), { status: "nao-medido", motivo: "ambos-ausentes" });
  assert.deepEqual(parCasaEscola(undefined, 18), { status: "nao-medido", motivo: "casa-ausente" });
  assert.deepEqual(parCasaEscola(0, undefined), { status: "nao-medido", motivo: "escola-ausente" });
  assert.equal(parCasaEscola(0, 0).status, "medido");
  assert.match(textoParCasaEscola(null, 18), /Ausência não é zero/);
  assert.doesNotMatch(textoParCasaEscola(null, 18), /concord|discord|diagnóst|corte|normal|risco/i);
});

test("par completo guarda os dois escores e a diferença, sem classificar", () => {
  assert.deepEqual(parCasaEscola(12, 30), {
    status: "medido",
    casa: 12,
    escola: 30,
    deltaEscolaMenosCasa: 18,
  });
  const texto = textoParCasaEscola(12, 30);
  assert.match(texto, /Casa 12\. Escola 30\. Diferença \(escola − casa\): 18/);
  assert.match(texto, /não é classificação/);
  assert.doesNotMatch(texto, /diagnóst|ponto de corte|alterado|normal/i);
});

test("escore inválido não é tratado como ausência", () => {
  assert.deepEqual(parCasaEscola(Number.NaN, 4), { status: "nao-medido", motivo: "escore-invalido" });
  assert.deepEqual(parCasaEscola(4, Number.POSITIVE_INFINITY), { status: "nao-medido", motivo: "escore-invalido" });
});

test("tempo até o laudo só existe com os dois instantes, sem relógio e sem estimar", () => {
  assert.deepEqual(tempoAteLaudo(null, null), { status: "nao-medido", motivo: "ambos-ausentes" });
  assert.deepEqual(tempoAteLaudo("", "2026-10-16T12:40:00Z"), { status: "nao-medido", motivo: "inicio-ausente" });
  assert.deepEqual(tempoAteLaudo("2026-10-16T12:00:00Z", null), { status: "nao-medido", motivo: "assinatura-ausente" });
  assert.deepEqual(tempoAteLaudo("não é data", "2026-10-16T12:40:00Z"), { status: "nao-medido", motivo: "instante-invalido" });
  assert.deepEqual(tempoAteLaudo("2026-10-16T12:40:00Z", "2026-10-16T12:00:00Z"), {
    status: "nao-medido",
    motivo: "assinatura-antes-do-inicio",
  });
  assert.deepEqual(tempoAteLaudo("2026-10-16T12:00:00Z", "2026-10-16T12:40:30Z"), { status: "medido", minutos: 40 });
  assert.deepEqual(tempoAteLaudo("2026-10-16T12:00:00Z", "2026-10-16T12:00:00Z"), { status: "medido", minutos: 0 });
});

test("resumo da clínica conta e tira mediana só do que foi medido, sem escore e sem identificador", () => {
  const casos: CasoLaco[] = [
    { casa: 12, escola: 30, inicioIso: "2026-10-16T12:00:00Z", assinaturaIso: "2026-10-16T12:20:00Z" },
    { casa: null, escola: 8, inicioIso: "2026-10-16T13:00:00Z", assinaturaIso: null },
    { casa: 4, escola: 4, inicioIso: "2026-10-16T14:00:00Z", assinaturaIso: "2026-10-16T14:40:00Z" },
  ];
  const resumo = resumirLaco(casos);
  assert.equal(resumo.aviso, LACO_AVISO);
  assert.deepEqual(resumo, {
    aviso: LACO_AVISO,
    casos: 3,
    paresMedidos: 2,
    paresNaoMedidos: 1,
    temposMedidos: 2,
    temposNaoMedidos: 1,
    medianaMinutos: 30,
  });
  const chaves = Object.keys(resumo).sort();
  assert.deepEqual(chaves, [
    "aviso",
    "casos",
    "medianaMinutos",
    "paresMedidos",
    "paresNaoMedidos",
    "temposMedidos",
    "temposNaoMedidos",
  ]);
  assert.equal(JSON.stringify(resumo).includes("12"), false);
  assert.equal(resumirLaco([]).medianaMinutos, null);
});

test("mediana par é a média dos dois centrais, sem preencher caso faltante", () => {
  const base = (minutosDepois: number | null): CasoLaco => ({
    casa: 1,
    escola: 1,
    inicioIso: "2026-10-16T12:00:00Z",
    assinaturaIso: minutosDepois === null ? null : new Date(Date.parse("2026-10-16T12:00:00Z") + minutosDepois * 60_000).toISOString(),
  });
  const resumo = resumirLaco([base(10), base(40), base(null)]);
  assert.equal(resumo.temposMedidos, 2);
  assert.equal(resumo.temposNaoMedidos, 1);
  assert.equal(resumo.medianaMinutos, 25);
});
