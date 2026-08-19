# Auditoria profunda do NeuroPed — 2026-08-19

## Escopo e linha de base

Auditoria iniciada sobre o repositório `jadsonfraga/neuroped`, branch `main`, commit inicial `f551b271`. O checkout estava alinhado com `origin/main`, com um único arquivo não rastreado herdado da publicação anterior: `docs/DEPLOY_CLOUDFLARE_2026-08-19.md`.

## Achados preliminares

| ID | Área | Evidência | Estado |
|---|---|---|---|
| BASE-001 | CI / documentação | Em `.github/workflows/verify.yml`, a etapa se chama `Configure Node.js 20`, mas `actions/setup-node` usa `node-version: "24"`. Isso podia induzir diagnóstico errado e divergia de workflows antigos. | Corrigido |
| BASE-002 | Artefatos locais | O checkout contém banco SQLite local e arquivos WAL/SHM, mas eles são ignorados pelo Git. | Encerrado: `git ls-files` não encontrou bancos rastreados e `.gitignore` cobre `.db`, WAL, SHM, SQLite e SQLite3. |
| BASE-003 | Publicação | Existia um documento de deploy não rastreado criado na sessão anterior. | Corrigido: o documento foi preservado como `docs/DEPLOY_CLOUDFLARE_2026-08-19.md` e será versionado com a publicação. |

A auditoria seguirá pelos contratos de segurança, autenticação, APIs, persistência, frontend, build e workflows; cada achado será reproduzido antes de qualquer correção.


| ID | Área | Evidência | Estado |
|---|---|---|---|
| BASE-004 | Artefatos gerados | A execução de `npm run verify` modifica artefatos derivados de build. O fallback local de acessibilidade também pode substituir o relatório real quando Chromium não está instalado. | Corrigido: `sw-build.js` e `_buildInfo.ts` são regenerados para o commit final; o relatório `a11y-report.json` real não é sobrescrito pelo fallback local. |
| BASE-005 | Performance / assets | Havia assets rastreados acima de 2 MB, incluindo o logo infantil e imagens clínicas. | Corrigido/aceito com evidência: auditorias de assets, Lighthouse, bundle e carregamento lazy passaram; os arquivos não entram no JS inicial. |
| BASE-006 | Segredos versionados | A busca por padrões sensíveis encontrou apenas `.env.example`; bancos locais e `dist/` estão ignorados. | Encerrado: busca adicional não encontrou segredo operacional versionado. |

### Segurança e persistência — primeira passagem

| ID | Área | Achado | Severidade | Ação |
|---|---|---|---|---|
| SEC-001 | Agenda / criptografia | `server/routes/booking-adapter.ts` monta `OPERATIONAL_DATA_KEY` com fallback para `NEUROPED_MASTER_KEY` e depois `NEUROPED_JWT_SECRET`. Isso mistura chave de assinatura de sessão com chave de dados operacionais e permite uma configuração silenciosamente fraca. | Alta | Fazer a Agenda exigir chave operacional dedicada, com mensagem/configuração fail-closed e teste de regressão. |
| SEC-002 | Cloudflare JWT | `functions/api/auth/_crypto.ts:verifyJwt` valida assinatura e expiração quando presente, mas não valida explicitamente cabeçalho `alg`/`typ`, claims obrigatórias, `issuer`/`audience` e aceita payload sem `exp`. O middleware complementa parte disso com `type` e família de sessão, mas há divergência de contrato com o JWT Express. | Média/Alta | Unificar contrato JWT ou endurecer o verificador Cloudflare com claims obrigatórias e validação temporal, adicionando regressão. |
| SEC-003 | Autenticação cross-runtime | Express exige `issuer`/`audience` e assina JWT sem `type`; Cloudflare assina com `type`/`sid` e sem `issuer`/`audience`. Tokens não são interoperáveis entre runtimes, embora compartilhem `NEUROPED_JWT_SECRET`. | Alta | Decidir contrato canônico compartilhado e alinhar emissor/verificador, preservando sessões Cloudflare e Express. |
| SEC-004 | Documentos clínicos | A implementação `functions/api/documents/index.ts` aparenta ser um endpoint demo, com tabela `documents_demo`, `is_demo: true`, texto livre e sem rotas imutáveis de arquivo/verificação; diverge da rota Express permanente `clinical_documents`. | Alta | Confirmar se a rota Cloudflare é alcançável em produção. Se for, substituir por contrato fail-closed/compatível ou retirar a superfície demo de produção. |
| SEC-005 | Limite de senha | Teste de assinatura P12 contém senha literal marcada como `neuroped-test-only`; não é segredo de produção, mas deve permanecer claramente isolado em fixture e coberto por guard para não ser confundido com credencial real. | Baixa | Validar contexto do teste; não expor/usar em runtime. |

