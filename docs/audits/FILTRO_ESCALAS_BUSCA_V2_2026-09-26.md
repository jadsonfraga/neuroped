# Filtro de Escalas — rodada definitiva de refinamento (busca v2)

Data: 2026-09-26 · Branch: `claude/refine-scales-filter-eyz9tt` · Escopo único: `/filtro`

## O que foi medido antes de mudar

Catálogo estudado: 274 instrumentos aplicáveis (`allScales`), 775 com fichas, mais 112 do registro mundial
deduplicado por nome. Distribuição: 29 queixas, 4 respondentes reais, 130 triagem / 76 diagnóstica / 68
monitorização, 137 com `signalTags`, 100 com exemplo para pais, 184 com ponto de corte.

A busca livre anterior (`searchBoost`) era substring sobre `nome + nome completo + descrição + queixas`
com um mapa de sinônimos pequeno. Sem tolerância a erro de digitação, sem tratamento de sigla com
pontuação ("mchat" ≠ "M-CHAT-R/F"), sem numeral romano ("snap 4" ≠ "SNAP-IV"), sem explicação de
por que um card apareceu e sem "você quis dizer".

Benchmark de 134 consultas realistas (siglas, apelidos, autores, erro de digitação, linguagem leiga de
pais, queixas em português e inglês) contra o catálogo real da página:

| Métrica | Busca anterior | Busca v2 |
|---|---|---|
| Acerto no 1º lugar | 95/134 (71%) | 125/134 (93%) |
| Acerto no top-3 | 104/134 (78%) | 134/134 (100%) |
| Consultas sem nenhum resultado | 17 | 0 |
| Tempo médio por consulta (catálogo inteiro) | — | 2,8 ms |

O benchmark virou teste de regressão (`tests/clinical/test-filter-search-quality.mjs`, piso top-1 ≥ 90%,
top-3 ≥ 97%, zero consultas vazias), executado em `npm run test:filter` e, por consequência, em
`verify:release`.

## O que mudou (sem regressões)

Referências de mercado consultadas para as decisões: HealthMeasures/PROMIS (facetas por sistema, idade,
respondente), APA DSM-5-TR (respondente e faixa etária como parte da identidade do instrumento),
Rehabilitation Measures Database (tempo de aplicação, custo, recomendação explicada por rubrica), NovoPsych
(chips de população × problema × finalidade), MDCalc (favoritos/recentes, "por que usar"), UpToDate
(abreviações aceitas), Baymard/Algolia/NN-g (tolerância a erro por tamanho do token, contagens por faceta,
recuperação de zero resultados, sinônimos unidirecionais, realce do que casou), W3C APG (teclado).

