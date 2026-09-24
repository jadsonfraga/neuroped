# Backlog da espiral SaaS

Prioridade: P0 segurança/perda/risco clínico · P1 jornada contratada,
cobrança, isolamento, recuperação · P2 usabilidade/confiabilidade ·
P3 refinamento/expansão.

## S1 · P1 · FECHADO (ciclo 1)
go-live declara nível atestado e o que não comprova. Evidência em
EVIDENCE.md#S1.

## S2 · P2 · FECHADO (ciclo 2)
Recusa EMAIL_VERIFICATION_REQUIRED no onboarding exibe "Reenviar link de
verificação" levando a `#/verificar-email`. Contrato:
tests/unit/onboarding-verification-link.test.mjs (em test:quick-wins).

## S3 · P1 · FECHADO (ciclo 3)
Acesso (12) e Comercial (8) inventariados com evidência por import direto;
lacuna auth/me fechada com contrato próprio no mesmo ciclo. Próximo domínio
a inventariar: Núcleo clínico.

## S4 · P1 · bloqueado externamente
Integração sandbox Asaas real (degrau INTEGRACAO_SANDBOX_EXERCITADA).
Bloqueio: exige credencial sandbox autorizada pelo proprietário; testes
atuais interceptam o provedor. Comprovação esperada: webhook sandbox
autenticado processado num ambiente publicado.

## S5 · P2 · aberto
Restauração demonstrada (§12): diferenciar backup configurado/executado/
restauração exercitada, com prova em ambiente isolado.
