# NeuroPed: acabamento sensorial do ambiente clínico

Preservar a assinatura marinho, vinho e dourado, modo escuro, navegação e fluxos assistenciais. Aplicar melhoria incremental no shell compartilhado em vez de reescrever as telas ou trocar a marca. A alternativa de aplicar novos efeitos globais a todos os elementos foi descartada: esconderia estados clínicos, aumentaria o custo de renderização e mudaria atividades com estímulo próprio.

Primeira entrega: profundidade de superfície e foco visível na navegação; entrada curta de rota, sempre legível, sem movimento quando o sistema solicita redução. O feedback sonoro do ambiente clínico é opcional, silencioso em dispositivos sem preferência, preserva preferências explícitas, não soa ao passar o cursor nem ao abrir uma rota e recebe uma amostra acionada em Preferências. Não alterar estímulos de avaliação, Arcade, pranchas de comunicação, voz, PDF, autenticação, papéis ou backend. O Arcade requer revisão separada: já tem música e controles próprios, que não devem ser confundidos com a preferência da interface.

Aceite técnico: navegador em 390/820/1440 px nos dois temas, teclado, rotas autenticadas com dados sintéticos, comparação visual pré/pós e regressões existentes. Rollback: reverter somente a entrega de apresentação; não há migração.

## Inventário e limites da auditoria

- O acabamento efetivo do shell vinha de `app-store-finish.css`, carregado junto da navegação. A melhoria da luz fica nessa mesma regra para não criar disputa de CSS. `motion-coherence-v15.css` continua sendo a origem da transição de rota.
- A preferência de som partia de opt-out. O shell e o filtro tinham efeitos de hover; a montagem de rota disparava outro. A nova regra é opt-in explícito para a interface. Os controles próprios de áudio didático, jogos, gravação e comunicação não mudam nesta entrega.
- Revisão por ondas: após o shell, tratar separadamente hierarquia e densidade de Agenda/Prontuário, condução de Exame/Observação e apresentação de Escalas/Documentos. Revisar separadamente áudio de jogo e de avaliação: nenhum estímulo de avaliação deve ser substituído por uma preferência ornamental.
- Seguir as orientações do W3C sobre [movimento disparado pela interação](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) e [foco visível](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html). A amostragem de contraste não é declaração de conformidade integral do produto.
