import { readFileSync } from "node:fs";
import { join } from "node:path";

const file = readFileSync(join(process.cwd(), "client/src/components/ClinicalReport.tsx"), "utf8");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

console.log("✉️ Auditando destino real do relatório clínico...");

if (!file.includes('const EMAIL_TO = "drjadsonfraga@proton.me"')) {
  fail("ClinicalReport.tsx deve definir EMAIL_TO como drjadsonfraga@proton.me.");
}

if (!file.includes("/api/send-report")) {
  fail("ClinicalReport.tsx deve manter integração opcional com /api/send-report.");
}

if (!file.includes("to: EMAIL_TO")) {
  fail("Bug detectado: /api/send-report deve receber to: EMAIL_TO; sem isso o backend envia para req.user.email e o toast promete destino errado.");
}

if (!file.includes("CRM-PE 25227 · RQE 17756")) {
  fail("Relatório deve usar assinatura CRM-PE 25227 · RQE 17756.");
}

if (file.includes("CRM-BA") || file.includes("jadsonfraga@hotmail.com")) {
  fail("Relatório ainda contém identidade institucional antiga.");
}

if (process.exitCode) {
  console.error("\nResultado: auditoria do relatório clínico reprovada.");
  process.exit(process.exitCode);
}

console.log("✅ Relatório clínico aprovado: destino do email e identidade institucional coerentes.");
