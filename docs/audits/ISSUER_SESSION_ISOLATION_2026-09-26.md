# Identidade documental por sessão e clínica — 2026-09-26

Rastreador: #594. Base auditada: `2d1251a6`.

## Defeito observado

O cache em `client/src/lib/issuer.ts` usava somente a clínica como chave. Dois
profissionais da mesma clínica podiam receber a identidade do primeiro no mesmo
SPA. A promessa em andamento não tinha escopo e podia repopular o cache depois
de uma invalidação. O hook também iniciava com qualquer emissor em cache antes
de verificar sua chave. A troca normal de clínica já fazia hard reload; este
achado não prova acesso indevido às APIs, cujo backend continua autorizando.

## Alteração

O cache e a deduplicação agora incluem a geração da sessão autenticada, clínica,
presença de credencial e geração de invalidação. Tokens não são copiados para a
chave. Refresh normal mantém a geração; login/logout a alteram. Cada resposta,
inclusive seu corpo assíncrono, é descartada se o contexto mudou. Uma promessa
obsoleta não pode limpar a promessa nova nem sobrescrever sua identidade.

Limpeza de sessão/clínica invalida o emissor antes do primeiro await. O hook
observa invalidações e nunca renderiza identidade de outro escopo enquanto
aguarda o carregamento. Persistir a seleção inicial de clínica também notifica
os emissores montados. Não há armazenamento de identidade em localStorage.

O gerador de laudo deixa a linha de data sem cidade quando ela não foi informada,
removendo o fallback institucional `Petrolina/PE`. Cidade explicitamente fornecida
continua preservada. Não altera conteúdo clínico nem afirma assinatura jurídica.

## Evidência local

- Testes escritos antes da alteração reproduziram reutilização da identidade e
  resposta após logout (RED).
- Oito testes do módulo real, com transporte sintético e sem rede: troca de conta
  na mesma clínica; deduplicação; refresh; resposta atrasada; logout; invalidação
  durante branding; troca de clínica durante leitura do corpo; primeira
  renderização do hook React; e ligação da limpeza aos contextos (GREEN).
- `npm run test:clinical-documents`, `live-tenant-client-boundary.test.mjs`,
  `auth-client-races.test.ts`, `npm run check` e `npm run lint`: passaram.
- Build e suíte quick-wins são gates adicionais, registrados na PR/CI.
- Não foi feito teste visual em navegador local. Renderização inicial usa React
  real em teste sem DOM; isso não substitui a jornada E2E em navegador.

## Revisão e rollback

Revisão React: assinatura de snapshot primitiva e estável, assinatura única por
hook, cleanup de observador e efeito, dependência explícita de escopo, sem novo
provider ou dependência. A sequência perfil → clínica preserva a checagem de
sessão antes da próxima requisição.

Rollback: reverter o commit completo; nenhuma migração ou dado persistente muda.
A reversão reintroduz o defeito de cache, portanto exige avaliar o risco de
emissão com profissional incorreto. O censo/migração do legado e o bloqueio LIVE
continuam fora deste escopo; este relatório não declara o SaaS comercializável.
