# CSS token source consolidation - 2026-09-14

## Scope and baseline

Baseline: `efad2006ed18618468880759be51bd7ed2f04d55` (main, inspected before editing).
This is an incremental, behavior-preserving CSS cleanup, not a new visual layer.
No routes, clinical logic, authentication, persistence, dependencies or palette values are changed.

## Verified source facts

- `main.tsx` loads `index.css` before `visual-reset.css` and the later presentation sheets.
- The superseded set is **32 semantic palette tokens per theme, 64 declarations total**.
  The set is explicit in `tests/unit/css-token-source-static.test.mjs`.
- Those tokens already have corresponding unconditional `:root` / `.dark` declarations
  in `visual-reset.css`. Both selectors and declaration importance match.
- Error colors, typography, shadows, geometry, outlines and relative-color fallbacks in
  `index.css` are not fully replaced by that sheet and therefore remain untouched.
- `tokens.css` was already imported at the top of `index.css` in the baseline.
  The old skip-link comment claiming otherwise was stale. Only the comment is corrected;
  skip-link rules and accessibility behavior are preserved.
- No `!important` is removed or added. No import is reordered. Existing v15 remains unchanged.

## CI gap and protection

The original `visual-reset.yml` path allowlist omitted `index.css`, `tokens.css`,
`product-signature.css` and `motion-coherence-v15.css`. A CSS-only change in one of
those files could miss this workflow. The trigger now covers `client/src/**/*.css`,
Tailwind/PostCSS/Vite configuration and the package manifest/lockfile.

A new executed contract rejects duplicate palette declarations in either theme,
requires the token import before Tailwind, preserves non-superseded primitives,
and checks the workflow coverage. Three mutation checks prove these guards reject
reintroduced light/dark palette definitions and a late token import.
Existing browser, accessibility, contrast and Lighthouse assertions are not weakened.

## Validation and evidence

Executed before publication: the new test first failed against the baseline, then
passed after the removal. All four existing visual static contracts also passed.
The PR records the final type/lint/build/browser outcomes for its HEAD; a pending
or failing check is not an approval. The unchanged production UI must not be
inferred solely from CSS source order or a successful build.

A separate local before/after experiment uses two real client builds in fresh
Chromium contexts, fixed time, reduced motion, light/dark themes, mobile/tablet/
desktop viewports, root computed tokens, visible-element computed styles and
full-page PNG byte equality. Its report, screenshots and runtime errors are kept
in the isolated CSS cleanup evidence directory on the authorized Windows machine.
This open-profile experiment is not a certification of authenticated clinical
journeys or every interaction state. Published CI evidence remains required.

## Rollback and merge boundary

Keep the PR in draft until the visual workflow and required HEAD checks complete
and the evidence is reviewed. No direct push to main, merge or production deploy.
Rollback is a normal revert PR, followed by the same gates. Reverting restores
redundancy but does not require a database migration or data repair.

Reducing `!important` is deliberately a separate, layer-by-layer change after this
baseline is accepted. No aesthetic score increase is claimed by this cleanup.

## Reconciliation — 2026-09-26

Reconciled against main `448b74b1`, preserving its expanded browser gates. The
review identified a missing trigger for public stylesheets: `client/public/**/*.css`
and `client/index.html` now trigger the same visual checks. Two additional mutation
checks reject removing either trigger. The local static suite passes; current-head
browser/CI evidence remains required before merge. The current user authorized
merge and deploy after validation, superseding the historical draft-only scope above.
