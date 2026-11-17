# OBS-10 · modo Fases

Entrada padrão da rota `/#/avaliacao-pre-consulta-faixa-etaria` desde 17/11/2026. **Não usa câmera:** o resultado é montado a partir do registro da aplicadora. Versão do registro inalterada (1.6.1).

## Para quem aplica

1. **Preparar (uma tela):** idade e duas confirmações (“Criança bem”, “Sala segura e kit separado”). O kit da ficha aparece ilustrado, só para conferência visual. Nenhuma câmera, filmagem ou aparelho de apoio é exigido.
2. **Jogar as 6 fases:** um cartão por vez com ilustração, o que dizer, os passos e o que observar (textos já sem instruções de filmagem). Um toque registra e avança:
   - **Fez sem ajuda extra**
   - **Fez com ajuda…** → Repeti o pedido / Mostrei como fazer / Com apoio habitual
   - **Não fez agora**
   - **Não quis**
   - **Pular…** → Falta material seguro / Não era seguro aplicar / Criança cansada ou indisposta / Sem tempo / Outro motivo
   Nota rápida opcional no próprio cartão. Ao fim de cada fase, uma tela de transição mostra o que pegar a seguir.
3. **Resultado e entrega:** a tela final mostra o **resultado pelo registro da aplicadora** (por fase, o que foi marcado; lista “para o médico conferir na consulta” com os cartões com ajuda, “não fez agora” ou “não quis”; não aplicados com motivo). Baixar resumo (TXT), arquivo para reabrir (JSON) ou imprimir. Notas por cartão são opcionais.

Sempre visíveis durante a coleta: cronômetro de 10 minutos, mapa das fases, **Encerrar** (com confirmação) e **Parar e chamar médico**.

## Resultado pelo registro da aplicadora

`client/src/features/obs10/fases/result.ts` agrupa as categorias declaradas por fase e entra no TXT como seção “RESULTADO PELO REGISTRO DA APLICADORA — SEM VÍDEO”. É síntese descritiva para revisão médica:

- sem soma total, porcentagem, peso, ponto de corte, norma ou conclusão;
- “não fez agora” e “não quis” não indicam incapacidade; cartão sem marca não indica habilidade ausente nem presente;
- nenhum texto é escrito no lugar da aplicadora: sem nota, o relatório diz “não descrito; vale a categoria declarada pela aplicadora”.

Como não há vídeo, `observationIssues(o, { applicatorRecord: true })` deixa de cobrar descrição literal e qualidade audiovisual nos registros com `preparation = "fases"`. O Guia da assistente continua cobrando as duas.

## Regras mantidas

| Regra | Como o modo Fases a preserva |
|---|---|
| Mesma ficha e mesmos cartões | `buildFasesPlan` lê `PRACTICAL_TASKS`; ordem e fases idênticas ao Guia. Só o texto de filmagem é retirado (`withoutCamera`); orientações de segurança permanecem. |
| Omissões | `taskOmission` (prono sem autorização, idade mínima) gera cartão “não se aplica” com um toque para registrar o motivo. |
| Limite de 10 min e saída da aba | `sessionElapsed` + `MAX_SECONDS`; `visibilitychange` encerra a coleta. |
| Sem pontuação | As cinco opções têm o mesmo peso visual; o progresso conta cartões marcados em qualquer categoria. Sem estrelas, XP, acerto/erro ou ranking. |
| Modelo previsto | `modelInInstruction` preservado; o cartão avisa que a demonstração já faz parte da tarefa. |
| Registro | Mesmo `SessionRecord`, ids `guided-*`, `context.preparation = "fases"`, captação “Sem vídeo” e linha `PREPARATION_FASES_LINE` no TXT e no dossiê. |
| Revisão completa | O JSON reabre no **Guia da assistente → Arquivo JSON para revisão**. |
| Privacidade | Sem câmera, upload, `localStorage` ou IA. Dados só em memória; guarda de saída ativa. |

## Limites

- Sem vídeo, o médico depende do que a aplicadora marcou e escreveu; não há como reconferir a execução. Para casos que exijam evidência audiovisual, usar o **Guia da assistente** (câmera opcional).
- O preparo resumido é declaração da aplicadora; não substitui treinamento supervisionado.
- Horário de registro/evocação da tarefa de memória não é medido; o relatório registra “não medido”. Os horários de marcação de cada cartão ficam no registro.
- Registro observacional para revisão médica: não é laudo, escore, norma ou diagnóstico.

## Arquivos

- `client/src/features/obs10/fases/model.ts` — plano, adaptação sem câmera, marcação e progresso.
- `client/src/features/obs10/fases/result.ts` — resultado pelo registro da aplicadora.
- `client/src/features/obs10/fases/FasesMode.tsx` — interface; `fases.css` — estilos escopados.
- `client/src/pages/pre-consulta-obs10.tsx` — aba padrão, trava das abas durante a coleta e guarda de saída.
- Testes: `tests/unit/obs10-fases.test.ts`, `tests/e2e/obs10-fases.mjs` (rota construída, API sintética, axe, celular 390 px).

## Rollback

Reverter a PR deste modo. Registros já exportados com `preparation: "fases"` continuam legíveis como texto; a reimportação na versão anterior os recusaria, sem alterar a sessão atual.
