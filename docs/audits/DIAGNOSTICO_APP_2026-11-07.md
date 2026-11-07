# Diagnóstico do app NeuroPed — 07/11/2026

Base: `624ffb6` (branch `claude/neuropedi-app-diagnostic-4fp4o5`, idêntica à `main` no início da sessão).
Escopo: todas as áreas da navegação, rotas, abas e funções, no estado atual do código.
Método: leitura de código (frontend, Functions, Express), suítes do repositório,
build e duas varreduras com Chromium headless sobre o build real
(anônima: 130 rotas; autenticada com a API sintética do próprio repositório: 134 rotas).
A produção (`neuroped.pages.dev`) não estava acessível a partir do sandbox
(proxy 403). Por isso nada abaixo é medição da produção ao vivo: são fatos do
código e do build, e a análise do que eles implicam em produção.

Nenhum dado de paciente foi usado. Todas as contas e pacientes da varredura são sintéticos.

## 1. Saúde técnica (verificado)

| Verificação | Resultado |
|---|---|
| `npm ci` | exit 0 |
| `npm run check` (TS app + Functions) | exit 0 |
| `npm run lint` (0 warnings) | exit 0 |
| `test:quick-wins`, `test:patient-safety`, `test:hardening-regressions` | exit 0 |
| `test:clinical`, `test:filter`, `test:interactive`, `test:clinical-documents` | exit 0 |
| `test:known-routes`, `audit:navigation`, `audit:access` | exit 0 |
| `build:client` | exit 0 |
| `scorecard` | todos os eixos OK: 340 instrumentos executáveis com fonte (250 revisados), 846 fichas (702 com fonte), 174 aguardando validação psicométrica publicada, 144 pendências de proveniência documental (teto 145) |

Varredura anônima (130 rotas): 0 erros de runtime, 0 erros de console, 0 assets
quebrados, 0 páginas 404 indevidas. 37 rotas públicas renderizam; 93 redirecionam
para o login (inclusive a home `/` e as bibliotecas de referência).

Varredura autenticada (134 rotas, perfil admin/owner sintético): 0 erros de runtime,
0 erros de console, 0 error boundaries, nenhuma rota caindo no login.

O que não foi rodado: `verify:release` completo (Lighthouse, a11y completa, E2E
publicados). Os E2E publicados dependem de acesso à produção.

## 2. Achados prioritários

### P1 — Ficha do paciente e documentos ligados ao paciente leem o armazenamento legado em produção

Em produção existem dois cadastros de paciente:

- **LIVE, por clínica (tenant):** `/api/live/patients`, usado por Pacientes, Ficha,
  Prontuário, Receita C1, Agenda e Escuta.
- **Legado `*_demo`, por dono do registro e sem clínica:** `/api/patients`,
  `/api/consultations`, `/api/conecta`, `/api/memory`, `/api/results`, `/api/documents`.

Telas que, em sessão LIVE autenticada, ainda chamam o legado:

| Tela | Chamada | Efeito provável em produção |
|---|---|---|
| Ficha do paciente → `PatientCockpit` | `/api/clinical-core/events` | **Essa rota não existe nas Functions** (só no Express). O bloco Clinical Core mostra "Indisponível". |
| Ficha → `PatientCockpit` | `/api/consultations`, `/api/conecta/events` | Tabelas `_demo` com o ID de um paciente LIVE → 404 → "Indisponível". `conecta/[id].ts` só exporta DELETE. |
| Ficha → Metas terapêuticas (`TherapyGoalsPanel`) | GET/POST `/api/clinical-core/events` | Não lê nem grava em produção. |
| Laudo NeuroPed, Laudo em um clique, Evolução de escalas | `/api/patients/:id` | O preenchimento automático (nome, nascimento, CID, escalas) falha sem aviso; o médico redigita. |
| Memória clínica | `/api/patients`, `/api/memory` | Lista pacientes do legado e grava notas em `clinical_memory_notes_demo`, fora do tenant. |
| NeuroPed Conecta | `/api/patients`, `/api/conecta/events` | Opera sobre pacientes e eventos `_demo`. |
| Portal da família | `/api/documents` | Tabela legada. |

Por que os testes não pegam: a API sintética (`scripts/lib/synthetic-clinical-api.mjs`)
simula `/api/clinical-core/events`, que a produção não tem. A matriz visual
autenticada passa verde onde a produção falharia.

Recomendação: decisão de produto por tela. Ou migrar para endpoints `/api/live/*`
(com o tenant no predicado SQL), ou bloquear o componente em LIVE de forma explícita,
como os diários já fazem. Também é preciso alinhar a API sintética às rotas que
existem nas Functions, mais um guard estático "toda chamada do cliente tem rota em `functions/`".

### P1 — Funções de acompanhamento domiciliar não funcionam em produção autenticada

