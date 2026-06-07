# AUDITORIA_LEGADO_PRE_REACT

## Objetivo
Garantir que os melhores recursos do NeuroPed anterior ao React estejam aproveitados no app React atual sem reintroduzir desorganização, duplicidade de rotas, menu inflado, regressão visual ou risco de exposição de dados clínicos.

Esta auditoria é um **ponto de controle obrigatório antes de qualquer nova migração de legado**. O foco é preservar valor, não nostalgia.

---

## Veredito executivo

**Nota fria de aproveitamento do legado:** 7,8/10.

O React atual já aproveita vários recursos importantes do app anterior: CAA/Vou Falar, diários clínicos, pré-retorno, relatórios de escalas com impressão, mascote/feedback e parte do fluxo familiar. O risco principal não é ausência total do legado; o risco é **crescer por acumulação**, criando duplicidade de telas, rotas e menus.

### Decisão operacional

1. **Não fazer mega merge do legado.**
2. **Não migrar recurso antigo só porque existia.**
3. **Só integrar legado que melhore uma das 4 áreas:** valor clínico, operação da clínica, documentação ou experiência familiar.
4. **Toda migração deve ser feita por micro-PR com teste e critério de aceite.**

---

## Matriz principal de legado

| Recurso legado | Onde estava no app antigo | Existe no React? | Estado atual | Valor clínico | Risco de bagunça | Decisão | Próximo passo |
|---|---|---:|---|---:|---:|---|---|
| CAA / Vou Falar | Prancha CAA / comunicação alternativa | Sim | Forte: frase, voz, categorias, busca, favoritos, histórico, exportar/importar | Alto | Médio | **Manter e lapidar** | Testar mobile, reduzir ruído visual, avaliar modo criança/terapeuta explícito |
| Diários clínicos | Engine de diários longitudinal | Sim | Forte: componente genérico portado, CSV, tendência, histórico | Alto | Baixo/médio | **Manter e expandir com cautela** | Adicionar checklist de quais diários já existem; não duplicar páginas |
| Diário do sono | Diário específico | Sim | Configurado com hora de deitar, latência, despertares, qualidade e observações | Alto | Baixo | **Manter como está** | Melhorar exportação para PDF futuramente |
| Diário alimentar | Diário específico | Sim, rota presente | Precisa checagem visual completa | Médio/alto | Médio | **Auditar depois** | PR específico de diários |
| Diário escolar | Diário específico | Sim, rota presente | Precisa checagem visual completa | Médio/alto | Médio | **Auditar depois** | PR específico de diários |
| Diário de crises | App antigo / epilepsia | Parcial | Há rota `/epilepsia`, mas precisa confirmar completude frente ao legado | Alto | Médio | **Auditar e lapidar** | Não misturar com diário genérico sem decisão |
| Diário de cefaleia | App antigo / cefaleia | Parcial | Há rota `/cefaleia`, precisa confirmar impressão/exportação | Médio/alto | Médio | **Auditar e lapidar** | PR de diários clínicos |
| Pré-retorno familiar | Fluxo família/recepção | Sim | Bom: resumo, alertas, pontos positivos, WhatsApp/cópia/impressão | Alto | Médio | **Manter e conectar melhor** | Integrar com recepção/agenda futuramente; não expor dados sensíveis |
| Pré-consulta | Fluxo família | Sim, rota presente | Precisa comparar com versão antiga e com proposta SaaS | Alto | Médio | **Auditar antes de mexer** | Criar checklist de campos mínimos por idade |
| Portal da família | Área familiar | Sim | Rotas públicas existentes; precisa evitar confusão com área clínica | Alto | Alto | **Separar claramente** | Não liberar conteúdo clínico sensível; revisar navegação |
| Relatórios de escala | Resultado + impressão | Sim | Gera texto, copia, email/fallback e impressão/PDF via janela | Alto | Médio | **Manter e endurecer** | Garantir respostas completas, bloqueio se incompleto, layout consistente |
| PDF com respostas | App antigo/documentos | Sim parcial | Relatório inclui detalhamento das respostas; precisa teste por escala | Alto | Médio | **Manter e testar** | Criar teste/evidência de impressão em escala genérica |
| Encaminhamento por WhatsApp | Fluxos familiares | Parcial | Pré-retorno usa compartilhamento via WhatsApp; relatórios clínicos usam email/cópia/impressão | Médio | Alto se enviar dado clínico sem aviso | **Usar com cautela** | Para dados clínicos: preferir copiar/imprimir; WhatsApp só com orientação de sigilo |
| PANT | Documentos médicos | Sim, rota presente | Precisa auditoria própria; alto risco se automático demais | Alto | Alto | **Manter com travas** | Documento médico deve ter revisão profissional |
| PANTC1 / receitas | Receita e controle especial | Parcial/planejado | Não validar como assinatura digital real sem fluxo externo | Alto | Alto | **Manter como template, não como assinatura automática** | Evitar promessa ICP-A1 se não implementado |
| Filtro ouro/prata/bronze | Filtro clínico inteligente | Sim | Está como núcleo de valor; histórico recente protege estética PR260 | Alto | Médio | **Preservar** | Não mexer no visual sem teste comparativo |
| Catálogo de escalas | Legado amplo | Sim | Muito forte, mas risco de excesso de menu | Alto | Alto | **Consolidar, não duplicar** | Revisar taxonomia e busca antes de adicionar itens |
| Mascotes | Identidade visual antiga | Sim | Úteis como feedback, mas podem infantilizar se usados em excesso | Médio | Médio/alto | **Uso seletivo** | Manter em estados de apoio; retirar de áreas formais se poluir |
| Artes/imagens antigas | Assets visuais | Parcial | Risco de imagens órfãs e proporções inadequadas | Médio | Alto | **Inventariar antes de usar** | Criar inventário de assets, encaixar só onde agrega |
| PWA / instalação | App antigo local-first | Sim parcial | Histórico recente corrigiu caminhos relativos e service worker | Alto | Médio | **Preservar** | Testar GitHub Pages e Cloudflare após qualquer alteração |
| Modo claro/noturno | Preferências visuais | Sim parcial | Precisa checagem de consistência | Médio | Médio | **Manter** | Não trocar tokens sem migração gradual |
| Acessibilidade | Legado variável | Parcial | Há boas peças, mas precisa auditoria sistemática | Alto | Médio | **Auditar** | Contraste, foco, aria, navegação por teclado |
| Sidebar antiga | Navegação legado | Sim/risco | Risco conhecido: duplicidade e menu inflado | Médio | Alto | **Não reintroduzir** | Qualquer legado deve entrar nos hubs canônicos |

