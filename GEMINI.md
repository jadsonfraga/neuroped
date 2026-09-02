# NeuroPed — instruções para Gemini CLI

Este repositório é uma plataforma clínica de neuropediatria com frontend React/Vite, backend canônico em Cloudflare Pages Functions e persistência D1. Mudanças devem preservar segurança clínica, isolamento multi-tenant, LGPD e os gates de release existentes.

## Prioridades de engenharia

Sempre priorize, nesta ordem:

1. segurança e ausência de vazamento de PHI/PII;
2. autenticação, autorização e isolamento entre clínicas/tenants;
3. integridade e recuperabilidade dos dados;
4. ausência de regressão clínica;
5. billing/entitlements decididos server-side;
6. testes e observabilidade sem conteúdo clínico;
7. performance e UX;
8. novas funcionalidades somente depois dos itens estruturais.

## Arquitetura canônica

- Produção clínica: Cloudflare Pages Functions em `functions/api` + D1.
- Vercel é mirror de frontend remoto; não trate backend Express local como runtime de produção.
- `server/` existe para desenvolvimento/local e compatibilidade; uma correção somente nele não resolve um problema do runtime canônico.
- `main` é protegida. Toda alteração deve chegar via PR e passar pelos required checks.
- Clinical LIVE é fail-closed e tenant-aware. Nunca introduza fallback silencioso para DEMO ou storage local quando LIVE estiver ativo.

## Regras de dados clínicos

- Nunca use dados reais de pacientes em código, testes, fixtures, logs ou comentários.
- Fixtures devem ser obviamente sintéticas.
- PHI/PII não pode aparecer em logs, analytics, telemetry ou mensagens de erro.
- Em sessão remota LIVE autenticada, não crie persistência clínica paralela em `localStorage`, `sessionStorage`, IndexedDB, Cache API ou service worker.
- Preserve guards existentes de limpeza de cache/storage em logout, troca de conta e troca de clínica.
- Toda leitura/escrita LIVE deve ser escopada por clínica/tenant e ownership/membership conforme o domínio.
- Nunca reduza criptografia, blind indexes, key separation, retenção, legal hold, auditoria ou políticas de export/delete para simplificar uma feature.

## Segurança e autenticação

- Autorização deve ser server-side; esconder UI não é controle de acesso.
- Trate IDs de recursos como não secretos e teste IDOR/cross-tenant quando alterar CRUD.
- Não exponha, copie, imprima ou procure secrets.
- Não adicione credenciais ao repositório.
- Não altere `.env*`, certificados, chaves, tokens ou arquivos de credenciais.
- Não enfraqueça CORS, CSP, rate limits, sessão, refresh rotation ou reuse detection.

## Billing SaaS

- Preço/assentos/status não podem ser confiados ao frontend.
- Entitlements devem ser recalculados/validados no backend canônico.
- Webhooks devem permanecer autenticados, idempotentes e seguros contra eventos repetidos/fora de ordem.
- Não altere preços, plano, trial, grace period ou política comercial sem pedido explícito do owner.

## Conteúdo clínico e instrumentos

- Não invente itens, normas, pontos de corte, escores, classificações ou propriedades psicométricas.
- Instrumentos licenciados/proprietários não devem ter conteúdo reproduzido sem autorização verificável já existente no projeto.
- Resultado de escala isolado não vira diagnóstico automático.
- Preserve sentinelas de segurança clínica e separação entre relato, observação e inferência quando aplicável.
- Mudanças de conteúdo clínico substantivo devem ficar claramente marcadas para revisão humana.

## Estratégia de mudança

- Prefira mudanças pequenas e reversíveis.
- Leia implementação e testes existentes antes de criar abstração nova.
- Não duplique helpers/guards já existentes.
- Não faça refactor amplo sem necessidade para a issue.
- Não mude framework, banco, provider ou arquitetura por conveniência.
- Ao corrigir bug, adicione teste de regressão focado.
- Preserve compatibilidade local/offline quando explicitamente suportada, sem enfraquecer LIVE.

## Testes

Durante desenvolvimento, rode primeiro testes focados. Antes de um PR gerado pelo agente, o workflow executa obrigatoriamente:

```bash
npm run verify
```

Nunca:

- remova teste para fazê-lo passar;
- altere baseline para esconder regressão;
- transforme erro real em warning;
- pule teste de segurança por flakiness sem corrigir a causa.

## Áreas de alto risco

Tenha cautela extra em:

- `functions/api/live/**`
- `functions/api/auth/**`
- `functions/api/billing/**`
- `functions/api/tenants/**`
- `db/migrations/**`
- storage/browser persistence
- documentos clínicos/PDF
- assinatura digital
- escalas e filtros clínicos
- workflows de deploy

O agente acionado por issue não deve editar `.github/workflows/**`; mudanças de CI precisam de tarefa dedicada e revisão humana.

## Definição de concluído

Uma mudança só está pronta quando:

1. resolve a causa, não apenas o sintoma;
2. mantém fail-closed nas fronteiras sensíveis;
3. inclui teste de regressão quando apropriado;
4. não introduz PHI/PII em storage/logs;
5. não cria bypass multi-tenant/auth;
6. passa nos testes focados;
7. passa em `npm run verify` antes do PR.
