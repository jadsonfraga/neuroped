# Protocolo de Deploy Coach — NeuroPED

Documento operacional para conduzir uma mudança do pedido até a publicação
comprovada em produção, ou para inspecionar (somente leitura) o estado de
publicação de um PR/SHA já existente.

**AGENTS.md continua sendo a autoridade canônica do repositório.** Este
documento não a substitui nem a duplica: onde houver qualquer divergência
entre este arquivo e `AGENTS.md`, `AGENTS.md` prevalece. Este protocolo deve
ser lido junto com ele a cada execução, porque `AGENTS.md` pode ter mudado
desde a última vez.

## 0. Pré-condições — verificar a cada execução, nunca presumir

O ambiente de execução não é uma garantia permanente entre sessões. No
início de toda execução deste protocolo, verificar de fato (não assumir):

- `gh` CLI e/ou token do GitHub (`GH_TOKEN`/MCP `github`) — checar se está
  autenticado e com escopo para push/PR neste repositório antes de contar
  com ele.
- Cloudflare/Wrangler: só é necessário quando o modo `entregar` precisar
  inspecionar o estado de produção diretamente; a publicação em si acontece
  pelo workflow `deploy-cloudflare.yml` a partir de `main`, nunca por
  `wrangler` local.
- Chromium (`/opt/pw-browsers` ou equivalente) — só relevante se o passo
  exigir teste de navegador; confirmar presença antes de invocar, e declarar
  bloqueio externo (seção 5) se ausente, em vez de pular o teste em silêncio.
- Scripts do `package.json` citados neste documento — confirmar que ainda
  existem com `npm run <script> --help`/leitura do `package.json` antes de
  invocá-los; comandos foram conferidos em 2026-09-26 mas podem mudar.

Se qualquer ferramenta necessária estiver ausente ou sem permissão, isso é
um bloqueio externo (seção 5), não um motivo para simular sucesso ou decidir
sozinho um caminho alternativo não previsto no `AGENTS.md`.

## 1. Modos de operação

Este protocolo tem dois modos, mutuamente exclusivos. O modo é determinado
pelo primeiro argumento da invocação; se ambíguo, perguntar antes de agir.

### 1.1 `entregar <descrição concreta da mudança>`

Conduz uma mudança de código do início até deploy comprovado em produção.
Sequência obrigatória:

1. **Escopo único.** Uma mudança, um domínio, conforme a Política de PRs do
   `AGENTS.md`. Recusar (e sinalizar ao usuário) descrições que impliquem
   múltiplos domínios não relacionados.
2. **Issue rastreadora.** Localizar uma issue existente que descreva a
   mudança ou abrir uma nova antes do PR. O PR final referencia essa issue.
3. **Branch e commits.** Nunca commitar direto em `main`. Commits claros,
   sem `--no-verify`, sem pular hooks.
4. **Implementação com testes próprios.** A mudança precisa de teste que a
   cubra; não é aceitável ampliar apenas o escopo mínimo do pedido.
5. **Gate local antes de push.** Rodar, no mínimo, o que for pertinente ao
   escopo tocado (`npm run check`, `npm run lint`,
   `npm run test:quick-wins`, testes clínicos relevantes) e, quando o PR for
   candidato a merge em `main`, `npm run verify` completo — é o mesmo gate
   que o workflow `verify.yml` roda como *status check* obrigatório
   (`TypeScript, catalog, access, identity, assets, clinical tests and
   build`, ver `docs/BRANCH_PROTECTION.md`). Nunca reportar verde sem ter
   executado e sem citar comando + código de saída real.
6. **Migração D1, se houver.** Somente SQL suportado por SQLite/D1, apenas
   forward-only, nova migração numerada — nunca editar migração já aplicada
   em algum ambiente. Declarar compatibilidade (a migração pode conviver com
   a versão anterior do código durante o intervalo entre migrar e fazer
   deploy) e o inverso (como reverter o efeito, se aplicável).
7. **Rollback documentado.** Todo PR desta esteira registra, no corpo do PR:
   como reverter o código (revert do merge commit) e, separadamente, como
   reverter a migração/dado se ela não for trivialmente compatível com o
   código anterior.
8. **Abrir PR.** PR pequena, atômica, com plano de rollback, vínculo com a
   issue e testes próprios — nunca PR monolítica multi-domínio.
9. **Somente após merge em `main`:** o deploy é disparado pelo workflow
   `deploy-cloudflare.yml`. Este protocolo nunca substitui esse workflow por
   `wrangler pages deploy` manual nem por outro caminho de publicação.
10. **Prova de deploy publicado** — ver seção 2. Sem essa prova, a entrega
    não está pronta, independentemente do status do workflow.

### 1.2 `monitorar <PR ou SHA>`

Modo **somente leitura**. Objetivo: relatar o estado real de publicação de
um PR ou commit já existente.

Neste modo é proibido, sem exceção:

- Editar qualquer arquivo do repositório.
- Fazer merge, aprovar, ou mudar o estado do PR.
- Re-executar (`re-run`) jobs ou workflows.
- Disparar deploy por qualquer via (push, `workflow_dispatch`, `wrangler`).