---

## Achados já confirmados no React atual

### 1. CAA / Vou Falar

O CAA atual já contém recursos de alto valor:

- montagem de frase;
- fala por síntese de voz;
- busca por figurinha;
- categorias;
- favoritos;
- histórico;
- cartão personalizado da família;
- exportação/importação da prancha;
- frases rápidas;
- aviso de que não substitui avaliação fonoaudiológica.

**Decisão:** não recriar. Apenas lapidar.

**Riscos:**

- uso de localStorage é aceitável para recurso local educativo, mas não para dados clínicos sensíveis;
- emojis funcionam como pictogramas, mas podem destoar de áreas clínicas formais;
- precisa teste em celular pequeno.

### 2. Diários clínicos

O componente `DiarioClinico` documenta que foi portado do motor legado de diários. Isso é um bom sinal: o legado foi aproveitado como componente React genérico, não colado como código antigo.

**Decisão:** manter a arquitetura genérica.

**Próximo cuidado:** diários devem exportar CSV/relatório de forma clara e não devem criar múltiplas rotas redundantes.

### 3. Relatórios e impressão

O `ClinicalReport` já gera relatório clínico completo, inclui detalhamento das respostas e abre janela de impressão/PDF. Também escapa HTML, reduzindo risco de injeção no HTML de impressão.

**Decisão:** manter e testar.

**Próximo cuidado:** criar evidência por escala de que todas as respostas aparecem no PDF/print.

