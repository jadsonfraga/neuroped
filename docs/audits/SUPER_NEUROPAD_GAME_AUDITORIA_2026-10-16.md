# Auditoria ponta a ponta — Super NeuroPad Game (16/10/2026)

Base: `main` @ `cfe2f6d4`, versão do jogo `2026-10-15.1`. Escopo: `client/src/features/super-neuropad/*`,
`client/src/pages/super-neuropad-game.tsx`, `docs/SUPER_NEUROPAD_GAME.md`, testes `tests/unit/super-neuropad-*`
e `tests/e2e/super-neuropad-game.mjs`. Linha de base verificada antes de mudar qualquer coisa:
`npm run test:super-neuropad` = 66/66 passando; e2e `super-neuropad-game.mjs` (7 e 3 anos) passando.

## 1. Inventário

Faixas anuais de 2 a 17 anos (16 faixas), 6 mundos (Vila, Olhos, Palavras, Números, Memória, Corpo). Itens de 4 origens
(Sonda 10, OBS-10, Reconhecimento Visual, Avaliação Cognitiva). Tipos: toque (conferido pelo jogo), montar palavra
(jogo), fala e fazer (conferidos pela aplicadora).

| Idade | Itens | por mundo | fala/fazer/toque/montar | opções por toque | estimativa (min, teto) |
|---|---|---|---|---|---|
| 2 | 18 | 3 | 6/11/1/0 | 2 | 11,3 (12) |
| 3 | 24 | 4 | 8/14/2/0 | 2–3 | 14,3 (15) |
| 4 | 24 | 4 | 11/4/9/0 | 2–4 | 14,8 (20) |
| 5 | 24 | 4 | 7/5/12/0 | 2–4 | 15,2 (20) |
| 6 | 30 | 5 | 11/5/14/0 | 2–4 | 13,9 (20) |
| 7 | 30 | 5 | 11/4/14/1 | 3–4 | 13,7 (20) |
| 8–11 | 36 | 6 | 15/5/15/1 | 4 | 17,8–18,2 (20) |
| 12–17 | 36 | 6 | 15/5/15/1 | 4 | 18,6–19,1 (20) |

Itens exclusivos de uma só idade: 250; compartilhados entre idades: 80 (ex.: evocação de 3 palavras 6–17, fluência de
animais 8–17, escrita por ditado 7–17, pé só/junta do piso 12–17).

## 2. Construtos e progressão de dificuldade

Cobertos: cognição social/pragmática, reconhecimento e raciocínio visual, linguagem/leitura/escrita, aritmética,
memória verbal de curto prazo e operacional (dígitos direto/inverso, palavras), inibição e flexibilidade **verbais**
(SOL/LUA, DIA/NOITE, direita/esquerda), motricidade (pé só, marcha em linha, diadococinesia, cópia de formas).

Não cobertos por tarefa **no aplicativo**: tempo de reação, controle inibitório motor cronometrado (go/no-go),
memória visuoespacial (span espacial), variabilidade intraindividual de tempo de reação. Hoje a única medida de tempo é o
intervalo entre a exibição do item e o registro (inclui o tempo da aplicadora para julgar) — serve como ritmo interno
da partida, não como latência de resposta.

Progressão: por ano, os itens trocam de perfil de origem; de 8 a 17 anos a estrutura é idêntica (15/15/5/1) e a
progressão de dificuldade vem só da troca de conteúdo; não há ajuste adaptativo dentro da partida. Os 6 itens de cada
mundo a partir de 8 anos e 3–4 itens por mundo até 5 anos dão resolução muito grossa por mundo (ex.: 4 itens por mundo:
3–4 esperado / 2 observar / 0–1 alerta; 1 item muda a faixa).

## 3. Pontuação e registro

- Acerto/erro/não respondeu/recusou (recusa e ausência de resposta separadas de erro). Faixas por proporção **autoral**
  (0,75/0,5 por mundo; 0,8/0,6 no total), declaradas como não normativas. Nenhuma norma ou corte externo é usado.
- Registro por item: mundo, origem, referência, enunciado, esperado, dado, status, segundos, repetição, via (gesto).
  Resultado só em memória; PDF local; "Salvar no prontuário" explícito.
