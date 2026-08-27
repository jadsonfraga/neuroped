# Auditoria visual inicial — NeuroPed

Data: 2026-08-27

## Superfícies observadas

A home em execução apresenta um cockpit com quatro ações imediatas, uma busca universal, uma área de jornadas e um bloco de atalhos pessoais. A sidebar mantém `Começar`, o grupo `TRABALHO DE HOJE` aberto e os grupos avançados recolhidos. O catálogo `/explorar` repete a mesma taxonomia e apresenta 80 destinos, com cards de função e sinalização de acesso protegido.

## Pontos fortes

A hierarquia por tarefas está clara entre Trabalho de hoje, Avaliar, Documentar, Acompanhar e Portais. A busca está presente em três níveis — cabeçalho, home e catálogo. O mobile dock está montado com cinco ações e o acesso protegido continua explícito sem liberar áreas clínicas.

## Oportunidades prioritárias

1. A home ainda usa muitos blocos sucessivos com a mesma linguagem visual; a primeira dobra precisa diferenciar mais fortemente ação primária, contexto e descoberta.
2. A sidebar ainda combina cards de atalho, item Início/Todos os recursos e grupos, produzindo repetição sem um marcador visual forte de posição atual.
3. Os títulos de grupo em caixa alta têm baixa informação contextual; precisam de contagem, descrição curta ou tratamento de progressão para facilitar orientação.
4. O catálogo completo é correto, mas longo; precisa de filtro por jornada mais visível, estados vazios orientativos e melhor sinalização de recursos protegidos.
5. A modal legal aparece sobre todas as superfícies no navegador de teste; nenhuma ação de confirmação foi executada durante a auditoria.
6. A validação automática deve comparar rotas e rótulos antes/depois, e o build deve ser repetido após cada lote de mudanças.

## Critérios de sucesso da nova iteração

A pessoa deve conseguir identificar a página atual em menos de um segundo, abrir Agenda/Pacientes/Busca em um gesto, compreender a diferença entre Trabalho de hoje e ferramentas de referência sem expandir tudo, localizar qualquer função pelo catálogo sem navegar por uma lista interminável e usar o mesmo modelo mental no desktop e no mobile. Nenhuma rota pode desaparecer e nenhum gate clínico pode ser enfraquecido.


## Auditoria das abas internas

A Agenda apresenta nove abas condicionais — Agenda, Espera, Comunicação, Atividade, Disponibilidade, Página pública, Equipe, Avaliações e Financeiro — em uma faixa horizontal. No estado sem autenticação do navegador, a tela retorna corretamente um estado de erro com `Tentar novamente` e não exibe dados simulados.

A tela Checklists TEA apresenta cinco abas de instrumentos (`ADOS-2`, `ADI-R`, `CARS-2`, `GARS-3`, `SRS-2`) e quatro subabas de domínios. A faixa dos instrumentos é adequada para rolagem, mas a combinação de muitas abas mais subabas pode gerar baixa orientação em viewport estreita. O componente base agora tem rolagem previsível, gatilhos sem compressão, hover, escala de clique e foco mais claros.

A sidebar, após a marcação de descoberta progressiva, expõe `TRABALHO DE HOJE` aberto, grupos avançados recolhidos e contagens visíveis: 7, 8, 11, 9, 11 e 22. Essa contagem ajuda orientação, mas o grupo `PORTAIS E SUPORTE` ainda é significativamente maior e deve ser tratado como coleção secundária no próximo ciclo.


## Resultado após a primeira correção estrutural

A sidebar passou a ter `CONECTAR` com 14 itens e `AJUDA E CONTA` com 8 itens, substituindo o bloco único de 22. O DOM confirmou `Início` como item ativo com `aria-current="page"`, o dock com cinco ações e a nova orientação curta dos grupos. No estado atual do navegador, `TRABALHO DE HOJE` e `AVALIAR` aparecem expandidos devido ao caminho de navegação e ao estado persistido; os demais permanecem recolhidos. A faixa de abas interna não aparece na home, como esperado.


## Medição das abas após o refinamento

Na tela Checklists TEA, a lista de instrumentos está com `overflow-x: auto`, `aria-selected="true"` em `ADOS-2` e os cinco gatilhos preservando seus rótulos. No viewport de teste, `scrollWidth` e `clientWidth` coincidem, portanto não há overflow indevido; em larguras menores, a faixa pode rolar sem comprimir os nomes.


## Auditoria Playwright desktop/mobile e regressão corrigida

A auditoria automatizada foi executada em `1440×900` e `390×844` para Home, Explorar e Checklists TEA. O shell apresentou 7 grupos de sidebar, `Início` ativo, dock mobile com 5 ações e o grupo correto aberto por contexto. A faixa de instrumentos do Checklists TEA manteve `overflow-x: auto`, cinco gatilhos e estado selecionado explícito em ambos os viewports.

Durante a auditoria, o catálogo `/explorar` revelou uma regressão real em ambos os viewports: `ShieldCheck` estava sendo usado no mapa de ícones sem import correspondente, causando `ReferenceError` e a tela de falha do AppErrorBoundary. O import foi corrigido e a auditoria posterior confirmou a renderização: home 1399/2492px, catálogo 4527/10198px e Checklists TEA 2740/3837px em desktop/mobile, respectivamente. Os únicos eventos restantes foram 404 de recurso não crítico registrados pelo ambiente de teste, sem erro de renderização React.


## Resíduo de ambiente identificado

A coleta HTTP encontrou apenas `404 http://localhost:5173/api/health` em todos os seis cenários. Trata-se do servidor Vite isolado usado para inspeção visual, que não expõe o endpoint fullstack de saúde; não houve erro de página, rota, componente, asset da interface ou renderização após o ajuste do catálogo. A validação de produção continua coberta pelos contratos de acesso e pelo build do frontend.


## Auditorias automáticas de telas e acessibilidade

`audit:design` permaneceu dentro do contrato do projeto: 212 valores de cor crus, exatamente no teto aprovado. `audit:screens` percorreu 300 rotas, encontrou 0 telas em branco e 0 erros de console; houve uma ocorrência isolada em `/brincando-e-aprendendo` classificada como `page.evaluate: Execution context was destroyed` durante navegação externa, sem crash do app. `audit:a11y` percorreu 7 rotas com Chromium real e encontrou 0 violações de acessibilidade em severidade serious/critical e 0 violações em todas as severidades.


## Leitura visual das capturas desktop/mobile

Na captura desktop, o cockpit apresenta uma hierarquia forte: hero com busca, quatro ações como linha principal e duas colunas de jornadas/segurança. A sidebar ganhou aparência mais leve e o estado ativo de Início está claramente marcado. O bloco pessoal aparece como orientação útil quando vazio, não como espaço abandonado.

Na captura mobile, a composição reflowa corretamente para uma coluna, mantém as quatro ações e o dock inferior. A página fica longa por natureza, mas não há overflow horizontal. A primeira ação visual no viewport é impactada pela modal legal do ambiente; a captura de auditoria removeu essa modal apenas no cenário controlado, sem confirmar o aviso.


## Qualidade de código após a iteração

`npm run lint` passou com 0 erros e 0 avisos depois da remoção dos imports não utilizados da home. `npm run check` continua falhando somente nos erros históricos do servidor ligados a `Request.user` e à augmentação do Express; não foram apontados arquivos da home, sidebar, abas, catálogo ou dock.