### 4. Pré-retorno

O pré-retorno atual já entrega valor operacional para família, recepção e médico:

- evolução geral;
- sono;
- comportamento;
- escola;
- alimentação;
- comunicação;
- crises;
- medicação;
- efeitos percebidos;
- dúvida principal;
- prioridade;
- resumo pronto;
- pontos de alerta;
- pontos positivos;
- perguntas estratégicas.

**Decisão:** preservar.

**Próximo cuidado:** conectar com agenda/backend futuramente, mas sem jogar dados sensíveis em fluxo aberto sem token/consentimento.

---

## Trava anti-bagunça obrigatória

Antes de migrar qualquer recurso legado, responder:

| Pergunta | Resposta obrigatória |
|---|---|
| Esse recurso melhora o app atual? | Sim/Não + justificativa |
| Já existe no React com outro nome? | Sim/Não |
| Vai duplicar menu ou rota? | Sim/Não |
| Vai piorar performance? | Sim/Não |
| Vai piorar estética? | Sim/Não |
| Vai criar risco LGPD? | Sim/Não |
| Vai expor área sensível aos pais? | Sim/Não |
| Tem teste ou critério de aceite? | Sim/Não |
| Pode ser migrado como componente isolado? | Sim/Não |
| Pode ser revertido sem afetar o app? | Sim/Não |

**Regra:** se houver mais de 3 respostas preocupantes, não migrar agora. Colocar em backlog.

---

## PRs recomendados

### PR 1 — Auditoria e trava operacional

- Criar esta auditoria.
- Criar guia de integração segura do legado.
- Não alterar lógica funcional.

### PR 2 — CAA / Vou Falar

Escopo permitido:

- revisar mobile;
- organizar modo criança/família/terapeuta se necessário;
- preservar exportação/importação;
- não trocar a arquitetura.

### PR 3 — Diários clínicos

Escopo permitido:

- inventariar diários ativos;
- padronizar exportação;
- corrigir labels e estados vazios;
- não duplicar rotas.

### PR 4 — PDF/Impressão das escalas

Escopo permitido:

- criar evidência de relatório com todas as respostas;
- melhorar texto de sigilo;
- impedir relatório incompleto;
- não criar envio automático por WhatsApp.

### PR 5 — Assets legados

Escopo permitido:

- inventariar imagens;
- classificar uso;
- aplicar apenas assets que melhorem a estética;
- proibir poluição visual.

### PR 6 — Navegação

Escopo permitido:

- remover duplicidade;
- manter hubs canônicos;
- não reviver sidebar antiga.

---

## Critérios de aceite da etapa atual

- [x] Matriz inicial de legado criada.
- [x] Trava anti-bagunça definida.
- [x] CAA classificado como recurso já aproveitado e preservável.
- [x] Diários classificados como portados para motor genérico.
- [x] Relatórios/PDF classificados como funcionalidade existente a testar.
- [x] Pré-retorno classificado como recurso operacional preservável.
- [ ] Rodar `npm run check`.
- [ ] Rodar `npm run validate:catalog`.
- [ ] Rodar `npm run test:clinical`.
- [ ] Rodar `npm run build`.

Os comandos acima precisam ser executados no ambiente local/CI. Esta alteração documental não modifica runtime.

---

## Nota fria final desta auditoria

| Dimensão | Nota |
|---|---:|
| Aproveitamento do legado no React | 7,8 |
| Risco de bagunça se migrar sem controle | 8,5 de risco |
| CAA/Vou Falar | 8,6 |
| Diários clínicos | 8,2 |
| Relatórios/PDF | 7,8 |
| Portal familiar/pré-retorno | 7,7 |
| Navegação/hierarquia | 6,8 |
| Assets/mascotes | 6,5 |

**Síntese:** o legado bom já começou a entrar. O próximo ganho não vem de migrar mais coisa de uma vez; vem de **auditar, consolidar e testar o que já foi trazido**, migrando o restante em micro-PRs sem reabrir a bagunça do app antigo.
