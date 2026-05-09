# Cloud Storage — Guia de Configuracao

> Como configurar Postgres + Object Storage para o NeuroPed EDJ.
> O codigo e multi-provedor; voce escolhe o que melhor se adequa ao orcamento e LGPD.

---

## Arquitetura

```
NeuroPed EDJ (cloud)
|
|-- Banco de dados (Postgres)
|   |-- Supabase (sa-east-1)   — recomendado para BR
|   |-- Neon serverless         — barato, US-East com replica BR
|   |-- AWS RDS sa-east-1       — compliance maxima
|
|-- Object Storage (S3-compatible)
|   |-- Supabase Storage        — mesmo provedor do DB, sa-east-1
|   |-- Cloudflare R2           — zero egress fees
|   |-- AWS S3 sa-east-1        — compliance maxima
|   |-- Backblaze B2            — alternativa barata
|
|-- App (Express + React + Vite)
    |-- Node.js no Render/Fly/Railway/AWS
```

---

## Setup recomendado: Supabase (BR-friendly, all-in-one)

**Por que:** Postgres + Storage no mesmo provedor, regiao sa-east-1 (Sao Paulo), free tier 500MB DB + 1GB storage, escalabilidade simples, RLS nativo, dashboards prontos.

### Passos

1. **Criar conta:** https://supabase.com (sign up com GitHub)
2. **Criar projeto:**
   - Name: `neuroped-edj`
   - Database password: gerar forte
   - **Region: South America (Sao Paulo)** ← criticamente importante para LGPD
   - Plan: Free (depois Pro $25/mes quando crescer)

3. **Obter credenciais:**
   - Project Settings -> Database -> Connection string -> URI (mode: Transaction)
   - Copiar para `DATABASE_URL` no `.env`
   - Substituir `[YOUR-PASSWORD]` pela senha real

4. **Criar bucket de storage:**
   - Storage -> New bucket
   - Name: `neuroped-files`
   - Public: **NO** (privado)
   - File size limit: 50 MB

5. **Obter credenciais Storage S3:**
   - Project Settings -> API -> Storage -> S3 access keys
   - Click "New key" -> nome `neuroped-app`
   - Copiar Access Key ID e Secret Access Key
   - Anotar Project Reference (em Project Settings -> General -> Project ID)

6. **Configurar policies de bucket (RLS):**
   No SQL Editor:

   ```sql
   -- Permite que o backend (com service_role) faca tudo no bucket neuroped-files
   -- Bloqueia acesso anonimo
   CREATE POLICY "Backend access only"
   ON storage.objects FOR ALL
   TO authenticated
   USING (bucket_id = 'neuroped-files');
   ```

7. **Atualizar `.env`:**

   ```env
   DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<password>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
   DATABASE_SSL=true

   STORAGE_PROVIDER=supabase
   STORAGE_ENDPOINT=https://<PROJECT_REF>.supabase.co/storage/v1/s3
   STORAGE_REGION=sa-east-1
   STORAGE_BUCKET=neuroped-files
   STORAGE_ACCESS_KEY=<seu_access_key_id>
   STORAGE_SECRET_KEY=<seu_secret_access_key>
   STORAGE_FORCE_PATH_STYLE=false
   ```

8. **Rodar migrations:**

   ```bash
   npm run db:push
   ```

   Isso cria as tabelas no Postgres da Supabase.

9. **Testar:**

   ```bash
   npm run dev
   # Em outra aba:
   curl http://localhost:5000/api/health
   # Deve retornar: { storage: "supabase", database: "postgres", ... }
   ```

---

## Alternativa: Cloudflare R2 (cheap egress)

Use R2 se seu trafego de download for alto e voce quer minimizar custos.

### Setup R2 Storage

1. Criar conta Cloudflare: https://dash.cloudflare.com
2. R2 -> Create bucket
   - Name: `neuroped-files`
   - Location hint: South America
3. R2 -> Manage R2 API tokens -> Create token
   - Permissions: Object Read & Write
   - Bucket: neuroped-files
   - Copiar Access Key ID e Secret + S3 endpoint URL

4. `.env`:

   ```env
   STORAGE_PROVIDER=r2
   STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   STORAGE_REGION=auto
   STORAGE_BUCKET=neuroped-files
   STORAGE_ACCESS_KEY=<r2_access_key>
   STORAGE_SECRET_KEY=<r2_secret_key>
   STORAGE_FORCE_PATH_STYLE=true
   ```

R2 nao tem regiao BR, entao para LGPD voce ainda precisa de DPA com Cloudflare.

---

## Alternativa: AWS S3 sa-east-1 (compliance maxima)

Use AWS para projetos B2B/SUS/grandes hospitais que exigem certificacoes formais.

### Setup S3

1. Console AWS -> S3 -> Create bucket
   - Name: `neuroped-edj-files`
   - Region: **South America (Sao Paulo) sa-east-1**
   - Block all public access: **YES**
   - Encryption: SSE-S3 (default) ou SSE-KMS
   - Versioning: Enabled (recomendado para auditoria)

