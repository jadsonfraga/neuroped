import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  AI_PURPOSES,
  CLINICAL_RECORD_MIN_RETENTION_DAYS,
  LEGAL_REFERENCES,
  PENDING_LEGAL_DECISIONS,
  RETENTION_CATEGORIES,
  SUBJECT_REQUEST_LABELS,
  buildAiChartLine,
  clinicalRetentionUntil,
  evaluateSubjectRequest,
  validateAiUseInput,
  validateFamilyAck,
  validateRetentionDays,
  type SubjectRequestType,
} from "../../shared/lgpd-compliance";

const NOW = new Date("2026-10-16T15:00:00Z");
const good = { patientId: "paciente-1", tool: "Ferramenta fictícia", purpose: "redacao_documento", dataSharing: "pseudonimizado", humanReviewed: true, usedAt: "2026-10-16T14:30:00Z" };
const FORBIDDEN = /\b(corte|nível|niveis|níveis|escore|pontuação|classificação)\b/i;

test("registro de IA: validação estruturada, sem texto livre clínico", () => {
  assert.equal(validateAiUseInput(good, NOW).ok, true);
  for (const bad of [
    { ...good, tool: "" },
    { ...good, tool: "<script>alert(1)</script>" },
    { ...good, tool: "x".repeat(81) },
    { ...good, purpose: "diagnostico" },
    { ...good, dataSharing: "tudo" },
    { ...good, riskLevel: "inaceitavel" },
    { ...good, humanReviewed: "sim" },
    { ...good, usedAt: "ontem" },
    { ...good, usedAt: "2026-10-17T00:00:00Z" },
    { ...good, patientId: "../etc" },
    { ...good, patientId: null, dataSharing: "pseudonimizado" },
  ]) assert.equal(validateAiUseInput(bad, NOW).ok, false, JSON.stringify(bad));
  assert.equal(validateAiUseInput({ ...good, patientId: null, dataSharing: "nenhum" }, NOW).ok, true);
  assert.equal(validateAiUseInput({ ...good, riskLevel: null }, NOW).ok, true, "risco é opcional: não assumimos classificação");
});

test("linha sugerida para o prontuário: quem, quando, ferramenta, finalidade, revisão, família; sem nível/corte", () => {
  const base = { tool: "Ferramenta fictícia", purpose: "redacao_documento" as const, dataSharing: "pseudonimizado" as const, humanReviewed: true, usedAt: "2026-10-16T14:30:00Z", actorName: "Dra. Fictícia" };
  const pending = buildAiChartLine({ ...base, familyStatus: "nao_informada" });
  assert.match(pending, /16\/10\/2026 11:30/, "UTC-3 fixo");
  assert.match(pending, /Dra\. Fictícia/);
  assert.match(pending, /"Ferramenta fictícia"/);
  assert.match(pending, /redação de documento/i);
  assert.match(pending, /pseudonimizados/);
  assert.match(pending, /revisado criticamente pelo médico/);
  assert.match(pending, /não substitui a decisão médica/);
  assert.match(pending, /Ciência da família ainda não registrada/);
  assert.match(buildAiChartLine({ ...base, familyStatus: "informada", familyAt: "2026-10-16T15:00:00Z" }), /Família informada sobre o uso de IA em 16\/10\/2026 12:00/);
  assert.match(buildAiChartLine({ ...base, familyStatus: "recusou" }), /Família recusou o uso de IA/);
  assert.match(buildAiChartLine({ ...base, humanReviewed: false, familyStatus: "nao_informada" }), /Revisão crítica pelo médico ainda não registrada/);
  assert.match(buildAiChartLine({ ...base, dataSharing: "nenhum", familyStatus: "nao_informada" }), /sem envio de dados do paciente/);
  for (const status of ["nao_informada", "informada", "recusou"] as const) assert.doesNotMatch(buildAiChartLine({ ...base, familyStatus: status }), FORBIDDEN);
  for (const label of Object.values(AI_PURPOSES)) assert.doesNotMatch(label, FORBIDDEN);
});

test("ciência da família: só 'informada' ou 'recusou', data não futura", () => {
  assert.equal(validateFamilyAck({ status: "informada", informedAt: "2026-10-16T14:00:00Z" }, NOW).ok, true);
  assert.equal(validateFamilyAck({ status: "recusou" }, NOW).ok, true);
  assert.equal(validateFamilyAck({ status: "nao_informada" }, NOW).ok, false);
  assert.equal(validateFamilyAck({ status: "informada", informedAt: "2999-01-01T00:00:00Z" }, NOW).ok, false);
  assert.equal(validateFamilyAck(null, NOW).ok, false);
});

