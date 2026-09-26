# Reconciliação: privacidade do texto livre na URL do Filtro

Data: 26 de setembro de 2026. Base examinada: PR #998, HEAD 9aa0ac65d974457156c1becc3bba9826abb7eb29, que incorpora main db792b2354f446335271da95eb49b6c2d3478bf7.

## Defeito reproduzido

O efeito da página espelhava cada alteração de busca em history.replaceState. serializeFilterUrlParams emitia q com texto livre arbitrário; limitar 300 caracteres não impede que esse texto contenha identificação ou relato de paciente. A prova usa somente canário fictício. Não houve leitura de dados reais nem comprovação de incidente externo.

## Correção mínima e contrato

O serializador nunca emite q. A leitura de links legados continua compatível; q permanece na lista de chaves próprias para ser removido tanto da query real quanto do hash na próxima escrita. Idade, queixas, respondente, sinais, tempo, demais filtros estruturados, parâmetros alheios e estado do roteador são preservados. O texto digitado continua disponível na busca da sessão, mas NÃO acompanha o link copiado ou recarregado. Esta restrição de privacidade substitui a afirmação anterior de que o deep-link reproduziria também o texto livre.

Não altera ranking, critérios clínicos, autorização, dados persistidos, migrações, favoritos, recentes ou o modo efêmero. Não promete apagar links já compartilhados ou histórico anterior. Os filtros estruturados ainda descrevem um perfil clínico: compartilhar apenas sem associação a uma pessoa identificável.

## Evidência local executada

Fontes originais conferidas pelo hash Git do blob: módulo 944d7ffbaac3bdc0d8d9d0ed487497d7de27d216; teste 1df856884620ea4ff290e32decce00ee1164f48b.

- Baseline: node --experimental-strip-types tests/unit/filter-url-state.test.ts, exit 0.
- Regressão nova contra módulo anterior: exit 1, texto livre não deve ser serializado na URL.
- Correção e contrato atualizado: mesmo comando, exit 0.
- Typecheck isolado do módulo: tsc --noEmit --strict --target es2022 --module esnext --lib es2022,dom,dom.iterable client/src/lib/filterUrlState.ts, exit 0.
- Mutação adversarial reintroduzindo q: teste recusou, exit 1. Fonte restaurada e teste novamente exit 0.

O teste cobre round-trip dos filtros estruturados, entrada legada, remoção de q da query e do hash, canário ausente após decodificação, preservação de parâmetros alheios e History idempotente com adaptador sintético. Usa o módulo real, mas NÃO equivale a prova de navegador. A suíte test:filter já inclui este arquivo; nenhum teste foi retirado do pipeline.

## Gates e limites

A rede local não permitiu instalar o repositório completo. Não declarar npm check, lint, build ou E2E completos locais nesta correção. Merge e deploy dependem da CI do HEAD resultante e da verificação posterior dos workflows oficiais e SHA servido. O sucesso de outro SHA não aprova este candidato.

Rollback por PR de revert dos arquivos desta correção, sem migração; reintroduzir q restaura o risco e não é recomendado. Demais pendências comerciais, censo legado e validações em hardware não são fechadas por este patch.
