# Super NeuroPad Game e Dyslexia Risk — natureza dos registros

**Diretriz (Dr. Jadson, 16/10/2026):** os módulos não classificam nem interpretam.
Aviso único em telas, PDFs e registros (`client/src/lib/descriptiveNotice.ts`):
"Registro descritivo; sem classificação. Interpretação a cargo do profissional."

## O que o app registra
- **Como a avaliação foi feita:** versão/forma (A/B), itens e ordem, tempos, condições, instruções, ajuda/mediação, pausas e registros desfeitos.
- **Como a criança respondeu:** resposta item a item, acertos/erros em contagem bruta, tipo de erro, recusas/sem resposta, tempo de resposta, observações comportamentais.

## O que foi removido
Pontos de corte, níveis, faixas de classificação, rótulos interpretativos, limiares, comparações normativas/de referência, sinais de alerta e "leitura do jogo"
(`cutProfiles`, `icedConfig`, `fluencyFlags`, `scoreIced`, `interpret`, `levelCuts`). O "nível" interno do Dyslexia Risk é apenas dificuldade do item na administração adaptativa, nunca exibido como resultado.

## Pendências anteriores
- Cortes, normas e validação normativa: **resolvidas por remoção**.
- Demais (folga de tempo, cobertura, procedência dos itens, faixa 15–18, concordância entre examinadores/equivalência entre formas A/B, medição de tempo): **itens operacionais**, sem dados inventados. A procedência dos itens é descrita apenas como contagem de origens; equivalência entre formas e concordância entre examinadores não foram estudadas e não são afirmadas.

## Garantias de teste
`tests/unit/sem-classificacao.test.ts` varre todas as saídas (relatórios, PDFs, registros, família, páginas) contra vocabulário interpretativo proibido; `tests/unit/golden-descritivo.test.ts` congela banco, sequências e tempos sem qualquer classificação.
