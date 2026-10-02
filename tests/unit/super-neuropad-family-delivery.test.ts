// Super NeuroPad Game — encaminhamento automático à família (trava
// anti-regressão). O mecanismo: na 1ª página do teste a aplicadora cadastra
// e-mail/WhatsApp da família; ao encerrar a partida, o app gera o PDF em
// linguagem acessível (mesmo construtor clínico) e prepara WhatsApp/e-mail
// com o resumo. Nada sai do dispositivo sem o gesto de envio do cliente; o
// resumo é sistemático (mesma ordem) e recorrente (mesmo formato em toda
// partida); sem norma, percentil ou diagnóstico.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LEVEL_LABELS,
  PHASE_ORDER,
  SUPER_NEUROPAD_TITLE,
  itemsFor,
  summarize,
  type AnswerRecord,
  type GameSession,
  type Item,
  type PhaseId,
} from "../../client/src/features/super-neuropad/model";
import {
  buildFamilyDocSpec,
  buildFamilySummary,
  isValidFamilyEmail,
  parseFamilyContact,
  serializeFamilyContact,
} from "../../client/src/features/super-neuropad/familyDelivery";

const ISSUER = { doctorName: "Profissional Sintético", specialty: "Neuropediatria", credentials: "CRM 00000", clinicName: "Clínica Sintética", motto: "" };
const CONTACT = { email: "familia@exemplo.com", phone: "(11) 91234-5678" };

function answer(item: Item, phaseId: PhaseId, status: AnswerRecord["status"], seconds: number): AnswerRecord {
  return { phaseId, itemId: item.id, prompt: item.prompt, expected: item.answer, given: status === "acerto" ? item.answer : status, status, seconds, repeated: false, via: item.kind === "toque" || item.kind === "montar" ? "toque" : "aplicadora" } as AnswerRecord;
}

function play(years: number, plan: (index: number) => AnswerRecord["status"] = () => "acerto"): GameSession {
  const answers: AnswerRecord[] = [];
  let index = 0;
  for (const phaseId of PHASE_ORDER) {
    for (const item of itemsFor(String(years), phaseId)) {
      answers.push(answer(item, phaseId, plan(index++), 5));
    }
  }
  return { version: "test", ageYears: years, bandId: String(years), characterId: "robo", startedAt: "2026-09-30T12:00:00.000Z", finishedAt: "2026-09-30T12:15:00.000Z", answers, pauseCount: 0 };
}

test("validação de e-mail e serialização do contato da família", () => {
  assert.equal(isValidFamilyEmail("familia@exemplo.com"), true);
  assert.equal(isValidFamilyEmail("nome.sobrenome+tag@clinica.org.br"), true);
  assert.equal(isValidFamilyEmail("sem-arroba"), false);
  assert.equal(isValidFamilyEmail("dois@arrobas@x.com"), false);
  assert.equal(isValidFamilyEmail(" a b @x.com "), false);
  assert.equal(isValidFamilyEmail(""), false);
  const serialized = serializeFamilyContact(CONTACT);
  assert.deepEqual(parseFamilyContact(serialized), CONTACT);
  assert.equal(parseFamilyContact(null), null);
  assert.equal(parseFamilyContact("{..."), null);
  assert.equal(parseFamilyContact(JSON.stringify({ email: "", phone: "" })), null, "contato vazio não é contato");
});

test("resumo para a família é sistemático e recorrente: mesma estrutura em toda partida, sem jargão normativo", () => {
  const complete = buildFamilySummary(play(8), CONTACT, new Date("2026-09-30T15:00:00"));
  const partial = buildFamilySummary({ ...play(8, (index) => (index === 1 ? "erro" : index === 2 ? "sem_resposta" : index === 3 ? "recusa" : "acerto")), answers: play(8).answers.slice(0, 10) }, { email: "", phone: "(11) 91234-5678" });
  for (const text of [complete, partial]) {
    assert.ok(text.includes(SUPER_NEUROPAD_TITLE));
    assert.ok(text.includes("Desempenho por mundo"), "seção por mundo sempre presente");
    assert.match(text, /NÃO dá diagn/);
    assert.doesNotMatch(text.replace(/não gera escore normativo, percentil[^.]*\./i, ""), /percentil/i, "o aviso nega o percentil; não o usa");
    assert.doesNotMatch(text, /TDAH|TEA|diagnóstico de/i);
    assert.doesNotMatch(text, /CRM|Prescrição/);
  }
  const sections = (text: string) => text.split("\n").filter((line) => /^[A-ZÀ-Ú]/.test(line)).map((line) => line.replace(/:.*/, ":").replace(/por e-mail e WhatsApp\.|por e-mail\.|por WhatsApp\./, "para a família.").replace(/Aventura completa:.*|Aventura encerrada antes do fim:.*/, "Situação da aventura:"));
  const fixed = (text: string) => sections(text).filter((line) => line !== "Leitura do jogo:");
  assert.deepEqual(fixed(complete), fixed(partial), "mesma ordem de seções em qualquer partida");
  assert.ok(complete.includes("Aventura completa: 30 de 30"));
  assert.ok(partial.includes("encerrada antes do fim"), "partida incompleta identificada para a família");
});

