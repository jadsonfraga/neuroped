## Objetivo

Esta rodada assume a próxima fase de produção segura do NeuroPed OS e transforma os bloqueadores do PR #724 em gates executáveis, sem substituir membership, entitlement, keyring, auditoria ou a fonte clínica canônica.

## Entregas

- adiciona o workflow manual `.github/workflows/saas-production-gates.yml`, fail-closed, com environments `staging`/`production`, confirmação explícita antes de migrations produtivas, validação de secret names sem valores, aplicação ordenada de migrations 0016–0023 e verificação metadata-only de tabelas e triggers;
- centraliza o catálogo físico de tabelas e triggers no contrato compartilhado, usado pelo readiness, diagnóstico e testes;
- adiciona `/api/saas/production-diagnostics`, sem valores de segredo, PHI ou payload, com schema, keyring, entitlement, URL e ações corretivas redigidas;
- torna evidências de backup/restore append-only via migration 0021;
- adiciona migration 0022 e `/api/saas/webhooks` para envelopes sem payload clínico, digest SHA-256, assinatura HMAC operacional tenant-aware, delivery ID único, replay seguro, escopo mínimo `webhook.send` e auditoria;
- adiciona migration 0023 e `/api/saas/incidents` para eventos de incidente com allowlist de componentes/códigos, severidade, correlation ID, metadata limitada, append-only e redaction;
- conecta observabilidade redigida e webhooks à Central NeuroPed OS, com estado por tenant, loading, validação, replay e ausência de persistência sensível;
- amplia os contratos, smoke SQLite/D1 mock, E2E e runbook.

## Validação local

- `npm run check`;
- `npm run lint`;
- `npm run build`;
- `npm run audit:security` com zero vulnerabilidades high/critical;
- migrations 0016–0023, FKs, triggers, idempotência, webhooks e incidentes;
- contratos SaaS/LGPD e fluxo operacional;
- separação público/clínico, política de acesso, navegação e inventário;
- browser persistence boundary sem PHI;
- E2E da Central com 20 abas, observabilidade, webhooks, filtro e persistência;
- acessibilidade integral de 55 rotas em navegador real, sem violações serious/critical;
- bundle Cloudflare Functions via Wrangler.

## Limites explícitos

O workflow não executa backup/restore, não envia e-mail, não conecta provedor externo, não imprime secrets e não altera `CLINICAL_LIVE_ENABLED`. A execução contra D1 real exige secrets/variables configurados nos environments, dados sintéticos em staging, revisão operacional e aprovação formal do controlador/encarregado. Esta implementação não constitui certificação jurídica LGPD.
