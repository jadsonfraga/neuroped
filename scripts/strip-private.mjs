#!/usr/bin/env node
/* ============================================================
   NeuroPed SDG — strip-private.mjs
   ------------------------------------------------------------
   Remove do DEPLOY PÚBLICO (não do repositório) os arquivos sensíveis:
   operação clínica profissional, administração, gerador de licenças,
   conteúdo pago e páginas de dev/teste/demo. Rodado nos workflows de
   deploy ANTES de publicar (GitHub Pages e Cloudflare). Assim:
     - o site público NÃO serve esses arquivos (nem por curl/JS-off);
     - o repositório os mantém (build privado do autor é recuperável);
     - os testes continuam rodando contra o repositório (intactos).

   "Ocultar com JS" (public-mode.js) é defesa em profundidade; ESTE script
   é a remoção de verdade do conteúdo sensível do que vai ao ar.

   Uso: node scripts/strip-private.mjs            (remove)
        node scripts/strip-private.mjs --list     (só lista)
   ============================================================ */
import { rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const listOnly = process.argv.includes('--list');

// Páginas/JS removidos do deploy público (sensíveis). NÃO inclui o landing
// de vendas neuroped-pro.html (público por design) nem consulta-bridge.js
// (usado pela home).
const PRIVATE_FILES = [
  // Operação clínica profissional
  'consulta.html', 'consulta-livre.html', 'intake.html', 'assinatura-digital.html',
  'consulta-pin-fix.js', 'consulta-docflow.js', 'consulta-documentos.js',
  'consulta-voz.js', 'consulta-safe-exit.js', 'consulta-next-redirect.js',
  'assinatura-digital.js',
  // Administração / financeiro
  'secretaria.html', 'agenda-financeiro.html',
  // Monetização / licenças / acesso pago + conteúdo pago
  // Decisão do autor: NADA de monetização por enquanto → Pro + e-book saem do público.
  'neuroped-pro.html', 'pro-license.js', 'pro-hashes.js',
  'neuroped-master-vitrine.html', 'neuroped-master-vitrine.css',
  'neuroped-master-vitrine.js', 'neuroped-master-vitrine-data.js',
  'solicitar-neuroped-master.html',
  'gerar-licencas-pro.html', 'ativar-passe-familiar.html', 'politica-acesso-familiar.html',
  'family-pass.js', 'family-pass-generator.js', 'family-pass-portal.js',
  'family-voucher.js', 'family-voucher-ui.js',
  'neuroped-master-protegido-data.js',
  // Auditoria / dev / teste / demo / ops
  'auditoria-ontologia.html', 'auditoria-operacional.html',
  'qa-smoke-test.html', 'teste-e2e-manual.html', 'teste-ouro-pin.html',
  'scale-engine-demo.html', 'clinical-trajetoria-demo.html', 'ds-pilot.html',
  'verificar.html', 'verificar-app.html', 'cloud-status.html',
  'setup.html', 'guia-lancamento.html'
];

let removed = 0, missing = 0;
for (const f of PRIVATE_FILES) {
  const p = join(root, f);
  if (!existsSync(p)) { missing++; continue; }
  if (listOnly) { console.log('  privado:', f); continue; }
  rmSync(p, { force: true });
  removed++;
}

// Substitui dados pagos por um stub vazio para a biblioteca degradar sem erro,
// caso algum código leia o global mesmo com a área reservada travada.
const proStub = join(root, 'neuroped-master-protegido-data.js');
if (!listOnly && !existsSync(proStub)) {
  writeFileSync(proStub, 'window.NEUROPED_MASTER_PRO = window.NEUROPED_MASTER_PRO || [];\n');
}

if (listOnly) {
  console.log(`strip-private: ${PRIVATE_FILES.length} arquivos marcados como privados.`);
} else {
  console.log(`strip-private: removidos ${removed}, ausentes ${missing}. Conteúdo sensível fora do deploy público.`);
}
