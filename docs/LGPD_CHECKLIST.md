# LGPD — Checklist de Conformidade
> NeuroPed EDJ | Última revisão: 2026-05-08

---

## Status Geral

🟡 **EM PROGRESSO** — Sistema em fase de homologação. Não deve processar dados reais de pacientes identificáveis até todos os itens obrigatórios estarem marcados como ✅.

---

## 1. Base Legal e Finalidade

| Item | Status | Observação |
|------|--------|-----------|
| Definir base legal para tratamento de dados de pacientes | ⬜ | Art. 7º, VIII LGPD — tutela saúde (requer avaliação jurídica) |
| Finalidade do tratamento documentada | ⬜ | Documentar: qual dado, para quê, por quanto tempo |
| Dados coletados limitados ao mínimo necessário (minimização) | ⬜ | Verificar campos do cadastro de pacientes |
| Dados de menores de idade: autorização parental documentada | ⬜ | Sistema trata crianças e adolescentes — crítico |
| Dados sensíveis (saúde): base legal específica documentada | ⬜ | Art. 11 LGPD — dados de saúde são sensíveis |

---

## 2. Transparência e Direitos do Titular

| Item | Status | Observação |
|------|--------|-----------|
| Política de privacidade disponível | ✅ | `/privacy-policy.html` existe no build |
| Termos de uso disponíveis | ✅ | `/terms-of-use.html` existe no build |
| Mecanismo para titular solicitar acesso aos dados | ⬜ | Implementar rota/formulário de requisição |
| Mecanismo para titular solicitar exclusão dos dados | ⬜ | Implementar "direito ao esquecimento" |
| Mecanismo para titular solicitar portabilidade | ⬜ | Exportação de dados em formato aberto |
| Mecanismo para titular revogar consentimento | ⬜ | Painel de controle do titular |

---

## 3. Segurança dos Dados

| Item | Status | Observação |
|------|--------|-----------|
| Criptografia em repouso (campos sensíveis) | ✅ | AES-256-GCM via NEUROPED_MASTER_KEY |
| Criptografia em trânsito (HTTPS) | ⬜ | Obrigatório em produção |
| Hash de CPF para busca sem exposição | ✅ | HMAC-SHA256 conforme SECURITY.md |
| Senhas com hash seguro (bcrypt) | ✅ | bcrypt cost 12 |
| Controle de acesso baseado em papel (RBAC) | ✅ | Roles implementadas no servidor |
| Logs de auditoria para ações sensíveis | ✅ | Tabela audit_logs + endpoints /api/audit-log |
| localStorage sem dados sensíveis | ✅ | Auditado sessão 2 — apenas prefs de UI |
| sessionStorage para tokens JWT | ✅ | authClient.ts usa sessionStorage (volátil) |
| secureStorage.ts para dados futuros | ✅ | AES-GCM + PBKDF2, expiração 8h |
| Service Worker sem cache de dados clínicos | ✅ | Network Only para /api/ e /patients |
| Backup automático | ⬜ | Configurar no provedor de produção |
| Teste de restauração de backup | ⬜ | Validar periodicamente |
| Plano de resposta a incidentes | ⬜ | Documentar procedimento |

---

## 4. Localização dos Dados

| Item | Status | Observação |
|------|--------|-----------|
| Banco de dados em servidor no Brasil | ⬜ | LGPD art. 33 — transferência internacional requer requisitos |
| Backups em servidor no Brasil | ⬜ | Idem |
| Fornecedores terceiros processam dados no BR | ⬜ | Verificar provedor escolhido |
| DPA (Data Processing Agreement) com fornecedores | ⬜ | Especialmente se usar Supabase/Neon/Vercel |

---

## 5. Retenção e Descarte

| Item | Status | Observação |
|------|--------|-----------|
| Política de retenção de dados definida | ⬜ | Quanto tempo guardar dados de pacientes? |
| Mecanismo de exclusão segura após prazo | ⬜ | Soft delete + purge programado |
| Dados de pacientes demo/teste segregados de dados reais | ✅ | Sistema atual usa apenas dados demo |
| Logs de auditoria com retenção própria | ⬜ | Definir período (recomendado: mínimo 5 anos para saúde) |

---

## 6. Responsável (DPO)

| Item | Status | Observação |
|------|--------|-----------|
| DPO ou encarregado nomeado | ⬜ | Nomear responsável pelo tratamento |
| Canal de contato com DPO publicado | ⬜ | Email/formulário de contato para titulares |
| Registro de operações de tratamento (ROPA) | ⬜ | Documentar todas as operações |

---

## 7. Notificação de Incidentes

| Item | Status | Observação |
|------|--------|-----------|
| Procedimento de notificação à ANPD documentado | ⬜ | Prazo: 2 dias úteis para incidentes graves |
| Procedimento de notificação aos titulares documentado | ⬜ | Prazo razoável após conhecimento do incidente |
| Canal de comunicação de incidentes definido | ⬜ | Email dedicado a incidentes |

---

## 8. Dados Específicos do NeuroPed

| Dado | Sensibilidade | Status de Proteção |
|------|--------------|-------------------|
| Nome do paciente | Pessoal | ✅ Criptografado (AES-GCM) |
| Data de nascimento | Pessoal | ✅ Armazenado |
| Diagnósticos | Sensível (saúde) | ⬜ Verificar criptografia |
| Resultados de escalas | Sensível (saúde) | ⬜ Verificar criptografia |
| Notas clínicas | Sensível (saúde) | ✅ Criptografado (AES-GCM) conforme SECURITY.md |
| CPF (se coletado) | Pessoal | ✅ Hash HMAC-SHA256 |
| Dados de responsáveis legais | Pessoal | ⬜ Verificar |

---

## Classificação LGPD do Sistema

Com base nos itens acima, o sistema está classificado como:

### 🟡 MODO HOMOLOGAÇÃO
- Pode processar apenas **dados fictícios/demo**
- Não deve processar dados reais de pacientes identificáveis
- Ver `docs/PRONTIDAO_DADOS_REAIS.md` para critérios de promoção

---

_Próxima revisão programada: antes de qualquer deploy em produção com dados reais._
