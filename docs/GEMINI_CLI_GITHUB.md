# Gemini CLI no GitHub — NeuroPed

## Objetivo

Integrar o Gemini CLI ao ciclo do repositório sem permitir que o modelo publique diretamente em `main`, acesse credenciais Git durante a fase de IA ou execute deploys.

## Autenticação

Crie um repository secret chamado `GEMINI_API_KEY` em:

`Settings → Secrets and variables → Actions → New repository secret`

Use uma chave do Google AI Studio. Nunca grave a chave em arquivo, issue, PR ou variável pública.

Enquanto esse secret não existir, os workflows Gemini permanecem instalados porém inativos de forma segura: o revisor de PR não bloqueia o CI e o agente de issue não modifica código.

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

1. confirma que `GEMINI_API_KEY` está configurada;
2. faz checkout da `main` protegida com `persist-credentials: false`;
3. instala as dependências necessárias ao gate posterior;
4. Gemini lê `GEMINI.md` e o contexto da issue;
5. Gemini altera somente a cópia de trabalho usando ferramentas de leitura/escrita de arquivos;
6. o modelo não recebe shell, `git`, `gh`, rede, deploy CLI, cloud CLI ou MCP GitHub de escrita;
7. mudanças em paths sensíveis são rejeitadas por etapa determinística;
8. Chromium real é instalado fora da fase de IA;
9. `npm run verify` é executado fora da fase de IA;
10. somente se o gate passar, uma etapa determinística cria `gemini/issue-<número>-<run>` e faz commit/push;
11. o workflow tenta abrir PR contra `main`;
12. se a política do GitHub bloquear PRs criados por `github.token`, a branch validada é preservada e a issue recebe o link de comparação;
13. a branch protection continua decidindo se a mudança pode ser integrada.

As credenciais de Git/GitHub só são disponibilizadas após a fase Gemini ter terminado e após o gate de release passar.

## Revisão automática de PR

PRs não-draft originados no próprio repositório recebem uma segunda revisão Gemini em modo somente leitura quando `GEMINI_API_KEY` está configurada.

Antes da análise, uma etapa determinística materializa o diff do PR. O Gemini recebe apenas ferramentas de leitura do repositório — sem shell e sem escrita — e trata título, corpo, código e diff como dados não confiáveis para análise, não como instruções operacionais.

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

O modelo também não pode fazer deploy, merge, push, commit ou criar branches por conta própria. Git e GitHub aparecem apenas em etapas determinísticas posteriores ao `npm run verify`.

## Proteções adicionais

- `GEMINI.md` define a arquitetura canônica e as regras de segurança do NeuroPed.
- `.geminiignore` exclui workflows, segredos, bancos locais, artefatos e estado local do contexto normal.
- `.gemini/` e credenciais temporárias são ignoradas pelo Git.
- A Action oficial e a versão do Gemini CLI ficam fixadas para reduzir drift de supply chain/comportamento.
- A ausência da credencial opcional não deixa os PRs vermelhos.

## Action oficial

A integração usa `google-github-actions/run-gemini-cli`, action oficial do Google, fixada por commit SHA para reduzir risco de supply-chain drift. O Gemini CLI também está fixado na versão validada pelo workflow, em vez de usar `latest` silenciosamente.
