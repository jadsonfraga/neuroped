# Auditoria profunda e correções — 22/10/2026

Escopo: toolchain (typecheck/lint/build), suíte de guards e testes do `package.json`,
contrato cliente ↔ Functions, invariantes do AGENTS.md (tenant, D1, LGPD, verdade clínica),
lógica de datas e idade, PDFs clínicos, cálculo de dose e superfície pública.
Base: `HEAD` d8e78bf. Não houve commit; as alterações estão na árvore de trabalho.

## Método e linha de base

- `npm ci` (lockfile) e `npm run check`, `npm run lint`, `npm run build:client`.
- 66 execuções isoladas de scripts `npm` de guards/testes não-E2E (todos os de release
  que não exigem navegador ou URL publicada), e 20 E2E Playwright sobre `dist/public`.
- Varredura estática: contrato de rotas (cliente × `functions/api`), métodos HTTP,
  predicados de tenant em `UPDATE`/`DELETE`, escritas D1 fora de `batch`, CSP × hosts
  usados, service worker, `catch` vazios, marcadores TODO/stub, botões sem ação,
  `toISOString().slice(0,10)` como "hoje", PDF com texto não sanitizado.
- Leitura direta de: cálculo de dose, checagem de dose, webhook de cobrança,
  autenticação (segredo JWT), paginação do backup, fluxo de arquivamento de PDF.

## Achados corrigidos

| # | Achado | Evidência | Correção |
|---|---|---|---|
| 1 | `npm run check` abortava antes da checagem semântica: `@aws-sdk/client-s3` 3.1045 (lockfile) traz `.d.ts` que o TypeScript 5.6.3 não lê, e o `tsc` pula a checagem de tipos quando há erro de sintaxe. O script "passava" sem checar o cliente. | `tsc` com 5.6.3: só `S3.d.ts(142,167) TS1005`. Com 5.8.3: 2 erros semânticos reais (itens 2 e 3). | `typescript` 5.6.3 → 5.8.3 (a versão que o próprio pacote declara). Edição cirúrgica no `package-lock.json` (sem churn de `libc`). |
| 2 | `secureStorage.ts`: `b64()` aceitava só `ArrayBuffer` e recebia `Uint8Array` (IV). | TS2345 em `secureStorage.ts:274`. Runtime já correto (`new Uint8Array(x)` copia). | Tipo ampliado para `ArrayBuffer \| Uint8Array`. |
| 3 | `LiveDocumentsPanel.tsx`: download de PDF montava o `Blob` com `bytes.buffer`. Hoje o decoder gera buffer exato, mas se `bytes` fosse uma view o PDF sairia corrompido. | TS2322 em `LiveDocumentsPanel.tsx:74`. | `new Blob([bytes])`. Latente, sem efeito atual comprovado. |
| 4 | Teste de regressão desatualizado: `scale-pdf-fidelity-regression` exigia `config.labels[...]`, mas o registro usa as opções por item (commit d516ec4). O código está correto. | `test:clinical-documents` falhava (exit 1). Confirmado que a tela e a exportação usam `itemOptions(item, config.labels)`. | Asserção trocada pela fonte real, que é mais forte (verifica também a origem das opções). |
| 5 | Laudo: "data da consulta" pré-preenchida com a data UTC. Entre 21h e 24h (Brasília) o laudo nascia com o dia seguinte. | `laudo-um-clique.tsx:62`. | `localIsoDate()`. Guarda `local-iso-date` ampliada para chaves como `dataConsulta` (antes só pegava `data`/`date`). |
| 6 | Resumo pré-consulta: idade calculada pelo dia UTC. Na véspera do aniversário (noite) a criança aparecia com a idade nova. | Teste novo: nascimento 22/10/2016, referência 21/10/2026 22h BRT → esperado "9 anos", obtido "10 anos" com a lógica antiga. | `localIsoDate(new Date(hoje))` para a idade. |
| 7 | Datas de escala aplicada (`appliedAt`, timestamp) exibidas pelo dia UTC na evolução e no resumo: aplicação às 22h aparecia com a data de amanhã. | `fmt()` em `evolucao.ts` e `br()` em outros três arquivos. | Helper único `formatIsoDateBr` (`clinicalDate.ts`): data pura intacta, timestamp pelo dia local. Os quatro formatadores usam o helper. |
| 8 | Arquivamento de PDF sem paciente (ex.: laudo assinado sem paciente vinculado) chamava `/api/files/sign-upload`, que existe só no Express. Em produção o catch-all respondia "Rota de API não encontrada.", sem indicar a causa. O próprio `CLOUD-STORAGE.md` diz que object storage não está ativo. | `filesClient.ts`; `functions/api/[[path]].js`. | Erro específico quando a rota de armazenamento não existe neste deploy (404 com `code: NOT_FOUND` + `path`). Não cria fallback novo. |
| 9 | Receita C1 Express: `f.cid` (texto livre) desenhado no PDF sem `pdfSafe`. pdf-lib (WinAnsi) lança em caractere fora do Latin-1 e a receita assinada não é gerada. Além disso havia duas funções mortas com `_` (`_buildC1PdfBytes`, `_canonicalExpressPayload`) com o mesmo caminho sem sanitização. | `receita-c1-express.tsx` linhas 119 e 299; nenhuma referência às funções `_`. | `pdfSafe(f.cid)` e remoção do código morto. Asserção estática em `receita-c1-compliance`. |
| 10 | Seis arquivos de teste existiam mas não rodavam em nenhum script nem workflow (30 casos: reconhecimento visual, busca visual do Super NeuroPad e gate de `npm audit`). | Varredura de `tests/unit` × `package.json` × `.github/workflows`. | Ligados a `test:cognitive`, `test:super-neuropad` e `test:quick-wins`. Todos passam. |

