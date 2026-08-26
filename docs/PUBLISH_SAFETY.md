# NeuroPed — Publicação segura e recuperação do estado-fonte

## Objetivo

Toda implementação deve possuir um artefato recuperável antes de ser publicada. O fluxo local do NeuroPed agora separa duas garantias: **preservar os bytes do estado-fonte** e **verificar antecipadamente se a instalação GitHub pode publicar o delta**, especialmente quando ele altera `.github/workflows/`.

> O preflight falha fechado. Ele não faz `fetch`, commit, push ou merge; apenas verifica uma revisão já preparada.

## Fluxo recomendado

Depois de atualizar a referência remota e criar uma branch de trabalho baseada no `main`, implemente e faça o commit normalmente. Em seguida, execute a selagem e preserve o diretório de saída fora do checkout:

```bash
git fetch --prune origin main
git switch -c feat/nome-da-melhoria origin/main
# implementar, testar e criar o commit
npm run source-state:seal -- --base origin/main --label nome-da-melhoria
```

O comando cria, por padrão, um diretório irmão `.neuroped-state/` com um `source-state.bundle`, um `source-state.patch`, o manifesto, refs, reflog, resultado do `fsck`, status do worktree, estatísticas do delta e a verificação do bundle. O diretório é ignorado pelo Git, mas deve ser copiado para armazenamento durável antes do push. O manifesto inclui o SHA do `HEAD`, o SHA da base, a branch, a origem remota, o estado do worktree, os arquivos não rastreados e hashes SHA-256 dos artefatos.

Depois da selagem, execute o preflight apontando para o diretório gerado:

```bash
npm run publish:preflight -- \
  --base origin/main \
  --state-seal ../.neuroped-state/neuroped-...
```

Somente se o resultado for `PREFLIGHT_RESULT=PASS` a branch pode ser publicada e o PR pode ser aberto. A ordem explícita evita que a ausência de permissão seja descoberta depois de um trabalho local desaparecer ou depois de uma tentativa de push parcialmente diagnosticada.

## O que o preflight verifica

| Controle | Comportamento |
|---|---|
| Identidade da branch | Rejeita `main`, `master` e estado detached. |
| Base | Exige que a base informada seja ancestral do `HEAD`; a base deve ser atualizada antes da selagem. |
| Delta | Exige pelo menos um commit além da base e lista os arquivos alterados. |
| Worktree | Rejeita alterações não commitadas ou arquivos não rastreados. |
| Snapshot | Exige `manifest.json` e `source-state.bundle`, confere branch, `HEAD`, base e hash SHA-256, e executa `git bundle verify`. |
| Permissões básicas | Consulta a instalação GitHub correspondente ao `origin` e exige `contents: write` e `pull_requests: write`. |
| Workflows | Se algum arquivo em `.github/workflows/` mudou, exige também `workflows: write`; não há fallback silencioso. |
| Segredos | Emite somente conta, repositório, SHAs, nomes de arquivos e nomes de permissões; nunca imprime token, senha ou valor secreto. |

A ausência de `workflows: write` não bloqueia um delta que não toca workflows, mas aparece no diagnóstico do ambiente e bloqueia qualquer delta que contenha alterações em `.github/workflows/`. A permissão de ações habilitadas no repositório não substitui essa permissão granular.

## Recuperação

Se a sessão for interrompida depois da implementação, o bundle preserva os objetos alcançáveis pelas refs no momento da selagem e o patch preserva alterações rastreadas e arquivos não rastreados. Para recuperar uma revisão em outro checkout, verifique primeiro o manifesto e os hashes; depois use o bundle em um repositório descartável e compare o delta com a base atual. O bundle não deve ser commitado no repositório de produção.

Se a selagem for executada com alterações não commitadas, o patch ainda será produzido para diagnóstico, mas o manifesto marcará o worktree como sujo e o preflight recusará a publicação. Isso é intencional: a recuperação pode existir sem transformar uma revisão incompleta em branch publicada.

## Contratos automatizados

O contrato está em `tests/unit/publish-safety.test.mjs`. Ele é executado por `npm run test:publish-safety` e por `preverify:release`, antes do conjunto pesado de verificações de release. O contrato valida que a captura contém bundle, patch, refs, reflog, `fsck`, manifesto e hashes, e que a publicação exige a permissão `workflows: write` apenas quando o delta realmente contém workflows.

## Diagnóstico esperado

Um resultado bem-sucedido contém linhas como:

```text
PREFLIGHT_REPOSITORY=jadsonfraga/neuroped
PREFLIGHT_BRANCH=feat/nome-da-melhoria
PREFLIGHT_HEAD=<sha>
PREFLIGHT_BASE=<sha>
PREFLIGHT_WORKFLOWS_CHANGED=false
PREFLIGHT_RESULT=PASS
```

Um bloqueio deve ser tratado como diagnóstico acionável, não contornado manualmente. Exemplos são `snapshot não corresponde ao HEAD atual`, `worktree sujo`, `a base não é ancestral do HEAD` e `permissões GitHub insuficientes: workflows: write`.
