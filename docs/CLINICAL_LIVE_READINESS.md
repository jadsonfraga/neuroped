# Clinical LIVE Readiness

> Este documento é um contrato operacional interno. A habilitação para dados reais depende de validação do responsável técnico, segurança da informação e assessoria jurídica/privacidade. O NeuroPed permanece em homologação enquanto qualquer gate abaixo estiver pendente.

## Política de ativação

O Clinical Core LIVE somente pode ser considerado pronto quando **todos** os sinais a seguir forem verdadeiros no mesmo ambiente:

| Gate | Sinal | Comportamento quando ausente |
|---|---|---|
| Banco | Binding `DB` aponta para o D1 de produção/homologação controlada | As rotas LIVE retornam `SAAS_DB_NOT_CONFIGURED` |
| Feature flag | `CLINICAL_LIVE_ENABLED=true` configurado deliberadamente | As rotas LIVE retornam `CLINICAL_LIVE_DISABLED` |
| Keyring de dados | `CLINICAL_DATA_KEY` com ID válido e segredo com pelo menos 32 caracteres | As rotas LIVE retornam `CLINICAL_CRYPTO_NOT_CONFIGURED` |
| Keyring de índice | `CLINICAL_INDEX_KEY` existe e é diferente das chaves de dados | O keyring é considerado inválido |
| Rotação | Chaves atual/anterior possuem IDs distintos | O keyring é considerado inválido |
| LGPD/governança | `CLINICAL_LGPD_READY=true` após aprovação do checklist de privacidade, retenção, direitos do titular e resposta a incidentes | As rotas LIVE retornam `CLINICAL_LGPD_NOT_READY` |
| Tenant | O usuário possui membership ativa na clínica e papel compatível | A API retorna `TENANT_FORBIDDEN` |
| Integridade clínica | O paciente pertence à clínica; eventos passam pelo schema canônico | A API retorna `PATIENT_NOT_FOUND` ou `CLINICAL_CORE_VALIDATION_ERROR` |

O endpoint `/api/version` somente anuncia `realPatientsEnabled=true`, endpoints LIVE e modo `CLINICAL_LIVE_READY` quando banco, feature flag, keyring e gate LGPD estão simultaneamente prontos. A presença de uma única flag nunca deve ser interpretada como autorização para dados reais.

## Persistência e auditoria

O perfil do paciente é cifrado com AES-GCM derivado por HKDF e associado ao tenant e ao propósito do registro por AAD. O banco LIVE não deve conter nome, responsável, observação clínica ou payload clínico em colunas plaintext. Identidade e referências externas usam blind index segregado por clínica; o índice não substitui criptografia.

Criações, correções e leituras de pacientes e timelines são registradas em `saas_audit_log`. Mutações clínicas e seus registros de auditoria são compostos no mesmo `db.batch()`. Leituras clínicas também devem ser auditadas em batch; se o log de acesso não puder ser persistido, a resposta clínica falha fechado e não devolve o payload ao cliente.

A correção de evento é append-only: um evento ativo é marcado como `corrected` e o sucessor é inserido com `supersedes_event_id`. O cliente não deve oferecer edição ou exclusão destrutiva no LIVE enquanto não houver contrato auditável de arquivamento, correção e recuperação.

## Fronteira demo/LIVE

Com D1 configurado, rotas clínicas legadas que apontam para `patients_demo`, `consultations_demo`, `scale_results_demo` ou `documents_demo` retornam `410 CLINICAL_LEGACY_RETIRED`. O frontend deve mostrar o estado de readiness e não pode tentar fallback silencioso para essas tabelas. Demo permanece disponível apenas para homologação sem D1 clínico ativo.

## Checklist antes de qualquer piloto

1. Aplicar migrations em uma base de homologação vazia e validar que as tabelas LIVE não possuem colunas de PHI plaintext.
2. Configurar secrets por ambiente; nunca reutilizar `CLINICAL_DATA_KEY` como `CLINICAL_INDEX_KEY`.
3. Executar teste de rotação com chave anterior e restauração em base descartável.
4. Validar membership, último owner, isolamento entre duas clínicas e negação para papéis sem leitura/escrita clínica.
5. Confirmar que consentimentos e registros de privacidade estão versionados e que o checklist LGPD foi aprovado antes de definir `CLINICAL_LGPD_READY=true`.
6. Executar testes automatizados, build e um E2E autenticado em dados sintéticos.
7. Registrar a decisão de promoção, responsáveis, janela, plano de rollback e evidência de backup.

A ativação do gate LGPD e o uso de pacientes reais continuam sendo decisões humanas de governança; nenhum workflow deve alterar `CLINICAL_LGPD_READY` ou os secrets clínicos automaticamente.
