# Baseline da auditoria visual

## Primeira observação — produção pública

A URL canônica `https://neuroped.pages.dev/` redireciona para a rota de login (`?next=%2F#/login`) e exibe um aviso legal modal antes da interação. A interface subjacente apresenta a marca NeuroPed, o subtítulo de neuropediatria, busca global por escala/teste/módulo e uma área de acessos prioritários. O modal é um cartão claro centralizado sobre uma camada escurecida, com ícone médico em bloco lilás/amarelo, título “Aviso importante”, texto jurídico educativo, CTA em gradiente teal-vinho e link para termos completos.

## Pontos positivos iniciais

A hierarquia do aviso legal é clara, a marca é facilmente identificável e o gradiente teal-vinho já funciona como assinatura visual. O fluxo deixa explícito que o produto não substitui avaliação profissional.

## Hipóteses a validar

A auditoria deve verificar se o mesmo nível de intenção visual se mantém após o aviso legal, nas rotas públicas, no shell profissional autenticado, nas rotas clínicas, nos módulos interativos e em viewport móvel. Também deve verificar consistência entre mascotes/ilustrações, densidade de bordas, hierarquia tipográfica, estados de carregamento/erro, contrastes, motion e uso de assets.

## Segunda observação — login e shell

Após o aceite legal, a rota pública exibe um shell muito limpo com marca no canto superior esquerdo e quatro controles de utilidade no canto direito: busca, tema, som e menu. O formulário profissional fica centralizado em um cartão claro, com ícone de escudo em gradiente, título “Entrar na área profissional”, descrição objetiva e campos de e-mail/senha. Há um botão de acesso seguro e um botão flutuante de ajuda.

A composição é funcional e transmite proteção, mas a tela ainda pode ganhar mais assinatura institucional: narrativa visual lateral ou plano de fundo editorial, melhor relação entre marca e formulário em desktop, estados de foco mais sofisticados, uma prova discreta de confiança e tratamento mais elegante do espaço vazio, sempre preservando a clareza clínica e o foco na tarefa.

## Terceira observação — institucional e rodapé

A página institucional mantém a mesma linguagem de cartões largos brancos, bordas suaves e títulos em sans. O conteúdo é bem organizado e responsável, mas a composição tem pouca variação de escala e pouca narrativa visual: a maior parte da página é empilhamento de blocos, e o rodapé termina com uma linha de credenciais e o seletor fixo de zona. O seletor “Nesplora / Clínica” é persistente e útil, porém visualmente compete com o encerramento da página. A melhoria premium deve priorizar composição editorial, contraste de superfícies, respiro e um fechamento institucional mais intencional, sem ocultar avisos legais.

## Quarta observação — microsite infantil

A rota `#/brincando-e-aprendendo` apresentou uma falha persistente na produção. O primeiro carregamento exibiu o fallback “O NeuroPed encontrou uma falha”, e uma recarga simples reproduziu o mesmo estado com outro identificador técnico. A tela de erro é visualmente limpa, mas a falha impede toda a experiência infantil; portanto, esta é uma prioridade de não-regressão antes de qualquer refinamento cosmético nessa superfície. O botão “Atualizar cache” não foi acionado para não apagar estado local durante a auditoria.

## Quinta observação — separação entre produção e branch local

A navegação da produção para `#/missao-saude` permaneceu no fallback de erro, sugerindo que o `AppErrorBoundary` pode conservar o erro entre mudanças de hash ou que o chunk da superfície pública não está carregando de forma recuperável. Para evitar qualquer intervenção destrutiva em produção, a auditoria passou a usar uma instância local isolada. O primeiro acesso por proxy temporário foi corretamente bloqueado pelo `domainGuard` como endereço não autorizado; a visualização local será habilitada apenas por uma allowlist de desenvolvimento, sem alterar a allowlist oficial nem o comportamento de produção.

## Sexta observação — branch local carregável

Com uma URL de auditoria isolada, a branch local carregou corretamente e exibiu o aviso legal sobre a rota de login. Após o modal, o formulário informa de forma segura que a autenticação profissional não está configurada naquele endereço público de desenvolvimento. O carregamento inicial usa skeleton leve e evita expor dados clínicos. A auditoria visual da aplicação seguirá pelas rotas públicas, sem tentar autenticar nem usar credenciais reais.

## Sétima observação — transição e carregamento

Na branch local, a navegação para uma rota pública independente inicia com um skeleton de preparação antes de renderizar o conteúdo. Esse padrão é adequado para reduzir a sensação de página vazia, mas precisa ser validado em rotas com chunks maiores e em conexões lentas para que não pareça travamento. A auditoria de implementação deverá cobrir carregamento, falha de chunk, recuperação, reduced motion e acessibilidade, e não apenas o estado estático já renderizado.

