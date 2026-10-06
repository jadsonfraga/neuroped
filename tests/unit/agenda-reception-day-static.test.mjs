/**
 * Contrato estático da Recepção do dia na Agenda.
 * Rodar: node tests/unit/agenda-reception-day-static.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const agenda = readFileSync("client/src/pages/agenda.tsx", "utf8");
const panel = readFileSync("client/src/components/AgendaReceptionDay.tsx", "utf8");

// Aba para todos que operam a agenda (profissional e recepção), sem trocar a aba inicial.
assert.match(agenda, /<TabsTrigger value="recepcao" data-testid="tab-reception-day">Recepção do dia<\/TabsTrigger>/);
assert.doesNotMatch(agenda, /\{canConfigure && <TabsTrigger value="recepcao"/, "a recepção também vê a aba");
assert.match(agenda, /useState\("agenda"\)/, "a aba inicial continua sendo a Agenda");
assert.match(agenda, /<AgendaReceptionDay[\s\S]*providerId=\{providerId\}[\s\S]*agendaOf=\{agendaOf\}[\s\S]*mutate=\{mutate\}/, "usa o profissional escolhido, o rótulo da agenda e o mesmo mutate (POST com ?provider)");
// O link do cabeçalho para /recepcao (pré-consultas) e o CSS que depende dele ficam intactos.
assert.match(agenda, /<Link href="\/recepcao">/);

// Painel: só a ação existente, chave com o profissional, atualização periódica.
assert.match(panel, /action: "appointment_status"/, "ações de balcão usam a transição validada no servidor");
assert.doesNotMatch(panel, /action: "(appointment_reschedule|create_appointment|appointment_payment)"/, "recepção do dia não cria, remarca nem mexe no financeiro");
assert.match(panel, /queryKey: \[receptionDayKey\(date, providerId\)\]/);
assert.match(panel, /refetchInterval: REFRESH_MS/);
assert.doesNotMatch(panel, /amountCents|paymentStatus/, "nenhum dado financeiro na recepção do dia");

console.log("agenda-reception-day-static: aba para profissional e recepção, mesma ação de status, chave por profissional, sem financeiro OK");
