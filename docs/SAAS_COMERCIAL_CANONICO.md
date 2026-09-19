# NeuroPed SaaS — Arquitetura Comercial Canônica

**Data:** 08/09/2026  
**Estado:** arquitetura implementada em PR; sem liberação pública automática  
**Escopo:** produto B2B vendável derivado do NeuroPed, separado do prontuário clínico, PANT e NeuroBoard.

## 1. Decisão de produto

O SKU inicial não é “todo o NeuroPed”. A plataforma já possui autenticação, tenants, memberships, D1, billing e Clinical Core, mas capacidade técnica não equivale a entitlement comercial.

```text
CONTRATO COMERCIAL
  commercial_offers
  commercial_licenses
  commercial_license_acceptances
  commercial_license_users
  commercial_usage_events
          │
          ▼ autoriza somente
CINCO MATERIAIS EDUCATIVO-OPERACIONAIS
  form.preconsultation
  form.change_log
  form.school_feedback
  form.approved_plan
  form.routine_log

FORA DO SKU INICIAL
  prontuário / Clinical Core / dados de pacientes
  PANT / laudos / assinatura médica
  NeuroBoard / parecer de caso
  scoring psicométrico
  apoio à decisão / diagnóstico / prescrição
  white-label / redistribuição
```

## 2. Fontes de verdade

Ordem de autoridade:

1. `shared/commercial.ts` — contrato de domínio, SKU, preço, gates e guardrails;
2. `db/migrations/0026_saas_commercial_catalog.sql` — invariantes persistentes em D1;
3. `functions/api/commercial/*` — enforcement server-side;
4. UI — apenas representação das capabilities concedidas pelo backend;
5. PSP/billing — cobrança e conciliação, nunca definição do produto.

`shared/billing.ts` continua sendo infraestrutura preexistente de cobrança do SaaS. O histórico de R$ 99/assento/mês não é fonte de verdade para a licença institucional aqui definida.

## 3. SKUs

### NeuroPed Institucional — Piloto 1.0

| Campo | Valor |
|---|---:|
| Código | `institutional-pilot-1-0` |
| Preço | R$ 1.490,00 |
| Vigência | 365 dias |
| Venda | somente por convite |
| Coorte histórica máxima | 3 licenças |
| Unidades/licença | 1 |
| Usuários autorizados | até 10 |
| Onboarding | 60 min |
| Suporte incluído | 120 min |

O teto de três é **histórico**: cancelar ou expirar uma licença piloto não abre uma quarta vaga automaticamente.

### NeuroPed Institucional — Anual 1.0

| Campo | Valor |
|---|---:|
| Código | `institutional-annual-1-0` |
| Preço | R$ 2.490,00 |
| Vigência | 365 dias |
| Venda | `gated` |
| Unidades/licença | 1 |
| Usuários autorizados | até 10 |
| Onboarding | 60 min |
| Suporte incluído | 120 min |

`gated` = produto definido, mas provisionamento/checkout de expansão bloqueado até decisão formal pós-piloto.

## 4. Fronteira clínica e regulatória

Todos os offers iniciais têm, por contrato e teste:

- `acceptsPatientData = false`;
- `includesMedicalService = false`;
- `includesClinicalDecisionSupport = false`;
- `includesPsychometricScoring = false`;
- `includesPant = false`;
- `includesNeuroBoard = false`;
- `allowsRedistribution = false`;
- `allowsWhiteLabel = false`.

Remover qualquer uma dessas negativas é **mudança de classe de produto**. Exige PR/ADR específico e nova revisão jurídica, regulatória e LGPD antes de produção.

## 5. Tenancy e autorização

Não existe uma segunda identidade de tenant.

Reutilizam-se:

- `clinics` — tenant/unidade institucional;
- `clinic_memberships` — vínculo do usuário à unidade;
- `users` — identidade nominal;
- `saas_audit_log` — trilha administrativa.

Acesso a um material requer cumulativamente:

1. membership ativa no tenant;
2. licença comercial existente;
3. licença `active` e dentro da vigência;
4. usuário explicitamente `active` em `commercial_license_users`;
5. feature habilitada no offer;
6. offer conhecido pelo contrato canônico.

**Membership não equivale a licença.** Um profissional pode pertencer à clínica e ainda assim receber todas as commercial capabilities como `false` se não estiver entre os usuários autorizados.

`GET /api/commercial/me?clinicId=...` devolve o snapshot tenant-scoped e a autorização do usuário atual. O frontend não calcula permissões por preço, role, query string ou estado local.

### 5.1 Onde a licença é exercida

As seis condições acima vivem em `functions/api/commercial/_guard.ts`, num único `requireCommercialFeature()` que toda rota de material chama antes de qualquer efeito. O guard devolve o mesmo status para recusas de acesso, de modo que a resposta não diferencie “sua licença não cobre isto” de “esta clínica não é sua”; drift contratual é a exceção e responde 409.

| Superfície | Papel |
|---|---|
| `GET /api/commercial/materials` | catálogo tenant-scoped com `licensed` por material |
| `GET /api/commercial/materials/:code` | confirma o entitlement e registra `material_open` |
| `POST /api/commercial/materials/:code` | registra `material_export` com o canal de entrega |
| `GET/POST/DELETE /api/commercial/users` | assentos da licença, sob gestão da unidade |
| `/licenca` | tela do gestor: aceite, assentos, vigência e suporte consumido |

`COMMERCIAL_MATERIALS`, em `shared/commercial.ts`, liga cada feature code às telas reais do aplicativo. Um feature code sem destino é um entitlement que não entrega nada, e o teste de regressão recusa uma rota declarada que não exista no `App.tsx` ou que não esteja sob o gate.

