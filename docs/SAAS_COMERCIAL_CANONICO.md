# NeuroPed SaaS — Arquitetura Comercial Canônica

**Revisão:** 21/09/2026. **Estado:** implementação em PR; sem liberação pública automática.
**Escopo:** produto B2B separado de prontuário/Clinical Core, PANT e NeuroBoard.

## 1. Decisão de produto

O SKU inicial não é todo o NeuroPed. Autenticação, tenants, memberships, D1 e billing são infraestrutura, não entitlement comercial.

O catálogo preserva cinco códigos por compatibilidade, mas entrega **quatro materiais institucionalmente licenciados e um recurso público complementar**:

| Código | Superfície | Natureza |
|---|---|---|
| `form.change_log` | `/neuroacompanhamento` | material institucional licenciado |
| `form.school_feedback` | `/diario-escola` | material institucional licenciado |
| `form.approved_plan` | `/plano-terapeutico` | material institucional licenciado |
| `form.routine_log` | `/diario-sono`, `/diario-alimentar` | um material institucional, duas telas |
| `form.preconsultation` | `/pre-consulta` | recurso público, gratuito, não exclusivo |

Não são cinco superfícies exclusivas. A pré-consulta não exige conta/licença da família e seu preenchimento público **não é associado automaticamente à unidade licenciada**. Os endpoints comerciais auditados continuam exigindo identidade e entitlement; não são o endpoint público da família. O recurso público não sustenta uma promessa de exclusividade do SKU.

Prontuário, dados identificáveis de pacientes, PANT/laudos, NeuroBoard, pontuação psicométrica, decisão clínica, diagnóstico, prescrição, white-label e redistribuição continuam fora do produto.

## 2. Fontes de verdade

1. `shared/commercial.ts`: ofertas, termos, preço, limites, guardrails e `surface` dos materiais.
2. `0026_saas_commercial_catalog.sql`: schema e invariantes iniciais, preservado como histórico.
3. `0027_saas_commercial_seat_integrity.sql`: proteção forward-only do último assento e identidade imutável.
4. `functions/api/commercial/*`: autorização persistida e respostas HTTP.
5. UI: representa respostas do servidor; não concede entitlement por papel, preço ou ausência de contexto.
6. PSP/billing: cobrança/conciliação, nunca definição do produto.

`shared/billing.ts` e seu billing genérico histórico por assento não mudam o SKU institucional.

## 3. SKUs preservados

| Campo | Piloto 1.0 | Anual 1.0 |
|---|---|---|
| Código | `institutional-pilot-1-0` | `institutional-annual-1-0` |
| Preço | R$ 1.490,00 | R$ 2.490,00 |
| Vigência | 365 dias | 365 dias |
| Termos | `institutional-pilot-terms-v1` | `institutional-annual-terms-v1` |
| Venda | somente por convite | `gated`, expansão fechada |
| Unidades/licença | 1 | 1 |
| Usuários autorizados | até 10 | até 10 |
| Onboarding | 60 minutos | 60 minutos |
| Suporte incluído | 120 minutos | 120 minutos |
| Coorte histórica máxima | 3 licenças | sem teto de coorte |

Cancelar/expirar licença piloto não abre uma quarta vaga. O preço, a versão dos termos e as condições de venda não foram alterados nesta correção. Qualquer revisão contratual material exige nova versão e aceite; não se reescrevem aceites existentes.

## 4. Fronteira clínica e regulatória

Os offers mantêm `acceptsPatientData`, `includesMedicalService`, `includesClinicalDecisionSupport`, `includesPsychometricScoring`, `includesPant`, `includesNeuroBoard`, `allowsRedistribution` e `allowsWhiteLabel` como `false`. Alterar uma negativa muda a classe do produto e exige revisão própria jurídica, regulatória e LGPD antes de produção.

## 5. Tenant, sessão e licença

Reutilizam-se `users`, `clinics`, `clinic_memberships` e `saas_audit_log`; não existe tenant comercial paralelo.

Cada material institucional exige identidade autenticada, membership ativa persistida, tenant ativo, licença ativa dentro da vigência, contrato canônico, assento ativo do usuário e feature habilitada. Membership não substitui licença; admin global não contorna membership.

`clinicId` é alvo solicitado, nunca autoridade. A autorização de tenant precede a leitura/divulgação de drift, impedindo revelar a terceiros a situação contratual de outra unidade.

### 5.1 Drift explícito

`getCommercialLicenseSnapshot()` retorna `null` somente quando nenhuma licença aplicável foi encontrada. Uma versão divergente (inclusive vazia) ou offer desconhecido conserva o snapshot persistido com `contractState: drift`.

`/me`, catálogo tenant-scoped `/materials`, guard de abertura/exportação e gestão de assentos devolvem **409 / COMMERCIAL_OFFER_UNKNOWN** para esse estado. Não concedem capacidades nem realizam mutações. Ausência real continua com a semântica de licença ausente. O `/catalog` público descreve as ofertas canônicas; não lê a licença de uma unidade.

### 5.2 Modo individual e transições

`outside-scope` significa exclusivamente `accessMode: local` explicitamente resolvido. Bootstrap, sessão remota sem autenticação, falta de clínica, erro de carga e intervalo de troca de tenant nunca liberam conteúdo.

O hook mascara snapshots de outro contexto já no render e descarta respostas assíncronas antigas por geração. A confirmação de abertura pertence ao usuário, clínica, licença, feature e instância do snapshot. Uma resposta antiga não autoriza a próxima tela, mesmo quando o usuário volta à mesma clínica. A gestão de licença também descarta detalhes, seleções e consentimentos de contexto anterior.

