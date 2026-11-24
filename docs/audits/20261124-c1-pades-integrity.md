# C1 — integridade PAdES e bloqueios externos (24/11/2026)

Issue #1387. Escopo deste PR: verificação criptográfica local de CMS emitido pelo NeuroPed, com cobertura integral do ByteRange; não é validação de confiança ICP-Brasil. A verificação passa pelo assinador comum antes do retorno dos bytes. Certificados de testes são sintéticos.

## Bloqueios e próximas etapas
- BLOCKED_EXTERNAL_ICP_TRUST: cadeia oficial de confiança, política aplicável, revogação OCSP/LCR, vínculo CPF/CRM/UF verificado e validação independente no backend ainda precisam ser implementados e homologados. Não usar status declarado pelo navegador como prova. Validar PDF de teste real no ITI sob controle do médico; não subir certificado, senha ou PHI ao repositório.
- BLOCKED_EXTERNAL_SNCR: API e ambiente de treinamento Anvisa, domínio brasileiro autorizado e autenticação do prescritor; conferir contrato vigente, resposta/numeração, QR oficial, idempotência e falhas. Não inventar número. Trava de transição existente deve permanecer até integração homologada.
- Sessão A1 com expiração/logout, consentimento por documento, auditoria imutável e distribuição do PDF original continuam no backlog #1387.

QA: executar npm run test:clinical-documents e npm run check; testes de adulteração incluídos. Este PR não declara QA concluído nem aptidão jurídica. Rollback: reverter commit/PR, sem migração ou alteração de dados; não liberar PDF cuja integridade não esteja comprovada.
