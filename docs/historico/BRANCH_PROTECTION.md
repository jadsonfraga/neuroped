# Branch Protection · MP9.0 WS5

Configure no GitHub Settings → Branches → main:

## Required status checks (must pass before merge)
- [x] clinical-tests / integrity
- [x] smoke-prod / smoke
- [x] audit-mp90 / lighthouse (warn-only, não bloqueia)
- [x] audit-mp90 / a11y (warn-only, não bloqueia)

## Required reviews
- [x] Require pull request reviews before merging
- [x] Required approving reviews: **1**
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require review from Code Owners (vide `.github/CODEOWNERS`)

## Conversation resolution
- [x] Require conversation resolution before merging

## Linear history
- [x] Require linear history

## Force push / deletion
- [x] Do not allow force pushes
- [x] Do not allow deletions

## Bypass
- (vazio) — nem o owner pode bypass sem comentário justificando

## Workflow obrigatório
Todo PR tem que passar pelos 4 gates (MP9.0 regra de ouro):
1. test
2. design-audit
3. clinical-tests (integrity)
4. lighthouse (warn)

Se algum dos primeiros 3 falhar, merge bloqueado.

## Hotfix
Em emergência clínica (bug grave em produção), usar branch `hotfix/*` que faz bypass dos gates secundários mas exige:
- review do Dr.
- post-mortem em `docs/post-mortems/YYYY-MM-DD-bug.md` em até 48h