### 5.2 Fronteira do produto

A licença incide sobre a **unidade institucional**: sessão remota autenticada com clínica selecionada. A instalação individual do aplicativo, sem backend remoto ou sem unidade ativa, não exerce licença nenhuma e os materiais seguem como sempre foram — não é brecha, é o limite do que foi vendido. O modo é determinado pelo build e pela capacidade do backend, não por escolha do usuário final numa instalação institucional.

Dentro de uma unidade, a permissão vem do servidor duas vezes: o snapshot pinta a tela e a confirmação de abertura decide. Se a confirmação recusa, o material não é renderizado, mesmo que o snapshot anterior dissesse o contrário.

### 5.3 Ledger

`material_open`, `material_export`, `authorized_user_added` e `authorized_user_revoked` são gravados pelas rotas acima. Abertura e entrega não devolvem sucesso sem terem sido registradas; concessão e revogação de assento só geram evento quando a escrita mudou exatamente uma linha (`WHERE changes() = 1`), para que uma corrida não deixe ledger sem assento correspondente.

## 6. Lifecycle fail-closed

O D1 impõe o lifecycle mesmo se uma rota futura esquecer um guard:

```text
admin da plataforma
  → /api/commercial/provision
  → license = pending
  → referência de conciliação comercial registrada

gestor owner/clinic_admin da unidade
  → /api/commercial/accept
  → aceita a MESMA contract_version
  → aceita: sem dados de pacientes / sem ato médico / sem redistribuição
  → escolhe usuários que já são memberships ativos
  → acceptance + authorized users persistidos
  → transição pending → active
```

Triggers impedem:

- licença nascer diretamente `active`;
- quarta licença do piloto;
- licença ativa sem `billing_reference`;
- ativação sem aceite da versão contratual exata por `owner`/`clinic_admin` ativo;
- ativação sem usuário autorizado;
- usuário autorizado que não pertença à mesma clínica;
- 11º usuário ativo;
- telemetria com `license_id` de outro tenant;
- abertura/exportação de material por usuário não autorizado.

## 7. Privacy by architecture

`commercial_usage_events` é telemetria operacional, não prontuário.

Metadados aceitos em aplicação usam allow-list:

- `materialId`;
- `deliveryChannel`;
- `clientVersion`;
- `sourceVersion`;
- `supportCategory`.

Chaves arbitrárias como nome, CPF, diagnóstico, prontuário e texto clínico são recusadas. O banco limita `metadata_json` a 2 KB. Dados clínicos permanecem nas estruturas clínicas próprias e não devem ser copiados para tabelas comerciais.

## 8. Billing

O PSP é adaptador. Nenhum dado de cartão deve ser persistido em D1; somente referência opaca de conciliação.

A arquitetura atual permite operação comercial manual/assistida: proposta → pagamento/faturamento externo → referência de conciliação → provisionamento pending → aceite institucional → ativação.

Um checkout automatizado futuro deve criar a ponte explícita `offerCode + payment + contractVersion + license`. O checkout genérico por assento já existente não pode ativar `commercial_license` por inferência.

## 9. Suporte como COGS

O produto inclui:

- 60 min de onboarding;
- 120 min de suporte/ano.

Suporte é medido via `commercial_usage_events.kind = 'support_minutes'`. O ledger registra minutos e categoria operacional, nunca conteúdo clínico.

## 10. Gate de expansão

O plano anual continua fechado até decisão formal. Critérios recomendados:

- pelo menos 2/3 instituições usando regularmente 3 ou mais dos 5 materiais;
- suporte ≤ 3 h/instituição no período observado;
- zero incidente de segurança ou uso clínico indevido;
- disposição de renovação ≥ R$ 2.250/ano;
- valor percebido sem depender de acesso pessoal ao médico;
- revisão jurídica, fiscal e de licença concluída.

Abrir o gate exige novo PR e teste correspondente. Não usar variável de frontend para contorná-lo.

## 11. Stop rules

Suspender o piloto/licença diante de:

- incidente com dado pessoal decorrente da oferta;
- uso como diagnóstico/prescrição;
- anúncio de “certificação NeuroPed” não autorizada;
- disputa relevante de propriedade intelectual;
- enquadramento regulatório incompatível com o SKU;
- erro material com potencial de risco clínico.

## 12. Evolução

### Implementado nesta linhagem

- contrato comercial canônico;
- catálogo e preços;
- offers/features no D1;
- licenças e acceptances;
- usuários autorizados;
- provisionamento administrativo;
- aceite/ativação institucional;
- snapshot de capabilities;
- telemetria operacional mínima;
- testes adversariais;
- CI antirregressão.

### Próxima camada após merge

- UI/backoffice de provisionamento;
- portal institucional dos cinco materiais usando `/api/commercial/me`;
- termo/licença contratual versionado para aceite visual;
- integração do PSP escolhido com idempotência;
- dashboard agregado da coorte piloto.

### Não entra por expansão silenciosa

PANT como serviço, NeuroBoard, Clinical Decision Support, prontuário multi-instituição e escalas de terceiros exigem produtos e revisões próprias.

## 13. Regra de release

Merge desta arquitetura significa **fundação comercial tecnicamente consolidada**, não venda pública automática.

A primeira venda ainda depende de aprovação final dos cinco materiais, versão contratual revisada, emissão fiscal/recebimento definidos, responsável de suporte/operação e seleção das até três instituições-piloto.
