# NeuroPed — Rollout do Clinical Core LIVE

## Objetivo

Esta mudança adiciona uma camada incremental de Clinical Core LIVE multi-clínica sem reutilizar as tabelas DEMO. O domínio LIVE passa a cobrir pacientes cifrados, eventos clínicos, avaliações e respostas de instrumentos, documentos versionados, retenção, exportação e solicitações de eliminação controlada.

A habilitação continua **fail-closed**. A presença do código e da migração não libera o tráfego clínico por si só: o servidor exige `CLINICAL_LIVE_ENABLED=true`, um keyring clínico válido e membership explícita na clínica. Billing também é recalculado no servidor para cada rota LIVE.

## Alterações entregues

| Camada | Implementação | Garantia principal |
| --- | --- | --- |
| Banco | `db/migrations/0014_saas_tenant_lifecycle.sql` | Tabelas aditivas, índices, foreign keys, escopo físico por `clinic_id` e triggers de tenant |
| Eventos | `functions/api/live/events/index.ts` | Proveniência, payload cifrado, leitura/escrita tenant-aware e supersession |
| Pacientes | `functions/api/live/patients/index.ts` e `functions/api/live/patients/[id].ts` | Perfil cifrado, blind index, leitura, edição com optimistic concurrency e arquivamento lógico |
| Avaliações | `functions/api/live/assessments/index.ts` | Instrumento/versionamento explícitos, respostas cifradas, append-only e supersession |
| Documentos | `functions/api/live/documents/index.ts` | Versões append-only, conteúdo cifrado, visibilidade familiar explícita e auditoria |
| Governança | `functions/api/live/governance/index.ts` | Retenção, exportação, eliminação controlada e workflow `requested → approved → processing → completed/rejected` |
| Interface | `ClinicContext`, `ClinicSwitcher`, pacientes, detalhe, prontuário e `SaveToPatient` | Troca de clínica com limpeza de cache; rotas LIVE sem fallback silencioso para legado |
| Billing | guards nas rotas LIVE e links de convite | Clinical/export/admin recalculados server-side; convite exige `APP_BASE_URL` válida |
| Operação | `.github/workflows/saas-billing-d1-migration.yml` | Aplicação idempotente da 0014 e verificação de tabelas/triggers no D1 remoto |

## Variáveis obrigatórias

| Variável | Regra | Efeito quando ausente ou inválida |
| --- | --- | --- |
| `CLINICAL_LIVE_ENABLED` | Deve ser exatamente `true` para liberar o domínio | As rotas LIVE respondem `503 CLINICAL_LIVE_DISABLED` |
| `CLINICAL_DATA_KEY` | Segredo atual com pelo menos 32 caracteres | Rotas LIVE respondem `503 CLINICAL_CRYPTO_NOT_CONFIGURED` |
| `CLINICAL_DATA_KEY_ID` | Identificador alfanumérico seguro; padrão técnico `k1` | Keyring inválido; tráfego bloqueado |
| `CLINICAL_DATA_KEY_PREVIOUS` | Opcional durante rotação | Necessário para decifrar registros ainda vinculados à chave anterior |
| `CLINICAL_DATA_KEY_PREVIOUS_ID` | Opcional; diferente do ID atual | Colisão de IDs bloqueia o keyring |
| `CLINICAL_INDEX_KEY` | Segredo separado da chave de dados, com pelo menos 32 caracteres | Blind indexes não podem ser gerados; tráfego bloqueado |
| `APP_BASE_URL` | URL válida; em produção deve usar HTTPS | Convites não são criados nem reenviados |
| `ENVIRONMENT` | Use `production` no ambiente produtivo | Ativa a exigência de HTTPS para convites |

> **Nunca** grave chaves clínicas no repositório, no frontend, em logs ou em variáveis compartilhadas com o blind index. A rotação usa a chave anterior somente para leitura; novas gravações usam a chave atual.

## Sequência de implantação

### 1. Preparação

Faça backup operacional do D1 conforme a política de infraestrutura vigente e confirme que o deploy aponta para o banco correto. Valide, sem publicar tráfego clínico, a existência das variáveis obrigatórias e a separação entre `CLINICAL_DATA_KEY` e `CLINICAL_INDEX_KEY`.

### 2. Migração

Execute a migração `0014_saas_live_clinical_domains.sql` pelo workflow versionado. O workflow repete a aplicação de forma idempotente e consulta `sqlite_master` para confirmar as sete tabelas LIVE e os triggers de isolamento/imutabilidade.

### 3. Smoke test técnico

Com `CLINICAL_LIVE_ENABLED` ainda desligado, confirme que chamadas para `/api/live/patients`, `/api/live/events`, `/api/live/assessments`, `/api/live/documents` e `/api/live/governance` retornam bloqueio explícito. Depois, habilite o flag em ambiente controlado e valide login, listagem de clínicas, troca de clínica, criação de paciente, registro de avaliação, documento versionado e solicitação de exportação.

### 4. Liberação gradual

