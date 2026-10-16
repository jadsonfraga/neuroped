# Laudo em um clique (roadmap item 1)

Rota: `/laudo-um-clique` (também `?patientId=` a partir da ficha do paciente, botão "Laudo em um clique").
Complementa, sem substituir, `/laudo-neuroped` e `/laudo-super`; nenhum conteúdo clínico existente foi alterado.

## O que faz
1. Carrega nome, nascimento e **escalas já salvas** do paciente (`/api/patients/:id` e `/results`).
2. Organiza o texto escrito pelo médico no template do dossiê de redação clínica: quadro **"Em uma página"** (5 linhas), capítulos de título fixo (I a XII; fonte ausente não vira capítulo vazio), fechamento com a nota final fixa e **Anexo técnico** opcional.
3. **Declaração de fonte** (R3) automática em escola, terapias, exames e história; lacuna se faltar a fonte.
4. **Escalas pontuadas** só no Anexo técnico (regra 8). Usa escore e classificação salvos; deriva classificação apenas onde já existe corte oficial no app (M-CHAT-R/F). Sem escore salvo, **nenhum número é inventado**.
5. **Conferência de prosa** (porta do Apêndice A): teto de 45 palavras, 90% < 30, vírgulas, léxico vetado, vazamento de processo, primeira pessoa, travessão, "não X, mas Y", escala no corpo, fonte, CID-10/CID-11 coincidentes, trecho repetido, última frase. Itens de **bloqueio** impedem copiar/imprimir.
6. **Controle fora do laudo**: lacunas e perguntas ao médico, checklist, segunda leitura (5 perguntas, alto risco) e linha sugerida para o prontuário (uso de ferramenta).
7. **Revisão obrigatória**: copiar/imprimir só após "Li, editei e assumo este texto". Qualquer edição exige gerar e rever de novo.

## Privacidade (IA externa)
- O app **não chama IA externa**. O botão "Prompt pseudonimizado" monta o laudo com marcadores (`PACIENTE_1`, `[DATA_1]`, `[CPF_1]`…), copiável para a IA que o médico escolher.
- Trava `garantirPseudonimizado`: se restar nome/documento/contato, o prompt é bloqueado.
- O mapa de marcadores fica só em memória na tela; o texto devolvido é reidentificado localmente.
- Dados de teste são todos fictícios.

## Arquivos
- `client/src/lib/laudoUmClique/` — `tipos`, `pseudonimizar`, `escalas`, `estilo`, `gerador`, `promptIA`.
- `client/src/pages/laudo-um-clique.tsx` — página; rota em `App.tsx`, `knownRoutes.ts`, `routeGuardPolicy.ts`, navegação e ficha do paciente.
- Testes: `tests/laudo/test-laudo-um-clique.test.ts` (unitário, 18 casos; incluído em `test:clinical-documents`) e `tests/e2e/laudo-um-clique.mjs` (Playwright, API sintética).

## Comandos
`npm run test:laudo-um-clique` · `npm run build && npm run test:e2e:laudo-um-clique`

## Limitações conhecidas
- O texto clínico continua sendo do médico; o gerador não redige prosa clínica nova (evita invenção).
- Sem endpoint de IA no servidor: refinamento por IA é manual (prompt pseudonimizado).
- Em modo clínica remota (LIVE) o escore pode não vir salvo; nesse caso a escala fica "sem escore" e fora do anexo por padrão.
- Aprovação de estilo não comprova correção clínica. Escalas: decisão DP-01 do dossiê (escore no anexo) pendente do médico.
- Linha de prontuário cita a Resolução CFM 2.454/2026 "a confirmar no texto oficial".
