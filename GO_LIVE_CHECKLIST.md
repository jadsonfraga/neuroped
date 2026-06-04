# GO LIVE CHECKLIST — NeuroPed SDG

Checklist obrigatório antes de aceitar o primeiro paciente real no sistema.

Cada item exige evidência verificável. Sem evidência, NÃO marque como concluído.

## P0 — Bloqueadores absolutos

### Infraestrutura
- [ ] Projeto Supabase em produção criado (evidência: URL do projeto)
- [ ] Schema aplicado com todas as tabelas previstas em ARCHITECTURE.md (evidência: migration SQL)
- [ ] RLS ativada em pacientes, consultas, submissions, audit_log (evidência: query `pg_policies`)
- [ ] Cloudflare Pages configurado com domínio próprio (não github.io)
- [ ] DNS apontando para domínio próprio com HTTPS válido
- [ ] Service Worker NÃO cacheia rotas privadas (`/api/*`, `/auth/*`)

### Autenticação
- [ ] Supabase Auth ativo com magic link
- [ ] MFA TOTP obrigatório para `admin` e `medico`
- [ ] Backup codes implementados
- [ ] Logout limpa sessão em todos os dispositivos
- [ ] Rate limiting configurado (3 magic links/hora/IP)

### Autorização
- [ ] Políticas RLS testadas com Playwright para cada role
- [ ] Acesso cross-clínica retorna 403
- [ ] Acesso cross-médico testado
- [ ] Passe familiar limita a paciente + instrumento específicos

### Dados
- [ ] Backups automatizados configurados no Supabase
- [ ] Política de retenção documentada
- [ ] Mecanismo de exclusão de dados implementado (LGPD art. 18)
- [ ] Mecanismo de portabilidade implementado (LGPD art. 18 V)
- [ ] Exportação de dados do titular implementada

### LGPD
- [ ] Termo de uso e política de privacidade revisados por advogado especializado
- [ ] Fluxo de consentimento informado implementado
- [ ] Consentimento registrado em tabela `consents` com timestamp e versão
- [ ] DPO designado (pode ser o próprio Dr. Jadson)
- [ ] Canal de comunicação com ANPD documentado
- [ ] Processo de notificação de incidente em 72h documentado

### Trilha de auditoria
- [ ] `audit_log` ativa e inalterável
- [ ] Login / logout / falhas registrados
- [ ] Visualização sensível de PII registrada
- [ ] Alteração de dados de paciente registrada
- [ ] Geração de laudo registrada

### Segredos
- [ ] Nenhuma chave secreta no frontend (audit do bundle)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` apenas em Functions
- [ ] Webhooks com validação HMAC
- [ ] Rotação de chaves documentada

### Instrumentos clínicos
- [ ] Apenas instrumentos com `app_status: live` aparecem como aplicáveis
- [ ] Instrumentos clássicos sem licença removidos ou marcados como catálogo
- [ ] Cada instrumento `live` tem scoring documentado e revisado clinicamente
- [ ] Disclaimers de uso operacional vs normatizado visíveis

### Laudos
- [ ] Carimbo "DEMONSTRAÇÃO" removido APENAS após integração de assinatura digital
- [ ] Provedor de assinatura ICP-Brasil contratado (Bry, Vault ID, ou equivalente)
- [ ] PDF gerado server-side, não no navegador
- [ ] PDF gravado em Supabase Storage privado
- [ ] URL assinada com expiração curta

### Testes
- [ ] Suíte Playwright cobrindo os 12 fluxos E2E obrigatórios
- [ ] Testes de acesso indevido passando
- [ ] Testes de RLS passando
- [ ] Lighthouse mobile ≥ 90 em todas as páginas públicas
- [ ] Lighthouse acessibilidade ≥ 95

### Monitoramento
- [ ] Sentry frontend ativo com mascaramento de PII
- [ ] Cloudflare Analytics ativo
- [ ] Health check endpoint monitorado
- [ ] Alertas configurados para erros server-side

## P1 — Necessários para comercialização

### Pagamentos
- [ ] Provedor de pagamento contratado (Asaas, Stripe)
- [ ] PIX e cartão funcionais em sandbox
- [ ] Assinatura recorrente testada (criar, cancelar, upgrade, downgrade)
- [ ] Webhooks de pagamento verificando assinatura HMAC
- [ ] Idempotência em endpoints de webhook
- [ ] Bloqueio de funcionalidades por plano implementado
- [ ] Conciliação financeira documentada

### Comunicação
- [ ] Sistema de mensagens com persistência segura e RLS
- [ ] Notificações sem revelar conteúdo sensível em tela bloqueada
- [ ] E-mail transacional configurado (SES, Resend, Postmark)
- [ ] Política de comunicação documentada

### Telemedicina (se for ofertar)
- [ ] WebRTC com TURN server configurado
- [ ] Consentimento específico de telemedicina implementado
- [ ] Registro da modalidade em prontuário
- [ ] Conformidade com Resolução CFM 2.314/2022 documentada
- [ ] Política de gravação ou não gravação definida
- [ ] Regras para atendimento de menores
- [ ] Critérios para conversão em presencial

## P2 — Maturidade operacional

- [ ] CI/CD com gates de qualidade automatizados
- [ ] Ambiente staging idêntico a produção
- [ ] Rollback automatizado por commit
- [ ] Documentação para onboarding de novos membros da equipe
- [ ] SLA documentado
- [ ] Plano de continuidade de negócio
- [ ] Plano de disaster recovery

## Critérios para declarar "MVP clínico para uso interno controlado"

Todas as P0 completadas + auditoria interna por terceiro.

## Critérios para declarar "SaaS comercializável"

Todas as P0 + todas as P1 + auditoria de segurança externa.

## Critérios para declarar "nota 10/10"

Todas as P0 + P1 + P2 + nova auditoria independente sem achados críticos.
