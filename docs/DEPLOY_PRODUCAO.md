# Deploy de produção — NeuroPed

## URL de produção

- Cloudflare Pages informado pelo solicitante: `https://www.neuroped.pages.dev`.
- Resultado neste ambiente em 2026-06-06: `HTTP/1.1 403 Forbidden`, portanto a validação visual de produção ficou não medida.

## Origem do deploy neste repositório

- Workflow versionado: `.github/workflows/deploy.yml`.
- Evento: push em `main` ou execução manual.
- Plataforma do workflow: GitHub Pages.
- Pasta publicada: raiz do repositório (`path: .`).
- Comando de build: não há comando de build no workflow; a raiz já contém artefatos estáticos publicados.

## Branch usada

- Workflow usa `main` para deploy em GitHub Pages.
- Cloudflare Pages não está configurado neste repositório; origem/branch Cloudflare: não medido.

## Variáveis de ambiente

- `VITE_API_URL`: não medido; não há fonte Vite presente nesta cópia.
- Backend público: não medido.

## Modo local-first

- PWA usa assets estáticos, manifest e service worker.
- Recursos locais devem continuar úteis sem backend.
- Recursos que dependem de backend devem exibir estado honesto de implantação pública.

## Service worker e cache

- Cache atual: `neuroped-v8-honest-api`.
- A alteração do nome força limpeza de caches antigos na ativação.
- Para invalidar cache após deploy: publicar novo `CACHE_NAME`, recarregar com hard refresh e validar `Application > Service Workers` no browser.

## Rotas SPA

- `404.html` redireciona rotas diretas para `index.html#/rota`.
- Validação real em Cloudflare/GitHub Pages: não medida.

## Headers de segurança

- Não há `_headers` Cloudflare versionado nesta cópia.
- Headers reais de `https://www.neuroped.pages.dev`: não medidos por retorno 403.

## Como validar após merge

1. Abrir URL de produção em navegador real.
2. Hard refresh e limpar service worker antigo se necessário.
3. Navegar home, escalas, aplicação, resultado, relatório/PDF ou estado honesto, histórico e configurações.
4. Abrir uma rota direta inexistente e confirmar fallback compreensível.
5. Monitorar console para erros críticos.
6. Rodar Lighthouse e axe.
7. Executar `npm run verify` no checkout atualizado.

## Riscos conhecidos

- Repositório contém build compilado sem fonte; mudanças de UI no bundle seriam frágeis.
- Cloudflare Pages não está descrito por workflow/arquivo de configuração no repositório.
- E2E real depende de browser/Playwright disponível no ambiente de CI.
