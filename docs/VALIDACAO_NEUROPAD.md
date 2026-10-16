# Validação clínica pendente — Super NeuroPad Game e Dyslexia Risk (ICED-8 e Jogo das Letras e Números)

Documento criado em 16/10/2026 junto com o PR de pendências do diagnóstico. **Nenhum valor clínico foi inventado.**
Tudo que depende de norma, fonte ou estudo ficou como **referência interna sem fonte**, com campo para a fonte e
com texto de aviso na tela, no PDF e no prontuário. Este arquivo lista o que **só o Dr. Jadson (ou a literatura
e um estudo de validação) pode fornecer** e onde cada coisa se liga no código.

## 1. O que o código já faz (infraestrutura, sem mudar resultado)

| Item | Onde | Estado |
|---|---|---|
| Cortes do Super NeuroPad por faixa etária | `client/src/features/super-neuropad/cutProfiles.ts` (`CUT_PROFILES`, `cutProfileFor`) | Um perfil único `interno-padrao` (75/50 % por mundo, 80/60 % no total) para todas as idades, `fonte: null` |
| Domínio com poucos itens só descritivo (2–3 anos) | `MIN_DOMAIN_ITEMS_FOR_LEVEL = 3` em `cutProfiles.ts` | Ativo (único efeito: 2 anos, domínio "brincar simbólico", 2 itens) |
| Folga de tempo até o teto | `timeMarginSeconds`, `TIME_MARGIN_WARN_SECONDS = 60` em `model.ts` | Aviso em 2, 3, 16 e 17 anos; **não** muda itens nem tetos |
| Procedência dos itens do Super NeuroPad | `itemProvenance`, `provenanceText` em `model.ts` | Tela de preparação, relatório e PDF |
| Referências do ICED-8 em tabela | `client/src/features/dyslexia-risk/icedConfig.ts` | Valores históricos, `fonte: null` |
| Ditado do ICED com 10 pseudopalavras | `DITADO_PSEUDO` (`model.ts`), corte proporcional 2/5 | Rascunhos antigos (5) continuam avaliados sobre 5 |
| Leitura proporcional do escore | `IcedResult.proporcaoPct` e aviso "descritiva, NÃO altera a faixa" | Não muda faixa |
| Fluência do jogo: sinais sem norma | `client/src/features/dyslexia-risk/game/fluencyFlags.ts` | Precisão, "nenhuma leitura", tempo curto; comparação **desligada** até haver `fonte` |
| Compreensão forma B | `game/comprehensionB.ts` | 6 textos autorais, sem equivalência psicométrica comprovada |
| Faixa 15–18 | `game/bank.ts` | 6 itens por nível (antes 4), sem subnível validado; nota "faixa ampla" nos registros |
| Procedência do jogo | `BANK_PROVENANCE` em `game/bank.ts` | Tela inicial, registro e PDF |
| Congelamento (golden) | `tests/unit/pendencias-golden.test.ts` + `tests/fixtures/golden-pendencias.json` | Qualquer mudança de corte/escore/sinal falha o teste |

Para mudar um corte: (1) preencher `fonte` com a citação; (2) alterar o valor; (3) rodar
`node --import tsx tests/tools/gen-golden-pendencias.ts` e revisar o diff do fixture no PR; (4) atualizar os textos de
procedência. Sem `fonte`, o texto continua dizendo "referência interna, sem fonte".

## 2. Depende do Dr. Jadson (checklist)

Marque e registre data, responsável e fonte em cada linha.

