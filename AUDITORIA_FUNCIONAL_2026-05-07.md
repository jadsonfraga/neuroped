# AUDITORIA FUNCIONAL — NeuroPed EDJ

Data: 2026-05-07  
Escopo: auditoria estática dos arquivos publicados na branch `main`, com foco em funcionalidades não operantes, inconsistências, riscos de cache, experiência de uso e melhorias realistas.

## 1. Sumário executivo

O app está no ar como conjunto híbrido: app React principal em `index.html` + páginas estáticas independentes para CAA, diário, filtro e bancos de escalas. A CAA gratuita ampliada já está funcional na rota `comunicacao-alternativa.html`, mas há inconsistências residuais de rótulo e cache em outros arquivos.

Status geral estimado: 7,2/10.

Pontos fortes:
- CAA gratuita funcional com voz PT-BR, montagem de frase, apagar último cartão e limpar frase.
- Diário v2 está mais estável que a versão anterior, com data local e backup local.
- Filtro de escalas tem entrada por idade, queixa livre, sinônimos e tolerância parcial a erro.
- GitHub Pages consegue hospedar todas as rotas estáticas principais.

Pontos críticos:
- `escalas.html`, `manifest.json`, `sw.js` e `deploy-trigger.json` ainda citam CAA Premium/cache v11, podendo confundir usuário e navegador.
- `index.html` atual é shell React e não contém mais o injetor que colocava CAA abaixo de Secretaria; portanto a CAA pode não aparecer na sidebar do app principal.
- `sw.js` pode continuar entregando versão antiga por cache, porque o nome do cache ainda é `neuroped-v11-caa-premium`.
- O filtro de escalas ainda ranqueia páginas/lotes genéricos como instrumentos, o que reduz precisão clínica.
- O app principal carrega Google Fonts externo e tem CSP com permissões amplas para `unsafe-inline`, contrariando a ambição de PWA totalmente local/sem rede externa.

## 2. Achados de alta prioridade

### A1 — CAA pode não estar na sidebar do app principal

Evidência: o `index.html` atual voltou a ser apenas a casca do React com `div id="root"` e bundle externo local. Não há script de injeção da CAA na sidebar na versão atual. A sidebar real depende do bundle `assets/index-CCN60Z39.js`.

Impacto: o usuário abre o app principal e não vê a CAA onde espera, apesar da página CAA existir.

Correção realista:
- Localizar no código-fonte React o array de navegação da sidebar e inserir item nativo:
  - label: `CAA`
  - subtítulo: `figurinhas e voz`
  - href: `./comunicacao-alternativa.html`
  - posição: logo abaixo de `Secretaria`.
- Evitar injetor por DOM. É frágil e pode falhar após qualquer rebuild.

Prioridade: P0.

### A2 — Cache antigo pode manter CAA Premium

Evidência: `sw.js` ainda usa `CACHE_NAME = "neuroped-v11-caa-premium"`.

Impacto: usuários podem continuar vendo versão antiga mesmo após commit novo. Em iPhone/PWA instalado, esse problema é frequente.

Correção realista:
- Atualizar para `neuroped-v12-caa-gratuita`.
- Incluir `skipWaiting()` e `clients.claim()` já existem, mas a troca de nome do cache é essencial.
- Adicionar botão/instrução de `Atualizar app` ou `limpar cache` no índice.

Prioridade: P0.

### A3 — Rótulos contraditórios: Gratuita vs Premium

Evidência: `comunicacao-alternativa.html` já é CAA Gratuita, mas `escalas.html`, `manifest.json` e `deploy-trigger.json` ainda citam CAA Premium.

Impacto: confusão visual e percepção de produto mal acabado.

Correção realista:
- Trocar todos os textos de `CAA Premium` para `CAA Gratuita`.
- Trocar `communication_aac_version` para `v5-caa-gratuita`.
- Trocar notas do deploy para CAA Gratuita.

Prioridade: P0.

### A4 — Filtro ainda não consulta escala por escala em `scales-index.json`

Evidência: `filtro-escalas.html` usa lista `SCALES` interna com poucos registros e ainda inclui lotes inteiros como se fossem instrumentos.

Impacto: o filtro parece sensível, mas pode recomendar lote genérico acima da escala específica.

Correção realista:
- Carregar `scales-index.json` com `fetch()`.
- Se falhar, usar fallback interno.
- Penalizar páginas/lotes genéricos no score.
- Ranqueamento deve operar por instrumento individual: título, idade mínima/máxima, tags, respondente, página e âncora.

Prioridade: P1.

## 3. Achados de média prioridade

### M1 — CAA usa emojis como figurinhas

Impacto: funciona rápido, mas não é uma prancha CAA visual consistente. Emojis mudam por sistema operacional e nem sempre representam bem o conceito.

Correção realista:
- Manter emojis como fallback.
- Adicionar camada futura com pictogramas SVG próprios ou biblioteca aberta devidamente licenciada.
- Não copiar imagens de LetMeTalk, Tobii Snap ou bancos proprietários.

Prioridade: P1.

### M2 — CAA não tem busca por figurinha

Impacto: com muitas categorias, achar rapidamente `dor`, `banheiro`, `água`, `mamãe`, `pausa` pode exigir muitos toques.

Correção realista:
- Campo `buscar figurinha` filtrando por label, fala e categoria.
- Botão `favoritos`.
- Histórico dos 12 cartões mais usados no aparelho.

