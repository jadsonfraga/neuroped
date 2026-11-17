# OBS-10 · modo Fases

Entrada padrão da rota `/#/avaliacao-pre-consulta-faixa-etaria` desde 17/11/2026. Versão do registro inalterada (1.6.1).

## Para quem aplica

1. **Preparar (uma tela):** idade, duas confirmações (“Criança bem”, “Sala segura e kit separado”) e a forma de filmagem (“Celular de apoio filmando” ou “Sem filmagem hoje”). O kit da ficha aparece ilustrado, só para conferência visual.
2. **Jogar as 6 fases:** um cartão por vez com ilustração, o que dizer, até três passos e o que observar. Um toque registra e avança:
   - **Fez sem ajuda extra**
   - **Fez com ajuda…** → Repeti o pedido / Mostrei como fazer / Com apoio habitual
   - **Não fez agora**
   - **Não quis**
   - **Pular…** → Falta material seguro / Não era seguro aplicar / Criança cansada ou indisposta / Sem tempo / Outro motivo
   Nota rápida opcional no próprio cartão. Ao fim de cada fase, uma tela de transição mostra o que pegar e como filmar a seguir.
3. **Entregar:** baixar resumo (TXT), arquivo para reabrir (JSON) ou imprimir. Notas por cartão podem ser completadas depois do encerramento, sem novas tarefas.

Sempre visíveis durante a coleta: cronômetro de 10 minutos, mapa das fases, **Encerrar** (com confirmação) e **Parar e chamar médico**.

## Regras mantidas

| Regra | Como o modo Fases a preserva |
|---|---|
| Mesma ficha e mesmos cartões | `buildFasesPlan` lê `PRACTICAL_TASKS`; ordem e fases idênticas ao Guia. |
| Omissões | `taskOmission` (prono sem autorização, idade mínima) gera cartão “não se aplica” com um toque para registrar o motivo. |
| Limite de 10 min e saída da aba | `sessionElapsed` + `MAX_SECONDS`; `visibilitychange` encerra a coleta. |
| Sem pontuação | As cinco opções têm o mesmo peso visual; o progresso conta cartões marcados em qualquer categoria. Sem estrelas, XP, acerto/erro ou ranking. |
| Categoria não vira descrição | Sem nota digitada, o relatório marca a descrição como pendente. Ajuda e pulo gravam somente o motivo escolhido. |
| Modelo previsto | `modelInInstruction` preservado; o cartão avisa que a demonstração já faz parte da tarefa. |
| Registro | Mesmo `SessionRecord`, ids `guided-*`, `context.preparation = "fases"` e linha `PREPARATION_FASES_LINE` no TXT e no dossiê. |
| Revisão completa | O JSON reabre no **Guia da assistente → Arquivo JSON para revisão** (qualidade de vídeo, trechos, dossiê). |
| Privacidade | Sem câmera integrada, upload, `localStorage` ou IA. Dados só em memória; guarda de saída ativa. |

## Limites

- O preparo resumido é declaração da aplicadora; não substitui o checklist completo nem treinamento supervisionado. Para primeira aplicação, câmera integrada, ensaio ou filmagem conferida, usar **Guia da assistente**.
- Horário de marcação de memória (registro/evocação) não é medido neste modo; o relatório registra “não medido”. Os horários de marcação de cada cartão ficam no registro.
- Qualidade audiovisual não é declarada aqui; permanece pendente até a revisão completa.
- Registro observacional para revisão médica: não é laudo, escore, norma ou diagnóstico.

## Arquivos

- `client/src/features/obs10/fases/model.ts` — plano, marcação, progresso e textos (puro, testável).
- `client/src/features/obs10/fases/FasesMode.tsx` — interface; `fases.css` — estilos escopados.
- `client/src/pages/pre-consulta-obs10.tsx` — aba padrão, trava das abas durante a coleta e guarda de saída.
- Testes: `tests/unit/obs10-fases.test.ts`, `tests/e2e/obs10-fases.mjs` (rota construída, API sintética, axe, celular 390 px).

## Rollback

Reverter a PR deste modo. Os registros já exportados com `preparation: "fases"` continuam legíveis como texto; a reimportação na versão anterior os recusaria, sem alterar a sessão atual.
