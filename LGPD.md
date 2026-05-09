# LGPD — Conformidade Substantiva

> Documento tecnico-juridico descrevendo as medidas adotadas pelo NeuroPed EDJ
> para cumprimento da Lei 13.709/2018 (LGPD), em particular para tratamento
> de dados sensiveis de saude (art. 5º, II) por profissional habilitado.

---

## 1. Controlador

**Dr. Jadson Fraga Araujo Junior**
Neuropediatra — CRM-PE 25227 — RQE 17756
Rua Raimundo Lacerda, 001 — Sao Jose
Petrolina/PE — CEP 56302-470
Telefone: (87) 9 9109-7371

Atua como controlador (LGPD art. 5º, VI) e encarregado/DPO (art. 41).

## 2. Base legal

| Tipo de dado | Base legal | Fundamento |
|--------------|-----------|------------|
| Dados pessoais comuns (nome, email, telefone) | Art. 7º, V | Execucao de contrato |
| Dados pessoais comuns | Art. 7º, II | Cumprimento de obrigacao legal |
| Dados sensiveis de saude | Art. 11, II, "f" | Protecao da saude por profissional |
| Dados sensiveis com consentimento adicional | Art. 11, I | Consentimento especifico do titular |

## 3. Principios LGPD aplicados (art. 6)

### 3.1 Finalidade especifica
Cada coleta tem proposito documentado em `/api/consents`. Mudanca de finalidade requer novo consentimento.

### 3.2 Adequacao
Dados coletados sao restritos ao necessario para o cuidado clinico (anamnese, escalas, evolucao).

### 3.3 Necessidade (minimizacao)
- CPF coletado apenas se houver finalidade clara (ex: identificacao do paciente em laudo).
- Endereco e telefone do paciente NAO sao obrigatorios para uso clinico basico.
- Campos opcionais marcados como tal na UI.

### 3.4 Livre acesso
- Endpoint `/api/auth/me` retorna dados do usuario.
- Endpoint `/api/lgpd/export-request` permite portabilidade.
- Pagina `/configuracoes/exportar` (frontend) consome esses endpoints.

### 3.5 Qualidade dos dados
- Validacao Zod em toda entrada da API.
- Atualizacao de dados via `PATCH /api/patients/:id`.
- Versao timestampada em `updated_at`.

### 3.6 Transparencia
- Politica de Privacidade publica em `/privacidade.html`.
- Audit log expoe quais acessos houve aos dados (visivel ao titular sob solicitacao).

### 3.7 Seguranca (vide secao 5)

### 3.8 Prevencao
Audit logs imutaveis registram tentativas de acesso suspeitas (login falho, lockouts).

### 3.9 Nao discriminacao
Sistema nao toma decisoes automatizadas com efeito juridico/significativo sem revisao humana.

### 3.10 Responsabilizacao
Audit trail completa em `audit_logs` permite demonstrar adequacao em fiscalizacao da ANPD.

## 4. Direitos do titular (art. 18)

| Direito | Implementacao |
|---------|---------------|
| Confirmacao de existencia de tratamento | `GET /api/auth/me` + `GET /api/patients/:id` |
| Acesso aos dados | `POST /api/lgpd/export-request` (entrega em ate 15 dias - art. 19) |
| Correcao | `PATCH /api/patients/:id` |
| Anonimizacao/bloqueio | `POST /api/lgpd/delete-request` (anonymize) |
| Eliminacao | `POST /api/lgpd/delete-request` (delete) |
| Portabilidade | Exportacao em JSON estruturado |
| Informacao sobre compartilhamento | Documento em `/privacidade.html` (compartilhamento = nenhum) |
| Revogacao do consentimento | Pagina `/consentimento-lgpd` permite revogar |

Tempo de resposta: maximo 15 dias da solicitacao (LGPD art. 19, paragrafo unico).

## 5. Medidas tecnicas e organizacionais (art. 46)

### 5.1 Criptografia em repouso
- AES-256-GCM autenticado com IV unico por mensagem.
- Chave mestra derivada via PBKDF2-SHA256 (100.000 iteracoes) a partir de `NEUROPED_MASTER_KEY` (env).
- Aplicada a: `name`, `cpf`, `notes` em `patients`.
- Aplicada a: `answers` em `scale_results` (opcional, via campo `answers_encrypted`).

