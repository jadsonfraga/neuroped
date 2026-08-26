
## Referência inicial

O Material Design classifica sons de interface como feedback de seleção, confirmação, alerta e sons secundários, defendendo uso sutil e não intrusivo. A página legada consultada informa que o guia Material 2 não é mais mantido e direciona para o Material 3; a referência foi usada como princípio histórico de sound design, não como especificação normativa atual. URL consultada: https://m2.material.io/design/sound/applying-sound-to-ui.html

## Referências oficiais

A Apple HIG orienta que todo feedback seja acessível por múltiplos canais — visual, textual, sonoro e háptico — e que a intensidade da interrupção corresponda à importância da informação. Também recomenda reservar confirmações para ações relevantes e evitar alertas excessivos. URL: https://developer.apple.com/design/human-interface-guidelines/feedback

A WCAG 2.2 SC 2.3.3 recomenda eliminar animações desnecessárias e oferecer controle para desligar animações não essenciais iniciadas por interação, respeitando a preferência de redução de movimento do sistema. URL: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html

## Decisões de produto

A evolução adotará feedback sonoro breve e opcional, nunca como único canal; silêncio por padrão em contextos potencialmente sensíveis; controle explícito de som e vibração; limite de repetição para hover e navegação; confirmação sonora apenas para ações relevantes; e fallback visual/textual sempre presente. O som será de interface, não música de fundo, para preservar concentração em uso clínico.