O modo `monitorar` apenas lê: status do PR, checks do commit (incluindo o
status `NeuroPed / Cloudflare production`, publicado por
`report-cloudflare-status` em `deploy-cloudflare.yml`), o conteúdo publicado
de `https://neuroped.pages.dev/deploy-check.json` e, quando pertinente, o
resultado de `/api/health`. Reporta o que encontrar; qualquer ação corretiva
fica para uma execução em modo `entregar`, sob autorização do usuário.

## 2. Prova de deploy publicado — os quatro elementos

Um `run` de `deploy-cloudflare.yml` **concluído com sucesso nunca é, por si
só, prova de publicação correta** — ele já inclui os próprios gates de
verificação (ver `.github/workflows/deploy-cloudflare.yml`), mas a
comprovação externa (o que este protocolo exige checar de fora do run) só
está completa quando os quatro itens abaixo coincidem, todos para o **mesmo
commit**:

1. **SHA local** — o commit que se pretende ter publicado (`git rev-parse
   HEAD` do merge em `main`, ou o SHA informado a `monitorar`).
2. **Run concluído** — o job `deploy-cloudflare` do workflow
   `Deploy Cloudflare Pages` para esse SHA terminou com `conclusion:
   success`. Um run `cancelled`, `in_progress`, `queued` ou `failure` nunca
   é tratado como sucesso por inferência, mesmo que um `report-cloudflare-status` para o mesmo commit exista com outro resultado; usar
   sempre a execução mais recente e conferir seu status literal.
3. **Sentinela pública** — `GET
   https://neuroped.pages.dev/deploy-check.json` responde e seu campo
   `commit` é igual ao SHA do item 1 (o workflow também expõe `run_id` e
   `run_number` nesse arquivo; usá-los para casar exatamente com o run do
   item 2, não apenas o SHA).
4. **Fluxo alterado testado no domínio publicado** — não apenas
   `/api/health` genérico: exercitar manualmente (ou via teste automatizado
   apontando para `https://neuroped.pages.dev`) o comportamento específico
   que a mudança introduziu ou corrigiu, e confirmar que o resultado é o
   esperado nesse domínio.

Só reportar "deploy concluído" ao usuário quando os quatro itens forem
verificados nesta execução. Um run cancelado, um `deploy-check.json` com SHA
antigo, ou a ausência do teste do item 4 significam que a entrega **não**
está pronta — reportar exatamente o que falta, não arredondar para "ok".

## 3. Limpeza de artefatos sem perda de trabalho

Ao final de qualquer execução (`entregar` ou `monitorar`), a árvore de
trabalho deve ficar limpa — mas "limpa" nunca significa apagar algo que já
existia antes desta execução começar.

- No início da execução, registrar o estado inicial (`git status
  --porcelain`, branch atual, stash existente).
- Ao final, restaurar apenas o que a própria execução gerou de incidental
  (arquivos temporários de teste, builds locais não commitados por esta
  execução) — comparando explicitamente contra o estado inicial registrado.
- Nunca rodar limpeza global (`git clean -fdx`, `git checkout -- .`, `git
  reset --hard`) sem antes conferir, item a item, que nada do que será
  descartado é anterior a esta execução. Na dúvida, preservar (mover para
  fora do caminho versionado) em vez de apagar.

## 4. Bloqueios externos

Quando qualquer passo deste protocolo exigir permissão, segredo ou console
externo que não está disponível nesta execução, não fingir conclusão nem
devolver a decisão ao usuário sem registro: seguir a seção "Bloqueios
externos" do `AGENTS.md` — criar/atualizar um arquivo
`docs/audits/BLOCKED_EXTERNAL_<NOME>.md`, no formato já usado no repositório
(tabela com sistema/acesso necessário, ação que falta, risco de não
executar, como verificar a conclusão — ver exemplos existentes em
`docs/audits/BLOCKED_EXTERNAL_*.md`). Um registro apenas local (não commitado
no repositório) não conta como bloqueio declarado — ele precisa estar
publicado para valer como auditoria.

## 5. Definição de pronto

Uma entrega feita por este protocolo só é "pronta" quando, além da
Definição de Pronto do `AGENTS.md`, também vale:

- Os quatro elementos da seção 2 foram verificados para o commit final.
- Rollback e compatibilidade de migração (seção 1.1, item 6–7) estão
  documentados no PR, não apenas na cabeça de quem executou.
- Todo bloqueio externo encontrado está registrado por escrito conforme a
  seção 4 — nunca apenas mencionado em conversa.

## 6. Proibições explícitas desta esteira

- Nunca declarar deploy concluído a partir de um run `cancelled` ou de um
  status check que não corresponde ao SHA final.
- Nunca usar `wrangler pages deploy` manual, `db:push` externo, ou qualquer
  caminho de publicação fora de `deploy-cloudflare.yml` a partir de `main`.
- Nunca editar uma migração já aplicada em qualquer ambiente — sempre nova
  migração forward-only.
- Nunca, em modo `monitorar`, executar qualquer ação com efeito (merge,
  re-run, deploy, edição).
- Nunca apagar arquivos ou estado preexistente à execução em nome de
  "limpeza".
