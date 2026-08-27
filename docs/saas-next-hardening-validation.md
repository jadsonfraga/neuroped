# Validação — operação segura NeuroPed OS

## Escopo

Esta rodada fecha inconsistências contra o critério de aceite da fase operacional. A Central passou a operar com estados de mutação, rollback, reenvio de convites, editor versionado de retenção, postura de keyring e idempotência de integrações.

## Resultado dos gates

| Gate | Resultado | Evidência |
| --- | --- | --- |
| TypeScript strict | Passou | `npm run check` |
| Lint global | Passou | `npm run lint` com zero warnings |
| Migrations 0016–0020 | Passou | `npm run test:saas-migrations` |
| Contrato de hardening | Passou | `npm run test:saas-hardening` |
| Fluxos SQLite/D1 mock | Passou | `npm run test:saas-operational` |
| Build frontend/backend | Passou | `npm run build` |
| Bundle Cloudflare Pages Functions | Passou | `npx --yes wrangler@4 pages functions build functions --outdir=/tmp/next-pages-functions-check` |
| Segurança de dependências | Passou | `npm run audit:security`, zero vulnerabilidades high/critical reportadas |
| Separação pública/clínica | Passou | `npm run validate:public` |
| Política de acesso | Passou | `npm run audit:access` |
| Inventário de rotas e páginas | Passou | `npm run audit:inventory` |
| Navegação | Passou | `npm run audit:navigation` |
| Smoke E2E da Central | Passou | `npm run test:e2e:saas`, 20 abas, filtro, interação e persistência |
| Acessibilidade integral | Passou | `npm run audit:a11y:full`, 55 rotas, zero violações serious/critical |
| Zero PHI browser-side | Passou | policy, boundary, diário e previsit guards |

## Correções verificadas

A API de readiness agora exige as tabelas operacionais até a migration 0020, diferencia `readyForProduction` de `eligibleForClinicalEnablement` e retorna ações corretivas por gate. O keyring expõe apenas postura, versão e falhas de configuração, verificando também a separação da `OPERATIONAL_DATA_KEY` em relação às chaves clínicas e ao índice cego.

A aba Acessos possui reenvio controlado: o convite anterior é revogado, o novo token é de uso único, a URL é devolvida somente naquela resposta e a listagem continua exibindo apenas prefixo de hash. A aba LGPD possui editor de dias de retenção, purge mode, enabled e legal hold com versão otimista e rollback local em erro. Todas essas mutações apresentam estado de processamento e desabilitam duplicação.

A API de integrações exige `X-Idempotency-Key`, guarda somente hash do request e resposta operacional sem credencial, devolve replay idêntico para a mesma chave/payload e rejeita reuso com payload diferente. O catálogo declara redaction, tenant scope, assinatura e janela anti-replay. A referência de secret manager não é devolvida em endpoints de leitura.

## Limites restantes

A validação comprova os contratos de software e o comportamento local. Ela não executa backup/restore real, não configura KMS/secret manager, não envia e-mail, não conecta um provedor externo e não autoriza go-live automático. Esses passos continuam dependentes de staging, dados sintéticos, credenciais reais fornecidas pelo operador e aprovação formal do controlador/encarregado.
