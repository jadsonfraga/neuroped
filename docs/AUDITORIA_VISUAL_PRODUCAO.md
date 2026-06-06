# Auditoria visual e funcional de produção — NeuroPed

Data/hora: 2026-06-06T17:26:30Z  
URL alvo: https://www.neuroped.pages.dev  
Branch de trabalho: chore/sdg-sprint-9-real

## Escopo e honestidade

- Navegador real em produção: **não medido**. Tentativa de acesso HTTP a `https://www.neuroped.pages.dev` retornou `403 Forbidden` no ambiente de execução.
- Playwright em navegador real: **não medido**. Instalação de `@playwright/test` via registry npm retornou `403 Forbidden`.
- Auditoria realizada nesta sprint: inspeção estática do build publicado no repositório, validação de referências locais, service worker, manifest, fallback 404 e scripts npm adicionados.
- Prints antes/depois: **não medido** por ausência de browser instalado/Playwright no ambiente.

## O que foi medido

- Existência de `index.html`, `manifest.json`, `sw.js`, `404.html`, ícones e assets publicados.
- Referências locais do `index.html` para assets.
- Fallback SPA de `404.html`.
- Tratamento estático de `/api` no `index.html` e no service worker.
- Scripts `npm run check`, `npm run lint`, `npm run build`, `npm run test:e2e`, `npm run scorecard` e `npm run verify`.

## O que não foi medido

- Navegação real por todos os menus em Chromium/WebKit/Firefox.
- Console real do navegador em produção.
- PDF renderizado visualmente.
- Lighthouse.
- axe serious/critical.
- Regressão visual por screenshot.
- Revisão médica humana do conteúdo clínico.

## O que quebrou na linha de base

- `git fetch origin main` falhou porque o repositório local não possui remote `origin` configurado.
- `npm ci` falhou porque não havia `package.json`/`package-lock.json` na linha de base.
- `npm run check`, `lint`, `build`, `scorecard` e `verify` falharam na linha de base porque não havia scripts npm.
- Acesso automatizado a `https://www.neuroped.pages.dev` retornou `403 Forbidden` neste ambiente.

## O que funciona após esta alteração

- Existe pacote npm mínimo para executar checks reproduzíveis.
- O check estático valida os arquivos essenciais da PWA e referências locais.
- O build estático valida a presença de bundle JS publicado e mede maior chunk.
- O scorecard gera `docs/PLACAR_9.0.md` com nota baseada no menor eixo medido.
- `/api` em build público possui fallback honesto no `index.html` e no `sw.js` com a mensagem: “Este recurso está em implantação no ambiente público.”
- `404.html` mantém fallback SPA compreensível por hash route.

## O que está em implantação

- Backend público para endpoints `/api`, quando requisitados pelo bundle estático.
- Execução real de E2E Playwright no ambiente CI/local com browser instalado.
- Medição a11y/axe e Lighthouse.

## O que depende de backend

- Qualquer endpoint `/api` real consumido pelo bundle publicado.
- Entrega remota de relatórios, e-mail, sincronização ou recursos server-side que não estejam no build local-first.

## O que depende de decisão clínica humana

- Validação de interpretação clínica de escalas.
- Aprovação de fontes e proveniência clínica.
- Limites de uso, linguagem final de relatórios e indicação/contraindicação por idade/domínio.

## Tabela de auditoria

| Tela/Recurso | Status | Evidência | Problema | Correção necessária | Prioridade |
|---|---|---|---|---|---|
| Produção `https://www.neuroped.pages.dev` | QUEBRA | `curl -I -L` retornou `HTTP/1.1 403 Forbidden` no ambiente | Não foi possível auditar visualmente a produção | Validar acesso fora deste ambiente e anexar prints | P0 |
| Home/shell HTML | FUNCIONA | `index.html` possui `#root`, título NeuroPed, manifest, CSS e JS local | Conteúdo React não auditado em browser real | Rodar Playwright real assim que dependência/browser estiver disponível | P1 |
| Manifest/PWA | FUNCIONA | `npm run check` valida `start_url`, `scope`, `display` e `icons` | Não mede instalação real | Testar instalação PWA em navegador | P2 |
| Service worker/cache | FUNCIONA | `sw.js` atualiza cache e possui `apiNetworkFirst` para `/api` | Não medido em browser real | Validar ativação e limpeza de cache em produção | P1 |
| Chamadas `/api` | EM IMPLANTAÇÃO | `index.html` expõe `safeApiFetch`; `sw.js` converte 404/network em JSON honesto | Sem backend público confirmado | Mapear endpoints reais no código-fonte quando disponível | P1 |
| Fallback de rota inexistente | FUNCIONA | `404.html` redireciona para `index.html#/rota` | Não medido com reload real em Pages | Validar rota direta pós-deploy | P1 |
| Encontrar escala | CONFUSO | Bundle contém termos de escalas/filtro, mas jornada não foi aberta em browser | Falta prova visual/funcional | Rodar specs Playwright reais e captura | P1 |
| Aplicar teste | CONFUSO | Bundle contém termos de perguntas/progresso/resultado | Falta prova de fluxo completo | Cobrir em browser real desktop/mobile | P1 |
| Resultado/relatório/PDF | CONFUSO | Bundle contém PDF/relatório; fallback honesto global para `/api` | PDF não aberto/renderizado | Teste visual e E2E de relatório | P1 |
| Histórico/local storage | CONFUSO | Bundle contém `localStorage`/histórico | Não auditado em navegador real | Teste de salvar/recuperar local | P1 |
| Configurações/tema | CONFUSO | Tokens de tema/dark detectados | Alternância não clicada | E2E real de tema | P2 |
| Mobile básico | CONFUSO | Viewport e CSS responsivo existem | Não houve emulação real | Rodar mobile Playwright e anexar print | P1 |
| Console crítico | não medido | Browser real indisponível | Não há evidência | Rodar navegação real com captura de console | P0 |
| axe/Lighthouse | não medido | Ferramentas não executadas | Sem métrica a11y/perf | Integrar quando browser estiver disponível | P1 |

## Nota neutra inicial por eixo

| Eixo | Nota inicial | Base |
|---|---:|---|
| aparência | não medido | Sem navegador/print real. |
| navegação | não medido | Sem browser real. |
| clareza | não medido | Sem inspeção visual. |
| função real | 6,0 | Shell estático e fallback existem; produção inacessível no ambiente. |
| confiança clínica | 6,0 | Conteúdo preservado; validação médica humana não medida. |
| maturidade comercial | 5,0 | Deploy/documentação eram insuficientes na linha de base. |
| estabilidade técnica | 6,0 | Checks estáticos agora existem; browser real não medido. |

## Nota após correções desta PR

Ver `docs/PLACAR_9.0.md`. Não declarar 9,0 real nesta PR porque há eixos essenciais não medidos em navegador real.
