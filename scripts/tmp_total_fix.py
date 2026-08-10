from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    file = ROOT / path
    text = file.read_text("utf-8")
    if old not in text:
        raise SystemExit(f"Trecho esperado não encontrado em {path}")
    if text.count(old) != 1:
        raise SystemExit(f"Trecho não é único em {path}: {text.count(old)} ocorrências")
    file.write_text(text.replace(old, new, 1), "utf-8")


replace_once(
    "functions/api/patients/index.ts",
    '''  if (!env.DB) {\n    return jsonResponse(\n      {\n        ...toPatientApi(row),\n        mode: "demo",\n        note: "Registro simulado — banco não configurado. Configure D1 para persistência real.",\n      },\n      201,\n    );\n  }''',
    '''  if (!env.DB) {\n    return errorResponse(\n      "Persistência indisponível. Nenhum paciente foi criado.",\n      "DB_REQUIRED",\n      503,\n    );\n  }''',
)

replace_once(
    "functions/api/consultations/index.ts",
    '''  if (!env.DB) {\n    return jsonResponse({ ...payload, mode: "demo", note: "Registro simulado — banco não configurado." }, 201);\n  }''',
    '''  if (!env.DB) {\n    return errorResponse(\n      "Persistência indisponível. Nenhuma consulta foi registrada.",\n      "DB_REQUIRED",\n      503,\n    );\n  }''',
)

replace_once(
    "functions/api/documents/index.ts",
    '''  if (!env.DB) {\n    return jsonResponse({ ...payload, mode: "demo", note: "Registro simulado — banco não configurado." }, 201);\n  }''',
    '''  if (!env.DB) {\n    return errorResponse(\n      "Persistência indisponível. Nenhum documento foi criado.",\n      "DB_REQUIRED",\n      503,\n    );\n  }''',
)

replace_once(
    "functions/api/scales/results.ts",
    '''  if (!env.DB) {\n    return jsonResponse(\n      {\n        ...payload,\n        mode: "demo",\n        note: "Registro simulado — banco não configurado.",\n      },\n      201,\n    );\n  }''',
    '''  if (!env.DB) {\n    return errorResponse(\n      "Persistência indisponível. Nenhum resultado foi registrado.",\n      "DB_REQUIRED",\n      503,\n    );\n  }''',
)

replace_once(
    "functions/api/results.ts",
    '''  if (!env.DB) {\n    return json(\n      {\n        ...payload,\n        mode: "demo",\n        note: "Banco não configurado — registro simulado.",\n      },\n      201,\n    );\n  }''',
    '''  if (!env.DB) {\n    return json(\n      {\n        error: "Persistência indisponível. Nenhum resultado foi registrado.",\n        code: "DB_REQUIRED",\n      },\n      503,\n    );\n  }''',
)

# Teste runtime: prova que todos os endpoints clínicos recusam falso sucesso sem D1.
test = ROOT / "tests/unit/no-fake-clinical-write.test.ts"
test.write_text(r'''import assert from "node:assert/strict";
import { onRequestPost as createPatient } from "../../functions/api/patients/index";
import { onRequestPost as createConsultation } from "../../functions/api/consultations/index";
import { onRequestPost as createDocument } from "../../functions/api/documents/index";
import { onRequestPost as createScaleResult } from "../../functions/api/scales/results";
import { onRequestPost as createUiResult } from "../../functions/api/results";

type Handler = (context: any) => Promise<Response>;

async function expectDbRequired(
  name: string,
  handler: Handler,
  body: Record<string, unknown>,
): Promise<void> {
  const request = new Request(`https://neuroped.invalid/api/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await handler({ env: {}, request, data: {} });
  const payload = await response.json() as { code?: string; error?: string };
  assert.equal(response.status, 503, `${name}: write sem DB deve falhar com 503`);
  assert.equal(payload.code, "DB_REQUIRED", `${name}: código deve ser DB_REQUIRED`);
  assert.match(payload.error ?? "", /persistência indisponível/i, `${name}: resposta deve ser honesta`);
}

await expectDbRequired("patients", createPatient, {
  name: "Paciente Fictício de Teste",
  birth_date: "2018-01-01",
});

await expectDbRequired("consultations", createConsultation, {
  patient_id: "demo-001",
  date: "2026-08-10",
  subjective: "Registro fictício",
});

await expectDbRequired("documents", createDocument, {
  patient_id: "demo-001",
  type: "laudo",
  title: "Documento fictício",
  content: "Conteúdo fictício de teste",
});

await expectDbRequired("scales-results", createScaleResult, {
  patient_id: "demo-001",
  scale_id: "teste-ficticio",
  scale_name: "Escala Fictícia",
  responses: [{ question: "Item fictício", answer: "Resposta" }],
});

await expectDbRequired("results", createUiResult, {
  patientId: "demo-001",
  scaleId: "teste-ficticio",
  scaleName: "Escala Fictícia",
  responses: [{ question: "Item fictício", answer: "Resposta" }],
});

console.log("✓ Escritas clínicas sem D1 falham fechado; nenhum 201 simulado é permitido");
''', "utf-8")

