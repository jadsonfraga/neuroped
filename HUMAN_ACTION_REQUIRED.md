# HUMAN ACTION REQUIRED

## Única ação externa bloqueante: ativar proteção servidor-side de `main`

**Por quê:** a API observada do GitHub reporta `main.protected=false`. A credencial conectada possui administração do repositório, mas o conector disponível nesta sessão não expõe criação/edição de ruleset ou branch protection. Alterar YAML no repositório não substitui essa proteção.

### Ação única

No GitHub, abrir `jadsonfraga/neuroped` → **Settings → Rules → Rulesets → New branch ruleset** e criar um ruleset **Active** chamado `main-production`, direcionado somente à default branch `main`, com:

- Pull Request obrigatório antes de merge;
- branch atualizada antes do merge (`strict`/require branch to be up to date), quando o GitHub oferecer essa opção para os status checks;
- resolução de todas as conversations obrigatória;
- deleção de `main` bloqueada;
- force push bloqueado;
- push direto bloqueado;
- bypass list vazia, salvo exceção futura explicitamente documentada;
- required status checks que rodam em todo PR para `main`:
  - `Verify NeuroPed` — job `TypeScript, catalog, access, identity, assets, clinical tests and build`;
  - `Test, Lint & Build` — usar o agregador final `require-checks`;
  - `PR Check` — job `Build & Lint`;
  - `No password regression` — job `App opens without access password`;
  - `Filter and scales spiral audit` — job `Filter, scales, aesthetics and lifecycle contracts`.

Não tornar required nenhum workflow que só execute depois do merge/push em `main` ou que tenha filtro de paths que possa fazer o check não existir em um PR arbitrário.

### Prova necessária depois da ação

1. API GitHub deve deixar de reportar `protected=false`/ruleset ausente para `main`.
2. Uma tentativa segura e descartável de push direto a `main` deve ser rejeitada pelo servidor.
3. Merge deve continuar possível exclusivamente via PR com os required checks verdes.

Enquanto essas três provas não existirem, **P0 #584 permanece aberto** e `PILOT_READY` deve permanecer `NO`.
