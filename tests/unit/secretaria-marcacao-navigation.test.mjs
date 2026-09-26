import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../..", import.meta.url);
async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("Secretaria pública usa somente o agendamento nativo NeuroPad", async () => {
  const [app, navigation, page, booking, publicBooking] = await Promise.all([
    source("client/src/App.tsx"),
    source("client/src/data/navigation.ts"),
    source("client/src/pages/marcacao.tsx"),
    source("client/src/pages/agendar.tsx"),
    source("functions/api/public-booking.ts"),
  ]);

  assert.match(app, /import\("@\/pages\/marcacao"\)/);
  assert.match(app, /path="\/marcacao" component=\{MarcacaoPage\}/);
  assert.match(navigation, /href: "\/marcacao",[\s\S]{0,200}label: "Secretaria IA"/);
  assert.match(navigation, /Agendamento próprio NeuroPad · 1 hora por paciente/);

  assert.match(page, /import AgendarPage from "@\/pages\/agendar"/);
  assert.match(page, /<main id="conteudo"[^>]*>\s*<AgendarPage \/>\s*<\/main>/, "rota montada fora do Layout traz o próprio landmark <main>");
  assert.doesNotMatch(page, /BoaConsulta|boaconsulta|BOACONSULTA_PROFILE_URL/);

  assert.match(booking, /\/api\/public-booking\?action=providers/);
  assert.match(booking, /\/api\/public-booking\?action=slots/);
  assert.match(booking, /action: "book"/);
  assert.match(booking, /action: "reschedule"/);
  assert.match(booking, /action: "cancel"/);
  assert.match(booking, /action: "waitlist"/);
  assert.match(booking, /privacyAccepted: booking\.privacy/);
  assert.match(booking, /sessionStorage\.setItem\("neuroped:booking-token"/);
  assert.doesNotMatch(booking, /BoaConsulta|boaconsulta/);

  assert.match(publicBooking, /INSERT INTO appointments/);
  assert.match(publicBooking, /slotLockStatements/);
  assert.match(publicBooking, /public_booking_consent_evidence|ensureOperationsHardeningSchema/);
  assert.match(publicBooking, /"SLOT_CONFLICT"/);
  assert.match(publicBooking, /action === "reschedule"/);
  assert.match(publicBooking, /action === "cancel"/);
});

console.log("✓ Secretaria IA usa a agenda própria e não depende do BoaConsulta");
