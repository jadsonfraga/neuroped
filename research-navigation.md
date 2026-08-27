# Pesquisa de arquitetura de navegação — NeuroPed

## Referências consultadas

1. Apple Human Interface Guidelines — Navigation and search: https://developer.apple.com/design/human-interface-guidelines/navigation-and-search
2. Apple Human Interface Guidelines — Sidebars: https://developer.apple.com/design/human-interface-guidelines/sidebars

## Princípios extraídos

A sidebar deve representar áreas de primeiro nível do produto, não uma lista plana de todas as funções. Quando há muito conteúdo, seções com controles de divulgação mantêm o espaço vertical gerenciável.

A Apple recomenda, em geral, não ultrapassar dois níveis de hierarquia na sidebar. Os títulos dos grupos devem ser curtos e descritivos; ícones familiares devem apoiar a leitura, e não disputar atenção.

A sidebar deve permanecer descobrível, mas pode ser recolhida para abrir espaço ao conteúdo. Quando possível, seu conteúdo pode ser personalizado, permitindo que as pessoas elevem ao topo as áreas mais importantes para seu trabalho.

Para o NeuroPed, isso implica separar os destinos por intenção: `Hoje`/operação, `Avaliar`, `Acompanhar`, `Documentar` e `Referência`. O primeiro nível deve ser pequeno e estável; os recursos raros devem ser encontrados por busca e hubs, não despejados na primeira tela.

A pesquisa também reforça que busca e navegação devem trabalhar juntas. A busca precisa localizar páginas, instrumentos e tarefas, mas a tela inicial deve orientar o próximo passo para não exigir que a pessoa saiba o nome exato de uma função.


3. Nielsen Norman Group — Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
4. Baymard — Findability and Discoverability: https://baymard.com/learn/findability-vs-discoverability-ux

## Aprendizados adicionais

Progressive disclosure resolve a tensão entre poder e simplicidade: a primeira camada mostra poucas opções importantes; opções especializadas aparecem quando solicitadas. Para o NeuroPed, isso significa que a home não deve tentar listar 84 destinos. Deve apresentar o trabalho de hoje e abrir um catálogo estruturado quando a pessoa quiser explorar.

A encontrabilidade depende de a pessoa entender onde algo está e de a busca tolerar o modo como ela escreve. O catálogo precisa usar rótulos com linguagem de tarefa, sinônimos e autocomplete, em vez de depender apenas do nome interno da rota. Também deve oferecer atalhos previsíveis para fluxos recorrentes, como agenda, paciente, avaliação e documentos.

Diretriz de produto consolidada: a home será um cockpit com quatro próximos passos, uma busca universal e uma seção de recentes/favoritos; a sidebar ficará com poucos grupos de primeiro nível e uma entrada única para `Todos os recursos`; o catálogo assumirá a complexidade restante com filtros por jornada e acesso.


## Inspeção visual do estado atual

A home redesenhada já apresenta uma hierarquia mais curta: cockpit, busca universal, quatro ações do dia, jornadas e recursos pessoais. O catálogo compartilha os mesmos rótulos de jornada e já expõe os recursos do app em grupos coerentes.

O ponto a melhorar no próximo ciclo é reduzir ainda mais a duplicação de chamada entre os atalhos prioritários da sidebar e as ações da home, além de garantir que o mobile trate `Mais` como uma porta óbvia para o menu completo. A experiência deve privilegiar os poucos destinos de trabalho frequente, deixando recursos raros na busca e no catálogo, em linha com a pesquisa de progressive disclosure.


## Verificação estrutural do shell

A inspeção do DOM confirmou que a sidebar apresenta apenas `TRABALHO DE HOJE` aberto por padrão. Os grupos `AVALIAR`, `DOCUMENTAR`, `ACOMPANHAR`, `REFERÊNCIA` e `PORTAIS E SUPORTE` ficam recolhidos, mas continuam acionáveis pelos botões de divulgação. O dock móvel também está montado no shell, pronto para expor Início, Agenda, Pacientes, Avaliar e Mais.


## Comparação visual da segunda iteração

A home agora concentra o primeiro contato em quatro decisões imediatas: abrir agenda, encontrar paciente, escolher escala e produzir documento. Abaixo, a sequência Avaliar → Documentar → Acompanhar → Conectar família evita a antiga grade de muitos cards equivalentes.

O catálogo deixou de repetir a seção de início e começa por Destaques, seguida pelas jornadas. A sidebar mostra apenas dois acessos rápidos, o grupo Trabalho de hoje aberto e os demais grupos recolhidos. A hierarquia está coerente entre shell, home e catálogo.


## Verificação responsiva do shell

No viewport de 1280px, o DOM confirmou sidebar em modo desktop, `TRABALHO DE HOJE` como único grupo expandido e os demais grupos recolhidos. O dock móvel também está montado com exatamente cinco ações: `Início`, `Agenda`, `Pacientes`, `Avaliar` e `Mais`; `Mais` abre o mesmo drawer completo da sidebar por evento, evitando uma segunda arquitetura paralela.


## Verificação final da hierarquia inicial

A inspeção final confirmou quatro ações do dia (`Abrir a Agenda`, `Encontrar paciente`, `Escolher uma escala`, `Produzir documento`), dois atalhos rápidos (`Agenda` e `Pacientes`), o bloco de atalhos pessoais sempre presente e apenas `TRABALHO DE HOJE` expandido. Os grupos avançados continuam disponíveis por divulgação progressiva e pelo catálogo completo.
