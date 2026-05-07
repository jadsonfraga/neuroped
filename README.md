# NeuroPed EDJ

PWA educacional de apoio neuropediátrico do Dr. Jadson Fraga Araújo Júnior.

Estado atual: modo demo seguro. Não usar com pacientes reais até configurar backend, autenticação, banco com RLS, auditoria e assinatura digital juridicamente válida.

## Acesso

URL prevista no GitHub Pages:

```txt
https://jadsonfraga.github.io/neuroped/
```

## Identidade institucional

Dr. Jadson Fraga Araújo Júnior  
Neurologista Infantil  
CRM-PE 25.227 | RQE 17.756  
NeuroPed EDJ  
Fraga Serviços Médicos LTDA — CNPJ 33.158.207/0001-48  
Rua Raimundo Lacerda, 001 — Bairro São José — Petrolina/PE — CEP 56302-470  
Telefone: (87) 9 9109-7371  
E-mail: drjadsonfraga@proton.me

## Correções aplicadas

### Segurança imediata

- Removido o fluxo ativo de armazenamento clínico em endpoint público externo.
- Removido o modelo de acesso familiar com CPF como senha.
- Removida a linguagem ativa de assinatura digital ICP-Brasil simulada.
- Padronizada a identidade médica como Neurologista Infantil.
- Removida a entrada HTML gerada por ferramenta externa.
- App passa a abrir em modo demo seguro, bloqueando uso real de dados clínicos.

### Profissionalização técnica

- Criado projeto-fonte em `src/`.
- Criado `package.json` com scripts de desenvolvimento, build, lint e typecheck.
- Criado `vite.config.ts`.
- Criado workflow GitHub Actions com instalação, lint, typecheck, build e deploy de `dist/`.
- Criado `.env.example`.
- Separado modo `demo` e modo `production` por variável de ambiente.

### Caminho para produção

- Criado cliente Supabase protegido por configuração de ambiente.
- Criada migração SQL com tabelas clínicas, convites familiares, auditoria e políticas RLS.
- Exportação PDF atual é apenas visual via impressão do navegador.
- Assinatura digital real deve ser integrada por serviço juridicamente válido antes de uso médico documental.

## Stack

- React
- TypeScript
- Vite
- GitHub Pages
- Supabase, quando configurado em produção

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run lint
npm run typecheck
npm run build
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`.

```txt
VITE_APP_ENV=demo
VITE_APP_BASE_PATH=/neuroped/
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Para produção:

```txt
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

Nunca coloque `service_role` key no frontend.

## Supabase

Antes de ativar produção:

1. Criar projeto Supabase.
2. Aplicar a migração em `supabase/migrations/20260506_secure_clinical_core.sql`.
3. Ativar autenticação.
4. Revisar políticas RLS.
5. Testar perfis `doctor`, `staff` e `family`.
6. Validar auditoria e revogação de acesso familiar.

## Aviso clínico e jurídico

Esta ferramenta, no estado atual, tem caráter educacional e de demonstração. Não substitui consulta médica, avaliação presencial, prontuário certificado, prescrição eletrônica regulamentada nem assinatura digital válida.

Para uso real com pacientes, é obrigatório validar LGPD, segurança da informação, assinatura digital, controle de acesso, logs de auditoria e política de retenção documental.
