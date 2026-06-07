# NeuroPed Deploy Log

## 2026-06-07

Deploy trigger after sidebar reorganization, pre-consultation flow, reception panel, PIN hardening and local 100-scale registry publication.

## 2026-06-07 — Access review

Rebuild trigger after access-flow review. Full route-level access refactor must be applied from the repository development environment because direct connector changes to global gate behavior were blocked by tool safety controls.

## 2026-06-07 — Visual premium consolidation

Rebuild trigger after consolidating the premium visual asset cycle: new master shield logo, controlled image usage, `PremiumVisualPanel`, refined copy for pre-consultation, reception, parent portal and psychiatry guide, and documented asset governance.

## 2026-06-07 — Forced build/deploy trigger

Manual rebuild trigger requested after visual consolidation. Expected GitHub Actions workflow: `Deploy NeuroPed` on push to `main`, running `npm ci`, `npx vite build`, artifact upload and GitHub Pages deploy.

## 2026-06-07 — PR conflict audit and deployment trigger

Open PRs #365, #367, #368, #369 and #370 were inspected and direct merge was attempted from GitHub. Each merge attempt returned `Pull Request has merge conflicts`, so they were not merged into `main` from this connector session.

Current deploy trigger records the latest safe `main` state after the NeuroPed 9.9 partial implementation, including:

- global `PasswordGate` removed from `main.tsx`;
- route-aware local unlock logic;
- `accessPolicy.ts` and `SensitiveRouteGate.tsx` created;
- `shareText.ts` created;
- `/pre-retorno` implemented, registered in `App.tsx` and added to navigation;
- `/efeitos-colaterais` placeholder created but not yet registered due connector safety blocks.

Next required local step: resolve PR conflicts in Codex/Cursor, then rerun build/check/catalog/clinical tests before merging visual PRs.