test("resumo cita todos os mundos e o herói, e não vaza dados da aplicação (número do caso)", () => {
  const summary = buildFamilySummary(play(6), CONTACT, new Date("2026-09-30T15:00:00"));
  const names = summarize(play(6)).phases.map((phase) => phase.phase.name);
  for (const name of names) assert.ok(summary.includes(name), `mundo ${name} presente`);
  assert.ok(summary.includes("Robô"), "herói escolhido aparece para a família");
  assert.doesNotMatch(summary, /CASO-|iniciais/i, "sem código de caso no texto da família");
});

test("PDF para a família usa o construtor clínico, tem rodapé LGPD e nunca classifica partida incompleta", () => {
  const full = buildFamilyDocSpec(play(8), ISSUER, "30/09/2026 15:30");
  assert.ok(full.title.includes("Relatório para a família"));
  assert.match(full.footer ?? "", /LGPD/);
  assert.ok(full.sections.some((section) => section.heading === "Como ler este relatório"));
  const worldSection = full.sections.find((section) => section.heading === "Desempenho por mundo");
  assert.ok(worldSection?.rich?.length, "linhas com destaque por mundo");
  assert.equal(worldSection?.rich?.map((line) => line.text).join("\n"), worldSection?.body, "rich e body idênticos");
  const partialSession = play(8, (index) => (index === 1 ? "erro" : "acerto"));
  partialSession.answers = partialSession.answers.filter((entry) => entry.phaseId !== "corpo");
  partialSession.skipped = [{ phaseId: "corpo", reason: "Criança cansada ou sem colaboração" }];
  const partial = buildFamilyDocSpec(partialSession, ISSUER, "30/09/2026 15:30");
  const worldBody = partial.sections.find((section) => section.heading === "Desempenho por mundo")?.body ?? "";
  assert.match(worldBody, /não aplicado/);
  assert.match(worldBody, /Criança cansada/);
  assert.ok(partial.sections.some((section) => section.body.includes("não dá classificação geral")));
  for (const spec of [full, partial]) {
    for (const section of spec.sections) {
      assert.doesNotMatch(section.body, /percentil|diagnóstico de/i, `${section.heading}: sem jargão normativo`);
    }
  }
});

test("anti-regressão da página: cadastro na 1\u00aa tela e disparo automático no encerramento permanecem ligados", () => {
  const page = readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8");
  assert.match(page, /data-testid="super-neuropad-family-delivery"/, "bloco de cadastro na 1\u00aa página");
  assert.match(page, /buildFamilySummary/, "resumo para a família");
  assert.match(page, /buildFamilyDocSpec/, "PDF para a família");
  assert.match(page, /shareWhatsAppDocument/, "WhatsApp no encaminhamento");
  assert.match(page, /openEmailDraft/, "e-mail no encaminhamento");
  assert.match(page, /function finishGame\(\)[\s\S]*?deliverToFamily/, "encerramento dispara o encaminhamento");
  assert.match(page, /setScreen\("results"\);\s*\n\s*if \(familyContact && familyDeliveryStatus === "ready"\)/, "disparo só com cadastro válido");
  assert.doesNotMatch(page, /\b(?:localStorage|sessionStorage|indexedDB)\s*\./, "contato da família nunca persiste no navegador (LGPD)");
  assert.match(page, /setFamilyContact\(null\)/, "contato limpo ao iniciar partida de outra criança");
  assert.match(page, /isValidPhone\(contact\.phone\)/, "telefone validado antes de abrir o WhatsApp");
  assert.match(page, /isValidFamilyEmail\(contact\.email\)/, "e-mail validado antes de abrir o rascunho");
});
