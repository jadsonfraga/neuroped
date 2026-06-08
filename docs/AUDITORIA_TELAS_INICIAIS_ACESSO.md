# Auditoria — telas iniciais e política de acesso

Data UTC: 2026-06-08

## Resultado executivo

- `client/src/main.tsx` renderiza diretamente `<App />`, sem `PasswordGate` global.
- `client/src/App.tsx` não importa nem renderiza `LocalUnlockGate` global.
- O desbloqueio local fica restrito a `RouteGuard`, que usa `hasClinicalUnlock()` para rotas clínicas sensíveis.
- O onboarding automático só é armado quando a rota hash atual é exatamente `/`; links diretos públicos não são cobertos pelo onboarding.
- A splash screen continua permitida, mas o app marca prontidão em timeout curto e chama `onComplete`.
- LGPD permanece como rota pública de consentimento/registro, não como bloqueio global.

## Rotas públicas auditadas

| Rota | Política esperada | Resultado por código |
| --- | --- | --- |
| `#/` | Pública | Sem `Protected` |
| `#/filtro` | Pública | Sem `Protected` |
| `#/pre-consulta` | Pública | Sem `Protected` |
| `#/pre-retorno` | Pública | Sem `Protected` |
| `#/efeitos-colaterais` | Pública | Sem `Protected`, apontando para pré-retorno no roteador central |
| `#/recepcao` | Pública | Sem `Protected` |
| `#/portal-familia` | Pública | Sem `Protected` |
| `#/portal-familia/novidades` | Pública | Sem `Protected` |
| `#/portal-familia/acesso` | Pública | Sem `Protected` |
| `#/caa` | Pública | Sem `Protected` |
| `#/qualidade` | Pública | Sem `Protected` |
| `#/consentimento-lgpd` | Pública | Sem `Protected` |

## Rotas sensíveis auditadas

| Rota | Política esperada | Resultado por código |
| --- | --- | --- |
| `#/pacientes` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/paciente/teste` | PIN/auth clínico | prefixo `/paciente/` em `SENSITIVE_ROUTES` |
| `#/prontuario` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/documentos` | PIN/auth clínico | ponte de `not-found.tsx` protegida por `RouteGuard` |
| `#/pant` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/assinatura-digital` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/farmacologia` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/calculadora-dose` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/satisfacao-medicacao` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/avaliacao-multiprofissional` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/plano-terapeutico` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/plano-intervencao` | PIN/auth clínico | `<Protected>` + `RouteGuard` |
| `#/fichas-registro` | PIN/auth clínico | `<Protected>` + `RouteGuard` |

## Observações de execução

- `npm run audit:access` aprovou a política de acesso.
- Testes de browser/anônimos não puderam ser executados integralmente nesta sessão porque `npm ci` foi bloqueado pelo registry/proxy antes de restaurar dependências completas do `node_modules`.
