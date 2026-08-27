# Auditoria visual — linha de base

## Explorar mobile

A página é funcional e escaneável, mas ainda exige rolagem muito longa: 6.277 px de altura para 52 recursos. A primeira dobra está boa, porém a seção de busca fica seguida por jornadas extensas. A leitura melhora com os cards, mas há repetição de estrutura e pouca distinção entre recursos de alta e baixa frequência. O dock mobile fica fixo e cobre visualmente o fluxo em alguns pontos; a futura versão deve preservar espaço inferior e manter o acesso rápido.

## M-CHAT mobile

O formulário tem boa clareza de pergunta e botões de resposta grandes. O principal atrito é a continuidade: há 20 itens visíveis de uma vez, sem índice de domínios porque a escala é linear, e a barra sticky mostra progresso, mas pode ganhar uma orientação mais explícita de próxima pendência e rascunho. O CTA final é claro. A página tem densidade vertical alta, mas sem overflow horizontal; a evolução deve reduzir desorientação sem esconder perguntas ou alterar o significado das respostas.

## Sinais observados

- Priorizar divulgação progressiva e agrupamento por intenção no explorador.
- Dar destaque visual aos recursos de alta frequência e diferenciar ferramentas de referência.
- Manter foco, touch targets e dock sem sobreposição.
- No formulário longo, reforçar progresso, próxima pendência, domínio atual e retorno seguro ao ponto anterior.
- Evitar efeitos decorativos que compitam com decisões clínicas.
- O aviso 404 observado no servidor Vite isolado é ambiente (`/api/health`), não falha de renderização.

## Depois — primeiro lote

O explorador mobile caiu de 6.277 px para 3.899 px, redução de aproximadamente 37,9%, sem overflow horizontal. A primeira dobra mostra busca, filtros curtos, Atendimento aberto e os grupos seguintes recolhidos em cabeçalhos; todos continuam acionáveis. A experiência ficou significativamente mais curta sem perder o mapa completo.

No M-CHAT linear, o sticky de progresso permanece claro e sem regressão. A nova navegação por domínio não aparece porque esta configuração tem um único domínio; deve ser validada em uma escala multidomínio no smoke test. O formulário continua com 20 perguntas e sem overflow, preservando a leitura e o CTA final.

## Depois — captura final do primeiro lote

O explorador mobile agora exibe o contexto, a busca e os dois primeiros grupos expandidos, enquanto os demais aparecem como cabeçalhos compactos; a altura ficou em 3.899 px e os destinos continuam acessíveis. A sensação é de mapa operacional, não de mural de cartões.

A escala ABC confirmou o novo índice horizontal de domínios no sticky: Irritabilidade/Agitação, Interação/Relacionamento social, Campo cognitivo e demais seções ficam navegáveis com contagem própria. A navegação de domínio desloca o profissional para a primeira pergunta do bloco e preserva o foco. O formulário mantém 48 respostas no fluxo e não apresenta overflow horizontal.

Pendência de interpretação visual: os espaços em branco entre lotes no ABC são consequência do carregamento progressivo de perguntas e podem ser refinados com skeleton/altura mínima na próxima iteração, sem alterar o conteúdo clínico.

## Home — shell e primeira dobra

As capturas atuais mostram uma identidade visual forte, mas o modal de aviso legal domina a primeira impressão e desfoca o produto. Isso é deliberado para consentimento, porém a comparação de experiência deve ser feita também com o gate já reconhecido para avaliar o app real. Desktop apresenta boa composição do hero e mascote; mobile mantém o CTA de jornada, mas o dock e os cartões horizontais exigem cuidado para não cobrir conteúdo.

O bloco de destaques do shell agora deve ser medido sem o modal para confirmar a ordem: Agenda, Pacientes, Encontrar escala, Avaliação cognitiva infantil e Reconhecimento visual. O CTA de Explorar tudo deve ficar próximo da busca, mas não competir com a ação primária.
