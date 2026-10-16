# Multiclínica: perfis mínimos e marca da clínica (item 6)

## O que existe (reaproveitado)
- `clinic_memberships` com papéis `owner`, `clinic_admin`, `professional`, `assistant` (exibido como **Secretaria / recepção**) e `financial`.
- `shared/permissions.ts` é a fonte única de RBAC; billing (`requireBillingEntitlement`), flags por clínica e `saas_audit_log` seguem iguais.
- Nenhum papel novo foi criado no banco: "Secretaria" é só o nome exibido do papel `assistant`.

## O que foi adicionado
- **Marca da clínica**: tabela `clinic_branding` (migration versionada `0035_clinic_branding.sql`, **não aplicada**; rollback no cabeçalho). Cores primária/de destaque (com checagem de contraste), texto de cabeçalho e rodapé, logo PNG/JPEG ≤150 KB (SVG recusado).
- API: `GET/PATCH /api/tenants/:id` devolvem/aceitam `branding`; só `owner` e `clinic_admin` gravam (permissão `organization.manage`, checada também dentro do SQL). Auditoria guarda apenas nomes de campos. Sem a migration: GET devolve marca vazia, PATCH responde 503 `BRANDING_MIGRATION_PENDING`.
- PDFs: `buildDocumentPdf` aplica a marca centralmente (todos os documentos/laudos). Sem marca = paleta padrão. Logo inválido nunca bloqueia a emissão. A marca não altera conteúdo clínico.
- UI: Configurações → **Marca** (prévia ao vivo) e quadro "Perfis e permissões" na aba Equipe.

## Perfis
| Perfil | Pode | Não pode |
|---|---|---|
| Admin da clínica / proprietário | gerir equipe, marca, plano; clínico | — |
| Profissional | conteúdo clínico | gerir marca/equipe |
| Secretaria | agenda e cadastro | prontuário, laudos, escalas, portal da família |
| Financeiro | cobrança | conteúdo clínico |

## Testes
- `tests/unit/clinic-branding.test.ts` (Node 20+): validação, paleta, RBAC, rotas bloqueadas ao operador, PDF.
- `tests/unit/multiclinica-isolation.test.ts` (**Node ≥22**, `node:sqlite`, handlers reais + todas as migrations): clínica A nunca lê/escreve dados da B (inclusive com `X-Tenant-Id` forjado), secretaria 403 em conteúdo clínico, portal da família e portal público.
- `tests/e2e/multiclinica.mjs` (Playwright, API sintética): edição da marca, prévia, contraste, SVG recusado, persistência, quadro de perfis, secretaria sem abas Marca/Equipe e com laudos/prontuário bloqueados.
- `npm run test:multiclinica`, `npm run test:e2e:multiclinica`.

## Regra do médico
A marca só muda aparência. Nenhum corte, nível ou classificação nos testes próprios do NeuroPad; nada interpretativo à família.

## Limitações / decisões
- Migrations 0034 e 0035 aguardam autorização para aplicar.
- Secretaria ainda acessa os testes diretos (Sonda Dez aplicada pela assistente) — decisão existente, a confirmar.
- `familyDelivery.ts` (Super NeuroPad) ainda envia níveis à família: conflita com a regra; não alterado aqui.
- O "cadastro" da secretaria vive no módulo de operações/agenda, não no LIVE clínico.
