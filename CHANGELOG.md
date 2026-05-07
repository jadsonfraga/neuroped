# Changelog

Todas as alterações relevantes deste projeto serão documentadas aqui.

O formato segue [Keep a Changelog 1.1.0](https://keepachangelog.com/pt-BR/1.1.0/).
Este projeto adere a [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [9.9.0] - 2026-05-07

### Adicionado
- Identidade visual WarmMinimalism PANT (paleta creme/teal/ouro/bordô/plum/dark)
- Schema.org JSON-LD MedicalBusiness + Physician completo no `<head>`
- Open Graph e Twitter Cards completos
- Canonical URL e meta robots
- Bloco `<noscript>` institucional
- Política de Segurança (`SECURITY.md`) com canal privado de divulgação responsável
- Guia de Contribuição (`CONTRIBUTING.md`) com critérios clínicos e técnicos
- Licença proprietária explícita (`LICENSE`) com escopo, restrições e foro
- Página estática de Política de Privacidade (`privacidade.html`) com base legal LGPD
- Página estática de Declaração de Acessibilidade (`acessibilidade.html`)
- Arquivos `_headers` e `_redirects` para futura migração a Cloudflare Pages
- CSP via meta tag (camada complementar; CSP via header HTTP requer migração)
- Web Vitals telemetria preparada para integração

### Alterado
- `theme-color` migrado de `#7c3aed` (purple Perplexity) para `#1a6b65` (PANT teal)
- Variantes de `theme-color` para `prefers-color-scheme` light/dark
- Ícone SVG inline migrado de purple para teal/cream PANT
- Manifest enriquecido: descrição institucional, categorias `medical/health/education`, shortcuts ampliados
- README institucional com responsável clínico, CRM, RQE, endereço e badges
- `<title>` e `<meta description>` reformulados para tom institucional clínico (eliminada descrição "estudantes de medicina")

### Removido
- Comentário ASCII art "Created with Perplexity Computer" (`<!-- ... -->`)
- `<meta name="generator" content="Perplexity Computer">`
- `<meta name="author" content="Perplexity Computer">`
- `<meta property="og:see_also" content="https://www.perplexity.ai/computer">`
- `<link rel="author" href="https://www.perplexity.ai/computer">`
- `<script data-pplx-inline-edit>` (script de inline-edit do Perplexity Computer)
- Rastros remanescentes de identidade Perplexity em metatags

### Segurança
- `Content-Security-Policy` via meta tag (frame-ancestors none, default-src self)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restritiva (bloqueando câmera, microfone, geolocalização, pagamento, USB, FLoC)
- Service Worker registrado com path relativo (corrigindo regressão em deploys com base path)

### Conhecidas limitações que requerem rebuild do bundle
- Migração para history routing (atualmente hash routing `#/`) — bloqueado: assume `vite.config.js`
- Substituição de fontes Google Fonts por `@fontsource` local — bloqueado: bundle compilado referencia fontes via CSS
- Tokens CSS PANT em `src/styles/tokens.css` — bloqueado: bundle compilado, sem source acessível
- Implementação de `secureStore` (AES-GCM 256 + PBKDF2 600k) — bloqueado: requer alteração de código React
- Cobertura de testes Vitest ≥ 90% — bloqueado: sem source, sem suíte
- ESLint, Husky, lint-staged — bloqueado: sem source, sem `package.json`
- Lighthouse CI 99+ multi-rota multi-browser — bloqueado: requer reduções de bundle e CSP via header HTTP

Estas estão documentadas no `BLOQUEIOS.md` para destrava em iteração futura, quando o código-fonte equivalente ao build atual for recuperado do Perplexity Computer.

### Conformidade
- LGPD — Lei 13.709/2018: política de privacidade com base legal art. 7º e art. 11
- WCAG 2.2 AA — declaração de acessibilidade publicada
- CFM — Resolução 2.314/2022 referenciada na licença

---

## [8.0.0] - 2026-05-07 (anterior — substituída)

### Histórico
- Deploy inicial do NeuroPed via GitHub Pages com URL pública
- Workflow de deploy automático configurado
- Trava de domínio do Perplexity neutralizada para permitir uso em qualquer host

---

[9.9.0]: https://github.com/jadsonfraga/neuroped/releases/tag/v9.9.0
[8.0.0]: https://github.com/jadsonfraga/neuroped/releases/tag/v8.0.0