2. IAM -> Users -> Create user `neuroped-app`
   - Programmatic access
   - Attach policy:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": [
         "s3:PutObject",
         "s3:GetObject",
         "s3:DeleteObject",
         "s3:HeadObject",
         "s3:ListBucket"
       ],
       "Resource": [
         "arn:aws:s3:::neuroped-edj-files",
         "arn:aws:s3:::neuroped-edj-files/*"
       ]
     }]
   }
   ```

3. `.env`:

   ```env
   STORAGE_PROVIDER=s3
   STORAGE_REGION=sa-east-1
   STORAGE_BUCKET=neuroped-edj-files
   STORAGE_ACCESS_KEY=<aws_access_key_id>
   STORAGE_SECRET_KEY=<aws_secret_access_key>
   STORAGE_FORCE_PATH_STYLE=false
   # STORAGE_ENDPOINT nao necessario para AWS S3
   ```

4. Para Postgres: usar AWS RDS sa-east-1 (configurar separadamente).

Custo aproximado: R$ 30-80/mes em S3 (10GB armazenado + transferencia moderada) + R$ 80-300/mes em RDS db.t4g.micro/small.

---

## Migracao SQLite -> Postgres

Se voce comecou em dev com SQLite e quer migrar para Postgres em producao:

### 1. Exportar dados do SQLite

```bash
sqlite3 neuroped.db .dump > backup.sql
```

### 2. Adaptar SQL para Postgres

O dump do SQLite usa sintaxe propria. Use ferramenta como [pgloader](https://pgloader.io):

```bash
pgloader sqlite:///path/to/neuroped.db postgresql://user:pass@host/neuroped
```

Ou rode `npm run db:push` para criar schema vazio no Postgres e use scripts de seed.

### 3. Verificar

```bash
psql $DATABASE_URL -c "SELECT count(*) FROM users;"
psql $DATABASE_URL -c "SELECT count(*) FROM patients;"
```

### 4. Apontar producao para Postgres

Em producao, definir `DATABASE_URL` faz o app detectar Postgres automaticamente.
Manter SQLite em dev local fica opcional (continua funcionando se `DATABASE_URL` for unset).

---

## Custos comparados

### Cenario pequeno (validacao, ate 100 pacientes, 1GB storage)

| Stack | Custo/mes | LGPD |
|-------|-----------|------|
| Supabase Free + Render free | R$ 0 | Aceitavel (DPA pendente) |
| Supabase Pro + Render Standard | R$ 175 | Bom |
| Neon free + R2 + Render | R$ 35 | Aceitavel |
| AWS RDS micro + S3 + EB | R$ 350-500 | Excelente |

### Cenario medio (500 pacientes, 10GB storage)

| Stack | Custo/mes | LGPD |
|-------|-----------|------|
| Supabase Pro + Fly.io GRU | R$ 175-250 | Bom |
| AWS RDS small + S3 + EB | R$ 600-900 | Excelente |
| Locaweb VPS + S3 BR | R$ 200-400 | Excelente |

### Cenario grande (5000 pacientes, 100GB storage)

| Stack | Custo/mes | LGPD |
|-------|-----------|------|
| Supabase Team | R$ 1.250 | Bom |
| AWS multi-AZ + S3 + CloudFront | R$ 2.500-4.000 | Excelente (ISO 27001) |

---

## Checklist de migracao para nuvem

- [ ] Criar conta no provedor escolhido
- [ ] Criar projeto/bucket
- [ ] Configurar regiao (sa-east-1 quando possivel)
- [ ] Habilitar criptografia at-rest
- [ ] Habilitar SSL/TLS em transito
- [ ] Criar credenciais com permissoes minimas
- [ ] Atualizar `.env` (NUNCA commitar)
- [ ] Rodar `npm run db:push`
- [ ] Testar `/api/health` retornando provider correto
- [ ] Testar upload de arquivo via frontend
- [ ] Configurar backup automatico no provedor
- [ ] Assinar DPA (Data Processing Agreement)
- [ ] Documentar fluxo de dados na politica de privacidade
- [ ] Revisar com advogado LGPD (se for usar com dados reais)

---

## Resolucao de problemas

### "STORAGE_PROVIDER nao definido"
Falta variavel `STORAGE_PROVIDER` no `.env`. Configure conforme acima.

### "Falha ao conectar Postgres: SSL"
Adicione `?sslmode=require` na `DATABASE_URL` ou defina `DATABASE_SSL=true`.

### "Cannot signed URL: Invalid bucket"
Verificar se `STORAGE_BUCKET` existe e o usuario tem permissao.

### "AccessDenied" no Supabase
A service_role key tem acesso total. Verifique se esta usando a chave correta (nao a anon key).

### "ETIMEDOUT" no S3
Verifique firewall do provedor de hospedagem. Algumas hospedagens bloqueiam egress.

---

Atualizado: 2026-05-08.
