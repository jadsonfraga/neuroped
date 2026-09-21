# NeuroPed SaaS — Arquitetura Comercial Canônica

**Revisão:** 21/09/2026. **Estado:** implementação em PR, mantida em HOLD de release.
**Escopo:** produto B2B separado de prontuário/Clinical Core, PANT e NeuroBoard.

> Dependência de release ainda aberta: o workflow de publicação precisa aplicar a migração 0028 e verificar seu trigger antes de publicar Functions. A tentativa de atualizar esse workflow foi bloqueada pela ferramenta de edição. A migração existe na PR, mas isso não significa que está conectada ao deploy ou aplicada em produção. Não mesclar/publicar sem encerrar essa dependência e validar os gates do HEAD final.

## 1. Decisão de produto

O SKU inicial não é todo o NeuroPed. Autenticação, tenants, memberships, D1 e billing são infraestrutura, não entitlement comercial.

O catálogo preserva cinco códigos por compatibilidade, mas entrega **quatro modelos organizacionais em branco, institucionalmente licenciados, e um recurso público complementar**:

| Código | Superfície | Natureza |
|---|---|---|
| `form.change_log` | `/neuroacompanhamento` | modelo de registro organizado de mudanças |
| `form.school_feedback` | `/diario-escola` | modelo de devolutiva escolar estruturada |
| `form.approved_plan` | `/plano-terapeutico` | modelo para transcrição de plano já aprovado |
| `form.routine_log` | `/diario-sono`, `/diario-alimentar` | um modelo descritivo de rotina, duas rotas |
| `form.preconsultation` | `/pre-consulta` | recurso público, gratuito, não exclusivo |

Não são cinco superfícies exclusivas. A pré-consulta não exige conta/licença da família e seu preenchimento público **não é associado automaticamente à unidade licenciada**. Os endpoints comerciais auditados continuam exigindo identidade e entitlement; não são o endpoint público da família.

A superfície institucional usa `CommercialMaterialWorkspace` e modelos de `shared/commercialTemplates.ts`. Não monta as telas clínicas locais, não lê armazenamento clínico e não oferece campos para preencher dados identificáveis no aplicativo. As telas clínicas originais permanecem disponíveis exclusivamente pelo caminho individual local já existente. A licença não é uma forma de contornar a proteção de persistência clínica remota.

Os modelos podem ser impressos, baixados como HTML, copiados ou preparados em um aplicativo externo de e-mail. São modelos operacionais em branco, não instrumentos validados, prontuário, plano prescrito automaticamente ou laudo. A aprovação editorial dos materiais para venda continua sendo uma etapa de produto.

Prontuário, dados identificáveis de pacientes, PANT/laudos, NeuroBoard, pontuação psicométrica, decisão clínica, diagnóstico, prescrição, white-label e redistribuição continuam fora do produto.

## 2. Fontes de verdade

1. `shared/commercial.ts`: ofertas, termos, preço, limites, guardrails e natureza das superfícies.
2. `shared/commercialTemplates.ts`: conteúdo dos quatro modelos em branco.
3. `0026_saas_commercial_catalog.sql`: schema e invariantes iniciais, preservado integralmente.
4. `0027_saas_commercial_seat_integrity.sql`: último assento e identidade imutável.
5. `0028_saas_commercial_final_authorization.sql`: revalidação de vínculo, tenant e vigência no INSERT de uso.
6. `functions/api/commercial/*`: autorização persistida e respostas HTTP; UI apenas representa esse resultado.
7. PSP/billing: cobrança/conciliação, nunca definição do produto.

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

Cancelar/expirar licença piloto não abre uma quarta vaga. Preço, versão dos termos e condições de venda não foram alterados nesta correção. Qualquer revisão contratual material exige nova versão e aceite; não se reescrevem aceites existentes.

## 4. Fronteira clínica e regulatória

Os offers mantêm `acceptsPatientData`, `includesMedicalService`, `includesClinicalDecisionSupport`, `includesPsychometricScoring`, `includesPant`, `includesNeuroBoard`, `allowsRedistribution` e `allowsWhiteLabel` como `false`. Alterar uma negativa exige revisão própria jurídica, regulatória e LGPD antes de produção.

## 5. Tenant, sessão e licença

Reutilizam-se `users`, `clinics`, `clinic_memberships` e `saas_audit_log`; não existe tenant comercial paralelo.

