// Super NeuroPad Game — encaminhamento automático à família (trava
// anti-regressão). O mecanismo: na 1ª página do teste a aplicadora cadastra
// e-mail/WhatsApp da família; ao encerrar a partida, o app gera o PDF em
// linguagem acessível (mesmo construtor clínico) e prepara WhatsApp/e-mail
// com o resumo. Nada sai do dispositivo sem o gesto de envio do cliente; o
// resumo é sistemático (mesma ordem) e recorrente (mesmo formato em toda
// partida); só contagens, sem norma, percentil, nível ou classificação.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
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
  snapshotCompletedFamilySession,
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
    assert.ok(text.includes("Por mundo"), "seção por mundo sempre presente");
    assert.match(text, /Registro descritivo; sem classificação\. Interpretação a cargo do profissional\./);
    assert.doesNotMatch(text, /percentil|referência interna|Leitura do jogo/i);
    assert.doesNotMatch(text, /TDAH|TEA|diagnóstico de/i);
    assert.doesNotMatch(text, /CRM|Prescrição/);
  }
  const sections = (text: string) => text.split("\n").filter((line) => /^[A-ZÀ-Ú]/.test(line)).map((line) => line.replace(/:.*/, ":").replace(/por e-mail e WhatsApp\.|por e-mail\.|por WhatsApp\./, "para a família.").replace(/Aventura completa:.*|Aventura encerrada antes do fim:.*/, "Situação da aventura:"));
  const fixed = (text: string) => sections(text).filter((line) => line !== "Leitura do jogo:");
  assert.deepEqual(fixed(complete), fixed(partial), "mesma ordem de seções em qualquer partida");
  assert.ok(complete.includes("Aventura completa: 36 de 36"));
  assert.ok(partial.includes("encerrada antes do fim"), "partida incompleta identificada para a família");
});

test("resumo cabe no link wa.me do WhatsApp (limite 1800 codificado)", () => {
  for (const years of [2, 8, 17]) {
    const session = play(years, (index) => (index % 4 === 1 ? "erro" : index % 4 === 2 ? "sem_resposta" : "acerto"));
    const text = buildFamilySummary(session, CONTACT, new Date("2026-09-30T15:00:00"));
    const encoded = encodeURIComponent(text).length;
    assert.ok(encoded <= 1800, `resumo de ${years} anos codificado em ${encoded} caracteres estoura o wa.me`);
  }
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
  const worldSection = full.sections.find((section) => section.heading === "Respostas por mundo");
  assert.ok(worldSection?.rich?.length, "linhas com destaque por mundo");
  assert.equal(worldSection?.rich?.map((line) => line.text).join("\n"), worldSection?.body, "rich e body idênticos");
  const partialSession = play(8, (index) => (index === 1 ? "erro" : "acerto"));
  partialSession.answers = partialSession.answers.filter((entry) => entry.phaseId !== "corpo");
  partialSession.skipped = [{ phaseId: "corpo", reason: "Criança cansada ou sem colaboração" }];
  const partial = buildFamilyDocSpec(partialSession, ISSUER, "30/09/2026 15:30");
  const worldBody = partial.sections.find((section) => section.heading === "Respostas por mundo")?.body ?? "";
  assert.match(worldBody, /não aplicado/);
  assert.match(worldBody, /Criança cansada/);
  assert.ok(partial.sections.some((section) => section.body.includes("Registro descritivo; sem classificação.")));
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
  assert.match(page, /function finishGame\\(finalAnswers: AnswerRecord\\[\\] = answers/, "encerramento recebe a resposta final");
  assert.match(page, /finishGame\\(next\\)/, "última resposta enviada ao encerramento");
  assert.match(page, /finishGame\\(answers, nextSkipped\\)/, "último mundo pulado enviado ao encerramento");
  assert.match(page, /setScreen\\("results"\\);\\s*\\n\\s*if \\(familyContact && familyDeliveryStatus === "ready" && deliverySnapshot\\)/, "disparo somente com contato válido e retrato atual");
  assert.match(page, /deliverToFamily\\(familyContact, deliverySnapshot\\)/, "entrega recebe retrato atualizado");
  assert.match(page, /buildFamilySummary\\(deliveredSession, contact\\)/, "mensagem usa o retrato atualizado");
  assert.match(page, /buildFamilyDocSpec\\(deliveredSession,/, "PDF usa o mesmo retrato");
  assert.doesNotMatch(page, /\b(?:localStorage|sessionStorage|indexedDB)\s*\./, "contato da família nunca persiste no navegador (LGPD)");
  assert.match(page, /setFamilyContact\(null\)/, "contato limpo ao iniciar partida de outra criança");
  assert.match(page, /isValidPhone\(contact\.phone\)/, "telefone validado antes de abrir o WhatsApp");
  assert.match(page, /isValidFamilyEmail\(contact\.email\)/, "e-mail validado antes de abrir o rascunho");
});

test("última resposta integra texto e PDF familiar antes do render (2, 8 e 17 anos)", () => {
  for (const years of [2, 8, 17]) {
    const complete = play(years, (index) => index === 0 ? "erro" : "acerto");
    const last = { ...complete.answers.at(-1)!, status: "erro" as const, given: "Resposta sintética divergente" };
    const stale = { ...complete, answers: complete.answers.slice(0, -1), finishedAt: null, pausedSeconds: 0 };
    const previousCount = stale.answers.length;
    const closedAt = "2026-09-30T12:18:00.000Z";
    const snapshot = snapshotCompletedFamilySession(stale, closedAt, [...stale.answers, last]);
    assert.equal(stale.answers.length, previousCount, "estado anterior não é mutado");
    assert.equal(stale.finishedAt, null);
    assert.equal(snapshot.finishedAt, closedAt);
    assert.equal(snapshot.answers.length, complete.answers.length);
    assert.equal(snapshot.answers.at(-1)?.itemId, last.itemId);
    assert.equal(summarize(snapshot).complete, true, "não perde a resposta final");
    const text = buildFamilySummary(snapshot, CONTACT, new Date(closedAt));
    assert.match(text, /Aventura completa:/);
    assert.equal(summarize(snapshot).hits, complete.answers.length - 2);
    const pdf = buildFamilyDocSpec(snapshot, ISSUER, "30/09/2026 12:18", new Date(closedAt));
    assert.ok(pdf.sections.some((section) => section.body.includes(last.prompt)), "PDF registra o último erro");
    assert.ok(pdf.sections.some((section) => section.body.includes("Resposta sintética divergente")), "PDF registra a resposta final");
  }
});

test("pular o último mundo preserva motivo e parcialidade na entrega", () => {
  const full = play(8);
  const remaining = full.answers.filter((entry) => entry.phaseId !== "corpo");
  const stale = { ...full, answers: remaining, skipped: [], finishedAt: null };
  const reason = "Pedido da família";
  const snapshot = snapshotCompletedFamilySession(stale, "2026-09-30T12:20:00.000Z", remaining, [{ phaseId: "corpo", reason }]);
  assert.equal(stale.skipped.length, 0, "motivo anterior não é mutado");
  assert.equal(summarize(snapshot).complete, false);
  assert.match(buildFamilySummary(snapshot, CONTACT), /encerrada antes do fim/);
  const pdf = buildFamilyDocSpec(snapshot, ISSUER, "30/09/2026 12:20");
  assert.match(pdf.sections.find((section) => section.heading === "Respostas por mundo")?.body ?? "", /Pedido da família/);
});
