# Supabase Setup — NeuroPed EDJ

## 1. Criar projeto

1. Acesse o painel Supabase.
2. Crie um novo projeto.
3. Guarde `Project URL` e `anon public key`.
4. Nunca use `service_role` no frontend.

## 2. Aplicar migracao

No SQL Editor, execute o arquivo:

```txt
supabase/migrations/20260506_secure_clinical_core.sql
```

Depois confirme:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Todas as tabelas clinicas devem aparecer com RLS ativo.

## 3. Auth

Configurar pelo menos uma opcao:

- E-mail/senha com confirmacao.
- Magic link/OTP.
- Provedor externo confiavel, se necessario.

Nunca usar CPF como senha.

## 4. Variaveis de ambiente

No provedor de deploy:

```txt
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

## 5. Perfis iniciais

Apos criar o primeiro usuario medico, inserir perfil:

```sql
insert into public.profiles (id, role, display_name)
values ('USER_UUID_AQUI', 'doctor', 'Dr. Jadson Fraga Araujo Junior');
```

## 6. Validacao minima

- Usuario sem login nao le dados.
- Usuario `family` so le paciente com grant valido.
- Grant expirado bloqueia leitura.
- Usuario `doctor` acessa auditoria.
- Usuario `family` nao acessa auditoria.