Por política LGPD (`clinicalBrowserPersistencePolicy`), com sessão LIVE elas mostram
só um aviso de bloqueio, e não existe backend tenant-aware equivalente:

- Diários: sono, alimentar, aderência, desregulação, dieta sensorial, escolar
- Diário de epilepsia, Calendário de cefaleia
- Pré-consulta, Pré-retorno / Efeitos colaterais, Recepção
- NeuroAcompanhamento (persistência local bloqueada)
- Assinatura digital (bloqueada antes de montar)
- CAA · Vou Falar (só memória da sessão; ver `BLOCKED_EXTERNAL_CAA_LOCAL_VALIDATION`)

O bloqueio é correto e seguro: ele falha fechado. O efeito, porém, é que cerca de 14
itens do menu "Acompanhamento clínico" e "Atendimento" aparecem para o profissional,
e o profissional chega num beco sem saída. Recomendação: esconder ou rotular no menu
em LIVE e priorizar um backend de diários por paciente (`/api/live/events` já existe).

### P2 — Governança

- `GET /api/memory` sem `patient_id`: o admin global lista notas de todos os donos,
  sem razão nem auditoria. Isso contraria a regra do AGENTS.md ("admin global não é
  fallback de rota clínica comum"). O alcance é limitado ao papel `admin` (cadastro
  novo recebe `professional`).
- Paridade Express × Functions: o Express não implementa `/api/live/*`, `tenants`,
  `operations` nem `billing`. As Functions não implementam `/api/files` nem
  `/api/clinical-core/events`. O upload de PDF sem clínica ativa (`archiveClinicalPdf`
  → `uploadFile`) cai em `/api/files`, que não existe em produção.
- Biblioteca Clínica (capítulo desatenção/imaturidade): o texto visível diz
  "Consensus bloqueado por cota… reinício anunciado 01/11/2026". O texto está vencido
  e o capítulo continua "sem aceite médico".

### P2 — Bloqueios externos ainda abertos (docs/audits/BLOCKED_EXTERNAL_*)

| Bloqueio | Impacto |
|---|---|
| R2/LGPD export (`LGPD_BUCKET_NOT_CONFIGURED`) | Exportação LGPD e veredito de prontidão clínica seguem NO-GO. Keyring clínico já resolvido em 17/10. |
| Resend (domínio/DNS) | E-mails de verificação/recuperação sem homologação de entrega real. |
| Asaas | Contrato operacional de cobrança pendente. |
| `NEUROPED_VISITOR_PASSWORD` | Login de visitante depende de segredo no GitHub/Cloudflare. |
| WhatsApp Business | Avisos automáticos da Secretaria inexistentes. |
| OBS-60 vídeo IA, Escuta (provedores) | Dependem de ativação externa e de validação clínica. |
| Smoke publicado (cliente zero) | Sem prova ponta a ponta na produção. |

## 3. Diagnóstico por área do menu

Legenda: **OK** = renderiza e funciona no build; **LIVE-bloq** = em produção autenticada
mostra só o aviso de bloqueio; **Legado** = depende das tabelas `_demo` (ver P1);
**Ext** = depende de configuração externa.

### Pré-consulta guiada
| Item | Estado |
|---|---|
| Super NeuroPad Game | OK (local, sem API). Issues #1190 e #1196 abertas (circuito neurológico, catálogo de 50 desafios). |
| Arena · NeuroPad | OK. Ficha `neuroped.arena.ficha.v1` classificada como longitudinal: não persiste em LIVE. |
| OBS-10 · Pré-consulta | OK. Auditorias de estações, mídia e tablet registradas em docs/audits. |

### Atendimento
| Item | Estado |
|---|---|
| Pacientes / Prontuário | OK em LIVE (`/api/live/patients`). Ficha com cockpit e metas parcialmente quebrados (P1). |
| Agenda & Gestão | OK em LIVE (`/api/operations`). Workspace local negado em LIVE (correto). |
| Laudos (NeuroPed) | OK para redação, PDF e assinatura ICP. Pré-preenchimento pelo paciente usa o legado (P1). |
| Laudo em um clique | Mesmo problema de pré-preenchimento (P1). |
| Laudos SuperNeuroPed | OK (local, sem API). |
| Checagem de dose (apoio) | OK, coberta por `test:clinical`. |
| Receita C1 | OK em LIVE. Impressão bloqueada sem paciente vinculado, por desenho. SNCR depende de integração externa. |
| Receita C1 Express | OK (local). |
| Memória clínica | Legado (P1, P2). |
| Escuta clínica | Ext. `ESCUTA_ENABLED=true` no wrangler, mas depende do binding AI, da criptografia e da validação clínica (`clinicalValidation: "pending"`). |
| Prontuário (rota direta) | OK em LIVE (`/api/live/events`, `LiveDocumentsPanel`). |
| Recepção | LIVE-bloq. |

