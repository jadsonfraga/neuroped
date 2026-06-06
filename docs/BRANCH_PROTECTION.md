# Proteção de Branch e Catraca de CI

Este documento descreve a **catraca** (quality gate) do NeuroPed e como
configurar a proteção da branch `main` no GitHub.

## A catraca: `npm run verify`

O comando único que o CI executa em todo PR é:

```
npm run verify
```

Que encadeia, falhando no primeiro erro:

| Etapa | Comando | O que garante |
| --- | --- | --- |
| 1. Tipos | `tsc --noEmit` | **0 erros** TypeScript (baseline `typescriptErrors: 0`) |
| 2. Catálogo | `tsx scripts/guards/validate-catalog.mjs` | sem id duplicado, sem faixa etária invertida, campos obrigatórios presentes; regenera `docs/PROVENIENCIA_CLINICA.md` |
| 3. Clínico | `tsx tests/clinical/test-clinical.mjs` | ≥ 150 casos clínicos do motor de filtro (hoje **347**) sem NaN/undefined, com monotonicidade de scoreFit e não-vazamento de diários |
| 4. Baseline | `tsx scripts/guards/check-baseline.mjs` | o catálogo não encolhe (instrumentos e proveniência declarada não regridem) |

O workflow correspondente é [`.github/workflows/test.yml`](../.github/workflows/test.yml),
disparado em `pull_request` e em `push` para `main`, **sem `continue-on-error`**
(gate duro).

## Baseline

Os números de referência ficam em
[`scripts/guards/baseline.json`](../scripts/guards/baseline.json):

```jsonc
{
  "typescriptErrors": 0,
  "clinicalCasesMin": 150,
  "catalogInstruments": 565,
  "catalogWithFonte": 98,
  "lighthousePerformance": null,
  "lighthouseAccessibility": null,
  "axeSeriousCriticalViolations": null
}
```

- Para **subir** um número (ex.: mais instrumentos no catálogo), atualize o
  baseline no mesmo PR — é uma mudança consciente e revisável.
- **Reduzir** um número exige justificativa explícita no PR; a catraca falha
  automaticamente para evitar regressões silenciosas.

### Lighthouse e axe (pendente de automação)

`lighthousePerformance`, `lighthouseAccessibility` e
`axeSeriousCriticalViolations` estão como `null` porque ainda **não há browser
headless no CI**. São medidos manualmente (Chrome DevTools › Lighthouse e a
extensão axe DevTools) nas telas-chave: Home, Filtro, M-CHAT, CAA, Prontuário.
Quando forem automatizados (ex.: `@lhci/cli` + `axe-playwright`, já que
`playwright` está instalado), basta preencher estes campos e estender
`check-baseline.mjs` para compará-los.

## Configurar a proteção da branch `main` (GitHub)

Em **Settings › Branches › Branch protection rules › Add rule**, para `main`:

1. ✅ **Require a pull request before merging**
   - ✅ Require approvals (mínimo 1)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
2. ✅ **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - Status checks obrigatórios:
     - `tsc + catálogo + testes clínicos + baseline` (job do `test.yml`)
3. ✅ **Require conversation resolution before merging**
4. ✅ **Do not allow bypassing the above settings** (aplica inclusive a admins)

Com isso, nenhum PR entra em `main` sem `npm run verify` verde.

## Rodando localmente

```bash
npm run verify          # catraca completa
npm run test:clinical   # só os testes clínicos
npm run validate:catalog # só o validador de catálogo (regenera o doc de proveniência)
```