- Leitura (`interpret`) só em partida completa; já traz mediana de ritmo, itens lentos (≥2× mediana, mín. 12 s), toques
  impulsivos (<1 s), padrão de resposta, fadiga por metades e ritmo, toque × aplicadora.

## 4. Achados

**Bugs / riscos de validade**
1. **Posição da resposta correta não é balanceada.** `TouchStage` embaralha as opções com a mesma semente da partida
   para todos os itens. No banco, em itens de 4 opções, a resposta certa está no índice 0 em 71, no 1 em 71, no 2 em 35
   e no 3 em 10 dos 187 itens; com a mesma permutação, o acerto fica concentrado em poucas posições durante toda a
   partida (ex.: com a semente 1, aos 6 anos a resposta certa fica no índice 1 em 9 dos 14 toques; com a semente 999999 fica no índice 1 em apenas 1 de 14 e o índice 2 domina). Uma criança com preferência de posição (perseveração, lado dominante) ganha ou perde pontos por
   artefato do embaralhamento, e o relatório não permite separar isso de erro de conteúdo.
2. O registro de toque guarda só o texto da opção escolhida, não a posição na tela nem o tipo de distrator: não dá para
   analisar erro de posição, perseveração nem erro por distrator.
3. O tempo do item mistura reação da criança e conferência da aplicadora (fala/fazer); não deve ser lido como latência.
   Falta variabilidade (dispersão) além da mediana.

**Profundidade técnica (lacunas)**
4. Sem tarefa cronometrada no aplicativo (ver seção 2) e sem treino não pontuado do formato de toque.
5. Sem aprofundamento adaptativo: criança que vai muito bem ou muito mal não tem sondagem de nível acima/abaixo.
6. Poucos itens por mundo; só nos mundos de 2–3 anos há leitura por domínio.
7. 2 e 3 anos: apenas 1–2 itens de toque (resto é julgado pela aplicadora); tarefas cronometradas no tablet não são
   adequadas para essa faixa (documentado como lacuna, não como erro).

**UX / acessibilidade**
8. Pontos positivos já presentes: alvos de toque mínimos 48 px, movimento reduzido, alto contraste, rótulos ARIA (58 usos
   na página), marcação textual além da cor, guarda de toque duplo (300 ms), axe nos testes e2e.
9. O e2e cobre só 7 e 3 anos; as outras 14 faixas dependem de testes unitários do banco.
10. Orçamento de tempo: de 8 a 17 anos a estimativa é 17,8–19,1 min de 20; não há folga para acrescentar itens à bateria
    principal. Módulos novos precisam ser opcionais e fora do teto/contagem principal.

**Risco de regressão (o que não pode quebrar)**
- Contagem de itens por faixa e `complete` (todos os itens registrados uma vez); faixas por proporção; formato de
  `AnswerRecord`, linhas estruturadas (`SESSAO`, `DOMINIO`, `ORIGEM`, `ITEM`, `ALERTA`), PDF, itens do prontuário,
  entrega à família, estimativa ≤ teto de tempo, nada persistido/enviado por rede.
- Regra de verdade clínica (AGENTS.md): nada de norma, corte ou equivalência não verificados; rastreio ≠ diagnóstico.

## 5. Plano (PRs pequenas, sem merge)
1. Posição das opções balanceada por item + registro opcional `pos`/`n` (compatível) + análise descritiva de erro por posição
   e variabilidade de tempo (mediana, intervalo interquartil, CV) por mundo.
2. Módulo opcional "Tarefas complementares" (4–17 anos), fora da contagem principal: treino + span espacial (Corsi, ajuste
   adaptativo por regra de parada) + go/no-go com tempo de reação, variabilidade, omissões, comissões e antecipações;
   registrado à parte (`tasks`), no relatório, no PDF, nas linhas estruturadas e no prontuário.
3. Testes automatizados novos + e2e de todas as faixas.
4. Lacunas mantidas: normas (não existem verificadas para estes itens), 2–3 anos sem tarefa cronometrada, bateria
   principal sem adaptação.