### Clínica e acompanhamento
| Item | Estado |
|---|---|
| Especialidades | OK (superfície pública servida pelo `not-found.tsx` via portal; funciona, mas é um padrão frágil). |
| NeuroAcompanhamento | LIVE-bloq (persistência). |
| Diário escolar | LIVE-bloq. |
| Avaliação multiprofissional, Neuropsicologia, Serviços da clínica | OK (conteúdo/estático). |

### Triagem e ferramentas
| Item | Estado |
|---|---|
| Filtro de escalas / Triar sem cadastrar | OK. Núcleo mais testado do app (`test:filter`, `test:podium`, ranking, segurança). |
| Reconhecimento visual, Testes cognitivos por faixa, Por faixa etária, Sonda Dez | OK. Banco cognitivo de 304 itens e 89 itens visuais, com auditorias próprias. |
| Bateria Jadson, Fluxograma, PAC, Autoavaliação, AH/SD × TEA, Guia psiquiátrico | OK. |
| CAA · Vou Falar | OK em memória. Sem salvamento em LIVE (bloqueio externo documentado). |
| Escalas individuais (PHQ-A, C-SSRS, GAD-7, PSC-17, AQ-10/50, SNAP, YGTSS, GMFCS, EMDI…) e `/generic-scale/:id` | OK. Rotas legadas redirecionam para a superfície canônica. Escalas neuropsiquiátricas marcam "sem permissão formal" quando aplicável (correto). |

### Acompanhamento clínico
| Item | Estado |
|---|---|
| Medicamentos, Calculadora de dose, Farmacologia | OK (conteúdo + cálculo local). |
| Diário de epilepsia, Calendário de cefaleia, 5 diários | LIVE-bloq (P1). |
| NeuroPed Conecta | Legado (P1). |

### Referência
Biblioteca clínica, Instrumentos padronizados, Biblioteca de instrumentos, Fluxogramas,
Marcos, Valores de referência, Curvas, Espasticidade, Classificações, Orientação
parental: todas OK e sem API. Todas exigem login (decisão de acesso; reavaliar se
parte deve ser pública). Biblioteca 365 em produção diária (Dia 06 publicado);
inventário autoral diário gera uma issue por dia (#1276 e anteriores; 107 issues
abertas, a maioria de revisão diária acumulada).

### Portais e suporte
| Item | Estado |
|---|---|
| Brincando e Aprendendo, Missão Saúde | OK (públicos). |
| Portal da família / acesso / novidades | Parcial: o painel LIVE existe (`/api/live/family-portal`), mas a página principal ainda usa `/api/documents` legado. |
| Secretaria IA (`/marcacao`) / `/agendar` | Depende de `/api/public-booking` com clínica de serviço público ativa. Sem isso, mostra "Agendamento indisponível" (comportamento honesto). WhatsApp: Ext. |
| Ajuda, Sobre, Acessibilidade, Qualidade, Termos, Privacidade | OK. |

### Conta, SaaS e administração
Login, cadastro, verificação de e-mail, recuperação de senha, convite, onboarding,
planos, configurações (perfil, clínica, membros, métricas, billing), consentimento
LGPD e sessão expirada: OK no build. Os testes de autenticação, tenant e billing passam.
Dependem de Resend (e-mail real) e de Asaas (cobrança real), ambos externos.

## 4. Pendências de repositório

- 1 PR funcional aberta: #1278 (PANT/PANTY, fundação de auditoria). 1 rascunho de
  auditoria (#1253). 9 PRs do Dependabot paradas desde 30/10.
- A raiz do repositório tem cerca de 90 relatórios históricos e scripts `.bat`/`.ps1`
  de deploy antigos (Railway, Vercel), além de 44 `preview-*.jpg`. O AGENTS.md já
  declara que esses documentos são subordinados. Arquivar reduziria o ruído para
  agentes e colaboradores.

## 5. Ordem sugerida

1. Corrigir o P1 da ficha: endpoint LIVE de eventos ou bloqueio explícito do cockpit/metas
   em LIVE, mais o guard "chamada do cliente → rota existente em `functions/`".
2. Migrar o pré-preenchimento de Laudo, Laudo em um clique e Evolução para `/api/live/patients`.
3. Decidir o destino de Memória clínica, Conecta e Portal família (migrar para LIVE ou bloquear).
4. Backend tenant-aware de diários (reaproveitando `/api/live/events`) e menu que
   não ofereça telas bloqueadas em LIVE.
5. Fechar os bloqueios R2/LGPD e Resend; rodar o smoke publicado.
6. Atualizar o texto vencido da Biblioteca e revisar as PRs do Dependabot.

Diagnóstico técnico. Conduta, priorização clínica e liberação dependem da revisão do Dr. Jadson.
