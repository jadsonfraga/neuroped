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

## Registro de como a aplicação transcorreu (v5)
- **Tempo medido:** início da sessão, tempo ativo, tempo de resposta por item e por mundo (mínimo/mediana/máximo por item), pausas, registros desfeitos e se a sessão terminou por limite de tempo, ao lado da estimativa do app. A diferença entre limite e estimativa é registrada (`folga_planejada_s`); o app não altera teto nem itens por conta própria.
- **Forma usada:** forma A/B dos textos (compreensão e fluência) no relatório, PDF e prontuário.
- **Observações do aplicador/examinador:** campo livre com atalhos de fatos (reação da criança, mediação/ajuda, condições do ambiente) nos três registros (Super NeuroPad, Jogo das Letras e Números, ICED-8), em tela, relatório, PDF e prontuário.
- **Idade exata** é sempre registrada junto da faixa (faixa de 15–18: "idade registrada: N anos").
- **Procedência dos itens:** contagem de origens no relatório e inventário item a item em `docs/instrumentos/`.
- **Saída da página:** o Super NeuroPad avisa antes de recarregar/fechar com partida em andamento ou resultado ainda não guardado.

## Instrumentos para dados externos
`docs/instrumentos/` traz protocolos e planilhas vazias (concordância entre aplicadoras, medição de tempo, formas A/B, piloto com crianças) e um script que calcula só números descritivos. Dependem de aplicações reais e de comitê de ética; **não há dados no repositório**.

## Garantias de teste
`tests/unit/sem-classificacao.test.ts` varre todas as saídas (relatórios, PDFs, registros, família, páginas) contra vocabulário interpretativo proibido; `tests/unit/golden-descritivo.test.ts` congela banco, sequências e tempos sem qualquer classificação.