### 5.3 Endpoints

| Superfície | Função |
|---|---|
| `GET /api/commercial/catalog` | ofertas informativas, quatro `licensedMaterials` e um `publicCompanions`; sem checkout |
| `GET /api/commercial/me` | licença/capabilities tenant-scoped; 409 em drift |
| `GET /api/commercial/materials` | catálogo da unidade; público não é apresentado como licenciado ou recusado |
| `GET /api/commercial/materials/:code` | autorização e registro de abertura pela equipe |
| `POST /api/commercial/materials/:code` | autorização e registro operacional de exportação |
| `GET/POST/DELETE /api/commercial/users` | gestão de assentos por owner/clinic_admin ativo |
| `/licenca` | aceite, assentos, vigência, suporte e distinção entre público e institucional |

## 6. Lifecycle e concorrência

A licença nasce `pending`. O provisionamento é administrativo; a ativação exige referência de conciliação, aceite da versão exata por gestor ativo e ao menos um usuário autorizado com membership na unidade.

O banco impede criação diretamente ativa, quarta licença piloto, ativação sem cobrança/aceite/assento, assento sem membership, 11º assento, uso de feature não habilitada, telemetria cross-tenant e uso por ator não autorizado.

A migração 0027 acrescenta:

- recusa de `active -> revoked` do último assento quando a licença está ativa;
- mesma proteção para `DELETE`, inclusive operação coletiva;
- imutabilidade de `license_id` e `user_id` no assento.

A decisão é tomada na escrita serializada, não no COUNT previamente lido pela API. Duas revogações que observam dois assentos disputam a mesma restrição: uma confirma e a outra recebe 409 / COMMERCIAL_LAST_AUTHORIZED_USER. Licença suspensa/cancelada pode encerrar assentos; sua reativação continua exigindo pelo menos um.

Assento, evento e auditoria ficam no mesmo `db.batch`. Uma falha desfaz a transação inteira. `WHERE changes() = 1` evita eventos para usuário inexistente ou mutação sem efeito. A resposta de sucesso não antecede o efeito persistido.

## 7. Privacidade e ledger

`commercial_usage_events` é telemetria operacional, não prontuário. Metadados aceitos: `materialId`, `deliveryChannel`, `clientVersion`, `sourceVersion`, `supportCategory`. Chaves arbitrárias e blobs clínicos são recusados; o banco limita metadados a 2 KB. Somente fixtures sintéticas entram em testes/logs da PR.

## 8. Cobrança e operação

O PSP é adaptador; somente referência opaca de conciliação vai ao D1, nunca cartão. O fluxo inicial é assistido: proposta, pagamento/faturamento externo, conciliação, provisionamento pending, aceite institucional, ativação. Um checkout futuro exige ponte explícita e idempotente; billing genérico não ativa licença por inferência.

Suporte é medido por eventos `support_minutes`, sem conteúdo clínico. A inclusão de 60 minutos de onboarding e 120 minutos de suporte permanece limitada.

## 9. Expansão e stop rules

A expansão anual exige decisão formal e nova PR: uso regular por pelo menos 2/3 da coorte, adoção dos materiais institucionais efetivamente licenciados, suporte sustentável (referência de até 3 h/instituição no período), ausência de incidentes, disposição de renovação (referência de R$ 2.250/ano), valor independente de acesso pessoal ao médico e revisão jurídica/fiscal/licenciamento.

Uso da pré-consulta pública, isoladamente, não comprova adoção paga. Suspender o piloto diante de incidente de dados, uso diagnóstico/prescritivo, certificação não autorizada, disputa de propriedade intelectual, enquadramento incompatível ou erro com risco clínico.

## 10. Testes e release

O workflow comercial roda em toda PR para main e em todo push em main, sem filtros de paths. Isso inclui mudanças indiretas de auth, tenant, UI, configuração e novos arquivos.

Suítes: `saas-commercial-canonical`, `saas-commercial-terms`, `saas-commercial-materials`, `saas-commercial-integrity`, `saas-commercial-scope`, `planos-page-contract` e TypeScript, além dos gates gerais do repositório.

A suíte de integridade executa os handlers reais sobre SQLite com um adaptador transacional da interface D1. Cobre drift persistido/HTTP, isolamento, duas leituras COUNT=2 antes das revogações concorrentes, proteção por SQL direto, rollback do ledger e distinção público/licenciado. Ela não substitui validação pós-release do D1 remoto.

A publicação deve aplicar 0026 e depois 0027, verificar todos os triggers críticos e recusar licença ativa sem assentos antes de publicar Functions. Não aplicar migrações nem alterar dados de produção pela simples revisão da PR.

### Rollback

Antes do merge, basta manter a PR sem publicar. Após release autorizado, preferir correção forward-only. Não remover triggers para contornar conflito e não reescrever 0026. Uma reversão do aplicativo não exige apagar 0027: os triggers são compatíveis com os handlers anteriores, embora a mensagem de erro antiga seja menos específica. Registrar qualquer correção administrativa de contrato/assento com razão e auditoria; nunca normalizar silenciosamente o banco.

## 11. Limites de conclusão

Merge não significa venda pública automática. A primeira venda ainda depende de aprovação final dos quatro materiais licenciados, apresentação correta do recurso público, termos revisados, emissão fiscal/recebimento, responsável de suporte e seleção das até três instituições-piloto.

Backoffice de provisionamento, integração PSP e dashboard agregado permanecem evoluções separadas. PANT, NeuroBoard, prontuário e escalas de terceiros não entram por expansão silenciosa.
