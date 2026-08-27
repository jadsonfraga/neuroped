# Auditoria E2E aba a aba — NeuroPed — 25/08/2026

## Escopo e método

Auditoria realizada sobre `jadsonfraga/neuroped@b057b14` e sobre a produção
canônica `https://neuroped.pages.dev`. A correção está no PR #696.

Níveis de evidência:

- **PROD-OK:** rota aberta no navegador publicado, sem erro de console, imagem
  quebrada ou overflow horizontal;
- **AUTH-GATE:** redirecionamento para login foi exercitado em produção;
- **CI/STATIC:** rota, guard, contrato e testes foram inspecionados; a operação
  autenticada completa depende de credencial E2E dedicada;
- **BLOCKED-LIVE:** falha fechada intencional até existir backend tenant-aware;
- **GAP:** indisponibilidade ou integração incompleta confirmada.

A varredura móvel foi feita em 390 × 844. O drawer abriu com
`aria-expanded=true`, `aria-modal=true`, foco no botão de fechar, conteúdo
principal `inert`, body lock e sem overflow horizontal.

## Resultado executivo

- A shell pública é estável, com uma exceção crítica corrigida:
  `/brincando-e-aprendendo` quebrava no preload do CSS lazy por depender de
  `@import` remoto.
- Links profundos protegidos perdiam a aba desejada depois do login; corrigido
  com destino interno validado e proteção contra open redirect.
- Links `#/receita-c1?patientId=...`, laudo e prontuário liam
  `window.location.search` e perdiam o paciente no hash router; corrigido.
- Busca global, Agenda, Receita C1 e Portal Família ainda tocavam endpoints
  legados em sessão LIVE; corrigidos para `/api/live/**`.
- Conecta e Memória Clínica continuam baseados em D1 demonstrativo. Agora
  falham fechados em LIVE em vez de criar um prontuário paralelo.
- `/agendar` abre, mas informa “Agendamento indisponível”: falta perfil público
  habilitado/configurado no D1.
- O gate “Dedicated E2E account only” falha por configuração externa; não há
  credencial técnica exclusiva válida para a jornada autenticada completa.

## Rotas públicas — aba a aba

| Aba/rota | Estado | Evidência |
| --- | --- | --- |
| `/login` | PROD-OK | formulário abre; retorno pós-login corrigido |
| `/sessao-expirada` | PROD-OK | recuperação pública renderiza |
| `/familia` | PROD-OK | home familiar |
| `/brincando-e-aprendendo` | CORRIGIDO | crash de preload CSS removido e coberto por teste |
| `/missao-saude` | PROD-OK | percurso educativo |
| `/agendar` | GAP | tela estável; booking não habilitado no banco |
| `/marcacao` | PROD-OK | Secretaria IA administrativa |
| `/eletroencefalograma` | PROD-OK | conteúdo institucional |
| `/pre-consulta` | PROD-OK | storage clínico negado no LIVE autenticado |
| `/pre-retorno` | PROD-OK | storage clínico negado no LIVE autenticado |
| `/efeitos-colaterais` | PROD-OK | alias seguro do pré-retorno |
| `/verificar` | PROD-OK | validação local de documento |
| `/filtro` | PROD-OK | filtro carregou sem erro |
| `/filtro-escalas` | PROD-OK | modo efêmero sem cadastro |
| `/orientacao-parental` | PROD-OK | conteúdo educativo |
| `/glossario` | PROD-OK | conteúdo de referência |
| `/portal-familia` | CORRIGIDO | público não expõe documento; prévia profissional usa LIVE documents |
| `/portal-familia/novidades` | PROD-OK | editorial |
| `/portal-familia/acesso` | PROD-OK | política de acesso |
| `/marcos-desenvolvimento` | PROD-OK | referência |
| `/curvas-crescimento` | PROD-OK | referência |
| `/caa` | PROD-OK / BLOCKED-LIVE | local público funciona; prontuário browser-local não monta em LIVE |
| `/sobre` | PROD-OK | institucional |
| `/servicos-clinica` | PROD-OK | institucional |
| `/termos` | PROD-OK | legal |
| `/sobre-neuroped` | PROD-OK | institucional |
| `/ajuda` | PROD-OK | ajuda |
| `/acessibilidade` | PROD-OK | página de acessibilidade |
| `/consentimento-lgpd` | PROD-OK | contrato de consentimento |