## Verificado e sem defeito (não alterado)

- **Dose e checagem** (`calculadoraDose.ts`, `checagemDose`): divisão por tomadas, gotas, tetos,
  limites inclusivos/exclusivos, unidade mg/kg/dia × mg/dia. Atomoxetina tem dois limites
  máximos de unidades diferentes, o que o trecho da bula confirma ("o menor entre…").
  Valores clínicos não foram alterados (decisão médica).
- **Webhook de cobrança**: token obrigatório, comparação em tempo constante.
- **Segredo JWT** e `OPERATIONAL_DATA_KEY`: validação de ≥32 caracteres consistente nas rotas; sem fallback cruzado.
- **Escritas D1**: na varredura de `prepare` avulso, cada chamada estava dentro de `batch`/lista de
  `statements` ou tinha `await`. Varredura por padrão, não prova exaustiva.
- **Paginação do backup de pacientes**: cliente (50) e servidor (cap 50) consistentes; `hasMore`/`total` validados.
- **CSP**: `connect-src` cobre as chamadas reais do navegador; demais hosts são links de navegação.
- **Service worker**: `/api/` e rotas clínicas são Network Only; nada sensível é cacheado.
- **Superfície pública**: middleware global aplica 60 req/min por IP em todo `/api/*`.
- **Super NeuroPad (auditorias de 16 e 20/10)**: balanceamento da posição da resposta certa,
  registro de posição, IQR/CV e estrutura do circuito estão implementados.

## Riscos residuais e decisões pendentes (não alterados)

1. **Tabelas `*_demo` do Clinical Core sem coluna de clínica.** `clinical_events_demo` e
   `patients_demo` não têm `clinic_id`; o isolamento depende da checagem de dono do paciente
   (`getPatientAccess`) que roda antes do `UPDATE`. O AGENTS.md exige tenant no predicado final.
   Corrigir exige migração forward-only e decisão sobre o backend demo. Não alterado.
2. **Fuso fixo nos documentos clínicos.** `CLINICAL_TIME_ZONE = "America/Bahia"`, mas a tabela
   `clinics` tem `timezone` por clínica e o booking já usa o fuso do profissional. Uma clínica
   fora do UTC-3 (ex.: Acre, Amazonas) terá carimbos de hora e dia deslocados. Decisão de produto.
3. **Laudo sem bloqueio por placeholders / doutrina** (`docs/audits/SUPER_NEUROPAD_LAUDO_FLUXO_2026-10-20.md`,
   itens 1–3): o próprio responsável clínico definiu "nenhum bloqueio no fluxo". Não alterado.
4. **Módulo de tarefas complementares do Super NeuroPad** (go/no-go, span espacial, variabilidade):
   é desenvolvimento de funcionalidade nova, não correção, e depende de validação clínica.
5. **Object storage externo** continua inativo (exige revisão de LGPD, `CLOUD-STORAGE.md`).
   Arquivamento sem paciente segue indisponível em produção, agora com mensagem correta.
6. **Relação TypeScript × `@aws-sdk/client-s3`.** Manter `typescript` em 5.8.x enquanto o
   pacote declarar essa faixa; um upgrade futuro do SDK pode exigir novo bump.

## Verificação

### Execução final (árvore com as correções)

| Verificação | Resultado |
|---|---|
| `npm run check` (raiz com checagem semântica + Functions) | exit 0 (antes: abortava na sintaxe do `.d.ts`) |
| `npm run lint` (`--max-warnings=0`) | exit 0 |
| `npm run build:client` | exit 0 |
| `npm run test:quick-wins` · `test:clinical` | exit 0 · exit 0 |
| `test:clinical-documents` | exit 0 (antes: exit 1, item 4) |
| `test:escalas-evolucao` · `test:resumo-pre-consulta` · `test:checagem-dose` · `test:super-neuropad` · `test:cognitive` | exit 0 em todos |
| Linha de base dos 66 scripts não-E2E (antes das correções) | 65 exit 0; 1 falha (`test:clinical-documents`) |
| E2E Playwright, 21 jornadas (build anterior às correções de datas e receita) | 21 exit 0 |
| E2E Playwright afetados, build final | `laudo-um-clique`, `resumo-pre-consulta`, `escalas-evolucao`, `scales`: exit 0 |

Não executado nesta rodada: `verify:release` completo, `audit:a11y`/`audit:screens` (acessibilidade
e telas com navegador completo), `audit:lighthouse` e o E2E de `direct-track` em todas as abas.
Nenhum desses cobre as alterações de data, PDF e tipos, mas a lista fica como pendência de release.

Alterações na árvore de trabalho (sem commit): 16 arquivos modificados e este relatório.