### 2.1 Super NeuroPad Game
- [ ] **Cortes 75/50 % (mundo) e 80/60 % (total):** manter como referência interna ou definir por idade (2–3, 4–5, 6–7, 8–11, 12–17). Se por idade, fornecer fonte ou estudo de validação e criar perfis em `CUT_PROFILES`.
- [ ] **Mínimo de itens por domínio (2–3 anos):** confirmar `MIN_DOMAIN_ITEMS_FOR_LEVEL = 3` ou ampliar a bateria (mais itens por domínio) respeitando o teto de 12 min (2 anos) e 15 min (3 anos).
- [ ] **Folga de tempo (2, 3, 16 e 17 anos: 44, 45, 57 e 57 s):** decidir se mantém (aviso), se reduz itens ou se muda o teto. O PR só avisa.
- [ ] **Itens autorais (bateria de 2–3 anos e 6º desafio dos 8–17 anos):** revisão clínica de cada item e dos pisos (fluência verbal 8–13 animais, cálculo mental, motor). Hoje: 18 de 18 itens aos 2 anos, 24 de 24 aos 3 anos e 6 de 36 dos 8 aos 17 anos são autorais.
- [ ] **Concordância entre aplicadoras:** estudo com ≥ 2 aplicadoras por criança nos itens de fala e ação (o jogo ainda não registra segunda aplicadora).

### 2.2 ICED-8
- [ ] **Fonte dos cortes:** PCPM 2º ano ≤ 42 (descreve até 55) e 3º ano ≤ 70 (descreve até 80); RAN > 45 s ou ≥ 4 erros; ditado ≥ 4 erros fonológicos ou pseudopalavras ≤ 2/5; pseudopalavras ≤ 10/16 ou ≥ 4 lexicalizações; consciência fonológica ≤ 6/12 (7–9 descreve); precisão ≤ 15/20; limiares do escore 5 e 9 de 15.
- [ ] **Âncoras de fluência para outros anos** (`FLUENCY_ANCHORS` só tem 2º e 3º): fornecer fonte por ano (1º, 4º–9º) para ativar; sem isso a fluência não pontua e o aviso permanece.
- [ ] **RAN por ano:** `RAN_REFERENCE` está igual para todos; fornecer valores por ano e a validade do estímulo (formas, não letras/números).
- [ ] **Limiar com domínios fora do alcance:** decidir se o limiar 9/15 vira regra proporcional (hoje só a leitura descritiva aparece, sem alterar a faixa).
- [ ] **Ditado com 10 pseudopalavras:** aprovar as 5 novas (bifa, dumeno, salteca, frobita, venhulo) e o corte proporcional 2/5 (equivalente ao antigo para 5 itens).

### 2.3 Jogo das Letras e Números
- [ ] **Referência de fluência por faixa** (`FLUENCY_REFERENCES`: `wcpmMinimo` + `fonte`): sem isso o jogo mostra só dados e sinais descritivos.
- [ ] **Revisão dos 6 textos da forma B** (`comprehensionB.ts`) e dos 18 itens novos da faixa 15–18 (ditado, leitura, aritmética).
- [ ] **Subnível da faixa 15–18** (ex.: 15–16 e 17–18): exige itens próprios e definição clínica.
- [ ] **Equivalência das formas A e B** (compreensão e fluência): estudo de formas paralelas.
- [ ] **Tempo estimado por item** (constantes em `estimateSessionSeconds`): medir em aplicações reais.

### 2.4 Validação geral com crianças brasileiras
- [ ] Amostra por faixa etária, aprovação em comitê de ética e consentimento (LGPD: dados de menores).
- [ ] Comparação com instrumento de referência (padrão-ouro escolhido pelo médico).
- [ ] Sensibilidade, especificidade e confiabilidade (teste-reteste) antes de qualquer mudança de rótulo "esperado".
- [ ] Registrar aqui a fonte aprovada e atualizar `status` para `com_fonte`.

## 3. O que NÃO deve ser feito sem essa validação
- Não transformar referência interna em "norma", "percentil" ou "ponto de corte validado" em nenhum texto.
- Não reduzir ou ampliar o teto de tempo, nem encurtar itens, só para ganhar folga.
- Não converter o limiar 9/15 do ICED em proporção para classificar.