Cada modelo institucional exige identidade autenticada, membership ativa persistida, tenant ativo, licença ativa dentro da vigência, contrato canônico, assento ativo do usuário e feature habilitada. Membership não substitui licença; admin global não contorna membership.

`clinicId` é alvo solicitado, nunca autoridade. A autorização de tenant precede a divulgação de drift contratual.

### 5.1 Drift explícito

`getCommercialLicenseSnapshot()` retorna `null` somente quando nenhuma licença aplicável foi encontrada. Versão divergente, inclusive vazia, ou offer desconhecido conserva o snapshot persistido com `contractState: drift`.

`/me`, catálogo tenant-scoped `/materials`, guard de abertura/exportação e gestão de assentos devolvem **409 / COMMERCIAL_OFFER_UNKNOWN**. Não concedem capacidades nem realizam mutações. Ausência real mantém a semântica de licença ausente.

O `/catalog` público descreve ofertas canônicas, não a licença de uma unidade. Somente o caminho exato `/api/commercial/catalog` é público no middleware; `/me`, `/users`, `/materials` e outros caminhos do namespace permanecem protegidos.

### 5.2 Modo individual e transições

`outside-scope` significa exclusivamente `accessMode: local` explicitamente resolvido. Bootstrap, sessão remota sem autenticação, falta de clínica, erro de carga e intervalo de troca de tenant nunca liberam conteúdo.

O hook mascara snapshots de outro contexto já no render e descarta respostas assíncronas antigas. A confirmação de abertura pertence ao usuário, clínica, licença, feature e instância do snapshot. A gestão também descarta detalhes, seleções e consentimentos de contexto anterior. O executor de exportação verifica novamente o contexto depois de receber o recibo do servidor, antes de entregar o modelo ao navegador.

### 5.3 Endpoints

| Superfície | Função |
|---|---|
| `GET /api/commercial/catalog` | catálogo público; quatro `licensedMaterials`, um `publicCompanions`; sem checkout |
| `GET /api/commercial/me` | licença/capabilities tenant-scoped; 409 em drift |
| `GET /api/commercial/materials` | catálogo da unidade; público não recebe licença ou recusa fictícia |
| `GET /api/commercial/materials/:code` | autorização e registro de abertura pela equipe |
| `POST /api/commercial/materials/:code` | autorização e registro de iniciação de exportação |
| `GET/POST/DELETE /api/commercial/users` | gestão de assentos por gestor ativo da unidade |
| `/licenca` | aceite, assentos, vigência, suporte e recurso público |

## 6. Lifecycle, concorrência e rotatividade

A licença nasce `pending`. A ativação exige conciliação, aceite da versão exata por gestor ativo e ao menos um usuário autorizado com membership na unidade.

O banco impede criação diretamente ativa, quarta licença piloto, ativação sem requisitos, assento sem membership, 11º assento, feature não habilitada e telemetria cross-tenant.

A migração 0027 recusa revogação ou exclusão do último assento de licença ativa, inclusive instruções coletivas, e impede reescrever `license_id`/`user_id`. A decisão ocorre na escrita, não no COUNT previamente lido pela API. Duas revogações que observam dois assentos resultam em uma confirmação e um **409 / COMMERCIAL_LAST_AUTHORIZED_USER**. Licença suspensa/cancelada pode encerrar assentos; a reativação exige pelo menos um.

Assento, evento e auditoria ficam no mesmo `db.batch`. Falha desfaz a transação inteira. `WHERE changes() = 1` evita eventos para mutações sem efeito.

A migração 0028 revalida membership, status do tenant, assento, status e vigência da licença no INSERT que confirma abertura/exportação. Uma mudança entre preflight e escrita resulta em **403 / COMMERCIAL_ACCESS_CHANGED**, sem evento órfão nem confirmação de uso.

A lista de usuários inclui candidatos com membership ativa **e assentos ainda ocupados por ex-membros**. Ex-membro é identificado como vínculo inativo e continua visível para revogação. Ele não pode receber nova concessão. O contador inclui todos os assentos alocados, como o limite do banco. Não há suspensão automática de uma unidade nem eliminação silenciosa de seu histórico por rotatividade de pessoal.

## 7. Privacidade e semântica de exportação

