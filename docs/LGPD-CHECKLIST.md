# Checklist LGPD — antes de guardar dados reais de pacientes

> ⚠️ Este é um **ponto de partida técnico/organizacional**, NÃO é parecer
> jurídico. Dados de saúde de **crianças** são dados pessoais **sensíveis**
> (LGPD art. 11) e o tratamento de dados de menores tem regras próprias (art.
> 14). Faça revisão com apoio **jurídico** e observe as normas do **CFM**.

Só ative `DEMO_API_WRITES_ENABLED=true` (escrita clínica real) depois disto.

## Base legal e consentimento
- [ ] Base legal definida (em geral **consentimento** do responsável, art. 14 §1º).
- [ ] Termo de consentimento claro, específico e destacado, assinado pelo
      **responsável legal** (o app já tem `/consentimento-lgpd` — revise o texto).
- [ ] Finalidade declarada e **minimização**: colete só o necessário.

## Segurança técnica
- [ ] Dados médicos **só** no subdomínio protegido por **Cloudflare Access** +
      login JWT (nunca no host público/estático).
- [ ] `NEUROPED_JWT_SECRET` forte e secreto; `CORS_ORIGINS` restrito ao host médico.
- [ ] Banco (D1) com acesso restrito; considere **criptografia** de campos
      sensíveis em repouso.
- [ ] PIN/senha fortes (10+ caracteres), fora do repositório público.
- [ ] **Log de auditoria** ativo (o app tem `audit-log.ts`) — quem acessou o quê.
- [ ] Backup e plano de **retenção/descarte** (não guardar além do necessário).

## Direitos do titular e governança
- [ ] Canal para o titular exercer direitos (acesso, correção, exclusão,
      portabilidade) — art. 18.
- [ ] Processo de **resposta a incidente** (notificar ANPD e titulares).
- [ ] Registro das operações de tratamento (art. 37).
- [ ] Avaliar necessidade de **Encarregado (DPO)**.
- [ ] **Contrato de processamento** com o processador (Cloudflare) e verificação
      de **local de armazenamento**/transferência internacional.

## Conteúdo clínico
- [ ] Conteúdo educativo com aviso de "não substitui avaliação" (já aplicado na
      zona pública).
- [ ] Conteúdo autoral/não-validado claramente rotulado (ver nota crítica).

## Enquanto não estiver pronto
- [ ] API em **somente-leitura** (padrão) — não guardar paciente real.
- [ ] Divulgar às famílias **apenas** o link público (conteúdo educativo).
