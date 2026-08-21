# Missão Saúde — plano de reconstrução

## Proposta

A Missão Saúde será uma experiência lúdica curta, incorporada ao Neuroped em rota própria e sem autenticação obrigatória. Ela convida a criança ou o cuidador a percorrer três estações educativas, com feedback positivo, mas não mede desempenho clínico, não realiza diagnóstico e não armazena respostas.

## Estações

| Estação | Tema | Interação | Arte local de apoio |
| --- | --- | --- | --- |
| Movimento | Brincar, equilíbrio e exploração segura | Escolher entre três atividades cotidianas ilustradas | `media/movimento-brincar.jpg` |
| Comunicação | Gestos, escuta e turnos de fala | Organizar cartões simples em uma sequência de comunicação | `media/linguagem-comunicacao.jpg` |
| Rotina | Sono, transições e autocuidado | Montar uma sequência de rotina em ordem acolhedora | `media/rotina-sono.jpg` |

O cartaz de marcos do desenvolvimento será reservado ao encerramento como conteúdo educativo complementar, sem pontuação individual ou comparação de habilidades.

## Padrões de experiência

O jogo terá um único estado de sessão em memória: estação atual, escolhas feitas e contagem de conquistas simbólicas. A pontuação será mostrada como "estrelas de exploração", sem menção a acerto clínico, idade-alvo ou expectativa de desenvolvimento. Todas as ações terão equivalentes por teclado e foco visível, com suporte a `prefers-reduced-motion`.

O visual adotará as cores institucionais presentes nas artes importadas — petróleo, lavanda, menta e azul-violeta — em uma linguagem de cartões arredondados, formas orgânicas e sinais de adição. Em navegadores sem WebGL, a experiência segue integralmente em HTML/CSS/React; nenhum recurso de WebGL será obrigatório.

## Limites de segurança

Não serão solicitados nome, idade, dados de saúde, sintomas ou histórico de desenvolvimento. A Missão Saúde será apresentada como conteúdo educativo e não como instrumento de rastreio, triagem ou avaliação clínica. O botão de continuidade apontará para os canais de agendamento já existentes no Neuroped, sem transferir respostas do jogo.
