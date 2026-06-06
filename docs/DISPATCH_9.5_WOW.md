# DISPATCH 9.5 — OPERAÇÃO "WOW FACTOR"

> **Missão:** elevar o NeuroPed a padrão visual SaaS premium 9.0+ — reposicionamento
> de percepção de produto, não cosmético.

---

## ⛓️ GUARDA-CORPOS (ler ANTES — inegociáveis; protegem o piso já conquistado)

A ambição "wow" só vale se **não regredir** o que já está verde e medido. Cowork,
respeite isto em TODAS as fases:

1. **Piso verde sempre.** Cada mudança: branch do `main` fresco → `npm run verify`
   100% → CI verde → merge. **Sequencial**, reversível. git `noreply@anthropic.com`.
2. **CONSTRUA sobre o que já existe, não recomece.** A paleta `--np-*` já foi
   **unificada** (1 acento iris + 1 ouro champagne) e há refinos globais em
   `np-foundation.css` §3.4/§3.5 (selection, scrollbar, accent-color, micro-
   interações). **Refine via tokens** (`np-tokens.css`/`np-palette-v2.css`) — não
   reinicie a identidade do zero (isso é churn + regressão). Se mudar a direção
   cromática (Fase 3), faça nos tokens e mantenha **`check-contrast --strict` verde** (AA).
3. **Tipografia:** Inter já é a fonte de texto; **Fraunces** (display editorial) é
   parte da identidade premium atual — só troque se **elevar**, não por trocar.
4. **Fase 5 (contagens):** mostrar **dados reais**; se um número não é derivável de
   verdade, **esconda** em vez de falsear. Nunca inventar.
5. **Fase 6 (remover "Testes"):** é **re-rotular/reorganizar**, NÃO deletar
   funcionalidade. Preserve os instrumentos de teste-direto, os **229 do catálogo**,
   as rotas e deep-links (use redirects, não 404). Não perca conteúdo clínico.
6. **Clínico/PDF:** sem emoji em UI clínica formal; **não tocar motor/`clinical-*.js`**
   sem a suíte passar; **não inventar asserção clínica** — dúvida vai para o Dr.
7. **Verificar no navegador (Claude in Chrome) antes de mergear** cada mudança
   visual: screenshot **antes/depois**. Nunca subir visual às cegas.
8. **A rubrica do `DISPATCH_9.0.md` continua valendo:** nota = **o menor dos eixos**
   (Segurança/Processo/Perf/A11y/Clínico/Estrutura), medido no CI. "Sensação
   premium" **não substitui** Perf/A11y/Clínico medidos — soma a eles.

---

## FASE 0 — MODO DE EXECUÇÃO
- Trabalhe DEVAGAR. Permissão para refatorar UI profundamente. Sem patches rápidos.
- Não aceite inconsistência nem componente "mais ou menos".
- Cada tela deve parecer feita pelo MESMO designer sênior. Passe pelo app várias vezes.
- Antes de finalizar uma tela: *"isso parece um produto caro de verdade?"* Se "mais ou menos", continue.

## FASE 1 — AUDITORIA NAVEGADA REAL
Abra `https://jadsonfraga.github.io/neuroped/` e `https://neuroped.pages.dev/`.
Use como humano real: clicar, digitar, alternar tema, gerar PDF, navegar mobile,
recarregar, offline, drawer, teclado, hover, transições, overflow, densidade.
DevTools Console aberto o tempo todo. Screenshots antes/durante/depois.

## FASE 2 — RECONSTRUÇÃO TOTAL DA SIDEBAR
Não pode parecer menu bootstrap/dashboard genérico/painel admin/site institucional.
Precisa parecer cockpit premium / SaaS enterprise / sistema clínico sofisticado.
**≥10 min reais só na sidebar.**
- **Topo:** logo refinado, símbolo isolado forte, nome "Neuroped", subtítulo discreto "Clinical Intelligence". Sem gradiente exagerado/neon/ícones infantis.
- **Seções em blocos:** PRINCIPAL (Home·Escalas·Runner·Relatórios) · INTELIGÊNCIA (Busca Clínica·Recomendações·Triagem) · AVALIAÇÃO (Instrumentos·Histórico·Aplicações) · SISTEMA (Offline·Preferências·Tema).
- **Estética:** profundidade, textura sutil, sombras sofisticadas, blur premium, respiro, ritmo. Hover suavíssimo/tátil. Item ativo com glow muito discreto + indicador refinado. Padding maior, espaçamento que respira, bordas translúcidas.
- **Objetivo sensorial:** ao abrir, micro-impacto emocional ("caramba, ficou caro").