## Oitava observação — referência positiva do Vídeo-EEG

A rota de Vídeo-EEG é a superfície mais sofisticada observada até aqui. O hero usa marrom profundo, tipografia creme em escala editorial, selo amarelo circular, contorno orgânico e alto contraste. A seção “Percurso orientado” organiza três etapas numeradas com ritmo vertical e um cartão informativo. O resultado comunica serviço sério e cuidado sem recorrer a excesso de ornamento. Essa combinação deve servir como referência interna para o shell principal, home e portais, enquanto a paleta pode ser harmonizada com o índigo/teal do produto sem perder o caráter institucional.

## Nona observação — descoberta de escalas

A entrada do filtro é visualmente limpa, com cartão amplo, ícone de ampulheta, título central e CTA. Ao acionar “Abrir filtro agora”, a superfície fica em “Carregando o catálogo clínico seguro…” durante a janela observada, sem apresentar progressão visível nem conteúdo parcial. O seletor fixo de zona continua ancorado no rodapé e deve ser considerado na composição de páginas longas. O redesign deve melhorar o estado de carregamento com skeletons com estrutura real, indicador de etapa e mensagens de recuperação, sem remover o aviso de segurança.

## Décima observação — Portal da Família

A rota `#/portal-familia` tem uma proposta editorial clara e segura: “Orientação clara para a rotina, a escola e os próximos passos”, distinção explícita entre conteúdo geral e documentos individuais, e aviso de que o ID do paciente nunca é senha. A estrutura usa cartões largos, chips de seção e uma galeria intitulada “Figuras de apoio para famílias”. Na captura de auditoria, os seis espaços da galeria aparecem como blocos vazios durante o carregamento, apesar de o texto informar “6 usados”. Esse estado é um ponto crítico de percepção: a superfície deve exibir imediatamente imagens/mascotes reais ou skeletons com identidade, evitando caixas vazias que pareçam conteúdo quebrado.

### Atualização do Portal após espera

Após aguardar, o hero ilustrado do Portal da Família carregou e revelou uma direção de arte acolhedora, com crianças, livros, natureza e marcos numerados. Na galeria de “6 usados”, quatro ativos carregaram — incluindo retratos e uma ilustração de apoio — enquanto dois slots permaneceram vazios. A composição do hero é forte, porém o texto é sobreposto à arte e perde contraste em alguns trechos; a galeria precisa de fallback visual determinístico ou de uma seleção de ativos que sempre esteja disponível.

## Décima primeira observação — central de ajuda

A central de ajuda usa cartões em duas colunas com ícones por cor e conteúdo fácil de escanear. Em uma página longa, porém, a linguagem se repete: muitos cartões brancos de mesma altura, separados por bordas e pouco contraste de seção. A melhoria premium pode criar capítulos mais nítidos, uma barra de navegação contextual, números/ícones de seção e um tratamento editorial para FAQ, mantendo o conteúdo rápido de consultar. O shell permanece fixo e o seletor de zona aparece sobre o conteúdo, o que deve ser considerado na versão móvel.

## Décima segunda observação — menu global e modo escuro

O menu lateral apresenta boa organização de destinos prioritários, busca, tema, som e saída. A marca fica ancorada no topo e os destinos são escaneáveis por ícone, título e subtítulo. No modo escuro, a estrutura continua legível, mas a sensação é mais próxima de inversão de tokens do que de uma direção de arte noturna completa: o fundo é quase preto, os cards continuam destacados e os acentos amarelo/teal têm presença forte. Um refinamento premium deve controlar o contraste de superfícies, reduzir a competição cromática e aplicar uma aura de profundidade mais precisa, mantendo foco visível e legibilidade.

## Décima terceira observação — mascotes e ativos de personagem

O ativo `neuroped-mascot-premium.webp` apresenta um cérebro infantil 3D com terno azul-marinho, gravata vinho, escudo com rede neural e cruz clínica. Ele tem silhueta clara, acabamento consistente e potencial para estados de onboarding, ajuda e vazio; é o melhor candidato para uma camada premium institucional. O ativo `dr-jadson-mascot-guide.webp` é um personagem infantil em jaleco azul com símbolo de “S” no peito, visualmente carismático e adequado a família, mas o emblema não é autoral do NeuroPed e não deve receber destaque sem substituição por um símbolo próprio. A direção recomendada é separar os papéis: cérebro premium para confiança/produto; ilustrações familiares para educação; nunca misturar mascote lúdico em fluxos clínicos de alta responsabilidade.

## Décima quarta observação — ilustrações estruturantes

