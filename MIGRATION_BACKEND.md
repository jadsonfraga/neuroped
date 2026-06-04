# Plano de Migração de Backend — NeuroPed SDG

> Documento técnico-operacional descrevendo o estado atual do armazenamento de dados, riscos identificados e plano de migração para infraestrutura adequada a uso clínico real e em conformidade com a LGPD.

---

## 1. Situação atual

### Camadas de persistência identificadas

| Camada | Tecnologia | Tipo de dado | Localização | Risco |
|--------|-----------|--------------|-------------|-------|
| Local (browser) | `localStorage`, `sessionStorage`, `IndexedDB` | Configurações de UI, dados clínicos transitórios, metadados de PWA | Dispositivo do usuário | Baixo (sem rede) — porém sem criptografia em repouso |
| Remoto legado | `npoint.io` (protótipo) | Eventualmente referências, não dados clínicos identificáveis | Serviço de terceiros nos EUA | **Alto** — não conformidade LGPD para dados sensíveis, sem SLA, sem contrato de processamento |
| Estático | GitHub Pages | Bundle JS/CSS, imagens, manifest, SW | CDN GitHub (EUA) | Baixo (apenas conteúdo público) |

### Limitações conhecidas

- **Sem autenticação real**: o PIN local estático é gate cosmético, não previne acesso por inspeção do bundle
- **Sem criptografia em repouso**: dados em `localStorage` são leitura plena
- **Sem auditoria**: não há log de quem acessou o quê
- **Sem backup**: dados ficam atrelados ao dispositivo
- **CPF como senha (legado)**: padrão a ser eliminado nesta versão segura
- **`npoint.io` como protótipo**: serviço gratuito sem garantias de privacidade ou retenção

---

## 2. Riscos do `npoint.io`

### Por que evitar para dados clínicos

1. **Localização**: servidores nos EUA, fora da jurisdição brasileira. LGPD exige base legal específica para transferência internacional de dados sensíveis (art. 33).
2. **Sem contrato de processamento**: não há DPA (Data Processing Agreement) padrão.
3. **Sem garantia de retenção**: dados podem ser apagados a qualquer momento sem aviso.
4. **Sem SLA**: não há garantia de disponibilidade.
5. **Sem auditoria**: impossível atestar quem acessou.
6. **Sem criptografia em repouso garantida**: documentação não menciona AES at-rest.

### Status no app

O `npoint.io` é tratado como **legado/protótipo** e **não armazena dados clínicos identificáveis** na versão pública atual. Mantemos referências para preservar funcionalidades não-críticas até a migração.

---

## 3. Plano de migração

### Fase 1 — Curto prazo (camada pública segura) — **ATUAL**

- [x] Remover dependência de `npoint.io` para qualquer dado clínico identificável
- [x] Criar política de curadoria pública/restrita
- [x] Restringir módulos sensíveis da navegação pública
- [x] Eliminar padrão "CPF como senha"
- [x] Documentar plano de migração (este documento)

### Fase 2 — Médio prazo (backend brasileiro)

Stack recomendada para dados clínicos reais:

| Componente | Opção primária | Opção secundária |
|------------|---------------|------------------|
| **Hospedagem** | AWS São Paulo (sa-east-1) | Magalu Cloud (BR), Locaweb |
| **Banco de dados** | PostgreSQL gerenciado (RDS sa-east-1) | Supabase (selecionar região mais próxima) |
| **Autenticação** | Auth0 com região BR ou Supabase Auth | Cognito São Paulo |
| **Storage de documentos** | S3 sa-east-1 com criptografia SSE-KMS | Backblaze B2 com região EU |
| **Email transacional** | Brevo (BR-friendly) | Amazon SES sa-east-1 |
| **Edge / CDN** | Cloudflare (com TLS 1.3) | AWS CloudFront |

### Tabelas prioritárias para migração

Em ordem de criticidade:

1. **`patients`** — dados identificáveis do paciente
2. **`scale_results`** — resultados de avaliações vinculados a paciente
3. **`portal_documents`** — laudos, receitas, relatórios
4. **`audit_logs`** — quem acessou o quê e quando (imutável)
5. **`consents`** — registros de consentimento LGPD (data, IP, base legal, finalidade)
6. **`medications`** — base de farmacologia (não sensível, pode ficar pública)
7. **`scales`** — metadados de escalas (não sensível, pode ficar pública)

