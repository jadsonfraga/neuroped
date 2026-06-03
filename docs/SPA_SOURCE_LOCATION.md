# Localização do código-fonte da SPA

> Registro para correções futuras dos bugs internos da SPA (tela "Escalas · 340+").

## Status: NÃO LOCALIZADO neste ambiente

Varredura completa do sistema de arquivos do ambiente de execução remoto
(`find / ...`) **não encontrou** o código-fonte da SPA:

| Busca | Resultado |
|---|---|
| `vite.config.*` | ✗ não existe |
| `pdf-generator.tsx` / `.ts` | ✗ não existe |
| `PDFButton.tsx` | ✗ não existe |
| Qualquer `*.tsx` (componentes React) | ✗ nenhum |
| Diretórios `*neuroped*` fora deste repo | ✗ só caches do CLI |

## O que existe neste repositório

Apenas o **bundle Vite compilado e minificado**, em `assets/`:
- `assets/index-CCN60Z39.js` — entry da SPA (router, telas, lógica)
- `assets/pdf-generator-DVRdbply.js` — gerador de PDF (usa fonte WinAnsi)
- `assets/PDFButton-_8aeYQwH.js` — botão de PDF
- `assets/scales-*.js`, `expandedScales-*.js`, etc. — dados de escala da SPA
  (separados dos `scales-*.js` da raiz, que alimentam as páginas estáticas)

## Onde o fonte provavelmente está

- Na **máquina local** do Dr. Jadson (onde o projeto Vite foi desenvolvido/buildado), ou
- Em um **repositório GitHub separado** (este repo `jadsonfraga/neuroped` guarda só o
  site compilado para o GitHub Pages).

## Para recuperar e corrigir na raiz

1. Localizar o projeto-fonte (rodar no PC do autor):
   - PowerShell: `Get-ChildItem -Path $env:USERPROFILE -Recurse -Filter "vite.config.*" -ErrorAction SilentlyContinue`
   - bash/mac: `find "$HOME" -name "vite.config.*" -not -path "*/node_modules/*" 2>/dev/null`
2. Subir a pasta `src/` (+ `package.json`, `vite.config.*`) para este repo, ou informar
   o repositório onde está.
3. Corrigir na origem: id do card (rota `#/undefined`), filtro da SPA, e o
   `pdf-generator` (trocar StandardFonts/WinAnsi por embed UTF-8 via fontkit, ou
   sanitizar emoji antes de `drawText`).
4. `npm run build` e commitar o novo bundle em `assets/`.

## Mitigações já em produção (sem o fonte)

Enquanto o fonte não é recuperado, os sintomas estão contidos por camadas no repo:
- `consulta-bridge.js` — redireciona `#/undefined`, `#/escala/undefined|null` → `filtro-escalas.html`
- `spa-route-watchdog.js` — intercepta clique/rota quebrada (proativo) + resgata tela morta + avisa erro de PDF
- `sw.js` → `patchPdfGenerator()` — sanitiza emoji do gerador de PDF (destrava o PDF da SPA)
- `filtro-escalas.html` — filtro estático corrigido (relevância real, PDF via iframe), para onde o usuário é levado