## FASE 3 — IDENTIDADE VISUAL GLOBAL (padronizar tudo)
- **Tipografia:** Inter / SF Pro / Geist; hierarquia rígida (títulos fortes, subtítulos limpos, corpo sofisticado, densidade controlada). Nada amador/apertado/infantil/acadêmico antigo. *(Guarda-corpo 3: preserve Fraunces no display se mantiver o nível.)*
- **Cores (UMA linguagem):** base carvão premium / azul petróleo profundo / slate; accent dourado queimado / champagne escuro / ouro elegante. Proibido amarelo forte, neon, azul vibrante comum, cinza lavado. *(Guarda-corpo 2: via tokens, AA mantido.)*
- **Superfícies em layers:** fundo / surface / elevated / floating, com blur, sombras suaves, contraste elegante.
- **Efeitos:** ambient glow sutil, spotlight leve, hover breathing, motion premium, microinterações — nunca "gamer".

## FASE 4 — MOBILE PREMIUM (375px obrigatório)
Eliminar overflow horizontal, texto cortado, botões esmagados, grids quebrados.
Experiência tipo app nativo, fluida, refinada. Drawer mobile com blur de fundo,
animação elegante, abertura/fechamento premium.

## FASE 5 — CONTEÚDO E CONTAGENS (recontar tudo)
Todos os números exibidos refletem dados/registros/escalas/instrumentos **reais**.
Eliminar números hardcoded errados, contagem fake, inconsistências. Atualizar
badges, totais, indicadores, dashboards. *(Guarda-corpo 4: esconder, nunca falsear.)*

## FASE 6 — REMOVER "TESTES" (unificar em ESCALAS)
A aba "Testes" fragmenta o produto → tudo vira **ESCALAS** com subgrupos: Diretas,
Escolares, Triagem, Diagnósticas. Arquitetura mental limpa, previsível, elegante.
*(Guarda-corpo 5: re-rotular/reorganizar — preservar instrumentos, rotas e deep-links.)*

## FASE 7 — PDF / LAUDO
Parecer documento médico premium / clínica high-end / relatório institucional.
Eliminar emojis, informalidade, densidade/margens/hierarquia ruins. Adicionar
tipografia refinada, grid elegante, espaçamento premium, cabeçalho sofisticado,
consistência clínica.

## FASE 8 — ACESSIBILIDADE PREMIUM
Focus states bonitos, teclado funcional, reduce-motion respeitado, contraste AA,
seleção temática, scrollbar premium. *(Boa parte já está em np-foundation §3.4 — estenda.)*

## FASE 9 — VERIFICAÇÃO REAL (após CADA grande alteração)
Abrir no navegador → navegar de verdade → hover → mobile → tema → PDF → reload →
console → densidade → "sensação premium". **Nunca confiar só no código.**

## FASE 10 — ENTREGA
1. Auditoria completa em markdown · 2. Screenshots antes/depois · 3. Lista de bugs ·
4. Lista de melhorias · 5. PRs separados · 6. Evidência visual · 7. Console limpo ·
8. Dúvidas clínicas para o Dr. · 9. Nota final por dimensão: Funcionamento, Estética,
Conteúdo, Mobile, PDF, A11y, Sensação premium.

## META FINAL
Não é "ficar bonito" — é parecer um produto **extremamente caro, refinado, confiável,
visualmente inesquecível, moderno, premium, coeso, elegante**, com sensação de software
de elite clínica. **Sempre dentro dos guarda-corpos acima.**