### 5.2 Criptografia em transito
- TLS 1.3 obrigatorio em producao (configuracao no provedor).
- HSTS habilitado via helmet (`max-age=31536000; includeSubDomains; preload`).

### 5.3 Hash de senha
- bcrypt com cost factor 12 (~250ms por hash).
- Politica: minimo 12 caracteres, maiuscula, minuscula, numero, especial.
- Lockout: 5 tentativas falhas = bloqueio por 15 minutos.

### 5.4 Autenticacao e sessao
- JWT HS256 (15 min de vida) + refresh token opaco (7 dias).
- Rotacao de refresh em cada uso, com deteccao de reuso.
- Invalidacao de sessoes em troca de senha.

### 5.5 Audit log imutavel
- Tabela `audit_logs` com ~25 tipos de evento (login, CRUD paciente, consent, export).
- Cada evento registra: usuario, IP, user-agent, timestamp, recurso afetado.
- Retencao: minimo 5 anos (alinhado a Resolucao CFM 1638/2002).

### 5.6 Controle de acesso
- 4 papeis: `admin`, `professional`, `reader`, `operator`.
- Middleware `requireRole` em todas as rotas sensiveis.
- Frontend `RouteGuard` em rotas clinicas.

### 5.7 Rate limiting
- Global: 100 req/min por IP em `/api/*`.
- Login: 5 tentativas / 15min.
- Email: 10 envios / hora.

### 5.8 Headers de seguranca
- helmet com CSP restritiva, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.

### 5.9 Backup
- Producao: snapshot diario do banco com retencao de 30 dias.
- Configurar no provedor (RDS automated backups, Supabase backups, etc).

## 6. Tratamento de dados de menores (art. 14)

Dados de pacientes menores de idade exigem consentimento do responsavel legal:

- Tipo de consentimento: `responsavel_legal_menor`
- Registrado com: nome do responsavel, parentesco, CPF do responsavel
- Validade: enquanto durar o tratamento clinico
- Revogavel a qualquer momento

## 7. Compartilhamento

**Politica:** o NeuroPed EDJ NAO compartilha dados pessoais com terceiros, exceto:

1. Quando exigido por ordem judicial
2. Quando solicitado pelo proprio titular (ex: relatorio para outro profissional)
3. Operadores tecnicos sob contrato de processamento (provedor de email SMTP, hospedagem)

Fornecedores atualmente em uso (configurar contrato/DPA com cada um):

| Fornecedor | Funcao | Local | DPA |
|------------|--------|-------|-----|
| __DEFINIR__ | Hospedagem | Brasil (preferencial) | Pendente assinatura |
| __DEFINIR__ | Email transacional (SMTP) | __DEFINIR__ | Pendente |

## 8. Retencao

| Tipo de dado | Retencao | Base |
|--------------|----------|------|
| Prontuario clinico | 20 anos apos ultimo atendimento | Resolucao CFM 1821/2007 |
| Audit logs | 5 anos | Boas praticas + LGPD art. 16 |
| Refresh tokens | 7 dias (auto-expirados) | Funcional |
| Consentimentos | Permanente (incluindo revogados) | Demonstracao de boa-fe |

Apos o prazo, dados sao anonimizados ou destruidos seguramente.

## 9. Incidentes de seguranca (art. 48)

Em caso de incidente que possa acarretar risco aos titulares:

1. **Ate 24h:** investigacao interna, contencao, registro tecnico
2. **Ate 48h:** comunicacao a ANPD via SEI/Gov.br
3. **Ate 7 dias:** comunicacao aos titulares afetados
4. **Documentacao:** relatorio formal arquivado por 5 anos

Canal de notificacao interna: telefone (87) 9 9109-7371.

## 10. Auditoria

Auditoria interna trimestral revisa:

- Logs de acesso suspeitos
- Tentativas falhas de login
- Pedidos LGPD pendentes
- Atualizacao de dependencias com CVEs
- Backup integro (teste de restore)

Auditoria externa recomendada: anual, por consultoria especializada em saude digital.

## 11. Atualizacoes deste documento

| Data | Versao | Mudancas |
|------|--------|----------|
| 2026-05-07 | 1.0 | Documento inicial fullstack-lgpd-backend |

---

*Este documento integra a politica de governanca de dados do NeuroPed EDJ. Atualizacoes obrigatorias a cada mudanca regulatoria ou alteracao significativa do sistema.*
