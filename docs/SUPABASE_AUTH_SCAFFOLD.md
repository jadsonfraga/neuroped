# Scaffold Supabase Auth — NeuroPed EDJ

## O que foi preparado

- Cliente Supabase tipado.
- Tipos TypeScript para tabelas publicas.
- Servico de autenticacao.
- Servico de auditoria.
- Servico de pacientes.
- Servico de documentos.
- Servico de grants familiares.
- Painel de login condicionado ao ambiente.

## Modo demo

Em `VITE_APP_ENV=demo`, o login fica desativado e nenhum servico real deve ser usado.

## Modo producao

Para ativar:

```txt
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

## Primeiro perfil medico

Depois de criar o usuario no Supabase Auth:

```sql
insert into public.profiles (id, role, display_name)
values ('USER_UUID_AQUI', 'doctor', 'Dr. Jadson Fraga Araujo Junior');
```

## Proximas etapas de codigo

1. Criar dashboard pos-login.
2. Criar tela de listagem de pacientes com dados pseudonimizados.
3. Criar fluxo de convite familiar.
4. Registrar auditoria em cada acao sensivel.
5. Criar testes automatizados quando houver Supabase local/CLI.