### Requisitos não-funcionais obrigatórios

- **Criptografia em repouso**: AES-256 nativo do RDS Postgres + colunas sensíveis com pgcrypto
- **Criptografia em trânsito**: TLS 1.3 obrigatório
- **Backup**: snapshots diários com retenção 30 dias, snapshot semanal com retenção 1 ano
- **Auditoria**: todo acesso a dado de paciente registra em `audit_logs` (user_id, patient_id, action, timestamp, ip)
- **Rate limiting**: 100 req/min por usuário autenticado, 10 req/min por IP anônimo
- **MFA obrigatório**: para qualquer acesso a dados clínicos (TOTP via Authenticator)
- **Revogação de sessão**: invalidação imediata após logout ou suspeita

### Fase 3 — Longo prazo (compliance certificado)

- Auditoria externa de segurança (penteste anual)
- Certificação ISO 27001 ou similar
- Contrato de processamento (DPA) assinado com fornecedores
- Política de privacidade revisada por advogado especialista em LGPD para área de saúde
- Plano de resposta a incidente (incluindo notificação ANPD em até 48h conforme art. 48 LGPD)

---

## 4. Estimativa de custo

### Fase 2 — Operação mensal

| Item | Faixa de custo (BRL) |
|------|---------------------|
| RDS Postgres (db.t4g.micro sa-east-1) | R$ 80–150/mês |
| S3 sa-east-1 (10 GB + transferência) | R$ 15–40/mês |
| Auth0 (até 7.500 usuários ativos) | Gratuito → R$ 130/mês |
| Cloudflare (Pro) | Gratuito → R$ 110/mês |
| Brevo email (até 20.000/mês) | Gratuito → R$ 100/mês |
| Backup automático e snapshots | R$ 30–60/mês |
| **Total operação** | **R$ 130–600/mês** |

### Fase 2 — Setup único

| Item | Faixa (BRL) |
|------|-------------|
| Desenvolvimento do backend (API REST + auth + banco + auditoria) | R$ 8.000–25.000 |
| Migração de dados existentes (se houver) | R$ 1.000–4.000 |
| Revisão jurídica LGPD por advogado especialista | R$ 1.500–5.000 |
| Auditoria de segurança inicial (mini-penteste) | R$ 2.500–8.000 |
| **Total setup** | **R$ 13.000–42.000** |

---

## 5. Marcos de progresso

- [ ] Stack escolhida e contratada
- [ ] Schema migrado com Drizzle/Prisma
- [ ] Auth implementada (login profissional + portal família com link único)
- [ ] CRUD de pacientes com auditoria
- [ ] CRUD de resultados de escalas
- [ ] Upload e leitura de documentos com URLs assinadas
- [ ] Política de privacidade revisada
- [ ] Termo de consentimento implementado in-app
- [ ] Testes de carga (até 100 usuários simultâneos)
- [ ] Penteste pré-produção
- [ ] Migração dos dados existentes (com consentimento dos usuários atuais)
- [ ] Switchover do app público para apontar ao novo backend
- [ ] Monitoramento ativo (Sentry + uptime)

---

## 6. Pendências críticas antes de aceitar dado real

Esta lista é **bloqueante**. Nenhum dado clínico identificável deve ser registrado no servidor antes que **todos** os itens estejam concluídos:

1. Hospedagem em servidor brasileiro contratada
2. TLS 1.3 obrigatório, HSTS preload
3. Criptografia at-rest configurada
4. Autenticação com MFA implementada
5. Auditoria de acesso ativa e testada
6. Backup automático funcionando e testado (restore validado)
7. Política de privacidade revisada juridicamente
8. Termo de consentimento ativo e arquivado
9. Encarregado/DPO nomeado (atualmente Dr. Jadson Fraga)
10. Canal de exercício de direitos LGPD (art. 18) operacional

---

## 7. Atualizações deste documento

| Data | Versão | Mudanças |
|------|--------|----------|
| 07/05/2026 | 1.0 | Documento inicial — safe-public-layer-v1 |

---

*Documento mantido pelo controlador de dados. Próxima revisão: ao iniciar Fase 2 ou em mudança regulatória relevante.*