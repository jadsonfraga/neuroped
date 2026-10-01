/**
 * Endurecimento do envio de e-mail transacional:
 *   1. timeout no transporte (um provedor lento não prende a requisição);
 *   2. teto por destinatário (o formulário público não vira disparador de e-mail
 *      para terceiros), com hash HMAC, janelas de hora e dia, retenção, e a
 *      mensagem sempre preservada na caixa de saída.
 *
 * Fixtures 100% sintéticas, sem PHI.
 * Rodar: node --import tsx tests/unit/email-delivery-hardening.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import {
  MAIL_REQUEST_TIMEOUT_MS,
  sendTransactionalEmail,
} from "../../functions/api/auth/_mailTransport";
import { enqueueNotification } from "../../functions/api/operations/_core";
import {
  EMAIL_RECIPIENT_MAX_PER_DAY,
  EMAIL_RECIPIENT_MAX_PER_HOUR,
  dispatchNotificationEmail,
  normalizeRecipientForQuota,
} from "../../functions/api/operations/_notificationDelivery";

const MAIL = {
  AUTH_PUBLIC_APP_URL: "https://app.neuroped.test/",
  AUTH_RESEND_API_KEY: "re_teste_sintetico",
  AUTH_EMAIL_FROM: "NeuroPed <agenda@neuroped.test>",
};
const KEY_A = "chave-operacional-de-teste-com-32-caracteres!!";
const KEY_B = "outra-chave-operacional-de-teste-32-caracteres!";

// Ruído esperado de console.error do transporte; a suíte checa só o contrato.
const realError = console.error;
console.error = () => {};
const realFetch = globalThis.fetch;

// ── 1. Transporte: timeout ─────────────────────────────────────────────────
{
  assert.ok(MAIL_REQUEST_TIMEOUT_MS >= 1_000 && MAIL_REQUEST_TIMEOUT_MS <= 15_000, "teto de espera razoável para uma requisição de usuário");

  // Provedor que nunca responde: só termina quando a requisição é abortada.
  let seenSignal: AbortSignal | undefined;
  globalThis.fetch = ((_input: unknown, init?: RequestInit) => {
    seenSignal = init?.signal ?? undefined;
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
    });
  }) as typeof fetch;
  const started = Date.now();
  const delivered = await sendTransactionalEmail(MAIL, { to: "x@y.test", subject: "s", text: "t" }, { timeoutMs: 40 });
  assert.equal(delivered, false, "estourar o tempo é falha de entrega, nunca exceção");
  assert.ok(Date.now() - started < 2_000, "não espera o provedor indefinidamente");
  assert.ok(seenSignal instanceof AbortSignal, "a requisição ao provedor leva um signal de cancelamento");
  assert.equal(seenSignal?.aborted, true);

  // Provedor rápido: entrega normal e o timer não aborta depois.
  let fastSignal: AbortSignal | undefined;
  globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
    fastSignal = init?.signal ?? undefined;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  assert.equal(await sendTransactionalEmail(MAIL, { to: "x@y.test", subject: "s", text: "t" }, { timeoutMs: 40 }), true);
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(fastSignal?.aborted, false, "o timer é limpo quando o envio termina");

  // Tempo inválido volta ao padrão (não aborta de imediato).
  for (const timeoutMs of [0, -5, Number.NaN]) {
    assert.equal(await sendTransactionalEmail(MAIL, { to: "x@y.test", subject: "s", text: "t" }, { timeoutMs }), true, `timeoutMs=${timeoutMs} usa o padrão`);
  }

  // Contrato antigo preservado: mesma URL, método e corpo.
  let captured: { url: string; method?: string; body?: any } | null = null;
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    captured = { url: String(input), method: init?.method, body: JSON.parse(String(init?.body)) };
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  await sendTransactionalEmail(MAIL, { to: "a@b.test", subject: "Assunto", text: "Corpo" });
  assert.deepEqual(captured, {
    url: "https://api.resend.com/emails",
    method: "POST",
    body: { from: MAIL.AUTH_EMAIL_FROM, to: ["a@b.test"], subject: "Assunto", text: "Corpo" },
  });
}

// ── 2. Normalização só para contar ─────────────────────────────────────────
{
  assert.equal(normalizeRecipientForQuota("  Vitima@Example.TEST "), "vitima@example.test");
  assert.equal(normalizeRecipientForQuota("vitima+promo@example.test"), "vitima@example.test");
  assert.equal(normalizeRecipientForQuota("v.i.t.i.m.a@gmail.com"), "vitima@gmail.com");
  assert.equal(normalizeRecipientForQuota("vitima+x@googlemail.com"), "vitima@gmail.com");
  assert.equal(normalizeRecipientForQuota("v.i.t.i.m.a@example.test"), "v.i.t.i.m.a@example.test", "pontos só são ignorados no Gmail");
  assert.equal(normalizeRecipientForQuota("+so-etiqueta@example.test"), "+so-etiqueta@example.test", "sem parte local não inventa endereço");
  assert.equal(normalizeRecipientForQuota("sem-arroba"), "sem-arroba");
}

// ── Banco real ─────────────────────────────────────────────────────────────
const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = OFF;");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  try {
    raw.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
  } catch (erro) {
    assert.match(String(erro), /duplicate column name/i, `migração ${nome}: ${String(erro)}`);
  }
}
const db = {
  prepare(sql: string) {
    const make = (args: unknown[]) => ({
      async first<T>() { return (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null; },
      async run() { const info = raw.prepare(sql).run(...(args as never[])); return { meta: { changes: Number(info.changes) } }; },
      async all<T>() { return { results: raw.prepare(sql).all(...(args as never[])) as T[] }; },
    });
    return { bind: (...args: unknown[]) => make(args), ...make([]) };
  },
  async batch(statements: Array<{ run(): Promise<unknown> }>) {
    raw.exec("SAVEPOINT b");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      raw.exec("RELEASE b");
      return results;
    } catch (error) {
      raw.exec("ROLLBACK TO b; RELEASE b");
      throw error;
    }
  },
} as unknown as D1Database;

type Row = Record<string, any>;
const sends: string[] = [];
globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
  sends.push(JSON.parse(String(init?.body)).to[0]);
  return new Response("{}", { status: 200 });
}) as typeof fetch;

// `null` = ambiente sem OPERATIONAL_DATA_KEY (um `undefined` ativaria o valor padrão).
const env = (key: string | null = KEY_A) => ({ DB: db, ...(key ? { OPERATIONAL_DATA_KEY: key } : {}), ...MAIL });
async function notify(email: string, key: string | null = KEY_A): Promise<Row> {
  const before = (raw.prepare(`SELECT COUNT(*) AS n FROM notification_outbox`).get() as Row).n as number;
  const stored = await enqueueNotification(db, env(key) as never, {
    appointmentId: null,
    providerUserId: "prof-q",
    clinicId: "clinic-q",
    template: "booking_requested",
    recipient: null,
    message: "Recebemos sua solicitação.",
    email,
    context: { professionalName: "Dra. Teto", clinicName: "Clínica Teto", providerSlug: "dra-teto", clinicSlug: "clinica-teto" },
  });
  assert.equal(stored, true, "a mensagem sempre vai para a caixa de saída");
  assert.equal((raw.prepare(`SELECT COUNT(*) AS n FROM notification_outbox`).get() as Row).n, before + 1);
  return { ...(raw.prepare(`SELECT status, channel, attempts, last_error, last_attempt_at FROM notification_outbox ORDER BY rowid DESC LIMIT 1`).get() as Row) };
}
const quotaCount = () => (raw.prepare(`SELECT COUNT(*) AS n FROM notification_email_quota`).get() as Row).n as number;

// ── 3. Teto por hora, por endereço normalizado ─────────────────────────────
{
  for (let i = 1; i <= EMAIL_RECIPIENT_MAX_PER_HOUR; i += 1) {
    const row = await notify("vitima@example.test");
    assert.deepEqual({ status: row.status, channel: row.channel, attempts: row.attempts }, { status: "delivered", channel: "email", attempts: 1 }, `envio ${i} dentro do teto`);
  }
  assert.equal(sends.length, EMAIL_RECIPIENT_MAX_PER_HOUR);

  const over = await notify("vitima@example.test");
  assert.deepEqual(
    { status: over.status, channel: over.channel, attempts: over.attempts, last_error: over.last_error, last_attempt_at: over.last_attempt_at },
    { status: "pending_provider", channel: "manual", attempts: 0, last_error: "rate_limited", last_attempt_at: null },
    "estourou: não sai, fica manual, não gasta tentativa nem aciona o intervalo de 1 minuto",
  );
  assert.equal(sends.length, EMAIL_RECIPIENT_MAX_PER_HOUR, "nenhuma chamada ao provedor depois do teto");

  for (const variant of ["VITIMA@example.test", "vitima+promo@example.test", "  vitima@Example.Test "]) {
    const row = await notify(variant);
    assert.equal(row.last_error, "rate_limited", `${variant} divide o mesmo teto`);
  }
  assert.equal(sends.length, EMAIL_RECIPIENT_MAX_PER_HOUR);

  const other = await notify("outra.pessoa@example.test");
  assert.equal(other.status, "delivered", "outro destinatário não é afetado");
  assert.equal(sends.length, EMAIL_RECIPIENT_MAX_PER_HOUR + 1);

  // Gmail: pontos e +etiqueta são a mesma caixa.
  for (let i = 0; i < EMAIL_RECIPIENT_MAX_PER_HOUR; i += 1) await notify("g.a.b@gmail.com");
  const gmail = await notify("gab+x@googlemail.com");
  assert.equal(gmail.last_error, "rate_limited", "variações do Gmail dividem o teto");
}

// ── 4. A janela da hora reabre; o teto do dia continua valendo ─────────────
{
  const hour = new Date(Date.now() - 2 * 3_600_000).toISOString();
  raw.prepare(`UPDATE notification_email_quota SET sent_at = ?`).run(hour);
  const before = sends.length;
  const reopened = await notify("vitima@example.test");
  assert.equal(reopened.status, "delivered", "passada a hora, o envio volta");
  assert.equal(sends.length, before + 1);

  // Dia cheio: 30 envios nas últimas 20 horas (fora da janela da hora) bloqueiam.
  const hash = (raw.prepare(`SELECT recipient_hash FROM notification_email_quota ORDER BY rowid DESC LIMIT 1`).get() as Row).recipient_hash as string;
  raw.prepare(`DELETE FROM notification_email_quota WHERE recipient_hash = ?`).run(hash);
  const earlier = new Date(Date.now() - 20 * 3_600_000).toISOString();
  for (let i = 0; i < EMAIL_RECIPIENT_MAX_PER_DAY; i += 1) {
    raw.prepare(`INSERT INTO notification_email_quota (recipient_hash, sent_at) VALUES (?, ?)`).run(hash, earlier);
  }
  const blocked = await notify("vitima@example.test");
  assert.equal(blocked.last_error, "rate_limited", "teto do dia vale mesmo com a hora livre");
}

// ── 5. Retenção: nada além de um dia fica guardado ─────────────────────────
{
  const stale = new Date(Date.now() - 25 * 3_600_000).toISOString();
  raw.prepare(`INSERT INTO notification_email_quota (recipient_hash, sent_at) VALUES ('hash-antigo', ?)`).run(stale);
  await notify("retencao@example.test");
  assert.equal((raw.prepare(`SELECT COUNT(*) AS n FROM notification_email_quota WHERE recipient_hash = 'hash-antigo'`).get() as Row).n, 0, "linhas com mais de um dia são removidas");
}

// ── 6. Privacidade: só hash, e o hash depende da chave ─────────────────────
{
  const rows = raw.prepare(`SELECT recipient_hash, sent_at FROM notification_email_quota`).all() as Row[];
  assert.ok(rows.length > 0);
  for (const row of rows) {
    if (row.recipient_hash === "hash-antigo") continue;
    assert.match(row.recipient_hash, /^[0-9a-f]{64}$/, "o endereço nunca é gravado em claro");
  }
  const dump = JSON.stringify(rows);
  for (const plain of ["vitima", "outra.pessoa", "gab", "retencao", "@example", "gmail"]) {
    assert.ok(!dump.includes(plain), `a tabela de teto não guarda ${plain}`);
  }

  await notify("chave@example.test", KEY_A);
  await notify("chave@example.test", KEY_B);
  const hashes = (raw.prepare(`SELECT DISTINCT recipient_hash FROM notification_email_quota ORDER BY rowid DESC LIMIT 2`).all() as Row[]);
  assert.equal(hashes.length, 2, "o mesmo endereço com chaves diferentes gera hashes diferentes (sem tabela arco-íris sem a chave)");
}

// ── 7. Atômico sob concorrência ────────────────────────────────────────────
{
  const before = sends.length;
  const firstRowid = ((raw.prepare(`SELECT COALESCE(MAX(rowid), 0) AS n FROM notification_outbox`).get() as Row).n as number) + 1;
  const context = { professionalName: "Dra. Teto", clinicName: "Clínica Teto", providerSlug: "dra-teto", clinicSlug: "clinica-teto" };
  await Promise.all(
    Array.from({ length: EMAIL_RECIPIENT_MAX_PER_HOUR + 6 }, () =>
      enqueueNotification(db, env() as never, {
        appointmentId: null, providerUserId: "prof-q", clinicId: "clinic-q", template: "booking_requested",
        recipient: null, message: "Recebemos sua solicitação.", email: "corrida@example.test", context,
      }),
    ),
  );
  assert.equal(sends.length - before, EMAIL_RECIPIENT_MAX_PER_HOUR, "pedidos simultâneos não furam o teto");
  const batch = raw.prepare(`SELECT status, last_error FROM notification_outbox WHERE rowid >= ?`).all(firstRowid) as Row[];
  assert.equal(batch.length, EMAIL_RECIPIENT_MAX_PER_HOUR + 6, "todas as mensagens ficam na caixa de saída");
  assert.equal(batch.filter((row) => row.status === "delivered").length, EMAIL_RECIPIENT_MAX_PER_HOUR);
  assert.equal(batch.filter((row) => row.last_error === "rate_limited").length, 6);
}

// ── 8. Sem chave não há como identificar o destinatário: nada sai ──────────
{
  const before = sends.length;
  const quotaBefore = quotaCount();
  const row = await notify("semchave@example.test", null).catch((error: unknown) => ({ failed: String(error) }));
  // Sem OPERATIONAL_DATA_KEY o próprio armazenamento cifrado recusa antes de chegar ao envio.
  assert.ok("failed" in row || row.status === "pending_provider", "sem chave nada é entregue");
  assert.equal(sends.length, before);
  assert.equal(quotaCount(), quotaBefore);

  // Direto no despacho: sem chave, falha fechada e a tentativa é devolvida.
  raw.prepare(`INSERT INTO notification_outbox (id, provider_user_id, clinic_id, channel, template, payload_encrypted, status, created_at, updated_at, attempts) VALUES ('ntf-sem-chave', 'prof-q', 'clinic-q', 'manual', 'booking_requested', 'payload-sintetico', 'pending_provider', ?, ?, 0)`).run(new Date().toISOString(), new Date().toISOString());
  const result = await dispatchNotificationEmail(db, env(null) as never, {
    id: "ntf-sem-chave",
    email: "semchave@example.test",
    message: "m",
    context: { professionalName: null, clinicName: null, providerSlug: null, clinicSlug: null },
  });
  assert.equal(result, "error");
  assert.deepEqual(
    { ...(raw.prepare(`SELECT status, attempts, last_attempt_at FROM notification_outbox WHERE id = 'ntf-sem-chave'`).get() as Row) },
    { status: "pending_provider", attempts: 0, last_attempt_at: null },
    "a tentativa reservada é devolvida",
  );
  assert.equal(sends.length, before);
}

globalThis.fetch = realFetch;
console.error = realError;
console.log("email-delivery-hardening: timeout no transporte, teto por destinatário (normalização, hora e dia, retenção, hash sem e-mail em claro, concorrência, sem chave) e mensagem sempre preservada OK");
