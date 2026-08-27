# Backend canônico — Cloudflare Pages Functions + D1

O runtime de produção do NeuroPed é o domínio Cloudflare Pages, com Functions em
`functions/api/**` e o binding D1 `DB`. O arquivo `db/schema.d1.sql` é apenas
o **baseline compatível e idempotente**; ele não representa sozinho todo o
modelo atual. As migrações `db/migrations/0001..0015` são parte obrigatória da
fonte de verdade.

## Regra de segurança

Há dois domínios de dados intencionalmente separados:

- **DEMO/local:** tabelas terminadas em `_demo`; nunca recebem pacientes reais;
- **LIVE:** tabelas `clinics`, `live_*`, billing e lifecycle, sempre com
  membership/tenant, entitlement, auditoria e cifragem clínica quando aplicável.

Uma tela autenticada em modo remoto não pode cair silenciosamente em uma tabela
`_demo`, em storage clínico do navegador ou em endpoint legado. Quando não
existe equivalente LIVE, a interface deve falhar fechada e informar a lacuna.

## Provisionamento e migrações

O workflow **Provision D1 backend** cria o banco/bindings e instala o baseline de
auth, consentimentos e memória demonstrativa. Ele não deve ser interpretado
como prova de que todos os domínios abaixo já foram aplicados fisicamente.

| Domínio | Migrações | Workflow operacional |
| --- | --- | --- |
| baseline/auth/consentimentos | `schema.d1.sql`, 0001–0004 | `provision-d1.yml` e `deploy-cloudflare.yml` |
| Conecta demonstrativo | 0005 | `conecta-d1-migration.yml` |
| Clinical Core demonstrativo | 0006 | `clinical-core-d1-migration.yml` |
| agenda e autoagendamento | 0007 + 0008 operational | `operations-d1-migration.yml` |
| importação BoaConsulta | 0008 import bridge | `boaconsulta-import-release.yml` |
| fundação SaaS/tenants | 0009 + 0010 | `saas-phase1-d1-migration.yml` |
| memória demonstrativa | 0011 | `provision-d1.yml` |
| billing/onboarding/provider | 0012 + 0013 + 0015 | `saas-billing-d1-migration.yml` |
| LIVE clínico, lifecycle e LGPD | 0014 | `deploy-cloudflare.yml` + contratos tenant |

Os dois arquivos de prefixo 0008 são históricos e têm nomes distintos. Não os
renomeie depois de aplicados; a ordem e a presença devem ser verificadas pelo
nome completo.

## Superfícies LIVE já canônicas

- clínicas, memberships e lifecycle: `/api/tenants/**`;
- pacientes cifrados: `/api/live/patients/**`;
- linha clínica cifrada: `/api/live/events`;
- avaliações/respostas append-only: `/api/live/assessments`;
- documentos clínicos versionados: `/api/live/documents`;
- retenção, exportação e eliminação controlada: `/api/live/governance`;
- billing, convites e entitlements: `/api/billing/**`;
- agenda/booking: `/api/operations` e `/api/public-booking`.

As rotas `/api/patients`, `/api/results`, `/api/consultations`,
`/api/clinical-core`, `/api/conecta` e `/api/memory` pertencem ao
contrato legado/demonstrativo. Elas não são substitutas aceitáveis para uma
sessão clínica LIVE.

## Checklist de ativação

1. Executar backup e registrar o identificador do banco D1 alvo.
2. Aplicar os workflows na ordem de dependência da tabela acima.
3. Consultar `sqlite_master`, colunas, índices e triggers; arquivo SQL no Git
   não prova aplicação física.
4. Configurar `CLINICAL_LIVE_ENABLED=true`, keyring clínico, chave separada de
   blind index, JWT, billing e `APP_BASE_URL`.
5. Validar `/api/health`; em seguida executar smoke autenticado de tenant,
   pacientes, avaliações, documentos, agenda e governança.
6. Executar ataque RED/BLUE com dois tenants e IDs conhecidos.
7. Executar restore real em banco isolado. Backup sem restore ensaiado não
   satisfaz o gate de produção.
8. Só então promover o deploy e conferir o sentinel do SHA publicado.

## Lacunas que continuam planejadas

- Conecta e Memória Clínica ainda não têm armazenamento LIVE tenant-aware
  próprio; permanecem bloqueados em sessão remota;
- a agenda é isolada por profissional/recepção e precisa de vínculo explícito
  com `clinic_id` para governança multi-clínica completa;
- PDFs binários imutáveis precisam de object storage canônico e metadados D1;
- o portal familiar precisa de token de acesso próprio, escopado e revogável;
- o worker LGPD ainda deve materializar exportações e eliminações aprovadas,
  respeitando retenção e legal hold.

O catálogo e a sequência completa estão em
`docs/AUDITORIA_E2E_ABA_A_ABA_2026-08-25.md`.
