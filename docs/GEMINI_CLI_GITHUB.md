# Gemini CLI no GitHub — NeuroPed

## Objetivo

Integrar o Gemini CLI ao ciclo do repositório sem permitir que o modelo publique diretamente em `main` ou execute deploys.

## Autenticação

Crie um repository secret chamado `GEMINI_API_KEY` em:

`Settings → Secrets and variables → Actions → New repository secret`

Use uma chave do Google AI Studio. Nunca grave a chave em arquivo, issue, PR ou variável pública.

## Programar via issue

Em uma issue do NeuroPed, somente o owner `jadsonfraga` pode acionar o agente escrevendo um comentário iniciado por:

```text
@gemini-cli
```

Exemplo:

```text
@gemini-cli corrija a causa desta issue, adicione teste de regressão e preserve todos os gates de segurança existentes.
```

O fluxo é:

1. checkout da `main` protegida;
2. instalação das dependências;
3. Gemini lê `GEMINI.md` e a issue;
4. Gemini altera somente a cópia de trabalho;
5. shell do modelo fica limitado a `npm`, `node` e `npx`;
6. mudanças em paths sensíveis são rejeitadas;
7. `npm run verify` é executado;
8. somente se o gate passar, o workflow cria `gemini/issue-<número>-<run>`;
9. faz commit/push nessa branch;
10. abre PR contra `main`;
11. a branch protection continua decidindo se o PR pode ser integrado.

O modelo não recebe `git`, `gh`, deploy CLIs ou MCP de escrita no GitHub durante a etapa de edição.

## Revisão automática de PR

PRs não-draft originados no próprio repositório recebem uma segunda revisão Gemini em modo somente leitura.

A revisão prioriza:

- auth/autorização;
- cross-tenant/IDOR;
- PHI/PII em browser ou logs;
- D1/migrations/data loss;
- billing/entitlements/webhooks;
- segurança clínica;
- regressões e lacunas de teste.

Esse review é complementar e não substitui CI ou revisão humana de conteúdo clínico/sensível.

## Restrições deliberadas

O agente de issue não pode editar:

- `.github/workflows/**`;
- `.git/**`;
- `.env*`;
- certificados/chaves;
- secrets;
- infraestrutura de produção.

Também não pode fazer deploy, merge ou push por conta própria. O push de branch e a abertura do PR são passos determinísticos posteriores ao `npm run verify`.

## Action oficial

A integração usa `google-github-actions/run-gemini-cli`, action oficial do Google, fixada por commit SHA para reduzir risco de supply-chain drift.
