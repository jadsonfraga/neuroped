# BLOQUEIOS — Remediação v9.9

Data: 2026-05-07

## Bloqueio 1 — Acesso de rede externa indisponível
- **Sintoma:** `git ls-remote https://github.com/jadsonfraga/neuroped.git HEAD` retornou `CONNECT tunnel failed, response 403`.
- **Impacto:** impossibilita validar upstream, clonar referência limpa e confirmar branch remota para Cloudflare Pages.
- **Hipótese de causa raiz:** política de rede do ambiente bloqueando saída HTTPS para GitHub.
- **Proposta de resolução:** habilitar egress HTTPS para `github.com` e `api.github.com`.

## Bloqueio 2 — APIs externas de validação indisponíveis
- **Sintoma:** checks para PageSpeed API e Mozilla Observatory retornaram HTTP `000`.
- **Impacto:** impossível produzir evidência primária de terceiros em `audit/external` (PSI/Observatory/Rich Results).
- **Hipótese de causa raiz:** bloqueio de DNS/egress para `googleapis.com` e `security.mozilla.org`.
- **Proposta de resolução:** liberar saída HTTPS para os domínios de validação externa.

## Bloqueio 3 — Navegador não disponível no runner
- **Sintoma:** `which google-chrome || which chromium` não encontrou executável.
- **Impacto:** não é possível executar Lighthouse/Playwright/axe multi-browser localmente sem instalar browser.
- **Hipótese de causa raiz:** imagem base sem Chrome/Chromium instalado.
- **Proposta de resolução:** provisionar Chromium no ambiente CI/runner ou permitir instalação via pacote interno.
