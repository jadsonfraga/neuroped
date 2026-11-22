# Filtro Clínico — trio complementar, sem escalas repetitivas

Data: 2026-11-22 · Branch: `claude/filtro-trio-complementar` · Base: `origin/main` (`44757eb`)

Continua `FILTRO_ESCALAS_QUALIDADE_2026-11-05.md`. Nada aqui é norma, ponto de
corte, diagnóstico ou equivalência psicométrica: as regras apenas agrupam
instrumentos do catálogo para que o trio não gaste duas vagas na mesma pergunta.

> Revisão clínica pendente: o agrupamento curado (tabela `CURATED_FAMILY`) e o
> limiar de inventário amplo devem ser conferidos pelo responsável clínico.

## Problema medido (antes)

O critério de "mesmo construto" do pódio só reconhecia `overlapGroup` idêntico ou
domínio + sinais iguais. Em 66.521 cenários sintéticos do catálogo real (31 queixas
isoladas e em pares × 11 idades × 5 respondentes × 0, 2 ou 3 sinais), **3.709 trios
tinham escalas repetitivas**, por exemplo:

| Par no mesmo trio | Ocorrências | Por que repete |
|---|---:|---|
| NRS × FPS-R | 444 | intensidade de dor, ambos por autorrelato |
| IPN-EPI/SEG Anamnese × Diferenciais | 438 | dois módulos clínicos da mesma bateria |
| FLACC × CHEOPS; FLACC × COMFORT-B | 282; 197 | dor comportamental, ambos por observação |
| Dois inventários amplos de pais (EINPI, NEUROFUNC-360, IDAFENI, NDI-360…) | 771 trios | mesmo rastreio de banda larga, mesmo informante |
| Triagem Motora 0–6 m × 6–12 m | 130 | mesmo protocolo em faixas vizinhas |
| BISQ × BISQ-R | 106 | edição original e revisada |
| Funções executivas ampliada × dia a dia (pais) | 93 | duas formas para o mesmo informante |
| CGI-S × CGI-I | 87 | mesma família de impressão global |

## Regra nova

`client/src/data/scaleConstructFamily.ts` (função pura) define **família de
instrumento** e **classe de informante** (pais, professor, autorrelato, clínico,
tarefa direta). Um par é repetitivo quando, **pelo mesmo informante**:

1. é o mesmo instrumento em outra edição ou forma curta/longa, ou o mesmo construto curado (tabela `CURATED_FAMILY`, ex.: BISQ/BISQ-R, PSC-17/35, PHQ-2/PHQ-A, dor comportamental);
2. é a mesma família pelo nome: módulo da mesma bateria ("IPN-LFC · …"), protocolo em faixa etária vizinha, forma do mesmo questionário autoral;
3. são dois inventários amplos (≥ 10 queixas).

A mesma família por **informantes diferentes** (pais × professor × autorrelato)
continua permitida, porque é outra perspectiva. Uma família, porém, **não ocupa as
três vagas**: o trio precisa de outro construto.

`sameClinicalConstruct` passa a usar essa regra, e ela alimenta as etapas já
existentes. A composição penaliza repetição e ganha um desempate por informantes e
famílias distintos. A resolução final troca a medalha repetitiva por outra segura,
mantém só com justificativa de cobertura única ou remove. O pódio não preenche vaga
por obrigação.

Em modo faixa, a composição dá mais peso à medalha que cobre a faixa inteira do que
à diversidade de informante. Sem isso, a troca de uma medalha repetitiva podia trazer
substituta de cobertura parcial: a métrica `band_medals_full_pct` caía de 89,2% para
89,1%, abaixo do piso do guarda de CI. Com a regra, ela fica em 89,2%, igual à `main`,
e o número de medalhas com cobertura parcial cai de 708 para 700.

Desempate etário (`ageSpecificityBonus`, 0–4 pontos): entre escalas que contêm a idade
**exata**, prefere a desenhada para aquela janela (ex.: marcos de 6 meses, IPN-TEA
9–12 anos) à de 0–18 anos. Em modo faixa vale 0. Nunca relaxa a trava de idade.

## Defeitos corrigidos na resolução de redundância

Dois defeitos antigos, que só apareciam quando a troca de Prata acontecia:

1. a substituta da Prata podia ser a própria escala do Bronze (pódio com medalha duplicada);
2. a carga do Bronze não entrava na conta do teto de 100 perguntas ao trocar a Prata.

Com Prata removida, o Bronze sobe para a vaga, sem buraco no meio do pódio.

## Resultado (mesma matriz e mesma régua nos dois motores)

| Medida | `main` | Esta branch |
|---|---:|---:|
| Trios com escalas repetitivas | 3.709 | 53 |
| Pódios com 3 medalhas | 50.749 | 49.653 |
| Pódios com 2 medalhas | 7.719 | 8.439 |
| Informantes distintos por pódio (média) | 1,553 | 1,584 |
| Medalha fora da idade | 0 | 0 |
| Sinal cobrível perdido | 0 | 0 |
| Pódio acima de 100 perguntas | 0 | 0 |
| Medalha duplicada | 0 | 0 |

Os 53 restantes são todos `kept_justified` e visíveis na auditoria do pódio. A
medalha parecida responde a uma queixa marcada que nenhuma outra cobre. Por exemplo,
em dor + queixa neonatal, a FLACC cobre a dor e só a COMFORT-B cobre o neonatal.

A queda de pódios completos é intencional. Quando não existe terceira escala
complementar segura, o pódio mostra duas, em vez de repetir uma.

## Verificação

`npm run lint`, `npm run check`, `npm run build:client`, `test:filter`, `test:podium`
(inclui o novo `tests/unit/filter-trio-complementarity.test.ts`), `test:ideal-choice`
(696 casos, 100%), `test:practical-filter` (média 10,00), `test:clinical`,
`test:interactive`, `test:quick-wins`, `validate:ranking`, `test:scale-responses` e
`audit:filter-fillable`: todos com exit 0. O teste novo falha no código da `main`
(medalha duplicada) e passa nesta branch.

## Rollback

`git revert` do commit. Sem migração D1 e sem mudança de contrato de API.