# Trava estática de pontas soltas já resolvidas: flash, portal seguro, versão e write fail-closed.
loose = ROOT / "tests/unit/loose-ends-regression.test.mjs"
loose.write_text(r'''import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const home = read("client/src/pages/home.tsx");
const filtro = read("client/src/pages/filtro.tsx");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const portalFamilia = read("client/src/pages/portal-familia.tsx");
const buildInfo = read("scripts/gen-build-info.mjs");
const pkg = JSON.parse(read("package.json"));
const clinicalFiles = [
  "functions/api/patients/index.ts",
  "functions/api/consultations/index.ts",
  "functions/api/documents/index.ts",
  "functions/api/scales/results.ts",
  "functions/api/results.ts",
];

// Triagem sem cadastro: deve continuar pública, efêmera e sem contaminar o estado persistente.
assert.match(home, /filtro-escalas\?mode=flash/);
assert.match(filtro, /Modo efêmero — saia da tela e os dados somem/);
assert.match(filtro, /sessionStorage\.setItem\(FLASH_STORAGE_KEY/);
assert.match(filtro, /sessionStorage\.removeItem\(FLASH_STORAGE_KEY/);
assert.match(filtro, /if \(flashMode\) return;/);
assert.match(publicRoutes, /"\/filtro-escalas"/);

// Portal familiar não pode reintroduzir CPF-como-senha nem liberar documentos remotos anonimamente.
assert.doesNotMatch(portalFamilia, /CPF\s+como\s+senha|senha\s*=\s*CPF/i);
assert.match(portalFamilia, /remoteAuthenticatedProfessional/);
assert.match(portalFamilia, /Nenhum dado clínico é liberado por esta tela pública/);

// Build/versionamento continua derivado do package.json, sem versão duplicada manual no gerador.
assert.equal(typeof pkg.version, "string");
assert.match(buildInfo, /JSON\.parse\(readFileSync\(packagePath/);
assert.match(buildInfo, /pkg\.version/);

// Nenhum endpoint clínico pode mentir que persistiu quando DB não existe.
for (const path of clinicalFiles) {
  const source = read(path);
  assert.match(source, /DB_REQUIRED/);
  assert.doesNotMatch(source, /Registro simulado|registro simulado/);
}

console.log("✓ Pontas soltas críticas protegidas por regressão estática");
''', "utf-8")

pkg = ROOT / "package.json"
data = json.loads(pkg.read_text("utf-8"), object_pairs_hook=dict)
scripts = data["scripts"]
scripts["test:no-fake-clinical-write"] = "node --import tsx tests/unit/no-fake-clinical-write.test.ts"
scripts["test:loose-ends"] = "node tests/unit/loose-ends-regression.test.mjs"
verify = scripts["verify:release"]
anchor = "npm run test:operations &&"
insert = "npm run test:operations && npm run test:no-fake-clinical-write && npm run test:loose-ends &&"
if anchor not in verify:
    raise SystemExit("Âncora verify:release não encontrada")
scripts["verify:release"] = verify.replace(anchor, insert, 1)
pkg.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")

# Atualiza o documento de dívida para refletir o que já foi entregue e o que ainda é bloqueador real.
whats = ROOT / "WHATS_LEFT.md"
whats.write_text('''# O QUE AINDA FALTA — NeuroPed\n\n> Reconciliação de produção: 10 de agosto de 2026.\n\n## Estado comprovado nesta auditoria\n\nO app possui rotas React registradas, filtro clínico com sinais/sintomas, modo de triagem efêmera sem cadastro, exportação PDF/CSV, escalas interativas, Clinical Core, Conecta, agenda/booking, recepção, documentos, autenticação remota, consentimento LGPD e deploy coordenado Cloudflare/Vercel. A suíte de release, auditoria completa de acessibilidade, E2E de escalas, auditoria de telas e build completo passaram antes desta reconciliação.\n\nA partir desta revisão, endpoints clínicos nunca mais devolvem `201` fictício quando D1 está ausente: escritas falham com `503 DB_REQUIRED`, enquanto leitura demonstrativa continua explicitamente marcada como demo. A regra é coberta por teste runtime e estático dentro de `verify:release`.\n\n## Pendências reais que permanecem\n\n1. **Criptografia de dados clínicos reais em repouso (#514).** As tabelas clínicas atuais continuam deliberadamente demo-only. Não liberar persistência identificável de pacientes reais até concluir migração cifrada, backup/rollback e revisão LGPD.\n2. **Revogação externa de credenciais históricas (#515).** O app removeu o mecanismo ICP aposentado e o purge de secrets Cloudflare já passou, mas revogação/rotação no emissor/provedor não pode ser provada apenas pelo repositório.\n3. **Proveniência de conteúdo externo (#533).** Exige validação da fonte original fora do código; não deve ser "resolvida" por inferência.\n4. **Peso clínico exato de sinais/sintomas (#438).** Sinais já participam do ranking, porém alterar peso para 50% muda decisão clínica do motor e permanece decisão médica explícita; não automatizar apenas para fechar issue antiga.\n\n## Dívidas de produto não bloqueadoras\n\nPropostas antigas exclusivamente estéticas ou de arquitetura visual devem ser tratadas como ideias opcionais, não como bugs de produção. O design atual é validado pelos gates de acessibilidade/design/telas e deve evoluir por mudanças pequenas com comparação visual e rollback.\n\n## Catraca obrigatória\n\nAntes de qualquer merge em `main`: `npm run verify:release`, `npm run audit:a11y:full`, `npm run test:e2e:scales`, `npm run audit:screens` e build completo. Depois do merge, Cloudflare e Vercel precisam publicar o mesmo SHA; qualquer divergência bloqueia a promoção.\n''', "utf-8")

print("Correções de auditoria aplicadas")
