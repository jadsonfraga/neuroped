# Dr. Jadson Fraga NeuroPed EDJ

Aplicativo PWA educacional e demonstrativo com escalas, questionários, farmacologia e recursos de apoio em neuropediatria.

## Acesso

URL: https://jadsonfraga.github.io/neuroped/

## Status atual

Esta versão publicada em GitHub Pages é uma versão estática de demonstração.

- Não deve ser usada como prontuário médico real.
- Não deve receber dados identificáveis de pacientes reais.
- Não utiliza CPF como senha.
- Não publica dados clínicos em serviço público externo.
- O Portal das Famílias está desativado nesta versão estática.
- A assinatura digital real deve ser feita por serviço externo válido ou integração própria segura.

## Stack atual

- Frontend: React + Vite em build pré-compilado
- PWA: Manifest + Service Worker
- Hospedagem: GitHub Pages com deploy automático via GitHub Actions
- Persistência local: apenas localStorage para demonstração

## Próxima versão recomendada

Para uso real:

1. Recriar o projeto-fonte com `src/`, `package.json`, `vite.config` e `.env.example`.
2. Usar Cloudflare Pages para frontend.
3. Usar Supabase Auth para login profissional e familiar.
4. Usar Supabase Postgres com Row Level Security.
5. Implementar auditoria por usuário.
6. Implementar criptografia, permissões e logs.
7. Separar ambiente demo e produção.
8. Implementar assinatura digital juridicamente válida ou linguagem documental segura.

## Identidade profissional

Dr. Jadson Fraga Araújo Júnior  
Neurologista Infantil  
CRM-PE 25.227 | RQE 17.756  
NeuroPed EDJ  
Rua Raimundo Lacerda, 001 — Bairro São José — Petrolina/PE — CEP 56302-470  
Telefone: (87) 9 9109-7371  
E-mail: drjadsonfraga@proton.me

## Aviso

Ferramenta educacional e de apoio. Não substitui avaliação médica, prontuário formal, prescrição validada ou documento assinado por meio juridicamente adequado.
