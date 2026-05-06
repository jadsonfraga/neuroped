# Dr. Jadson Fraga NeuroPed

Aplicativo PWA de apoio educacional e clínico em neuropediatria, com escalas, questionários, farmacologia, testes do neurodesenvolvimento e ferramentas de organização clínica.

## Acesso publicado

URL de produção:

https://jadsonfraga.github.io/neuroped/

Rota direta da anamnese inteligente:

https://jadsonfraga.github.io/neuroped/#/anamnese-inteligente

## Stack atual

- Frontend: React + Vite em build pré-compilado.
- Hospedagem: GitHub Pages.
- PWA: `manifest.json`, `sw.js`, ícones e cache offline.
- Deploy: GitHub Actions via `.github/workflows/deploy.yml`.

## Como o deploy funciona

O workflow de deploy publica o conteúdo da raiz do repositório no GitHub Pages quando há push na branch `main` ou execução manual pelo GitHub Actions.

Como este repositório contém o build final pré-compilado, não há etapa de `npm install` ou `npm run build` no deploy atual.

## Fluxo recomendado de alteração

1. Criar branch a partir de `main`.
2. Alterar arquivos estáticos ou substituir o build gerado.
3. Abrir Pull Request para revisão.
4. Conferir checks do GitHub Actions.
5. Fazer merge apenas após validação visual do app publicado em preview ou ambiente local.

## Cuidados de segurança

- Não armazenar dados reais de pacientes neste repositório público.
- Não publicar senhas, PINs reais, tokens, chaves privadas ou arquivos `.env`.
- Não tratar PIN de frontend como autenticação forte.
- Para uso com dados clínicos reais, migrar para backend seguro, autenticação individual, banco criptografado e trilha de auditoria.

## Limitações técnicas atuais

O repositório contém principalmente o build final do app, não o código-fonte completo em React/Vite. Para manutenção robusta, recomenda-se preservar também o projeto-fonte com `src/`, `package.json`, lockfile, scripts de build, lint e testes.

## Autor

Dr. Jadson Fraga Araújo Júnior  
Neurologista Infantil — CRM-PE 25.227 | RQE 17.756
