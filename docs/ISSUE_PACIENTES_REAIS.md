# ISSUE — Habilitar PACIENTES REAIS (planejamento, NÃO implementar)

> Estado atual: `mode: DEMO_HOMOLOGACAO`, `realPatientsEnabled: false`. Este documento é o
> checklist de pré-requisitos. **NÃO mexer no flag `realPatientsEnabled` nem implementar nada**
> sem revisão de segurança + base legal aprovadas. Dados reais só atrás de Cloudflare Access.

## Pré-requisitos (todos obrigatórios antes de ligar o flag)

### 1. Banco real (D1)
- [ ] Schema real (não `*_demo`): `patients`, `scale_results`, `documents`, `consultations`, `audit_log`, `consents`.
- [ ] Migrations versionadas (`drizzle`/SQL) + procedimento de aplicação.
- [ ] `database_id` real confirmado (`neuroped-db`) e separado do demo.

### 2. Autenticação / autorização (enforced)
- [ ] JWT validado (assinatura + expiração + segredo de ambiente) em **TODA** rota sensível das Functions.
- [ ] Checagem de papel (admin/professional/operator/reader) por rota.
- [ ] Sem bypass de demo quando `realPatientsEnabled=true`.
- [ ] Cloudflare Access (login wall) + PIN como defesa em profundidade.

### 3. Ownership / escopo por profissional (sem RLS nativo no D1)
- [ ] Toda query escopada ao profissional autenticado (paciente só visível ao dono/equipe autorizada).
- [ ] Cobertura de teste de ownership (base: `test:ownership` já existe).
- [ ] Negar acesso cruzado entre profissionais por padrão.

### 4. Criptografia
- [ ] D1 é encriptado at-rest pela Cloudflare (confirmar/documentar).
- [ ] Avaliar **cripto de campo** para PII mais sensível (nome, notas clínicas) + **gestão de chave** (rotação, custódia, não-hardcoded).
- [ ] TLS em trânsito (Cloudflare default).

### 5. LGPD / privacidade
- [ ] Captura e armazenamento de **consentimento** (tipo, versão, base legal, finalidade, data).
- [ ] **Direitos do titular:** acesso, correção, exclusão/portabilidade.
- [ ] Política de **retenção** + descarte.
- [ ] **Registro de tratamento** (ROPA) + DPA com a Cloudflare.
- [ ] Aviso de privacidade visível.

### 6. Backup / continuidade
- [ ] Estratégia de backup/export do D1 (time-travel/export) com **RPO e RTO** definidos.
- [ ] Teste de restore documentado.

### 7. Cutover demo → real
- [ ] Plano de migração (sem misturar dado demo com real).
- [ ] Janela de manutenção + rollback.
- [ ] Flip de `realPatientsEnabled` só após tudo acima + revisão de segurança.

## Riscos
- Vazamento de PII por gap de auth/ownership.
- Não-conformidade LGPD (multa/responsabilidade).
- Perda de dados sem backup testado.
- Exposição pública se o Access não estiver configurado **antes** de ligar dados reais.

## Decisão
**Bloqueado até:** revisão de segurança + base legal (LGPD) aprovadas pelo Dr., e Cloudflare Access de pé. **Nenhuma implementação nesta rodada.**