Prioridade: P1.

### M3 — CAA salva cartões personalizados, mas não exporta prancha

Impacto: família pode perder personalizações ao trocar de aparelho.

Correção realista:
- Adicionar exportar/importar prancha CAA JSON.
- Campo `restaurar prancha`.

Prioridade: P2.

### M4 — CAA não tem confirmação de áudio indisponível persistente

Impacto: em alguns navegadores, `speechSynthesis` depende de gesto ou voz instalada. A criança pode tocar e não ouvir.

Correção realista:
- Botão `testar voz` já existe.
- Adicionar aviso fixo se `speechSynthesis` não existir.
- Mostrar microfeedback visual: `falando...`.

Prioridade: P2.

### M5 — Diário v2 é local e útil, mas sem criptografia

Impacto: dados familiares sensíveis ficam em `localStorage` em texto puro.

Correção realista:
- Para uso familiar simples, manter como local e avisar claramente.
- Para uso clínico real, adicionar PIN e criptografia AES-GCM semelhante ao plano original.

Prioridade: P1 se for usado com dados reais de pacientes.

### M6 — `index.html` usa Google Fonts externo

Impacto: quebra a promessa de zero dependência externa e pode reduzir offline/performance.

Correção realista:
- Em produção estática, usar fontes do sistema ou embutir fontes localmente.
- Remover `fonts.googleapis.com` e `fonts.gstatic.com` se o objetivo for PWA offline estrito.

Prioridade: P2.

### M7 — JSON-LD traz `PsychiatricUnit`

Impacto: conflita com a identidade de neuropediatria e com a regra de evitar associação a psiquiatria infantil.

Correção realista:
- Substituir `PsychiatricUnit` por especialidade pediátrica/neurológica mais neutra no Schema.
- Manter `Neuropediatra` na descrição pública.

Prioridade: P1.

## 4. Achados de baixa prioridade

### B1 — Índice visual ainda informa `CAA Premium`

Correção simples: trocar título e card para `CAA Gratuita`.

### B2 — `deploy-trigger.json` está desatualizado

Correção simples: atualizar versão, data e descrição.

### B3 — Service worker ignora endpoints `/api/`

Isso é correto para GitHub Pages, mas deve estar documentado: backend só funcionará no Cloudflare Pages Functions.

### B4 — Filtro usa `theme-color` diferente do padrão

`filtro-escalas.html` usa `--teal:#0f766e`, enquanto padrão WarmMinimalism é `#1a6b65`.

Correção: unificar paleta.

## 5. Checklist funcional sugerido para teste manual

### App principal
- Abrir `https://jadsonfraga.github.io/neuroped/`.
- Confirmar que a sidebar aparece.
- Confirmar se existe item `CAA` abaixo de `Secretaria`.
- Clicar em `CAA` e verificar se abre `comunicacao-alternativa.html`.
- Testar em desktop e mobile.

### CAA Gratuita
- Tocar em `Água`: deve falar em português.
- Tocar em `Mamãe` + `Água`: os cartões devem entrar na frase.
- Clicar `Falar frase`: deve falar a frase combinada.
- Clicar `Apagar`: deve remover só o último cartão.
- Clicar `Limpar`: deve limpar tudo.
- Adicionar cartão personalizado e salvar.
- Recarregar página e verificar se cartão personalizado persiste.

### Diário v2
- Cadastrar criança.
- Registrar escola com data de hoje à noite.
- Confirmar que não cai no dia seguinte por UTC.
- Exportar JSON.
- Restaurar JSON.
- Gerar relatório de 7 e 30 dias.

### Filtro de escalas
- Entrada: `18 meses, não fala, não responde ao nome, barulho`.
- Esperado: TEA, fala e sensorial no topo; não priorizar lote genérico antes de instrumento específico.
- Entrada: `4 anos, seletividade alimentar, textura, engasgo`.
- Esperado: alimentação/sensorial com escala específica acima de lote.
- Entrada: `9 anos, desatenção, não termina tarefa, escola`.
- Esperado: TDAH/funções executivas/escola no topo.

## 6. Roadmap realista

### Hotfix imediato — 30 a 60 minutos
1. Renomear todos os rótulos residuais para `CAA Gratuita`.
2. Atualizar cache para `neuroped-v12-caa-gratuita`.
3. Atualizar `deploy-trigger.json`.
4. Garantir link CAA no índice.
5. Revalidar CAA em aba anônima.

### Sprint curto — 1 dia
1. Inserir CAA nativamente na sidebar do React.
2. Remover tentativa de injeção por DOM se existir em versões antigas.
3. Adicionar busca e favoritos na CAA.
4. Adicionar exportar/importar prancha CAA.
5. Trocar filtro para consumir `scales-index.json`.

### Sprint médio — 3 a 5 dias
1. Refatorar PWA/cache.
2. Remover dependência externa de fontes.
3. Melhorar acessibilidade da CAA com `aria-label` por cartão.
4. Revisar Schema.org e SEO médico.
5. Criar testes manuais documentados e checklist de release.

## 7. Veredito

A CAA Gratuita está funcional, mas a integração com o app principal e a limpeza de rótulos/cache ainda não estão no padrão esperado. O risco mais importante é o usuário não encontrar a CAA na sidebar e/ou visualizar conteúdo antigo por cache. O próximo passo correto é um hotfix específico para rotulagem, cache e navegação nativa.
