# PRONTIDÃO PARA DADOS REAIS — NeuroPed EDJ
> Última revisão: 2026-05-08

---

## Status Atual: 🟡 NÃO PRONTO

O sistema não está apto para processar dados reais de pacientes identificáveis.

---

## Critérios de Prontidão

Para o sistema ser promovido a **MODO PRODUÇÃO** e processar dados reais de pacientes, **todos** os critérios abaixo devem ser atendidos:

### GRUPO A — Segurança Obrigatória (Blocante)

- [ ] **A1** — HTTPS obrigatório em toda a aplicação (TLS 1.2+)
- [ ] **A2** — `VITE_PIN_HASH` configurado com senha forte (≥12 caracteres, letras+números+símbolos)
- [ ] **A3** — `NEUROPED_MASTER_KEY` gerado com `openssl rand -base64 48` — único por ambiente
- [ ] **A4** — `NEUROPED_JWT_SECRET` gerado com `openssl rand -base64 64` — único por ambiente
- [ ] **A5** — `ADMIN_INITIAL_PASSWORD` substituído no primeiro login
- [ ] **A6** — Autenticação JWT server-side integrada com frontend (PIN client-side é complementar, não substituto)
- [ ] **A7** — Banco de dados em provedor com criptografia em repouso e backup automático
- [ ] **A8** — `NODE_ENV=production` e `CORS_ORIGINS` restrito ao domínio de produção
- [ ] **A9** — Nenhuma credencial ou chave exposta em código-fonte ou logs

### GRUPO B — LGPD / Conformidade (Blocante)

- [ ] **B1** — Política de privacidade publicada e atualizada (incluindo finalidade, retenção, direitos)
- [ ] **B2** — Base legal para tratamento de dados de saúde documentada (art. 11 LGPD)
- [ ] **B3** — Mecanismo de exclusão de dados do titular implementado
- [ ] **B4** — DPO ou encarregado nomeado e canal de contato publicado
- [ ] **B5** — Dados armazenados em servidor no Brasil (LGPD art. 33)
- [ ] **B6** — Consentimento dos pacientes/responsáveis coletado e registrado
- [ ] **B7** — Plano de resposta a incidentes documentado

### GRUPO C — Qualidade / Estabilidade (Recomendado)

- [ ] **C1** — Suite de testes cobrindo fluxos críticos (login, pacientes, escalas)
- [ ] **C2** — Monitoramento de erros (Sentry ou similar)
- [ ] **C3** — Monitoramento de disponibilidade (UptimeRobot ou similar)
- [ ] **C4** — Procedimento de backup testado e documentado
- [ ] **C5** — Revisão de código por profissional de segurança

---

## Progresso Atual

| Grupo | Concluídos | Total | % |
|-------|-----------|-------|---|
| A — Segurança | 0 | 9 | 0% |
| B — LGPD | 1 (B1 parcial) | 7 | 14% |
| C — Qualidade | 0 | 5 | 0% |
| **Total** | **~1** | **21** | **~5%** |

---

## O que foi feito até agora (2026-05-08)

- ✅ PIN hardcoded removido do código-fonte
- ✅ `verifyPin()` com SHA-256 implementado em `client/src/lib/pinAuth.ts`
- ✅ `.env.example` atualizado com `VITE_PIN_HASH`
- ✅ `SECURITY.md` atualizado com histórico de correções
- ✅ `docs/LGPD_CHECKLIST.md` criado
- ✅ Arquitetura de segurança do servidor documentada (bcrypt, JWT, AES-GCM, helmet)
- ✅ Service Worker auditado — não cachea dados sensíveis

---

## Próximos Passos Prioritários

1. Configurar `VITE_PIN_HASH` no `.env` com hash da senha atual
2. Fazer rebuild do projeto: `npm run build`
3. Endereçar itens do Grupo A (segurança) antes de qualquer deploy
4. Contratar avaliação jurídica para base legal LGPD (Grupo B)
5. Escolher provedor de hospedagem BR e configurar HTTPS
