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

## Rodada de refinamento

Revisão crítica do próprio diff, com quatro correções:

1. **Trio inteiro na resolução de redundância.** Ao revisar a Prata, a rotina ignorava o
   Bronze. Ela podia manter a Prata repetitiva como "única" numa queixa que o Bronze
   também cobria, e podia escolher substituta repetitiva com o Bronze. Cobertura,
   justificativa, conflito e carga passam a considerar as demais medalhas do trio.
2. **Texto da auditoria.** "Uma forma basta" e "confirme a idade exata" só valem para
   formas do mesmo instrumento. A remoção agora também ocorre entre instrumentos
   diferentes do mesmo construto. A mensagem nomeia as duas escalas e diz o motivo.
3. **Precedência.** O `overlapGroup` declarado no catálogo vale antes da tabela curada.
4. **Acentos.** A faixa de acentos usa escapes `\u0300-\u036f`, não caracteres
   combinantes invisíveis no código-fonte.

Os testes novos (seções 7c e 7d) falham no código anterior e passam nesta versão. A
matriz abaixo repete os mesmos números, porque esses casos de borda não surgem nela.

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

## Teste em produção (navegador) e ajuste

Depois do deploy, o filtro publicado foi testado no navegador (390 px e 1280 px) com cinco
casos sintéticos: dor aos 6 meses, sono aos 15 meses, TDAH aos 8 anos, TEA aos 2 anos e
6 meses, e dor aos 12 anos. Não houve erro de JavaScript nem rolagem horizontal.

Dois achados:

1. **Dor aos 12 anos: NRS + FACES**, as duas medindo intensidade de dor relatada pela
   criança. A FACES está cadastrada como questionário de pais, então a regra por
   informante não a pegava. Correção: FACES entra no grupo curado de intensidade de dor, e,
   dentro de um grupo curado, conta como mesmo informante quem o catálogo lista como
   respondente em comum (exceto o clínico). O pódio passa a NRS + r-FLACC + EAF:
   autorrelato, observação do comportamento e funcionalidade.
2. **Sono aos 15 meses: BISQ + IPN-EPI/SEG Anamnese 20 + EFDI.** A anamnese de epilepsia já
   era a Prata escolhida pelo motor antes desta mudança, porque o catálogo marca os módulos
   IPN-EPI/SEG com a queixa sono. Antes ela saía para a âncora funcional e a BISQ-R
   repetitiva ficava. **Decisão clínica pendente:** confirmar se os módulos IPN-EPI/SEG
   devem continuar marcados para sono. Se não, a SWYC BPSC assume a vaga.

## Decisão: instrumento de epilepsia ancorado na epilepsia

Pedido do responsável clínico: decidir a marcação de sono da bateria IPN-EPI/SEG.

**Decisão.** A bateria não perde a marcação: o motor passa a ancorar instrumentos de
epilepsia na própria epilepsia (`CONDITION_ANCHORED_DOMAINS`, o mesmo mecanismo já
usado para a PC). Sono, ansiedade, aprendizagem, atraso e depressão sozinhos não trazem
instrumento de epilepsia. Com epilepsia marcada, as coberturas secundárias voltam a
valer e a bateria complementa a escala da outra queixa. Funcionalidade, efeitos de
medicação, neonatal e PC continuam abertos, como na âncora da PC, para não fechar o HINE
nem os efeitos dos antiepilépticos.

| Caso (sintético) | Antes | Depois |
|---|---|---|
| Sono, 15 meses | BISQ + IPN-EPI/SEG Anamnese + EFDI | BISQ + EFDI + SWYC BPSC |
| Sono + epilepsia, 15 meses | BISQ + IPN-EPI/SEG Anamnese + EFDI | igual |
| Depressão, 14 anos | NDDI-E entre as candidatas | NDDI-E fora |
| PC, 6 meses; neonatal, 2 meses | HINE disponível | igual |

**Guarda de métricas.** A cobertura integral da faixa passa a ser travada em dois grupos
de contextos, cada um no seu valor atual (achado P1 da revisão automática: baixar só o piso
global deixaria passar regressão em contexto alheio à âncora):

| Grupo | Piso | Por quê |
|---|---:|---|
| Contextos sem efeito de âncora | 88,1% | Candidatas e pódio idênticos aos de antes; o piso no valor atual reprova qualquer regressão alheia |
| Contextos em que a âncora removeu instrumento | 90,1% | Valor atual após a troca |
| Total geral | 89,0% | Antes 89,2%; a diferença vem só das trocas abaixo |

O total geral cai de 89,2% para 89,0%. As 51
medalhas que deixaram de cobrir a faixa inteira eram todas módulos IPN-EPI/SEG (0–215 m)
em sono e ansiedade sem epilepsia, trocados por instrumentos da janela etária (SWYC). Das
562 medalhas parciais restantes, só 1 tinha alternativa integral fora da curadoria clínica:
compensar exigiria desfazer a curadoria. Em troca, o guarda ganha o invariante
`anchored_outside_condition = 0`, que trava a regressão clínica real. Os demais pisos e
invariantes de segurança não mudaram.
