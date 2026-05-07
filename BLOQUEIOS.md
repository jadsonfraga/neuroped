# BLOQUEIOS

- 2026-05-07: Ambiente atual não possui acesso de rede externo funcional (HTTP 000 para PageSpeed e Observatory; `git ls-remote` com 403) e não possui Chrome/Chromium instalado. Isso impede validações terceiras e parte dos testes E2E/auditoria.
- 2026-05-07: Repositório em `/workspace/neuroped` é estático (não contém estrutura React/Vite completa esperada pelo plano A-L), portanto foi aplicada remediação compatível com a base existente.