## Segunda passagem — segurança e persistência clínica

### Achados corrigidos

| ID | Severidade | Achado | Correção e evidência |
|---|---|---|---|
| SEC-001 | Alta | A Agenda podia reutilizar a chave JWT como fallback da chave operacional. | Removido o fallback; `OPERATIONAL_DATA_KEY` agora é dedicado e o adaptador Express responde 503 configuracional sem a chave. Regressões da Agenda executadas. |
| SEC-002 | Alta | JWT Cloudflare aceitava tokens sem vínculo completo de sessão e havia divergência de claims entre runtimes. | Validação de `alg`/`typ`, `iss`, `aud`, `type`, tempo, `sid` obrigatório e `jti` obrigatório para refresh; emissões foram alinhadas. Regressões de auth passaram. |
| SEC-003 | Alta | A Function Cloudflare de documentos ainda representava persistência demo. | Substituída por fail-closed explícito (`503`, `CLINICAL_DOCUMENTS_BACKEND_UNAVAILABLE`) para não confirmar arquivamento clínico inexistente no runtime Pages. |
| DATA-001 | Alta | `POST /api/documents` aceitava arquivo pendente e podia registrar hash enviado pelo cliente; `/verify` comparava apenas hashes no banco. | Confirmação de upload agora baixa o objeto e calcula SHA-256 no servidor; documentos exigem `file.sha256`; verificação recalcula digest, tamanho e MIME no storage. |
| DATA-002 | Média | Um PDF ligado ao paciente A podia ser arquivado declarando paciente B. | Adicionado bloqueio `PATIENT_FILE_MISMATCH` e teste estático de contrato. |

### Regressões executadas após as correções

`npm run check`, regressões de autenticação Cloudflare, limites de entrada, ausência de escrita clínica falsa, `file-storage-race-regression`, `test:clinical-documents` e o teste estático de workflows clínicos passaram. Em ambiente sem storage configurado, a verificação de documento responde 503 e nunca declara integridade confirmada.

### Observação operacional

A validação server-side do digest lê o objeto completo do bucket para PDFs e demais arquivos confirmados. O limite atual de upload é 50 MB, portanto a operação é limitada, porém deve ser monitorada em produção para objetos grandes ou conexões lentas.

## Status da auditoria

A linha de base, segurança, autenticação, persistência clínica e regressões direcionadas foram auditadas. Permanecem as passagens de frontend, build/CI, bateria integral, dupla validação e publicação.

### Achado frontend DATA-003

O cliente `filesClient.ts` calculava SHA-256 completo no navegador e enviava o valor no endpoint de confirmação, embora o backend já tivesse sido corrigido para ignorar hashes do cliente e calcular o digest no objeto real do storage. Isso criava custo duplicado e uma falsa impressão de que a integridade dependia do navegador. O cálculo foi removido; o cliente agora confirma o upload com payload vazio e consome o digest retornado pelo servidor. `npm run check`, lint direcionado, `pdf-clinical-workflows-static` e `file-storage-race-regression` passaram após a alteração.


## Terceira passagem — frontend, rotas, build e CI

A política de acesso foi reavaliada contra todas as rotas registradas em `client/src/App.tsx`. As rotas `/conecta` e `/agenda` estavam protegidas no componente, mas não classificadas explicitamente no inventário de política; ambas foram incluídas em `SENSITIVE_ROUTES`. A rota educativa `/brincando-e-aprendendo` foi incluída na allowlist pública e no contrato de separação pública/clínica, sem abrir descendentes clínicas. A catraca `OPEN_ACCESS` deixou de depender de literal global e passou a ser opt-in por `VITE_OPEN_ACCESS=true`, com padrão fechado e constante de build-time injetada pelo Vite.

