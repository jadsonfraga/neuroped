/**
 * Transporte SMTP do servidor Express (server/lib/email.ts) contra um servidor
 * SMTP falso local. Cobre a construção do transporter do nodemailer (10.x),
 * AUTH, envelope, cabeçalhos, verify() e erros tipados — sem rede externa.
 */
import assert from "node:assert/strict";
import net from "node:net";

type Sessao = { auth: string[]; mailFrom: string[]; rcptTo: string[]; data: string };
const sessoes: Sessao[] = [];

const servidor = net.createServer((socket) => {
  const s: Sessao = { auth: [], mailFrom: [], rcptTo: [], data: "" };
  sessoes.push(s);
  let buffer = "";
  let emData = false;
  socket.write("220 fake.smtp.test ESMTP\r\n");
  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let idx: number;
    while ((idx = buffer.indexOf("\r\n")) >= 0) {
      const linha = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      if (emData) {
        if (linha === ".") {
          emData = false;
          socket.write("250 2.0.0 Ok: queued as FAKE123\r\n");
        } else {
          s.data += linha + "\n";
        }
        continue;
      }
      const cmd = linha.toUpperCase();
      if (cmd.startsWith("EHLO") || cmd.startsWith("HELO")) {
        socket.write("250-fake.smtp.test\r\n250-AUTH PLAIN\r\n250 8BITMIME\r\n");
      } else if (cmd.startsWith("AUTH PLAIN")) {
        s.auth.push(Buffer.from(linha.slice(11).trim(), "base64").toString("utf8"));
        socket.write("235 2.7.0 Authentication successful\r\n");
      } else if (cmd.startsWith("MAIL FROM:")) {
        s.mailFrom.push(linha.slice(10));
        socket.write("250 2.1.0 Ok\r\n");
      } else if (cmd.startsWith("RCPT TO:")) {
        s.rcptTo.push(linha.slice(8));
        socket.write("250 2.1.5 Ok\r\n");
      } else if (cmd === "DATA") {
        emData = true;
        socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
      } else if (cmd === "QUIT") {
        socket.end("221 2.0.0 Bye\r\n");
      } else if (cmd === "RSET" || cmd === "NOOP") {
        socket.write("250 Ok\r\n");
      } else {
        socket.write("502 5.5.2 Command not recognized\r\n");
      }
    }
  });
  socket.on("error", () => {});
});

await new Promise<void>((resolve) => servidor.listen(0, "127.0.0.1", resolve));
const porta = (servidor.address() as net.AddressInfo).port;

// 1) Sem configuração SMTP: erro tipado, sem tentar conectar.
{
  for (const k of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"]) delete process.env[k];
  const mod = await import("../../server/lib/email");
  await assert.rejects(
    mod.sendEmail({ to: "a@b.test", subject: "s", text: "t" }),
    (e: unknown) => e instanceof mod.EmailSendError && /SMTP ausentes/.test((e as Error).message),
  );
  assert.equal(await mod.verifySmtpConnection(), false);
  assert.equal(sessoes.length, 0, "sem configuração não pode abrir conexão");
}

process.env.SMTP_HOST = "127.0.0.1";
process.env.SMTP_PORT = String(porta);
process.env.SMTP_USER = "usuario-teste";
process.env.SMTP_PASSWORD = "senha-teste-nao-real";
process.env.SMTP_FROM = "NeuroPed Teste <noreply@neuroped.test>";
const { sendEmail, verifySmtpConnection, EmailSendError } = await import("../../server/lib/email");

// 2) verify() conecta e autentica.
assert.equal(await verifySmtpConnection(), true);

// 3) Envio: AUTH PLAIN, envelope, cabeçalhos da aplicação e messageId.
{
  const antes = sessoes.length;
  const r = await sendEmail({
    to: ["um@destino.test", "dois@destino.test"],
    subject: "Assunto de teste",
    text: "Corpo em texto",
    replyTo: "resposta@neuroped.test",
  });
  assert.match(r.messageId, /^<.+@.+>$/);
  const s = sessoes.at(-1)!;
  assert.ok(sessoes.length > antes);
  assert.deepEqual(s.auth, ["\u0000usuario-teste\u0000senha-teste-nao-real"]);
  assert.match(s.mailFrom[0], /<noreply@neuroped\.test>/);
  assert.deepEqual(
    s.rcptTo.map((r) => r.match(/<([^>]+)>/)?.[1]),
    ["um@destino.test", "dois@destino.test"],
  );
  assert.match(s.data, /^Subject: Assunto de teste$/m);
  assert.match(s.data, /^X-NeuroPed-App: edj$/im, "nome de cabeçalho é case-insensitive (RFC 5322)");
  assert.match(s.data, /^Auto-Submitted: auto-generated$/m);
  assert.match(s.data, /^Reply-To: resposta@neuroped\.test$/m);
  assert.match(s.data, /Corpo em texto/);
}

// 4) Sem text/html continua recusado antes da rede.
await assert.rejects(sendEmail({ to: "a@b.test", subject: "s" }), EmailSendError);

servidor.close();
console.log("✅ transporte SMTP (nodemailer): verify, AUTH, envelope, cabeçalhos e erros tipados contra servidor local.");
