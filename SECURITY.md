# SECURITY — NeuroPed EDJ

**Versão:** v5.1-truth-pass
**Última revisão:** 2026-05-28
**Status de segurança:** **DEMO — não usar dados reais**

---

## 1. Postura geral

Esta build é uma demonstração premium. Não há autenticação profissional, não há proteção criptográfica para dados em repouso, não há trilha de auditoria, não há controle de sessão server-side. Qualquer pessoa com acesso ao link público pode visualizar todo o conteúdo educacional e desbloquear os módulos profissionais demo com um PIN local.

**Não inserir dados de pacientes reais nesta versão.**

---

## 2. Modelo de ameaças (T)

| Ator | Capacidade | Impacto |
|---|---|---|
| Visitante anônimo | Lê código-fonte e descobre PIN MASTER | Acessa módulos demo (sem dados reais → sem impacto) |
| Atacante curioso | Abre DevTools e lê localStorage | Vê estado da sessão; se houver dados reais, vazamento |
| Atacante avançado | Modifica `app.js` localmente para bypass de RLS | Sem RLS server-side, qualquer payload é aceito pelo backend (se houver) |
| Familiar curioso | Acessa dispositivo do médico | Vê pacientes salvos localmente |
| Médico distraído | Insere dados reais por engano | Dados ficam em localStorage não criptografado |

---

## 3. Controles implementados (limitados)

| Controle | Status | Comentário |
|---|---|---|
| HTTPS obrigatório | ✓ | GitHub Pages força TLS |
| Service Worker scope | ✓ | Apenas escopo do app |
| Banner de demonstração | ✓ | Visível na primeira sessão |
| Marcação visível de dados demo | ✓ | Pacientes `[DEMO]` |
| PDF com carimbo "DEMONSTRAÇÃO" | ✓ | Aviso no rodapé |
| Demo banner persistente | ✓ | Reaparece a cada sessão |
| Modo profissional gated por PIN | ⚠ parcial | PIN em texto claro no JS — apenas barreira de UX, não segurança |
| Authentication | ✗ | Não implementada |
| MFA | ✗ | Não implementado |
| RLS no banco | ✗ | Sem banco real |
| Audit log | ✗ | Não implementado |
| Sentry/monitoramento | ✗ | Não implementado |
| Rate limiting | ✗ | Não implementado |
| Criptografia em repouso | ✗ | localStorage é texto claro |

---

## 4. Controles obrigatórios para evolução a MVP clínico

### 4.1 Autenticação real
- Supabase Auth com magic link OU OTP via SMS
- Email verificado obrigatoriamente
- Senha NÃO armazenada pelo app (Supabase gerencia bcrypt)
- Logout limpa todos os tokens

### 4.2 MFA obrigatório para perfis sensíveis
- `admin` e `medico` exigem MFA TOTP
- Recuperação via backup codes (não SMS, suscetível a SIM swap)
- MFA não é opcional após primeira ativação

### 4.3 Controle de acesso baseado em papel (RBAC)
Tabela `profiles` com coluna `role`. Roles iniciais:
- `admin` — todas operações
- `medico` — pacientes, consultas, instrumentos, laudos
- `secretaria` — agenda, cobrança, comunicação básica; **sem** prontuário
- `terapeuta` — apenas pacientes vinculados a si, com restrições
- `familia` — apenas o paciente autorizado e questionários liberados

### 4.4 Row Level Security
- Toda tabela com dados de paciente DEVE ter RLS ligada
- Sem exceções "para o admin via service_role"
- Testes automatizados de RLS antes de cada deploy

### 4.5 Trilha de auditoria
Logar em `audit_log` (imutável, append-only):
- Login / logout / falhas de login
- Criação, leitura sensível (PII), alteração, exclusão de paciente
- Geração de laudo
- Compartilhamento de passe familiar
- Mudança de configuração de segurança
- Acesso ao painel administrativo

### 4.6 Proteção de segredos
- Nenhuma chave secreta no frontend (`app.js`, `data.js`)
- `SUPABASE_ANON_KEY` é a única chave segura para frontend
- Webhooks de pagamento: validar assinatura HMAC obrigatoriamente
- Variáveis de ambiente em Cloudflare Pages, nunca em commit

### 4.7 Política de senhas / passwordless
- Magic link com expiração de 15 min
- Single use
- Rate limit: 3 magic links por hora por IP
- Bloqueio após 5 tentativas inválidas de MFA

### 4.8 Gestão de sessão
- JWT com expiração de 1h
- Refresh token rotativo
- Revogação em logout
- Bloqueio de sessões antigas em mudança de senha

---

## 5. Testes obrigatórios antes de marcar "seguro"

| Cenário | Esperado |
|---|---|
| Acessar paciente de outra clínica via URL direta | 403 |
| Acessar paciente de outro médico (mesma clínica) sem autorização | 403 |
| Reutilizar passe familiar expirado | 401 |
| Tentar editar consulta de outro médico via curl | 403 |
| Acessar `/api/admin/*` como `secretaria` | 403 |
| Acessar `/api/admin/*` sem MFA | 403 |
| Tentar SQL injection nos campos do paciente | sanitizado |
| Tentar XSS nos campos de mensagem | sanitizado |
| Logout em uma aba invalida sessão em todas | sim |
| Backup local após logout | apagado |

Nenhum desses testes pode passar com sucesso de bypass. Falha = bloqueador de produção.

---

## 6. Resposta a incidentes (futuro)

| Evento | Ação |
|---|---|
| Suspeita de credencial vazada | Revogar sessões + forçar reset |
| Acesso indevido confirmado | Notificar ANPD em 72h conforme LGPD art. 48 |
| Bug de segurança reportado | Resposta em 24h, correção em 7 dias |
| Vazamento de dados sensíveis | Notificar titular + ANPD + medidas mitigatórias |

---

## 7. Limitações conhecidas desta versão (transparência)

- PIN MASTER `FRAGA1108` está em texto claro no `app.js`. **Qualquer pessoa com DevTools consegue descobrir.**
- O propósito do PIN nesta versão é apenas evitar exposição acidental dos módulos demo a quem só quer conteúdo educacional. **Não é mecanismo de segurança.**
- Não há registro de quem acessou os módulos profissionais demo.
- Dados em localStorage podem ser inspecionados/alterados por extensões do navegador.

Esta documentação foi escrita para ser **lida e respeitada** antes de qualquer evolução do produto.
