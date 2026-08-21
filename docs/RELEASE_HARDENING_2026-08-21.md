# NeuroPed — requisitos verificáveis e homologação de release

**Data de referência:** 21 de agosto de 2026  
**Base auditada:** `main@7df7eabccf2d0aba67d7922ae72563ed76a977b5`  
**Candidato:** `hardening/release-2026-08-21`  
**Regra de publicação:** nenhuma publicação externa do candidato sem autorização explícita após todos os gates obrigatórios verdes.

## Objetivo

Transformar o relatório de hardening em critérios binários de aceite. Um item só pode ser marcado como concluído quando houver evidência automática ou revisão de código reproduzível. Não é permitido reduzir thresholds, remover testes, pular falhas ou reclassificar um gate vermelho como aprovado.

## Matriz de requisitos verificáveis

| ID | Requisito | Critério objetivo de aceite | Evidência/gate | Estado do candidato |
|---|---|---|---|---|
| R01 | TypeScript íntegro | `npm run check` retorna 0 | CI `compatibility` Node 20/24 e `verify` | Aguardando CI |
| R02 | Lint sem warnings | `npm run lint` retorna 0 | CI `compatibility` Node 20/24 | Aguardando CI |
| R03 | Dependências sem vulnerabilidade high | `npm audit --audit-level=high` retorna 0 | CI `verify-release` | Aguardando CI |
| R04 | Build frontend válido | `npm run build:client`/`verify` retornam 0 | `verify` | Aguardando CI |
| R05 | Build fullstack válido | `npm run build` retorna 0 | CI `verify-release` | Aguardando CI |
| R06 | Acessibilidade automatizada | auditoria Axe sem violações bloqueantes | `npm run verify` | Aguardando CI |
| R07 | Performance preservada | Lighthouse mantém thresholds oficiais existentes | `npm run verify` | Aguardando CI |
| R08 | Bundle clínico preservado | fronteiras de performance continuam passando | `performance-boundaries.test.mjs` | Integrado ao gate |
| R09 | Busca da Home sob demanda | catálogo clínico não entra estaticamente no critical path | teste de performance existente | Presente na base |
| R10 | Splash leve | splash usa SVG público, sem JPEG/base64 pesado no chunk | teste de performance existente | Presente na base |
| R11 | Escalas pesadas isoladas | M-CHAT/CARS/CBCL usam módulos dedicados e resultados lazy | teste de performance existente | Presente na base |
| R12 | Vídeo-EEG acessível | rota interna, `h1`, navegação explícita, sem redirect automático | `eeg-route-accessibility-static.test.mjs` | Presente na base |
| R13 | Tenant autenticado | `x-tenant-id`/`x-clinic-id` só é aceito com membership ativa do usuário | `release-contract-hardening.test.mjs` | Implementado |
| R14 | Billing fail-closed | clínica sem entitlement não obtém acesso clínico por escolha arbitrária de header | `_guard.ts` + teste estático | Implementado |
| R15 | Webhook idempotente | evento duplicado não duplica efeitos | testes/provider existentes + webhook | Presente na base |
| R16 | Webhook vincula seats ao checkout correto | pagamento usa o checkout identificado pelo próprio evento, nunca o mais recente sem vínculo | `release-contract-hardening.test.mjs` | Implementado |
| R17 | Trial permite testar multiusuário | trial preserva membros ativos + ao menos 1 vaga; nova clínica inicia com 2 seats | migration `0014` executada em SQLite real no teste | Implementado |
| R18 | Memória clínica com tabela única | leitura, escrita, edição e exclusão usam `clinical_memory_notes_demo` | `memory-search-ownership.test.ts` + hardening | Implementado |
| R19 | Exclusão LGPD efetiva | DELETE de paciente remove explicitamente memória clínica da tabela real | teste de memória + hardening | Implementado |
| R20 | Ownership da memória | profissional só pesquisa pacientes autorizados; admin mantém regra própria | `memory-search-ownership.test.ts` | Integrado à CI |
| R21 | Compatibilidade Node | check/lint/hardening passam em Node 20 e 24 | matrix CI | Aguardando CI |
| R22 | Deploy Cloudflare main-only | workflow de produção não é disparado por PR | teste hardening + workflow review | Verificado por contrato |
| R23 | Deploy Vercel main-only | workflow de produção não é disparado por PR e usa Cloudflare como backend canônico | teste hardening + workflow review | Verificado por contrato |
| R24 | Deploy GitHub Pages main-only | workflow de produção não é disparado por PR | teste hardening + workflow review | Verificado por contrato |
| R25 | Mesmo SHA nos três destinos | sentinelas de deploy precisam declarar o SHA de `main` correspondente | workflows existentes | Já verde na base; repetir após publicação autorizada |
| R26 | Homologação sem publicação | PR executa verificações completas, mas não chama deploy externo | `release-candidate-hardening.yml` | Implementado |
| R27 | Não baixar thresholds | mudanças não reduzem thresholds de Lighthouse/a11y/bundle | revisão do diff | Obrigatório |
| R28 | Candidato atualizado com main | branch deve estar 0 commits atrás da `main` antes do merge | comparação GitHub | Confirmar antes da autorização |
| R29 | PR revisável | um único PR draft contém diff, riscos, gates e regra de publicação | PR de release | Criar após consolidar branch |
| R30 | Autorização explícita | merge/publicação só após mensagem inequívoca do responsável autorizando | decisão humana | BLOQUEIO FINAL |