test("retenção: piso de 20 anos do prontuário, ampliável e nunca reduzível", () => {
  assert.equal(CLINICAL_RECORD_MIN_RETENTION_DAYS, 20 * 365);
  assert.equal(validateRetentionDays("clinical_record", 7299).ok, false);
  assert.equal((validateRetentionDays("clinical_record", 7299) as { code: string }).code, "BELOW_LEGAL_FLOOR");
  assert.equal(validateRetentionDays("clinical_record", 7300).ok, true);
  assert.equal(validateRetentionDays("clinical_record", 36500).ok, true);
  for (const bad of [-1, 1.5, 36501, "7300", NaN, null]) assert.equal(validateRetentionDays("clinical_record", bad).ok, false);
  assert.equal(validateRetentionDays("family_portal_links", 30).ok, true, "sem piso legal assumido fora do prontuário");
  assert.equal(RETENTION_CATEGORIES.clinical_record.defaultDays, 7300);
  const until = clinicalRetentionUntil("2006-10-16T00:00:00.000Z", 10);
  assert.equal(until, new Date(Date.parse("2006-10-16T00:00:00.000Z") + 7300 * 86_400_000).toISOString(), "configuração menor que o piso é ignorada");
  assert.ok(Date.parse(clinicalRetentionUntil("2006-10-16T00:00:00.000Z", 9000)!) > Date.parse(until!));
  assert.equal(clinicalRetentionUntil(null), null);
  assert.equal(clinicalRetentionUntil("lixo"), null);
});

test("pedidos do titular: nunca assume onde a lei é ambígua; eliminação do prontuário dentro do prazo é negada com base legal", () => {
  const types = Object.keys(SUBJECT_REQUEST_LABELS) as SubjectRequestType[];
  const ids = new Set(LEGAL_REFERENCES.map((r) => r.id));
  for (const t of types) for (const within of [true, false]) {
    const o = evaluateSubjectRequest(t, { withinRecordRetention: within });
    assert.equal(o.responseDays, 15);
    assert.ok(o.legalRefs.length > 0 && o.legalRefs.every((r) => ids.has(r)), `${t}: referência inexistente`);
    assert.ok(o.reason.length > 20);
  }
  assert.equal(evaluateSubjectRequest("deletion", { withinRecordRetention: true }).decision, "deny_with_reason");
  assert.equal(evaluateSubjectRequest("anonymization", { withinRecordRetention: true }).decision, "deny_with_reason");
  assert.equal(evaluateSubjectRequest("deletion", { withinRecordRetention: false }).decision, "pending_legal_decision");
  assert.equal(evaluateSubjectRequest("access", { withinRecordRetention: true }).decision, "attend");
  assert.match(evaluateSubjectRequest("correction", { withinRecordRetention: true }).reason, /adendo/);
});

test("referências legais e pendências: citações presentes, ids únicos, dúvidas marcadas e sem assumir", () => {
  assert.equal(new Set(LEGAL_REFERENCES.map((r) => r.id)).size, LEGAL_REFERENCES.length);
  const text = LEGAL_REFERENCES.map((r) => `${r.source} ${r.article}`).join("|");
  for (const needle of ["art. 4º, V", "art. 5º, § 1º", "art. 5º, § 3º", "art. 11", "Lei 13.787/2018", "art. 16, I", "arts. 18 e 19"]) assert.ok(text.includes(needle), needle);
  assert.ok(PENDING_LEGAL_DECISIONS.length >= 6);
  for (const d of PENDING_LEGAL_DECISIONS) { assert.ok(d.question.endsWith("?")); assert.ok(d.productBehavior.length > 20); }
  assert.ok(PENDING_LEGAL_DECISIONS.some((d) => d.id === "ia-ciencia-forma"));
  assert.ok(PENDING_LEGAL_DECISIONS.some((d) => d.id === "eliminacao-anonimizacao"));
});

test("migration 0036: versionada, com gatilhos de imutabilidade e piso no banco; nenhum handler cria tabela", () => {
  const sql = readFileSync("db/migrations/0036_lgpd_ai_registry.sql", "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS ai_use_records/);
  assert.match(sql, /AI_USE_RECORD_IMMUTABLE/);
  assert.match(sql, /AI_USE_RECORD_NO_DELETE/);
  assert.match(sql, /AI_USE_PATIENT_TENANT_MISMATCH/);
  assert.match(sql, /category <> 'clinical_record' OR retention_days >= 7300/);
  assert.match(sql, /Rollback/i);
  assert.doesNotMatch(sql, /conteudo|content|texto_livre|note/i, "sem coluna de conteúdo clínico/texto livre");
  assert.ok(readdirSync("db/migrations").includes("0036_lgpd_ai_registry.sql"));
  for (const f of ["functions/api/live/ai-use/index.ts", "functions/api/live/governance/retention.ts", "functions/api/live/governance/audit.ts"]) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /CREATE TABLE|ALTER TABLE/i, f);
  }
});
