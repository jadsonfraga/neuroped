# Direção visual premium — NeuroPed

## Decisão de direção

A elevação visual seguirá a linha **Signature Clinical / Editorial Calm**: superfícies pearl e ink, teal profundo, vinho contido e dourado apenas como sinal de prioridade; tipografia editorial para títulos e sans de alta legibilidade para operação; ilustração neural como textura de confiança; mascote como guia contextual, nunca como decoração concorrente em áreas densas.

O objetivo não é transformar o NeuroPed em um produto infantilizado ou em um dashboard genérico. A sensação desejada é a de uma plataforma clínica proprietária, séria e acolhedora, com acabamento internacional e decisões visuais intencionais.

## Ativos e usos aprovados

| Ativo | Uso aprovado | Uso evitado | Motivo |
|---|---|---|---|
| `neuroped-mascot-premium.webp` | Estados vazios, onboarding, ajuda e momentos de conclusão | Fluxos clínicos densos e páginas de prescrição | Tem silhueta premium de cérebro-guia, mas não deve competir com dados |
| `dr-jadson-mascot-guide.webp` | Guia da home, páginas educativas e navegação pública | Destaque em decisões clínicas críticas | É carismático e familiar; o emblema visual do arquivo deve permanecer secundário |
| `neural-abstract.webp` | Login, hero institucional e faixas de confiança em baixa opacidade | Fundo de formulário, texto pequeno sobre a arte | Linguagem sofisticada de rede neural, sem texto embutido |
| `hero-brain.webp` | Conteúdo editorial de desenvolvimento e páginas de educação | Background global | A arte contém palavras em inglês integradas e exige composição controlada |
| `child-development.webp` | Portal da Família e orientação parental | Tela clínica de alta densidade | Acolhe responsáveis sem misturar sinais de prescrição |
| `team-multiprofessional.webp` | Avaliação multiprofissional e confiança institucional | Cards pequenos sem fallback | Requer tamanho reservado e tratamento resiliente |
| Ativos `dr-jadson-*` históricos | Acervo e contexto institucional | Mistura aleatória em rotas clínicas | Preservar memória visual sem diluir a assinatura atual |

## Melhorias de baixo risco implementadas nesta entrega

A camada global receberá refinamento de superfícies, hairlines, textura neural discreta, estados de foco e hover, além de tratamento consistente para modo escuro e reduced motion. O `PageHero` receberá uma malha decorativa puramente visual. O login ganhará composição de duas colunas em desktop com um painel neural institucional, mantendo o formulário e o contrato de autenticação inalterados. A galeria de ativos do Portal da Família terá carregamento prioritário para os seis tiles visíveis e fallback com estrutura reservada, evitando caixas vazias. O shell infantil continuará isolado e não receberá elementos clínicos invasivos.

## Guardrails de não-regressão

Nenhuma alteração toca permissões, rotas de autenticação, contratos clínicos, dados de pacientes, storage, URLs públicas, métricas de conteúdo ou os itens do filtro de escalas. Os efeitos são decorativos e respeitam `prefers-reduced-motion`, impressão e foco de teclado. Imagens grandes não serão duplicadas em `client/public`; a implementação reutiliza imports existentes e o acervo já versionado. O painel neural é carregado somente nas superfícies que o exibem.

## Critérios de aceitação visual

| Área | Critério de aprovação |
|---|---|
| Primeiro carregamento | Não há flash branco, conteúdo deslocado ou bloqueio de navegação; skeleton permanece curto e legível |
| Login | Formulário continua prioritário, mas a tela ganha narrativa institucional e prova visual de confiança |
| Shell | Navegação mantém alvos confortáveis, foco visível e hierarquia por seção; nenhum acento compete com a tarefa |
| Home | Título, busca e CTA continuam dominantes; mascote e arte neural funcionam como assinatura, não como ruído |
| Portal da Família | Hero conserva legibilidade; galeria nunca fica com slots visualmente vazios sem fallback |
| Rotas densas | Sem mascote grande, sem overlay e sem movimento que cubra dados ou controles |
| Dark mode | Contraste preservado, superfícies com profundidade e acentos controlados |
| Mobile | Conteúdo continua fluido, dock não cobre ações críticas e áreas touch mantêm tamanho confortável |
| Acessibilidade | `aria-hidden` apenas em decoração, foco visível, reduced motion e impressão preservados |

## Nota sobre a produção

Durante a auditoria, a produção exibiu erro persistente ao abrir `#/brincando-e-aprendendo` e permaneceu no fallback após uma recarga. A branch local carregou a mesma rota corretamente. O fenômeno deve ser tratado como risco de deploy/cache/chunk e validado nos Checks e no ambiente canônico após a publicação; não foi acionado “Atualizar cache” para evitar intervenção destrutiva no navegador do usuário.