## Problemas reproduzidos e corrigidos nesta rodada

### 1. Memória clínica dividida entre duas tabelas

A API de escrita usa `clinical_memory_notes_demo`, mas a busca e o DELETE explícito do paciente ainda apontavam para `memory_notes`. Como as duas tabelas podem coexistir, isso não necessariamente gera erro de SQL: produz busca vazia e exclusão incompleta silenciosas.

**Correção:** busca e exclusão agora usam a mesma tabela canônica. A regressão verifica as rotas de memória e o cascade explícito de paciente.

### 2. Header de tenant tratado como contexto suficiente

Um `x-tenant-id` explícito não pode equivaler a autorização. O tenant informado agora é aceito somente se houver `clinic_memberships(user_id, clinic_id, active=1)` correspondente.

### 3. Webhook podia herdar seats de checkout não relacionado ao evento

O update da subscription buscava o checkout mais recente do customer. Com checkouts concorrentes ou troca de quantidade de assentos, um evento antigo poderia aplicar configuração de outro checkout.

**Correção:** seats são resolvidos pelo `external_reference` ou `provider_checkout_id` do próprio evento e então aplicados à assinatura.

### 4. Trial de um assento bloqueava o primeiro convite

O owner inicial já ocupa o assento 1. A migration 0014 ajusta trials existentes para `max(seats atuais, membros ativos + 1, 2)` e recria o trigger de novas clínicas com 2 seats.

## Fluxo obrigatório de homologação

1. PR draft sobre `main`.
2. Matrix Node 20/24: TypeScript, ESLint, hardening, ownership de memória.
3. Gate integral: dependências, `npm run verify`, acessibilidade, Lighthouse, build frontend e controles clínicos já existentes.
4. Build fullstack.
5. Revisão do diff e confirmação de que os workflows de produção continuam restritos à `main`.
6. Confirmar branch 0 commits atrás da `main`.
7. Somente então solicitar autorização explícita.
8. Após autorização: merge controlado em `main`.
9. Verificar sentinelas e health checks de Cloudflare, Vercel e GitHub Pages no mesmo SHA.
10. Se qualquer destino divergir de SHA ou health, release é considerada incompleta.

## Condição de liberação

**GO:** todos os R01–R29 verdes + autorização R30.  
**NO-GO:** qualquer gate técnico vermelho, branch desatualizada, divergência de SHA, ausência de health check ou ausência de autorização explícita.