Libere primeiro para uma clínica de teste com trial/assinatura válidos e membership conhecida. Confirme no `saas_audit_log` as ações de criação/edição. Em seguida, habilite as demais clínicas por configuração de ambiente, sem migrar dados DEMO automaticamente.

## Rollback

O rollback de aplicação deve seguir esta ordem:

1. **Desabilitar imediatamente** `CLINICAL_LIVE_ENABLED`, mantendo as tabelas intactas para investigação. Isso impede novas leituras e escritas LIVE sem apagar evidências.
2. Reverter o bundle da aplicação para a versão anterior, se necessário.
3. Preservar `0014` no banco. **Não execute `DROP TABLE`, `DELETE` amplo ou rollback destrutivo**: avaliações, documentos e eventos LIVE são auditáveis e a migração é aditiva.
4. Se a falha for de chave, restaure a configuração correta ou a chave anterior compatível. Não altere o conteúdo cifrado manualmente.
5. Reexecute os contratos de segurança e verifique que o modo DEMO/local permanece funcional e que o endpoint legado de documentos continua falhando fechado quando aplicável.

A reversão do código **não** implica reversão física dos dados. Qualquer eliminação de dados deve passar pelo workflow de governança e pela retenção aprovada da clínica.

## Contratos de segurança relevantes

O servidor nunca confia somente no `clinicId` enviado pelo cliente. Cada rota resolve o usuário autenticado, consulta a membership ativa, recalcula entitlement de billing e só então consulta ou modifica linhas com `clinic_id` explícito. O role global de administrador não é bypass entre clínicas.

Payloads clínicos são cifrados com AES-GCM e chave derivada por clínica; blind indexes usam chave separada. Auditorias armazenam metadados operacionais e identificadores, não o conteúdo clínico. Documentos e avaliações não são sobrescritos: correções criam nova versão/evento e marcam a anterior conforme o contrato.

A exportação cria uma solicitação auditável. A eliminação é representada por solicitação com workflow e **não realiza exclusão física automática**. `auto_delete_enabled` permanece uma configuração explícita, mas a implementação entregue não executa deleção automática.

## Validações executadas

| Gate | Resultado |
| --- | --- |
| Compilação isolada das Functions Cloudflare alteradas | Aprovado |
| `npm run build` | Aprovado; permanece apenas o warning preexistente de chunks grandes |
| ESLint direcionado nos arquivos alterados | Aprovado |
| `git diff --check` | Aprovado |
| Teste físico da migração e triggers SQLite | Aprovado |
| `npm run test:no-fake-clinical-write` | Aprovado |
| Contrato LIVE novo | Aprovado: isolamento, supersession, cifragem contratual, append-only, UI e billing |
| `npm run test:quick-wins` | Não totalmente aprovado por falha preexistente em `route-guard-policy.test.ts` para `/neuroacompanhamento`; a falha não aponta para os arquivos desta mudança |
| `npm run check` | Contém erros TypeScript preexistentes no backend Express, especialmente `Request.user`; as Functions novas passaram na checagem isolada |

## Gaps conscientes antes de classificar como produção clínica plena

A migração 0014 e as rotas novas estão prontas para validação controlada, mas a classificação final ainda depende de configuração real de produção, execução do workflow D1 no ambiente alvo, smoke test com conta clínica e confirmação independente de backup/restauração.

O endpoint LIVE de pacientes limita a primeira listagem a 100 registros e ainda não entrega uma busca server-side paginada. O portal familiar e a visibilidade de documentos foram modelados no banco e no contrato, mas não constituem uma experiência familiar completa. Exportações e eliminações possuem fila/workflow e auditoria, porém ainda exigem um worker operacional para produzir artefatos e executar a etapa aprovada de eliminação conforme política institucional.

O fluxo de convite já existe, mas o envio efetivo de e-mail permanece dependente da integração operacional existente; o backend agora impede links gerados com domínio fallback ou HTTP em produção. Também permanece necessário corrigir a falha preexistente de classificação da rota `/neuroacompanhamento` antes de declarar o gate geral de release verde.

## Referências internas

- [`db/migrations/0014_saas_tenant_lifecycle.sql`](../db/migrations/0014_saas_tenant_lifecycle.sql)
- [`functions/api/live/events/index.ts`](../functions/api/live/events/index.ts)
- [`functions/api/live/patients/index.ts`](../functions/api/live/patients/index.ts)
- [`functions/api/live/assessments/index.ts`](../functions/api/live/assessments/index.ts)
- [`functions/api/live/documents/index.ts`](../functions/api/live/documents/index.ts)
- [`functions/api/live/governance/index.ts`](../functions/api/live/governance/index.ts)
- [`tests/unit/saas-live-clinical-domains.test.ts`](../tests/unit/saas-live-clinical-domains.test.ts)
- [`functions/api/tenant/_crypto.ts`](../functions/api/tenant/_crypto.ts)
- [`functions/api/billing/_guard.ts`](../functions/api/billing/_guard.ts)
