# Certificação do Filtro — nota 10 (Clinical Intelligence Engine)

O filtro (`filtro-escalas.html`) está em **~9,9** com tudo o que é verificável por
código já provado em CI (motor 43 OK · estático 836 · smoke 14 · design-audit no
baseline). O **0,1 final** depende de duas validações **humanas** que nenhum teste
automatizado substitui. Este documento é o roteiro para fechar o 10 — preencha as
colunas “obtido” e marque os itens.

---

## Parte 1 — Auditoria com leitor de tela real (a11y)

Rode com **NVDA** (Windows) ou **VoiceOver** (Cmd+F5 no macOS / iOS). Não basta a
marcação estar correta: tem que *soar* certo.

- [ ] **Tab order**: busca → chips de queixa → "quem responde" → resultados, sem armadilha de foco.
- [ ] **Atalho `/`**: foca a busca de qualquer lugar; **`Esc`** limpa busca + chips.
- [ ] **Card lido conciso**: o leitor anuncia `"1ª indicação, ouro. <nome>. <domínio>. faixa <x>. responde <y>. correspondência <alta/boa/parcial>"` — sem sopa de emojis.
- [ ] **Região status**: após buscar, anuncia "N indicações principais e M alternativas para <idade>".
- [ ] **Pós-busca**: o foco aterrissa no cabeçalho dos resultados (não fica preso na busca).
- [ ] **Skeleton**: durante o carregamento, a grade reporta `aria-busy` (não anuncia "vazio").
- [ ] **Tela-vazia**: sem resultado, os chips de recuperação são alcançáveis e clicáveis por teclado.
- [ ] **prefers-reduced-motion**: com "reduzir movimento" ligado, o astronauta e os cards não animam.
- [ ] **Contraste (WCAG AA)**: pílulas `alta/boa/parcial`, selos de licença e texto dos eixos ≥ 4.5:1. Use o color picker do DevTools.

## Parte 2 — Validação clínica do ranking (15 queixas reais)

Abra o filtro e digite cada queixa. Confira se o **pódio (1–3) + teste direto (4º) +
escola (5º)** fazem sentido clínico. Marque ✔/✘ e anote o que veio errado.

| # | Queixa (idade + sintoma) | Esperado (seu julgamento) | Obtido (top-5) | ✔/✘ |
|---|---|---|---|---|
| 1 | criança 5 anos agitada, escola suspeita de TDAH | inventário TDAH pais + escola + teste atenção | | |
| 2 | 2 anos não fala, não aponta | triagem TEA + linguagem + marcos | | |
| 3 | 8 anos troca letras, não lê bem | dislexia/aprendizagem + leitura | | |
| 4 | adolescente 14 anos ansioso, não desgruda dos pais | ansiedade/separação | | |
| 5 | 6 anos birras explosivas, desafia | comportamento/oposição | | |
| 6 | 4 anos não dorme, acorda à noite | sono | | |
| 7 | criança **sem autismo**, investigar TDAH | TDAH (NÃO deve trazer escalas de TEA) | | |
| 8 | 3 anos desajeitado, cai muito | motor/coordenação | | |
| 9 | 10 anos triste, sem vontade | humor | | |
| 10 | 7 anos incomoda com barulho e textura | sensorial | | |
| 11 | 9 anos rituais, mania de repetir | TOC | | |
| 12 | 12 anos fala em se machucar | risco (gate clínico — atenção ao enquadramento) | | |
| 13 | 18 meses atraso para sentar/andar | desenvolvimento/marcos | | |
| 14 | 5 anos só fala em casa (mutismo) | mutismo seletivo | | |
| 15 | 11 anos uso de álcool/cigarro | substâncias (CRAFFT) | | |

**Critério de aprovação:** ≥ 13/15 com pódio clinicamente plausível e **0** diários/
instrumentos de aplicação clínica vazando para a pré-consulta.

---

## O que registrar de volta

Para eu calibrar o último décimo: liste as linhas ✘ com **o que veio × o que deveria
vir**. Ajusto os gatilhos de construto (`scales-smart-rank.js`) e/ou os pesos do
`scoreFit()` com base em dado real — não em suposição.

> Apoio à decisão, não diagnóstico. A validação clínica aqui é de **relevância de
> triagem**, não de acurácia diagnóstica dos instrumentos.
