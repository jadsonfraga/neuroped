# Proteção de Branch e Catraca de CI

Este documento descreve a **catraca** (quality gate) do NeuroPed e como
configurar a proteção da branch `main` no GitHub.

## A catraca: `npm run verify`

O comando único que o CI executa em todo PR é:

```
npm run verify
```

Que encadeia, falhando no primeiro erro:

| Etapa                 | Comando                                             | O que garante                                                                                                                                           |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Segurança clínica  | `npm run validate:safety`                           | nenhuma escala nova ou alterada muda silenciosamente os bloqueios de suicídio, psicose, verbalidade ou alfabetização                                    |
| 2. Catraca de release | `npm run verify:release`                            | lint, tipos, auditoria de dependências, contratos, segurança/LGPD, catálogo, filtros, pódio ≤100, identidade, acessibilidade, design e build do cliente |
| 3. Build completo     | `npm run build`                                     | cliente e servidor compilam no ambiente de CI                                                                                                           |
| 4. Carga inicial      | `npm run test:bundle-audit && npm run audit:bundle` | o JavaScript inicial respeita o teto versionado e não antecipa chunks proibidos                                                                         |

O workflow automático correspondente é
[`.github/workflows/verify.yml`](../.github/workflows/verify.yml), disparado em
`pull_request` e em `push` para `main`, sem `continue-on-error` (gate duro). O
workflow [`.github/workflows/test.yml`](../.github/workflows/test.yml) é legado e
somente manual; ele não deve ser usado como status obrigatório da branch.

No GitHub Actions, o check real é o job:

```
TypeScript, catalog, access, identity, assets, clinical tests and build
```

Na interface de regras de branch ele pode aparecer qualificado como
`Verify NeuroPed / TypeScript, catalog, access, identity, assets, clinical tests and build`.

## Baseline

Os números de referência ficam em
[`scripts/guards/baseline.json`](../scripts/guards/baseline.json):

```jsonc
{
  "typescriptErrors": 0,
  "clinicalCasesMin": 150,
  "catalogRunnableInstruments": 203,
  "catalogRunnableReviewedWithFonte": 165,
  "catalogDocumentedInstruments": 701,
  "catalogDocumentedWithFonte": 546,
  "lighthousePerformance": null,
  "lighthouseAccessibility": null,
  "axeSeriousCriticalViolations": 0,
  "bundleMaxGzipKb": 250,
  "initialJsMaxGzipKb": 300,
  "initialJsForbiddenChunks": ["scaleFilter"],
  "designRawValues": 387,
}
```

- Para **subir** um número (ex.: mais instrumentos no catálogo), atualize o
  baseline no mesmo PR — é uma mudança consciente e revisável.
- **Reduzir** um número exige justificativa explícita no PR; a catraca falha
  automaticamente para evitar regressões silenciosas.

### Lighthouse e axe (pendente de automação)

`lighthousePerformance` e `lighthouseAccessibility` continuam como `null`
porque ainda não há browser headless no CI. A catraca de acessibilidade mantém
`axeSeriousCriticalViolations: 0`; sem browser, ela usa o fallback estático
determinístico documentado em `scripts/audit-a11y.mjs`.

## Configurar a proteção da branch `main` (GitHub)

Em **Settings › Branches › Branch protection rules › Add rule**, para `main`:

1. ✅ **Require a pull request before merging**
   - ✅ Require approvals (mínimo 1)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
2. ✅ **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - Status checks obrigatórios:
     - `TypeScript, catalog, access, identity, assets, clinical tests and build`
       (job `verify` do workflow `Verify NeuroPed`)
3. ✅ **Require conversation resolution before merging**
4. ✅ **Do not allow bypassing the above settings** (aplica inclusive a admins)

Com isso, nenhum PR entra em `main` sem `npm run verify` verde.

## Rodando localmente

```bash
npm run verify          # catraca completa
npm run test:clinical   # só os testes clínicos
npm run validate:catalog # só o validador de catálogo (regenera o doc de proveniência)
```
