# Retomada do NeuroPed após reinício do ambiente

Repositório canônico: **jadsonfraga/neuroped**.
Backend de produção: Cloudflare Pages Functions + D1.
Vercel: espelho do frontend no mesmo SHA, nunca outro backend.

## Regra de retomada

Não pedir novamente owner/repo, não presumir que uma branch lembrada seja o
head de uma PR e não considerar um push perdido porque o checkout sumiu.
Consultar no GitHub o estado da PR, o head atual, o commit de merge, as
branches relacionadas e os runs. Ler `AGENTS.md` antes de alterar código.
Processos/revisões que rodavam só no contêiner não são recuperados: precisam
ser executados de novo. Sucesso administrativo de um reviewer desativado não
é revisão; código escrito não equivale a CI verde ou deploy concluído.

A retomada específica do OBS-60 está em
`docs/audits/OBS60_RECOVERY_2026-09-27.md`. A PR #1023 foi mesclada em
`90829a2b716624e87215d60ac4b636ca3c225010`. O deploy desse merge deve ser
verificado separadamente; não se pode deduzir publicação pelo merge.

## Com acesso direto ao GitHub

```sh
gh pr view 1023 --repo jadsonfraga/neuroped \
  --json state,headRefName,headRefOid,mergeCommit,url
gh repo clone jadsonfraga/neuroped neuroped
cd neuroped
cat AGENTS.md
git status --short
git rev-parse HEAD
```

Esse exemplo pressupõe destino novo. Se o diretório existir, conferir
remote e alterações locais antes de fetch/checkout; nunca apagar diretório,
executar reset destrutivo ou forçar main para recuperar um ambiente.

## Sem rede/CLI autenticado no sandbox

O workflow **Repository recovery bundle** funciona no GitHub Actions e
exporta somente código versionado/histórico alcançável. Usa `contents: read`,
checkout sem credenciais persistidas e nenhum segredo. Não altera branches
remotas, banco ou produção. Inclui quatro refs verificadas no momento da
execução: main, fonte exata da execução, branch Claude preservada e head da
PR #1023. Uma ref ausente reprova o workflow; não gera backup dito completo.

O workflow roda para mudanças deste procedimento e também pode ser acionado
manualmente depois de integrado a main. Não é backup agendado. O artifact
expira em 30 dias; o código versionado permite regenerá-lo. Antes de publicar
um novo artifact, ele verifica o bundle e faz clone offline + `git fsck` e
comparação de todos os SHAs em um diretório novo.

Baixar o artifact `neuroped-recovery-<run_id>` pelo conector GitHub, extrair
em diretório novo e verificar os hashes. O bundle permite restaurar `.git`,
não só uma pasta de arquivos:

```sh
# Dentro do diretório extraído, conferir origem/run e então os hashes.
cat manifest.json
sha256sum --check SHA256SUMS
# neuroped-restaurado precisa ser novo (não reutilizar um checkout existente).
git clone --branch recovery/source ./neuroped.bundle ../neuroped-restaurado
cd ../neuroped-restaurado
git fsck --full
git branch main refs/remotes/origin/recovery/main
git branch claude/obs-60-neuroped-module-28nyqy refs/remotes/origin/recovery/claude-obs60
git branch feat/obs60-video-evidence-20260927 refs/remotes/origin/recovery/obs60-pr1023
git remote set-url origin https://github.com/jadsonfraga/neuroped.git
cat AGENTS.md
git status --short
git log -1 --oneline
```

`recovery/source` pode ser uma PR ainda não mesclada. Para trabalhar no main
observado na captura, usar `git switch main` com worktree limpa. Conferir
refs remotas atuais antes de qualquer novo push. Os hashes detectam
alteração acidental do pacote; sua procedência vem do run autenticado, não
apenas da existência de um arquivo SHA256SUMS.

## Limites e entrega

O bundle não inclui D1, segredos, dados de pacientes, dependências instaladas,
trabalho não enviado ou processos em andamento. Não resolve falta de
permissão no console de produção e não ativa IA externa. Instalar pelo lock
com `npm ci`, executar `npm run verify` e as provas específicas aplicáveis.
Resultados de CI precisam corresponder ao SHA efetivo; também verificar a
árvore integrada quando main tiver avançado desde a revisão.

Merge e deploy exigem autorização separada. Quando o usuário reservar essas
etapas para si, entregar branch/PR, testes, bloqueios e rollback; não executar
merge nem reexecutar workflow que publique em produção.

Rollback deste procedimento: reverter somente sua PR. Nenhuma mudança em
runtime clínico, schema ou configuração de produção.