## Navegação restrita — aba a aba

As rotas `/agenda`, `/pacientes`, `/prontuario`, `/receita-c1`,
`/mchat` e `/calculadora-dose` tiveram o AUTH-GATE exercitado em produção.
As demais foram reconciliadas com o catálogo, o router, RBAC e a matriz CI.

### Acesso rápido e acompanhamento

| Aba | Rota | Estado |
| --- | --- | --- |
| Agenda & Gestão | `/agenda` | AUTH-GATE; seletor de paciente corrigido para LIVE |
| Pacientes / Prontuário | `/pacientes` | AUTH-GATE; LIVE patients |
| Memória clínica | `/memoria-clinica` | BLOCKED-LIVE; hoje usa `clinical_memory_notes_demo` |
| Laudos | `/laudo-neuroped` | CI/STATIC; vínculo por hash corrigido |
| Laudos SuperNeuroPed | `/laudo-super` | CI/STATIC |
| Receita C1 | `/receita-c1` | AUTH-GATE; paciente LIVE e hash corrigidos |
| Integrações Manus | `/manus` | CI/STATIC |
| NeuroPed Conecta | `/conecta` | BLOCKED-LIVE; hoje usa `conecta_events_demo` |
| NeuroAcompanhamento | `/neuroacompanhamento` | CI/STATIC |
| Diário escolar | `/diario-escola` | CI/STATIC; persistência browser negada no LIVE |

### Clínica e experiências educativas

| Aba | Rota | Estado |
| --- | --- | --- |
| Serviços e avaliação | `/servicos-clinica` | PROD-OK |
| Eletroencefalograma | `/eletroencefalograma` | PROD-OK |
| Brincando e Aprendendo | `/brincando-e-aprendendo` | CORRIGIDO |
| Missão Saúde | `/missao-saude` | PROD-OK |

### Trabalho clínico