`commercial_usage_events` é telemetria operacional. Metadados permitidos: `materialId`, `deliveryChannel`, `clientVersion`, `sourceVersion`, `supportCategory`; não há blob clínico. O POST de exportação recebe somente `{channel}` e recusa campos adicionais. Fixtures de testes são sintéticas.

`material_export` significa **iniciação autorizada**. O servidor devolve `stage: authorized_initiation`; isso não comprova impressão, salvamento em disco ou entrega de e-mail. O usuário pode cancelar no navegador/aplicativo externo. A UI não afirma que enviou e-mail: apenas solicita o rascunho com modelo em branco. A janela de impressão é reservada vazia durante o clique e só recebe conteúdo depois da autorização; recusa fecha essa janela.

## 8. Cobrança e operação

O PSP é adaptador; somente referência opaca de conciliação vai ao D1. O fluxo é assistido: proposta, pagamento externo, conciliação, provisionamento pending, aceite e ativação. Checkout futuro exige ponte explícita e idempotente; billing genérico não ativa licença por inferência.

Suporte é medido por `support_minutes`, sem conteúdo clínico. Onboarding de 60 minutos e suporte de 120 minutos permanecem limitados.

## 9. Expansão e stop rules

Expansão anual exige decisão formal e nova PR: uso regular de pelo menos 2/3 da coorte, adoção efetiva dos materiais institucionais, suporte sustentável (referência de até 3 h/instituição), ausência de incidentes, disposição de renovação (referência de R$ 2.250/ano), valor independente de acesso pessoal ao médico e revisão jurídica/fiscal/licenciamento.

Uso da pré-consulta pública isoladamente não comprova adoção paga. Suspender o piloto diante de incidente de dados, uso diagnóstico/prescritivo, certificação não autorizada, disputa de propriedade intelectual, enquadramento incompatível ou risco clínico.

## 10. Testes e release

O workflow comercial roda em toda PR para main e em todo push em main, sem filtros de paths. Inclui contrato canônico, termos, materiais, integridade, escopo, regressões da revisão adversarial, vitrine, TypeScript e jornadas de exportação em Chromium.

Os testes de integração executam handlers e middleware reais sobre SQLite com um adaptador transacional da interface D1. Cobrem drift persistido/HTTP, isolamento, duas leituras COUNT=2 antes de revogações, SQL direto, rollback, mudança de membership/tenant/vigência entre autorização e escrita e recuperação de vaga de ex-membro. Não são testes contra o D1 remoto de produção.

O teste de navegador usa os componentes comerciais e cliente HTTP reais em uma fixture isolada, com respostas de autorização sintéticas. Verifica os quatro downloads de HTML, acionamentos de impressão/cópia/e-mail, recusa sem saída e mudança de unidade durante resposta. Não realiza impressão física nem envio de e-mail. Não equivale a uma jornada de autenticação real no produto publicado.

### Dependência bloqueante de publicação

O workflow atual já aplica 0026 e 0027, mas **ainda não aplica 0028**. A alteração desse workflow foi bloqueada pela ferramenta. Antes de qualquer merge/release, é necessário acrescentar a execução de `db/migrations/0028_saas_commercial_final_authorization.sql` depois de 0027 e verificar a presença de `trg_commercial_material_usage_live_membership` juntamente com os demais triggers críticos. Preservar todas as proteções, credenciais e demais etapas existentes; nenhuma alteração de segredo é necessária.

Conferir no HEAD final os gates gerais, revisão independente e essa integração de release. Um CI de código verde não substitui migração conectada ao fluxo de publicação. Nenhuma migração foi executada em produção nesta correção.

### Rollback

Antes do merge, manter a PR sem publicar. Após release autorizado, preferir correção forward-only. Não remover triggers para contornar conflito nem reescrever 0026. Reversão do aplicativo não exige apagar os triggers aditivos; mensagens de erro de versões anteriores podem ser menos específicas. Qualquer correção administrativa de contrato/assento precisa de razão e auditoria.

## 11. Limites de conclusão

Merge não significa venda pública automática. A primeira venda depende de aprovação editorial dos quatro modelos, apresentação correta do recurso público, termos revisados, emissão fiscal/recebimento, responsável de suporte e seleção das até três instituições-piloto.

Backoffice de provisionamento, integração PSP e dashboard agregado permanecem evoluções separadas. PANT, NeuroBoard, prontuário e escalas de terceiros não entram por expansão silenciosa.