O build revelou uma regressão objetiva de orçamento causada pela remoção do literal aberto, pois a política segura precisa permanecer no bundle quando a configuração é dinâmica. O entrypoint mediu 116,78 KB gzip e o JavaScript inicial real 175,45 KB gzip. Os limites foram revisados de forma estreita para 118/178 KB, mantendo os tetos de chunk tardio em 1.240 KB bruto e 320 KB gzip; o auditor passou a aprovar o build sem remover a proteção contra crescimento futuro. O build final também passou nos gates de PIN incorporado e shell offline.

Os workflows especializados de Mutismo Seletivo, PDF/CAA e escalas/PDF usavam Node 20 ou 22 enquanto o projeto declara Node `>=20` e o restante do CI estava em Node 24. Eles foram padronizados em Node 24 com `actions/setup-node@v6`; o workflow Cloudflare também define `VITE_OPEN_ACCESS=false` explicitamente. A documentação do Bridge BoaConsulta e o comentário do cliente de arquivos foram atualizados para não afirmar que o modo aberto é padrão nem que o navegador calcula o digest.

## Regressões adicionais executadas

A segunda bateria de validação executou buscas direcionadas por literais de acesso aberto, gravação clínica simulada, fallback entre segredo JWT e chave operacional, referências não classificadas a `documents_demo` e cálculo de digest no cliente. As únicas referências legadas a `documents_demo` permanecem na documentação do endpoint fail-closed e na exclusão condicionada `is_demo = 1` durante remoção de paciente; não há criação ou leitura clínica falsa no runtime. Passaram novamente `route-guard-policy`, `validate:public`, `guard:open-access` e `test:quick-wins`.

A bateria integral `VITE_OPEN_ACCESS=false npm run verify` passou localmente, incluindo lint, TypeScript, testes clínicos, auditorias de segurança, acessibilidade, design, Lighthouse/fallback de bundle, build do cliente, auditoria de PIN, shell offline e baseline do catálogo. O ambiente local não tinha Chromium para a auditoria visual completa; por isso o relatório Axe versionado anterior foi preservado e o resultado local foi tratado como fallback estático, não como substituto de uma medição remota.

## Status atualizado

A auditoria local encontra-se verde. Restam a validação no GitHub Actions, a publicação no Cloudflare Pages e a verificação dos endpoints e assets no domínio canônico após o deploy. Nenhuma publicação ou alteração remota de dados clínicos será considerada válida apenas por sucesso de build; o sentinel de deploy, headers e respostas fail-closed dos endpoints serão conferidos separadamente.

### Falha remota encontrada e corrigida — landmark da experiência educativa
A primeira validação remota do commit `f6ed2005` concluiu com sucesso os gates canônicos, o deploy Cloudflare, Vercel, GitHub Pages, D1 e contratos operacionais, mas o workflow de espiral de frontend falhou no Axe com três violações moderadas em `/#/brincando-e-aprendendo`: `landmark-main-is-top-level`, `landmark-no-duplicate-main` e `landmark-unique`. A causa foi objetiva: a página educativa já possui `header`, `<main>` e `footer` próprios, mas estava montada dentro do `<main id="main-content">` do `Layout` clínico. A rota foi separada do shell clínico no `AppRouter`, preservando o `RouteGuard`/`PrivateGate` global para rotas privadas e mantendo a experiência pública como microsite autônomo. Foi adicionada regressão estática para impedir o retorno da rota para dentro do `Layout`. `node tests/unit/quick-wins-static.test.mjs`, `npm run check`, `npm run test:quick-wins` e o `npm run verify` completo passaram localmente após a correção. O commit corretivo aguarda o novo ciclo remoto de Axe e deploy.

### Evidência remota do primeiro ciclo
No commit `f6ed2005`, `Verify NeuroPed`, `Test, Lint & Build`, `No password regression`, `NeuroPed Operational Suite D1 migration`, `Deploy Vercel`, `Deploy GitHub Pages` e `Deploy Cloudflare Pages` concluíram com sucesso. O único resultado negativo foi o workflow `Filter and scales spiral audit`, restrito ao Axe integral da rota educativa; nenhum erro clínico, de autenticação, build, migração ou publicação foi observado nesse ciclo.

## Status de correção do landmark
A validação local permanece verde e o segundo ciclo remoto será usado para confirmar a correção no navegador real do runner, seguido da inspeção do domínio canônico e do sentinel de publicação.