O ativo `hero-brain.webp` é uma ilustração botânica de cérebro infantil em aquarela, muito expressiva e acolhedora, mas contém palavras em inglês integradas à arte; ele funciona melhor em uma seção editorial específica do que como fundo genérico, onde reduzir a opacidade não resolveria completamente a competição textual. O ativo `neural-abstract.webp` é um fundo horizontal de neurônios luminosos em teal, azul profundo e dourado, com linguagem mais sofisticada e internacional; é adequado para faixas de confiança, hero/login lateral e estados institucionais, desde que usado com baixa opacidade, overlay e texto seguro.

## Décima quinta observação — microsite infantil local

Na branch local, `#/brincando-e-aprendendo` carrega corretamente e confirma que a falha vista em produção é de ambiente/deploy/cache, não do conteúdo base desta branch. A superfície infantil tem direção de arte muito mais coesa: fundo azul-claro, personagem em jaleco, tipografia arredondada pesada, selo de fase, botões de faixa etária com contorno escuro e microestrelas. O conteúdo é apropriado para exploração lúdica. O principal problema visual observado é a permanência do seletor de zona “Nesplora / Clínica” atravessando a parte inferior da primeira dobra, com alto contraste e escala grande; o microsite deveria ter um seletor contextual próprio ou integrar a troca de zona de modo mais discreto, sem perder a saída para a clínica.

## Décima sexta observação — rotas clínicas protegidas

A tentativa de abrir uma escala interativa (`#/mchat`) no ambiente local redirecionou para o login protegido, pois o backend remoto não está configurado na instância de auditoria. Não foi feita tentativa de autenticação. O estado observado do login em modo escuro é legível e coerente, embora o topo concentre quatro controles pequenos e o cartão central fique visualmente isolado em uma grande área escura. A validação clínica interativa deverá ser feita por testes locais/estáticos e, se necessário, pelo usuário em ambiente autenticado; a melhoria visual não deve contornar o gate de acesso.

## Décima sétima observação — login após a implementação

O login redesenhado carregou no ambiente local sem erro de runtime. A nova composição apareceu com painel narrativo institucional, hero neural, pilares de Segurança/Observação/Continuidade, mascote de apoio e formulário intacto. A hierarquia permanece clara: no desktop, a história ocupa a coluna esquerda e a autenticação a coluna direita; os campos e o aviso de backend não configurado continuam disponíveis. O banner “Nova versão disponível” observado na base local pertence ao `ServiceWorkerManager` e não altera a composição do login; deve ser avaliado separadamente no ambiente de deploy.

## Décima oitava observação — Portal da Família após a implementação

A galeria “Figuras de apoio para famílias” agora apresenta molduras estáveis com fundo gradiente e bordas refinadas. O carregamento prioritário (`eager`) foi aplicado aos seis ativos da primeira tela. Nos casos em que o arquivo não abriu no ambiente local, o componente `SafeAssetImage` exibiu o fallback reservado com ícone e mensagem de indisponibilidade, mantendo a integridade do layout e a percepção de produto acabado. O hero editorial também recebeu o refinamento de profundidade e hairlines da camada global.

## Décima nona observação — capturas reproduzíveis desktop

As capturas headless reproduzíveis confirmaram que login, Portal da Família, microsite infantil, página institucional, Vídeo-EEG e central de ajuda renderizam sem runtime error, além de três capturas mobile sem erro. Nas capturas desktop do login e do Portal, a camada de aviso legal aparece inicialmente por contrato e domina a tela até ser aceita; atrás dela, o login exibe a narrativa neural e o Portal mantém a galeria/hero em fluxo vertical estável. Essa camada modal não foi alterada nesta entrega para preservar o consentimento explícito.

## Vigésima observação — captura final sem modal

A captura final do login confirma uma composição de nível institucional: o painel neural ocupa a coluna esquerda com tipografia de impacto e três pilares de confiança, enquanto o formulário permanece limpo na direita e o mascote aparece como assinatura de apoio. A captura final do Portal da Família confirma a correção mais concreta da baseline: os seis ativos aparecem na galeria com proporção, moldura e ritmo uniforme, sem os dois slots vazios observados antes. A hierarquia de segurança, conteúdo educativo e documentos individuais continua preservada.

## Vigésima primeira observação — captura mobile

No login mobile, a ordem ficou correta: identidade do formulário e ação principal primeiro, narrativa neural depois, seguida do aviso educativo; não houve overflow horizontal. No Portal da Família mobile, os seis assets foram organizados em duas linhas de três com proporções estáveis, e os cards de conteúdo foram empilhados com alvos confortáveis. A imagem do hero tem alto conteúdo visual e sobreposição de texto, portanto deve ser mantida com o mesmo tratamento e não ampliada sem overlay adicional; o estado atual é aceitável porque o texto permanece legível e o fluxo segue escaneável.