| Aba | Rota | Estado |
| --- | --- | --- |
| Filtro Clínico Inteligente | `/filtro` | PROD-OK |
| Fluxograma Clínico | `/fluxograma` | CI/STATIC |
| Triar sem cadastrar | `/filtro-escalas` | PROD-OK |
| Avaliação multiprofissional | `/avaliacao-multiprofissional` | CI/STATIC |
| Diário do sono | `/diario-sono` | CI/STATIC; não persiste PHI no browser LIVE |
| Diário alimentar | `/diario-alimentar` | CI/STATIC; não persiste PHI no browser LIVE |
| Diário de epilepsia | `/epilepsia` | CI/STATIC; não persiste PHI no browser LIVE |
| Calendário de cefaleia | `/cefaleia` | CI/STATIC; não persiste PHI no browser LIVE |
| Escalas mundiais | `/escalas-neuropsiquiatria` | CI/STATIC |
| M-CHAT-R/F | `/mchat` | AUTH-GATE |
| CARS | `/cars` | CI/STATIC |
| Denver II | `/denver` | CI/STATIC |
| ASQ-3 | `/asq3` | CI/STATIC |
| SNAP-IV | `/snap` | CI/STATIC |
| SDQ | `/sdq` | CI/STATIC |
| Vanderbilt | `/vanderbilt` | CI/STATIC |
| SCARED | `/scared` | CI/STATIC |
| PHQ-A | `/phqa` | CI/STATIC |
| C-SSRS | `/cssrs` | CI/STATIC |
| Conners | `/conners` | CI/STATIC |
| CBCL | `/cbcl` | CI/STATIC |
| BRIEF-2 | `/brief2` | CI/STATIC |
| ABC | `/abc` | CI/STATIC |
| Vineland-3 | `/vineland` | CI/STATIC |
| CDI-2 | `/cdi2` | CI/STATIC |
| GMFCS | `/gmfcs` | CI/STATIC |
| CSHQ | `/cshq` | CI/STATIC |
| YGTSS | `/ygtss` | CI/STATIC |
| CRAFFT | `/crafft` | CI/STATIC |
| PedsQL | `/pedsql` | CI/STATIC |
| PSC-17 | `/psc17` | CI/STATIC |
| GAD-7 | `/gad7` | CI/STATIC + smoke Chromium obrigatório |
| AQ-10 | `/aq10` | CI/STATIC |
| Checklists TEA | `/tea` | CI/STATIC |
| Comport. TEA | `/tea-comportamentos` | CI/STATIC |
| Guia psiquiátrico | `/psiquiatria` | CI/STATIC |
| Bateria Jadson | `/bateria-jadson` | CI/STATIC |
| Neuropsicologia | `/neuropsicologia` | CI/STATIC |
| PAC | `/pac` | CI/STATIC |
| Autoavaliação | `/inventarios-auto` | CI/STATIC |
| AH/SD × TEA | `/ahsd-tea` | CI/STATIC |
| EMDI | `/emdi` | CI/STATIC |
| EAF | `/eaf` | CI/STATIC |
| ECSM | `/ecsm` | CI/STATIC |
| IPS | `/ips` | CI/STATIC |
| ECAR-SI | `/ecar-si` | CI/STATIC |
| EDI | `/edi` | CI/STATIC |
| EAI | `/eai` | CI/STATIC |
| EASI | `/easi` | CI/STATIC |
| EMS | `/ems` | CI/STATIC |
| ETARE | `/etare` | CI/STATIC |
| EAAH | `/eaah` | CI/STATIC |
| Testes por faixa | `/testes-diretos` | CI/STATIC |
| Cognitive Lab | `/cognitive-lab` | BLOCKED-LIVE; workspace local |
| Testes acadêmicos | `/testes-academicos` | CI/STATIC |
| Escrita e desenho | `/escrita-desenho` | CI/STATIC |
| Conhecimento visual | `/conhecimento-visual` | CI/STATIC |
| Reconhecimento visual | `/testes-reconhecimento` | CI/STATIC |
| Avaliação cognitiva infantil | `/avaliacao-cognitiva-infantil` | CI/STATIC |
| Motricidade | `/motricidade-teste` | CI/STATIC |
| Conhecimentos gerais | `/conhecimentos-gerais` | CI/STATIC |
| TDE-2 Adaptado | `/tde2` | CI/STATIC |
| CAA · Vou Falar | `/caa` | PROD-OK local / BLOCKED-LIVE |
| PANT | `/pant` | CI/STATIC |

### Referência

| Aba/rota | Estado |
| --- | --- |
| `/medicamentos`, `/farmacologia` | CI/STATIC |
| `/calculadora-dose` | AUTH-GATE |
| `/instrumentos-padronizados`, `/biblioteca-instrumentos` | CI/STATIC |
| `/fluxogramas`, `/marcos-desenvolvimento` | CI/STATIC / PROD-OK |
| `/valores-referencia`, `/curvas-crescimento` | CI/STATIC / PROD-OK |
| `/espasticidade`, `/classificacoes` | CI/STATIC |
| `/orientacao-parental`, `/portal-familia/acesso` | PROD-OK |
| `/ajuda`, `/sobre`, `/sobre-neuroped`, `/acessibilidade`, `/qualidade` | PROD-OK/CI |

## Catálogo de superfícies e banco

