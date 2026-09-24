# Backlog da espiral SaaS

Prioridade: P0 segurança/perda/risco clínico · P1 jornada contratada,
cobrança, isolamento, recuperação · P2 usabilidade/confiabilidade ·
P3 refinamento/expansão.

## S1 · P1 · FECHADO (ciclo 1)
go-live declara nível atestado e o que não comprova. Evidência em
EVIDENCE.md#S1.

## S2 · P2 · aberto
Onboarding: quando `POST /api/tenants` recusa com
`EMAIL_VERIFICATION_REQUIRED`, a mensagem aparece mas não há link direto
para `#/verificar-email`. Aceite: erro com esse código exibe ação "Reenviar
link de verificação" navegando à página; teste de contrato cobre.
Dependência: nenhuma.

## S3 · P1 · aberto
Inventário §5: registro por funcionalidade em inventory.json. Estado atual
cobre só o examinado no ciclo 1; denominador real desconhecido. Aceite:
domínios Acesso e Comercial com todas as jornadas listadas e classificadas.

## S4 · P1 · bloqueado externamente
Integração sandbox Asaas real (degrau INTEGRACAO_SANDBOX_EXERCITADA).
Bloqueio: exige credencial sandbox autorizada pelo proprietário; testes
atuais interceptam o provedor. Comprovação esperada: webhook sandbox
autenticado processado num ambiente publicado.

## S5 · P2 · aberto
Restauração demonstrada (§12): diferenciar backup configurado/executado/
restauração exercitada, com prova em ambiente isolado.
