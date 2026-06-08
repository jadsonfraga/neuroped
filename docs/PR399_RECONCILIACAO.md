# Reconciliação do PR #399

PR: `#399 — chore: stabilize public shell, route-level PIN, assets and CI verify`
Data UTC: 2026-06-08

## Estado observado

- PR aberto no GitHub, com 1 commit (`910855d`) e conflito/mergeability negativa contra a `main` atual.
- O clone local desta sessão não possui remote configurado e o acesso Git/CLI ao GitHub está indisponível (`gh` ausente; `git ls-remote` bloqueado por proxy 403). Por isso, não foi possível fazer merge/rebase nem fechar o PR diretamente nesta execução.
- A reconciliação foi feita manualmente a partir da tela pública de arquivos do PR.

## Arquivos do PR #399 revisados

- `.github/workflows/verify.yml`
- `client/src/App.tsx`
- `client/src/components/ClinicalReport.tsx`
- `client/src/components/CommandPalette.tsx`
- `client/src/components/Layout.tsx`
- `client/src/components/RouteGuard.tsx`
- `client/src/lib/commandPaletteEvents.ts`
- `client/src/styles/proportion-guards.css`
- `client/src/types/radix-dropdown-menu.d.ts`
- `package.json`
- `scripts/guards/audit-access-policy.mjs`

## Já presente ou preservado na main atual

- `main.tsx` já renderizava `<App />` diretamente, sem `PasswordGate` global.
- `localUnlock.ts` já mantinha `isAppUnlocked()` como `true` para a casca pública e `hasClinicalUnlock()` para áreas clínicas.
- `/pant`, `/assinatura-digital`, `/pacientes`, `/paciente/:id`, `/prontuario`, farmacologia, dose, planos e fichas já estavam sob `<Protected>`.
- `/documentos` já estava protegido via ponte em `not-found.tsx` com `RouteGuard`.
- Onboarding já estava restrito à Home `/` por leitura da rota hash atual.
- Guardas globais de proporção já estavam importados em `main.tsx`.

## Incorporado manualmente

- Extração de `commandPaletteEvents.ts` para evitar acoplamento do `Layout` ao bundle da `CommandPalette`.
- `CommandPalette` passou a escutar `commandPaletteOpenEventName` compartilhado.
- `Layout` passou a importar `openCommandPalette` pelo helper leve.
- `PreferencesPanel`, `Onboarding`, `CommandPalette` e `WelcomeTour` passaram a lazy loading com `Suspense` sem fallback bloqueante.
- `RouteGuard` passou a checar a rota atual e liberar imediatamente rotas não sensíveis se algum wrapper acidental for introduzido no futuro.
- `audit-access-policy.mjs` foi ampliado para rotas públicas familiares/iniciais e para a defesa anti-wrapper acidental.
- `verify.yml` preserva `npm run build` e adiciona `npm run build:client`, reconciliando o ganho do PR sem perder a cobertura de build do servidor.
- `@radix-ui/react-dropdown-menu` foi adicionado como dependência direta em `package.json`.

## Descartado

- Alterações de `ClinicalReport.tsx` do PR #399 foram descartadas: a revisão do próprio PR apontava risco de regressão em cores de radar chart com `hsl(...)` concatenado a alpha hexadecimal.
- O shim `client/src/types/radix-dropdown-menu.d.ts` foi removido porque a dependência real do Radix Dropdown Menu está declarada e deve fornecer tipos/runtime próprios.
- Não houve importação cega do diff de `App.tsx`; a Home permaneceu eager para preservar estabilidade do shell inicial atual.

## Estado final do PR

- Recomendação operacional: fechar o PR #399 como **superseded** após este commit entrar na branch principal, pois os ganhos seguros foram absorvidos manualmente e o PR original permanece antigo/conflitado.
- Ação direta de fechamento/merge não foi possível nesta sessão por falta de remote/credenciais/ferramenta GitHub.
