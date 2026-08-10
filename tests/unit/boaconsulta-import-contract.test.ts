import test from "node:test";
import assert from "node:assert/strict";
import {
  BOACONSULTA_MAPPING_VERSION,
  boaConsultaPatientFingerprint,
  maskCpf,
  parseBoaConsultaExport,
} from "../../shared/boaconsulta-import";

test("interpreta CSV brasileiro com ponto-e-vírgula, aspas e datas sem trocar dia/mês", () => {
  const csv = [
    "Paciente;Data de nascimento;CPF;Data do atendimento;CID;Evolução",
    'Maria Teste;10/08/2018;123.456.789-01;09/08/2026 14:30;F90.0;"Retorno; evolução estável"',
  ].join("\n");

  const result = parseBoaConsultaExport(csv, "text/csv", "exportacao.csv");
  assert.equal(result.mappingVersion, BOACONSULTA_MAPPING_VERSION);
  assert.equal(result.format, "csv");
  assert.equal(result.records.length, 1);

  const record = result.records[0];
  assert.equal(record.recordType, "encounter");
  assert.equal(record.normalized.patientName, "Maria Teste");
  assert.equal(record.normalized.birthDate, "2018-08-10");
  assert.equal(record.normalized.cpfDigits, "12345678901");
  assert.equal(record.normalized.occurredAt, "2026-08-09T14:30:00");
  assert.equal(record.normalized.diagnosisCode, "F90.0");
  assert.equal(record.normalized.clinicalText, "Retorno; evolução estável");
});

test("aceita envelope JSON e mapeia aliases usuais sem depender da ordem das chaves", () => {
  const json = JSON.stringify({
    prontuarios: [
      {
        "Nome do paciente": "João Exemplo",
        "Data da consulta": "2026-08-08",
        "Médico responsável": "Profissional Teste",
        "Anotações": "Registro clínico de teste",
        "Código atendimento": 987,
      },
    ],
  });

  const result = parseBoaConsultaExport(json, "application/json", "boa.json");
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].normalized.patientName, "João Exemplo");
  assert.equal(result.records[0].normalized.occurredAt, "2026-08-08");
  assert.equal(result.records[0].normalized.professional, "Profissional Teste");
  assert.equal(result.records[0].normalized.sourceExternalId, "987");
});

test("não converte formato de data ambíguo/inválido como se fosse brasileiro", () => {
  const result = parseBoaConsultaExport(
    "Paciente,Data de nascimento\nPaciente Exemplo,08/31/2018",
    "text/csv",
    "export.csv",
  );
  assert.equal(result.records[0].normalized.birthDate, "08/31/2018");
});

test("fingerprint combina CPF, nome normalizado e nascimento para reconciliação", () => {
  const fingerprint = boaConsultaPatientFingerprint({
    patientName: "Álvaro  de Souza",
    birthDate: "2017-01-02",
    cpfDigits: "12345678901",
  });
  assert.equal(fingerprint, "12345678901|alvaro de souza|2017-01-02");
  assert.equal(maskCpf("12345678901"), "***.***.***-01");
});

test("texto livre é preservado sem forçar identidade ou vínculo automático", () => {
  const result = parseBoaConsultaExport(
    "Evolução clínica sem cabeçalho estruturado.",
    "text/plain",
    "registro.txt",
  );
  assert.equal(result.format, "text");
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].recordType, "unknown");
  assert.ok(result.warnings.some((warning) => warning.includes("Texto livre")));
  assert.ok(result.records[0].warnings.some((warning) => warning.includes("identificador")));
});