1. **Motor de busca v2** (`client/src/lib/scaleSearch.ts`, puro, sem React)
   - Normalização: minúsculas, sem acento, pontuação vira espaço, forma compacta ("M-CHAT-R/F" → `mchatrf`),
     numerais romanos ⇄ arábicos, sigla derivada das iniciais do nome completo ("Childhood Autism Rating
     Scale 2" → `cars`, `cars2`).
   - Tolerância a erro de digitação (Damerau-Levenshtein): 1 erro para 4–6 letras, 2 a partir de 7, só
     contra nome, apelidos e nome completo — nunca contra a descrição.
   - Pesos por campo: nome > sigla > apelido > nome completo > queixa > sinal clínico > respondente >
     licença > descrição > fonte. Termos de domínio (queixa/sinônimo) têm teto e bônus para a queixa
     principal; termos de contexto (idade, "adolescente", "pais") ordenam mas não penalizam a cobertura;
     dígito solto só conta na forma compacta. Instrumento focado vale mais que catch-all com 19 queixas.
   - Cada acerto devolve campo, termo e token responsável → explicação ("Correspondeu por apelido
     “vanderbild” (você digitou …)") e realce no nome do card.
   - "Você quis dizer": agrupado por palavra corrigida (queixa > instrumento > termo).
2. **Apelidos e sinônimos curados** (`client/src/data/scaleSearchAliases.ts`): 167 instrumentos do catálogo
   com apelidos (siglas sem pontuação, autores, nomes coloquiais, inglês) e 40 grupos de sinônimos leigos
   → queixa ("não para quieto" → TDAH; "xixi na cama" → enurese). Teste garante que nenhum apelido colide
   com o nome de outro instrumento.
3. **Intenção lida do texto livre** (`parseFilterQueryIntent`): respondente, tempo ("10 min", "rápido"),
   finalidade, comunicação, alfabetização. Aparecem como chips "Entendi da busca" e só viram filtro com
   um toque — respondente é vínculo clínico obrigatório, nunca palpite automático.
4. **Contagens vivas por faceta** (`client/src/lib/filterDiagnostics.ts`): cada botão de respondente, faixa
   etária, finalidade, comunicação, alfabetização e tempo mostra quantos instrumentos seguros aquela
   escolha daria, calculado pelo MESMO motor clínico (`filterScalesWithClinicalRescue`). Fim do "cliquei e
   deu vazio".
5. **Diagnóstico de resultado vazio**: "O que mais restringe — toque para ajustar", com o ganho de cada
   relaxamento (+N). Idade nunca é removida (só foca o campo); bloqueios de segurança (autoaplicável < 8a,
   psicose/mania < 12a, alfabetização, linguagem verbal) são listados como não relaxáveis; risco agudo não
   recebe sugestão nenhuma.
6. **Tempo disponível** como filtro (≤5/≤10/≤20/≤45 min): subconjunto dos candidatos seguros; instrumento
   sem tempo aferido continua visível e sinalizado (fail-open visível, nunca número inventado).
7. **Filtros aplicados** em uma linha de chips removíveis; **ordenação** da prévia (relevância clínica, mais
   rápidas, A–Z, faixa mais justa); tempo estimado em cada card compacto.
8. **Deep-link** (`client/src/lib/filterUrlState.ts`): `#/filtro?idade=5a6m&queixas=tea&resp=pais&tempo=10`
   reproduz a busca. Validação campo a campo, preservação de `autoral`/`mode`, replaceState sem empilhar
   histórico. Modo efêmero (`/filtro-escalas`) nunca escreve a URL. Sem PHI na URL.
9. **Teclado**: `/` foca a busca, `Esc` limpa.
10. **Aviso honesto**: termo que existe no catálogo mas cujos instrumentos não são seguros para o perfil
    ("mchat" para 5 anos) recebe mensagem própria, distinta de "termo não reconhecido".

## O que NÃO mudou (invariantes preservados)

Motor clínico (`advancedFilterLogic`), pódio (`filterPodium`), ranking curado, bloqueios duros, fallback de
triagem ampla, contratos DOM e de sessão. A busca v2 só reordena/filtra DENTRO dos candidatos seguros; o
orçamento de tempo só remove candidatos (subconjunto), nunca acrescenta.

## Verificação (comando → resultado)

- `npm run test:filter` (12 arquivos, inclui os 5 novos) → exit 0
- `node --import tsx tests/clinical/test-filter-podium.mjs` → 518.878 checks, exit 0
- `node --import tsx tests/clinical/test-filter-ideal-choice.mjs` → 672/672 ideais (100%), exit 0
- `node --import tsx tests/clinical/test-filter-practical-100.mjs` → média 10,00, mínimo 10,0, exit 0
- `tests/unit/podium-rescue.test.ts`, `filter-dom-contract`, `quick-wins-static`, `loose-ends-regression`,
  `flow-os-navigation-static`, `performance-boundaries` → exit 0
- `scripts/guards/audit-filter-lifecycle.mjs`, `audit-filter-fillable.mjs`, `audit-filter-pr260.mjs` → exit 0
- `npm run lint`, `npm run check`, `npm run build:client` → exit 0
- E2E existentes (`tests/e2e/filter-age-complaint.mjs`, `filter-interactive-pdf-roundtrip.mjs`,
  `scroll-continuity.mjs`, `recovered-authorials.mjs`) e smoke Playwright das funções novas (deep-link,
  realce, chips de intenção, contagens, "quis dizer", atalhos, ordenação, modo efêmero sem URL) → exit 0

## Rollback

Reverter o commit desta rodada. Não há migração, nem mudança de dados clínicos, nem de contrato de API. Os
módulos novos são puros e a página volta ao `searchBoost` anterior com o revert.

## Rodada 2 (mesma data, após reconciliação com `origin/main` b838574)

Merge limpo, sem conflito nem mudança de dependência; toda a verificação acima repetida sobre a base
reconciliada (exit 0).

11. **Autocompletar** (`client/src/lib/filterAutocomplete.ts`, puro): ao digitar ≥ 2 caracteres, uma lista
    de até 8 sugestões, no padrão W3C APG combobox + listbox (`role="combobox"`, `aria-expanded`,
    `aria-activedescendant`, setas, Home/End, Enter, Esc). Ordem: instrumentos **seguros para o perfil
    atual** (mesmo motor clínico, sem a busca) → "Marcar queixa" (≤ 2) → instrumentos que casam mas
    estão **fora do perfil** (marcados, nunca escondidos nem confundidos com recomendação) → correção de
    grafia no topo quando nada casa. Enter em instrumento preenche a busca com o nome; em queixa, marca a
    queixa e limpa a busca. Esc fecha a lista; segundo Esc limpa. Lista fecha ao sair do campo e não
    intercepta cliques em outros controles.
12. **Abertos recentemente** (`client/src/lib/filterRecents.ts`, padrão MDCalc "Recent"): até 8
    instrumentos abertos a partir do pódio ou da prévia, só id/nome/rota (sem idade, queixa ou paciente),
    em `localStorage` fora dos namespaces clínicos; entrada inválida cai uma a uma. Modo efêmero não grava
    nem exibe. Botão "limpar".

Testes: `tests/unit/filter-autocomplete.test.ts` (ordem seguro > queixa > fora do perfil > correção,
teclado, recentes sem PHI) e contrato estático ampliado; smoke Playwright em 390 px e 1280 px (abrir,
teclado, Esc duplo, queixa por sugestão, blur, recentes após abrir/voltar, modo efêmero, sem overflow).

## Fora de escopo (próximas rodadas, se desejado)

Favoritos por usuário (tenant, servidor); baterias salvas com entrega por link; vocabulário de apelidos
alimentado por consultas sem resultado (contador anônimo, sem PHI); rubrica de recomendação por
instrumento × finalidade (estilo RehabMeasures) como dado curado.
