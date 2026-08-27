# NeuroPed — Relatório da segunda campanha visual

**Data:** 27 de agosto de 2026
**Autor:** Manus AI
**Branch:** `feat/operational-hardening-20260827`
**Escopo:** evolução estética pública e de baixo risco, sem alteração de autenticação, autorização, persistência clínica ou contratos de dados.

## Resumo executivo

A segunda rodada transforma a direção visual premium previamente aprovada em uma **assinatura de campanha reconhecível**. O eixo criativo é “Tecnologia clínica com alma humana”: uma linguagem editorial contemporânea, brasileira e proprietária, que combina autoria médica, acolhimento, responsabilidade e uma visão multiprofissional do cuidado.

A implementação foi deliberadamente centralizada. Em vez de espalhar efeitos decorativos por dezenas de telas, a rodada criou uma peça reutilizável para as superfícies públicas de maior valor de marca, refinou o `PageHero` compartilhado e alinhou o tour guiado global aos tokens do sistema. Assim, a percepção sobe em várias rotas sem alterar a jornada clínica, sem introduzir dependências externas e sem criar uma camada visual concorrente para o microsite infantil.

## O que mudou

| Superfície | Implementação | Intenção estética | Risco controlado |
|---|---|---|---|
| `NationalSignature` | Novo componente reutilizável com medalhão do Dr. Jadson, imagem multiprofissional, três pilares e origem Petrolina/PE | Criar uma assinatura nacional memorável, sofisticada e humana | Componente decorativo; nenhuma lógica clínica ou dado individual |
| Home | Assinatura compacta entre o hero e a jornada | Dar ao primeiro contato uma narrativa institucional, sem competir com busca e CTAs | Não altera cards, filtros, navegação ou métricas |
| `Sobre` | Assinatura ampla na vitrine institucional | Conectar autoria, equipe, origem e visão de cuidado | Mantém credenciais, contato e carrossel existentes |
| `Sobre o NeuroPed` | Assinatura compacta antes das explicações | Transformar uma página textual em capítulo editorial de marca | Mantém intactas as declarações de limites da ferramenta |
| Central de Ajuda | Assinatura compacta antes do guia | Fazer suporte parecer parte de um produto consolidado | FAQ, instruções e ações permanecem iguais |
| `PageHero` | Malha neural decorativa de baixa opacidade, com movimento discreto no hover | Criar continuidade visual entre módulos e reforçar a metáfora neural | Sem deslocamento de layout; respeita `prefers-reduced-motion` |
| `WelcomeTour` | Overlay, spotlight, card, botões e progresso migrados para tokens do NeuroPed | Eliminar a aparência índigo genérica e integrar o tour à marca | Foco, trap de teclado, etapas e ações não foram alterados |
| Privacidade institucional | Microcopy diferencia modo local e LIVE | Aumentar credibilidade e evitar uma promessa desatualizada | Correção textual; sem alteração no comportamento técnico |

## Direção visual consolidada

A campanha usa contraste entre uma base clara e calma e acentos institucionais em teal, índigo, violeta e dourado. A tipografia display serifada é usada somente em títulos de alto valor narrativo, enquanto textos de orientação continuam em sans-serif para preservar legibilidade clínica. Os contornos são finos, as sombras são longas e suaves, e a fotografia é apresentada como peça editorial com rotação mínima, moldura, caption e sobreposição de leitura.

A origem brasileira é afirmada de modo factual e contido: “Pensado em Petrolina/PE · desenhado para o Brasil”. Não foram inventados números de usuários, prêmios, certificações, alcance nacional ou depoimentos. O texto posiciona a plataforma sem fazer promessas clínicas, comerciais ou institucionais que não estejam comprovadas no produto.

> **Princípio de campanha:** a sofisticação deve parecer consequência de clareza, autoria e cuidado — nunca excesso de efeitos.

## Ativos utilizados

A rodada reutiliza ativos já presentes no repositório. O ativo multiprofissional `attached_assets/images/team-multiprofessional.webp` funciona como imagem de contexto e não como representação de paciente real ou dado clínico. O medalhão de autoria reutiliza `drJadsonMasterShieldLogo`, e a identidade de mascote continua sob a governança dos componentes `Mascote` e `PageMascotDecor`.

Essa escolha reduz risco de propriedade visual, reduz custo de carregamento e conserva a continuidade com a primeira rodada. Não foram adicionadas imagens externas, fontes externas, scripts de terceiros ou animações que possam alterar a interpretação clínica.

## Comparação visual

| Estado | Antes da segunda rodada | Depois da segunda rodada |
|---|---|---|
| Home | Hero e jornada já premium, mas sem uma tese institucional única entre os módulos | Hero seguido por uma assinatura nacional com autoria, imagem multiprofissional e três pilares |
| Página institucional | Conteúdo claro, porém predominantemente organizado em blocos | Capítulo editorial com headline display, imagem enquadrada, origem, CTA e pilares antes do conteúdo explicativo |
| Natureza da ferramenta | Cabeçalho e cards educativos funcionais | Narrativa de marca introduzida sem reduzir o destaque dos limites e da natureza educacional |
| Central de Ajuda | Sequência longa de cards com ritmo repetitivo | Entrada de campanha que orienta a leitura da central como produto maduro e confiável |
| Tour guiado | Overlay escuro índigo visualmente apartado do restante do app | Card translúcido tokenizado, spotlight com cor primária e controles coerentes com o sistema |
| Mobile | Colapso da primeira rodada já validado | Assinatura empilhada, mídia reduzida e pilares em coluna, sem overflow horizontal |

