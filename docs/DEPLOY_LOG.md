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

## 2026-06-07 — PRs 365–370 resolved by consolidation

Resolved the blocked PR set by safe consolidation instead of blind conflict merges.

Merged into `main`:

- #376: consolidated the functional clinical-flow core from #365 (`GenericScale.tsx`, `SaveToPatient.tsx`).
- #377: consolidated semantic visual cards in the clinical filter from #368.
- #378: hardened clinical report generation from #365 (`ClinicalReport.tsx`), removing auto-send and preventing empty PDF/email output.

Closed as superseded:

- #365, #367, #368, #369 and #370.

Deployment trigger commit: force GitHub Actions workflows on `push` to `main` after the consolidation sequence. Expected workflows:

- `.github/workflows/deploy.yml` — GitHub Pages build and deploy.
- `.github/workflows/deploy-cloudflare.yml` — Cloudflare Pages build and deploy.

## 2026-06-07 — Main deployment trigger

Requested deployment of the current `main` code state after registering `/pre-retorno` in `App.tsx` and navigation. This commit exists only to force push-based deployment workflows:

- GitHub Pages: `.github/workflows/deploy.yml`
- Cloudflare Pages: `.github/workflows/deploy-cloudflare.yml`

Post-deploy routes to verify:

- `#/pre-retorno`
- `#/portal-familia`
- `#/filtro`
- `#/recepcao`
- `#/pacientes`
- `#/prontuario`

## 2026-06-07 — Pre-return treatment field deployment trigger

Requested deployment after strengthening `/pre-retorno` with a dedicated free-text field for family-reported treatment symptoms/effects. This is the safe in-route substitute for the still-unregistered `/efeitos-colaterais` page while connector restrictions persist.

Included in current `main`:

- `/pre-retorno` registered in `App.tsx`;
- `/pre-retorno` visible in navigation;
- local storage key `neuroped:pre-retornos`;
- copy and WhatsApp helpers;
- treatment symptom/effect narrative field;
- prudent summary language: family report, no automatic causality, no dose-adjustment instruction.

Post-deploy route to verify first:

- `https://jadsonfraga.github.io/neuroped/#/pre-retorno`

## 2026-06-07 — Reception pre-return shortcut deployment trigger

Requested deployment after adding a direct `Pré-retorno` shortcut to the reception panel. This closes another high-value workflow gap without redesigning the panel.

Included in current `main`:

- `/recepcao` has direct `Pré-consulta` and `Pré-retorno` actions;
- `/pre-retorno` remains the active family-facing route for return updates and symptoms/effects perceived by the family;
- no global CSS/palette/sidebar redesign was introduced.

Post-deploy route to verify:

- `https://jadsonfraga.github.io/neuroped/#/recepcao`
- `https://jadsonfraga.github.io/neuroped/#/pre-retorno`

## 2026-06-07 — LGPD non-blocking consent deployment trigger

Requested deployment after changing the LGPD consent flow so it no longer blocks screen access.

Included in current `main`:

- `/consentimento-lgpd` is public and no longer wrapped by `Protected`;
- the consent page now presents a non-blocking notice;
- users can choose `Ir para o app`, `Continuar sem registrar agora`, or `Registrar consentimento`;
- when the backend is unavailable, consent can be stored locally and the app remains usable;
- sensitive clinical areas remain protected by the local clinical unlock/route guard.

Post-deploy routes to verify:

- `https://jadsonfraga.github.io/neuroped/#/consentimento-lgpd`
- `https://jadsonfraga.github.io/neuroped/#/filtro`
- `https://jadsonfraga.github.io/neuroped/#/pre-retorno`

## 2026-06-07 — Public app shell with PIN only on sensitive routes

Requested deployment after removing the global app-shell lock behavior. The public NeuroPed shell must open for all users, while sensitive clinical areas continue to require the PIN master through `RouteGuard`.

Included in current `main`:

- `isAppUnlocked()` now always returns `true`, preventing the global root gate from blocking public access;
- `hasClinicalUnlock()` remains unchanged and continues to control sensitive routes;
- `RouteGuard` still shows `LocalUnlockGate` for protected modules when there is no authenticated user or local clinical unlock;
- protected modules remain wrapped in `Protected`, including `/pacientes`, `/paciente/:id`, `/prontuario`, `/calculadora-dose`, `/farmacologia`, `/satisfacao-medicacao`, `/avaliacao-multiprofissional`, `/plano-terapeutico`, `/plano-intervencao` and `/fichas-registro`.

Post-deploy routes to verify:

- public: `https://jadsonfraga.github.io/neuroped/#/`
- public: `https://jadsonfraga.github.io/neuroped/#/filtro`
- public: `https://jadsonfraga.github.io/neuroped/#/portal-familia`
- PIN master: `https://jadsonfraga.github.io/neuroped/#/pacientes`
- PIN master: `https://jadsonfraga.github.io/neuroped/#/prontuario`
