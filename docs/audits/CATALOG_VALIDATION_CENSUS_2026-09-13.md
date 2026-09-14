# Censo psicométrico do release — 13 de setembro de 2026

Rastreio: #875. Base reproduzida: `b006b5c6911fad4c71af01fef98dd58318e18dec`.

## Defeito reproduzido

No mesmo catálogo, `validate:catalog` registra **110** pendências psicométricas, mas `check-baseline.mjs` registra **89** e aprova o release. O segundo contador considerava somente `pendente_validacao_clinica`; 21 registros com revisão clínica concluída continuavam declaradamente sem validação psicométrica publicada e escapavam ao teto.

## Correção

Os dois consumidores passam a importar `awaitsPsychometricValidation` de `scripts/guards/lib/catalog-validation.mjs`. O predicado conserva exatamente os critérios do validador canônico, inclusive normalização de acentos. O teto é reconciliado para 110, sem margem adicional: não se adiciona instrumento, fonte, norma, ponto de corte nem validação. O piso de revisão clínica com fonte permanece 185 e não significa validação psicométrica.

Entradas antes omitidas: `ndi-360`, `mnp-psi-100`, `farol-escolar`, `eani-fj`, `ecnfaj-1`, `esm-edj`, `eci-fraga-qdce`, `efdi`, `nepedq`, `tdl-aprendizagem`, `toc-drj-psicologia`, `camuflagem-tea-neuroped`, `afi12-sdg`, `sdrd12-sdg`, `sarf12-sdg`, `irritabilidade-desregulacao-vs1`, `nexo-s-24-sdg`, `mapa-ri-18-sdg`, `vigia-sd-20-sdg`, `balanco-med-24-sdg`, `mcri-24-sdg`.

## Provas executadas

- `node --test tests/unit/catalog-validation-census.test.mjs`: exit 0, 4 testes, nenhum skip; executa os dois CLIs reais em diretórios temporários com catálogos sintéticos.
- Limite aceito: 110 instrumentos revisados, mas não validados; relatório e gate contam 110, exit 0.
- Limite recusado: 111 nas mesmas condições; o CLI de release termina com exit 1 e identifica `atual 111 > teto 110`.
- `npm run validate:catalog`: exit 0; 274 instrumentos/274 com fonte/0 sem fonte/110 pendentes.
- `node --import tsx scripts/guards/check-baseline.mjs`: exit 0; 274 executáveis, 185 revisados com fonte, 110 pendentes, 775 fichas, 630 fichas com fonte, 145 pendências documentais.
- `git diff --check`: exit 0.

A regressão entra no início de `test:quick-wins`, portanto também no `verify:release` existente. Os testes não alteram o catálogo real, a baseline real nem dados clínicos.

## Risco e rollback

Escopo restrito a governança de release. O risco principal era equiparar revisão editorial a validação científica. As 110 pendências continuam reais; esta correção não as resolve cientificamente. Rollback por PR revertendo o commit, com reexecução dos gates; isso reintroduziria a subcontagem e não é recomendado. Aceite de merge depende dos checks do HEAD e revisão, não deste registro local isoladamente.