## Evidências visuais

A captura reproduzível cobre nove estados sem autenticação ou dados clínicos reais: login desktop/mobile, Portal da Família desktop/mobile, microsite infantil desktop/mobile, `Sobre o NeuroPed` desktop, Vídeo-EEG desktop e Central de Ajuda desktop. A captura final não reportou erro de runtime em nenhum estado.

A prancha consolidada fica em `artifacts/visual-final-contact-sheet.png` durante a auditoria local. As imagens completas são artefatos de revisão e não são incluídas no commit da aplicação, evitando crescimento desnecessário do repositório.

## Validações executadas

| Gate | Resultado | Evidência |
|---|---:|---|
| `npm run check` | Aprovado | TypeScript sem erros |
| `npm run lint` | Aprovado | ESLint sem warnings acima do limite |
| `npm run build:client` | Aprovado | Bundle real concluído em aproximadamente 6 segundos |
| `npm run audit:design` | Aprovado | 208 cores cruas, dentro do limite 208/212 |
| `npm run audit:assets` | Aprovado | 14 assets oficiais presentes, registrados e renderizados |
| `npm run audit:a11y` | Aprovado | 0 violações serious/critical e 0 violações totais no lint estático |
| `npm run audit:performance` | Aprovado | 30,9% MB de bytes estáticos dentro dos budgets configurados; sem violações |
| `npm run test:hardening-regressions` | Aprovado | EEG, Missão Saúde e boundaries de performance preservados |
| `npm run audit:visual` | Aprovado | 9 capturas, todas sem erro de runtime |
| `git diff --check` | Aprovado | Sem whitespace inválido |

Os comandos acima devem ser executados no branch da campanha, com dependências já instaladas. O gate de performance relata os números do build atual, enquanto o gate de design preserva a catraca existente, sem relaxamento para acomodar a campanha.

## Guardrails de não-regressão

O componente de campanha é decorativo e não lê, grava ou transforma dados clínicos. O `PageHero` continua recebendo exatamente os mesmos props sem mudança de semântica. O tour mantém `role="dialog"`, `aria-modal`, rótulos, foco programático, trap de teclado, navegação de etapas e fechamento por backdrop.

Todos os efeitos de movimento respeitam `prefers-reduced-motion`. A versão impressa oculta a mídia decorativa e mantém o texto. No mobile, a grade se torna uma coluna, a fotografia preserva proporção e os pilares tornam-se blocos de toque legíveis. A campanha não altera a política de persistência do navegador nem adiciona PHI a URL, storage ou logs.

O microsite `Brincando e Aprendendo` e a experiência `Missão Saúde` permanecem visualmente independentes. Eles foram incluídos na captura para detectar regressões de shell, mas não receberam a assinatura institucional por serem trilhas com direção de arte própria.

## Limites conhecidos

A auditoria visual local usa rotas públicas e uma sessão sem backend clínico configurado. Rotas clínicas protegidas continuam redirecionando para autenticação e não foram exercitadas com credenciais ou pacientes reais. A validação confirma renderização, acessibilidade estática, performance e contratos de regressão; não substitui revisão humana de conteúdo institucional, aprovação jurídica de copy ou validação de produção após deploy.

## Arquivos principais

| Arquivo | Papel |
|---|---|
| `client/src/components/NationalSignature.tsx` | Assinatura de campanha reutilizável |
| `client/src/components/PageHero.tsx` | Hero compartilhado com malha neural discreta |
| `client/src/components/WelcomeTour.tsx` | Tour alinhado à linguagem visual premium |
| `client/src/styles/visual-reset.css` | Sistema visual da campanha, tour e responsividade |
| `client/src/pages/home.tsx` | Inserção na home |
| `client/src/pages/sobre.tsx` | Inserção na vitrine institucional |
| `client/src/pages/sobre-neuroped.tsx` | Inserção e atualização de privacidade |
| `client/src/pages/ajuda.tsx` | Inserção na Central de Ajuda |
| `docs/VISUAL_CAMPAIGN_BRIEF_2026-08-27.md` | Briefing e registros da auditoria |

## Próximo passo operacional

A implementação está pronta para revisão no branch separado. Recomenda-se revisar a redação institucional, confirmar a licença e a aprovação interna dos ativos já existentes e, somente após a revisão, marcar o Draft PR como pronto. Nenhum merge ou deploy faz parte desta rodada.

## Referências

Não foram utilizadas fontes externas. As conclusões e métricas deste relatório derivam exclusivamente do código, dos assets e dos gates reproduzíveis do repositório `jadsonfraga/neuroped`.
