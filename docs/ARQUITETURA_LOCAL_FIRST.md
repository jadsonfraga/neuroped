# Arquitetura local-first e backend honesto

## Estado atual

O repositório publicado é um build estático de PWA. Não há código-fonte React/TypeScript editável nesta cópia, nem backend versionado no repositório.

## Regra pública para `/api`

No ambiente público estático, qualquer falha de backend deve retornar um estado honesto, nunca sucesso falso e nunca 404 silencioso. A mensagem padrão é:

> Este recurso está em implantação no ambiente público.

## Implementação desta PR

- `index.html` instala `window.safeApiFetch` e um wrapper global de `window.fetch` antes do bundle principal. Requisições `/api` com 404 ou erro de rede retornam JSON com `code` `BACKEND_IN_DEPLOYMENT`/`BACKEND_UNAVAILABLE` e status 503.
- `sw.js` trata `GET /api/` com `apiNetworkFirst`. Se o backend retornar 404 ou falhar, o service worker devolve JSON honesto com status 503.
- O fallback não marca a operação como sucesso clínico. Ele apenas impede quebra técnica e permite que a UI mostre estado em implantação.

## Limites conhecidos

- Wrapper global não substitui uma refatoração de fonte para um `apiClient` tipado.
- Se o bundle interpretar qualquer 503 como erro genérico sem ler a mensagem, a UI ainda pode precisar de ajuste no código-fonte.
- Não há fonte editável para padronizar `EmptyState`, `ComingSoon`, `BackendUnavailable`, `FeatureInDeployment` e `ErrorBoundary` dentro dos componentes.

## Próxima evolução

Quando o código-fonte estiver disponível, criar módulo único `src/lib/apiClient.ts` com:

- timeout;
- parse JSON seguro;
- classificação de erro;
- `BackendUnavailable` consistente;
- telemetria sem dados sensíveis;
- testes unitários e E2E reais.