| Superfície | Endpoint atual | Fonte atual | Decisão |
| --- | --- | --- | --- |
| auth/sessões | `/api/auth/**` | `users`, `auth_refresh_sessions` | canônico |
| consentimento | `/api/consents` | `consents` | canônico |
| clínicas/memberships | `/api/tenants/**` | `clinics`, `clinic_memberships`, lifecycle | canônico |
| billing/convites | `/api/billing/**` | `billing_*`, `clinic_invitations` | canônico |
| pacientes | `/api/live/patients/**` | `live_patients` cifrada | canônico |
| prontuário/linha do tempo | `/api/live/events` | `live_clinical_events` cifrada | canônico |
| escalas vinculadas | `/api/live/assessments` | assessments/responses append-only | canônico |
| documentos estruturados | `/api/live/documents` | documents/versions cifrados | canônico |
| governança LGPD | `/api/live/governance` | retention/export/deletion requests | parcial: worker pendente |
| agenda pública/interna | public-booking/operations | tabelas booking/appointments cifradas | funcional; falta `clinic_id` |
| BoaConsulta | integrations/boaconsulta | batches/chunks/records | staging canônico; validar cutover |
| Conecta | `/api/conecta` | `conecta_events_demo` | BLOCKED-LIVE |
| Memória Clínica | `/api/memory` | `clinical_memory_notes_demo` | BLOCKED-LIVE |
| pacientes/resultados legados | patients/results/consultations | tabelas `*_demo` | somente demo/local |
| pré-visita/diários/drafts | browser ephemeral/local | storage protegido | negar PHI no LIVE |
| CAA/Cognitive/assinatura | browser local | storage protegido | BLOCKED-LIVE |
| PDF binário imutável | files + documents Express | object storage não publicado no Pages | GAP |
| Portal familiar real | sem token familiar canônico | visibilidade modelada | GAP de autenticação familiar |

## Plano de incorporação ao D1

### Gate 1 — impedir mistura LIVE/DEMO

Entregue no PR #696: busca global, Agenda, Receita e Portal Família usam endpoints
LIVE; cockpit legado não monta para paciente LIVE; Conecta e Memória falham
fechados; testes estáticos cobrem a fronteira.

### Gate 2 — completar domínios tenant-aware

1. Criar `live_conecta_events` ou adaptador formal para
   `live_clinical_events`, com `clinic_id`, payload cifrado, proveniência,
   supersession e sem DELETE destrutivo.
2. Criar `live_memory_notes` cifrada, escopada por tenant/paciente, com busca
   por blind index ou índice autorizado; remover qualquer LIKE sobre conteúdo
   clínico em claro.
3. Adicionar `clinic_id` e FK de `appointments.patient_id` para
   `live_patients`, preservando booking público por provider e tokens.
4. Transformar pré-visita e diários em submissões server-side com token
   revogável, expiração, consentimento e incorporação auditada ao prontuário.
5. Modelar CAA/Cognitive/assinatura como eventos/documentos LIVE ou mantê-los
   explicitamente locais; nunca sincronizar storage silenciosamente.

### Gate 3 — documentos e família

1. Publicar object storage canônico para PDF, com hash, versão imutável,
   metadados D1, retenção e vínculo tenant/paciente.
2. Criar `family_access_grants` com token hash, escopo, expiração, revogação,
   limite de tentativas e auditoria.
3. Servir somente versões `published` e `family_visibility=true`; ID de
   paciente jamais é credencial.

### Gate 4 — operação/LGPD e release

1. Worker exclusivo para materializar exportação/eliminação, legal hold,
   idempotência e prova de artefato.
2. Executar todas as migrações e consultar tabelas/triggers no D1 remoto.
3. Executar restore em banco isolado.
4. Provisionar conta E2E dedicada, sem fallback para admin.
5. Rodar jornada autenticada completa com dois tenants: criar paciente,
   avaliação, documento, agenda, exportação; atacar IDs cruzados.
6. Exigir checks no `main`; a branch principal continua sem proteção
   servidor-side.

## Pendências de UX/acessibilidade

- o layout usa um `h1` de marca em todas as páginas; algumas telas acrescentam
  outro `h1` e outras ficam sem título específico. Trocar a marca por elemento
  não-heading e garantir um único `h1` por rota;
- a navegação mostra “Sair” mesmo sem sessão;
- a mensagem de agendamento precisa diferenciar “perfil não configurado”,
  “agenda desabilitada” e falha técnica;
- o fluxo autenticado completo continua não verificável enquanto o gate da
  conta E2E dedicada estiver vermelho.

## Critério para declarar produção clínica plena

Nenhuma superfície clínica remota pode usar tabela `_demo`, storage do
navegador ou endpoint legado; todos os dados devem ser cifrados e tenant-aware,
com autorização server-side, auditoria, retenção, restore ensaiado e teste
adversarial automatizado.
