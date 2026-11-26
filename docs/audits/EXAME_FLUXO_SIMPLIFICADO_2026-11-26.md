# Fluxo mais simples nas três abas

Base: `61ea2cc7b7faa4bcb6d5026c48c6ee1ab7651001` (#1420). O problema de uso é encontrar a próxima ação em meio a vários cartões e avisos. A edição muda a ordem e a apresentação, sem trocar faixas, catálogo, regras de exame ou o que é armazenado.

- No Exame via Assistente, escolher a faixa é a primeira ação; o atalho para a Observação Social fica ao final, com a confirmação existente antes de descartar notas.
- Nos cartões guiados das duas fichas, a sequência é **Prepare → Conduza → Registre**. O preparo essencial, o convite e a observação ficam em vista. Materiais detalhados, recurso visual e apoio continuam acessíveis. O botão do convite é distinto do material de apoio. Recusa e falta de oportunidade permanecem no registro. Uma nota não impede abrir a segunda atividade da mesma faixa.
- A Observação Social mostra o passo atual, sem chamar atenção para passos não usados. Os atalhos das fichas continuam com foco por teclado.
- O acolhimento é recolhido por padrão; abrir ou pular não registra nada. Para menores de dois anos, continua apenas a orientação presencial.

Gates: unidade, tipos, lint e navegador da mesma revisão. Manter o piloto com adultos e dados fictícios como medida de clareza real. Nenhuma edição em cadastro, prontuário, permissão ou backend. Para reverter, reverter somente o commit de simplificação, mantendo o #1420.
