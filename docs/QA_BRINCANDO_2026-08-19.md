# QA — Brincando e Aprendendo

## Preview validado

Em 19/08/2026, o bundle de produção foi aberto em `http://127.0.0.1:4174/#/brincando-e-aprendendo`. O aviso educacional foi aceito e a tela carregou sem erro.

## Achados visuais

A página exibiu o shell do NeuroPed, hero com mascote e logotipo locais, seletor das faixas 3–5, 6–8 e 9–12 anos, cinco arenas, cartões com ilustrações, botões de missão e rodapé. A hierarquia visual, a paleta infantil, as bordas arredondadas e as sombras estão preservadas. Os assets foram servidos pelo bundle local, sem dependência das imagens do domínio de referência.

## Correções aplicadas nesta rodada

Foram adicionados estados de foco visível, suporte a `prefers-reduced-motion`, entradas em cascata, microinterações nos cartões e botões, animação discreta do mascote, feedback animado e `aria-pressed` nos seletores de faixa. O avanço de atividade foi corrigido para permanecer bloqueado enquanto nenhuma resposta estiver selecionada; trocar de faixa agora reinicia a atividade e a pontuação.

## Regressão encontrada e corrigida

O teste real identificou que o wrapper local `KidsButton` aceitava a chamada `disabled={selectedAnswer === null}`, mas não encaminhava essa propriedade ao elemento `<button>`. Por isso, o botão `Próxima missão` permanecia clicável antes da resposta.

A correção adicionou `disabled?: boolean` ao contrato do wrapper, aplicou `disabled = false` no destructuring e encaminhou `disabled={disabled}` ao botão nativo. O frontend foi recompilado com sucesso.

Após reiniciar o preview e carregar com cache busting, o navegador confirmou o chunk atualizado `brincando-e-aprendendo-CmvpNYfe.js`. No primeiro desafio, o DOM passou a apresentar `disabled: true` no botão `Próxima missão`, enquanto as três alternativas permaneceram habilitadas.

## Evidência

Screenshot do preview: `/home/ubuntu/screenshots/127_0_0_1_2026-08-19_06-48-27_4312.webp`.
