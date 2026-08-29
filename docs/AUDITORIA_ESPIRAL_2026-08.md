# Auditoria em Espiral — 2026-08-29

Varredura diagnóstica completa do app (7 frentes paralelas: servidor Express,
Cloudflare Functions, libs do client, páginas clínicas, scoring de escalas,
PWA/service worker, schema/build). Os bugs de código foram corrigidos no branch
`claude/app-bug-hunt-priority-3ofar`. **Este documento registra o que NÃO foi
alterado por exigir decisão clínica ou de produto do autor.**

---

## 1. Bugs LATENTES de scoring clínico (código morto hoje, minas amanhã)

Contexto: por decisão do autor (2026), `GenericScale` **não executa**
`onCalculate` — o resultado é transcrição integral de perguntas e respostas,
sem escore. Os problemas abaixo estão em código morto, mas viram risco clínico
imediato se o cálculo for reativado. Nenhum foi alterado: cortes e regras de
pontuação são domínio clínico do autor.

| # | Instrumento | Problema | Onde |
|---|---|---|---|
| 1 | **CSHQ** | 4 itens de sentido invertido ("vai para a cama na hora certa", "adormece sozinha", "dorme a quantidade certa", "acorda por conta própria") pontuados na direção errada — bom sono soma até +12 pontos de "distúrbio". Não existe `reversedItems` para CSHQ. | `data/expandedScales.ts` (cshqDomains) + `pages/cshq.tsx:22` |
| 2 | **CSHQ** | Corte 41 importado da versão de 33 itens aplicado à versão de 25 itens (range 25–75): criança na intensidade de alerta do instrumento original sai "Normal". O infoBox cita sensibilidade/especificidade que não se transferem. | `data/expandedScales.ts:716` |
| 3 | **ABC** | Corte único (≤5/≤15) para subescalas de 4 a 15 itens: "Fala Inadequada" (máx 12) **nunca** alcança "Elevado"; a classificação global herda o viés via `some(color === "red")`. | `data/expandedScales.ts:887` + `pages/abc.tsx:28` |
| 4 | **SDQ** | Off-by-one nas 4 subescalas de dificuldade: o limiar "anormal" é tratado como teto do "limítrofe" (`score <= abnormal` → deveria ser `score < abnormal`). Emocional=5 sai "Limítrofe" quando as normas publicadas dizem anormal. O teste de CI cobre só o escore total. | `data/newScales.ts:100-101` |
| 5 | **ASQ-3** | A faixa etária selecionada (20 grupos, 2–60 meses) **não entra no cálculo** — mesmos itens e mesmo corte para todas as idades. Bebê típico de 2 meses sai "Encaminhar". | `pages/asq3.tsx` + `data/expandedScales.ts:619` |
| 6 | **PedsQL** | Total = média das médias de domínio em vez de média dos itens (domínio físico de 8 itens subponderado ~38%); domínio sem resposta vira 0 = "Qualidade comprometida" em vez de N/A. | `pages/pedsql.tsx:29,33` |
| 7 | **ECARSI (risco suicida)** | Fatores de proteção subtraem 1:1 do escore de risco (até −12): risco real alto + família presente sai "Risco baixo — manter acompanhamento". Sem piso e sem item-sentinela. Proteção deveria modular a conduta, não cancelar a banda de risco. | `data/bateriaJadsonPsiq.ts:110` |
| 8 | **BRIEF-2** | T-score fabricado por fórmula linear sem normas (média=3, DP=2 hardcoded): raw 5/10 ("às vezes" em tudo) sai T=60 "Potencialmente clínico". Apresentado como T-score real. | `data/expandedScales.ts:516` |
| 9 | **SDQ / Vineland** | Subescala ausente → `NaN` cai no ramo `else` = pior classificação ("Anormal" / "Significativamente Baixo") sem guarda `Number.isFinite`. | `data/newScales.ts:62`, `:468` |
| 10 | **YGTSS** | `ygtssIntensityLabels` tem 7 entradas com índices 0 e 1 ambos "Nenhuma"; frequência tem só 5. Escala real usa 0–5 em ambos — qualquer scoring por índice fica desalinhado. | `data/expandedScales.ts:757-766` |
| 11 | **CARS** | Banda `<= 36` não expressa o range 30–36.5 do CARS-2 (que usa meios-pontos); o conjunto de 4 opções inteiras descarta a resolução do instrumento. | `data/cars.ts:21-30` |
| 12 | **Conners** | Bandas por percentual do máximo bruto rotuladas como "T-score ≥ 62" no infoBox — percentual não é T-score. | `data/newScales.ts:252-268` |
| 13 | **Filtro etário** | `faixasEtarias` usa tetos fracionários (5.99, 11.99…): escala com `ageMin: 6` fica fora da faixa cujo rótulo diz "6"; idade computada em (5.99, 6.0) não casa faixa nenhuma. Testes só sondam inteiros. | `data/scaleFilter.ts:186-194` |

**Recomendação**: antes de qualquer reativação de `onCalculate`, revisar item a
item contra os manuais originais e criar testes de scoring por instrumento
(hoje `test-clinical.mjs` cobre catálogo/filtro, não cálculo).

## 2. Decisões de arquitetura/produto pendentes

1. **Entitlement de billing cobre 3 de 9 árvores clínicas** — `/api/patients`,
   `/api/live/*` e `/api/operations` exigem assinatura ativa, mas
   `/api/consultations`, `/api/scales/results`, `/api/results`, `/api/memory`,
   `/api/clinical-core` e `/api/conecta` servem os MESMOS dados sem o gate.
   Clínica suspensa perde o índice de pacientes mas continua lendo/escrevendo o
   prontuário. Estender o gate muda o produto (o que fica atrás do paywall?) —
   decisão do autor.
2. **`BILLING_CLINIC_CONTEXT_REQUIRED` (409) para usuário sem membership** —
   o admin de bootstrap (sem `clinic_memberships`) não consegue listar
   pacientes no runtime Cloudflare, enquanto rotas irmãs servem os mesmos
   dados. Falta definir: usuário solo sem clínica é caso válido? Auto-criar
   membership no bootstrap?
3. **`/api/send-report` envia para qualquer destinatário** — é feature (enviar
   laudo à família) e vetor de phishing com conta comprometida. Opções:
   allowlist de domínios via env, confirmação em duas etapas, ou aceitar o
   risco documentado.
4. **Exclusão de paciente órfã arquivos e documentos clínicos** — `files` e
   `clinical_documents` usam `SET NULL`: os PDFs continuam no bucket,
   inalcançáveis por query de paciente; laudo imutável responde 409 até para
   pedido de eliminação LGPD. Conflito real retenção CFM × eliminação LGPD —
   precisa de política escrita (anonimizar? reter com fundamento legal
   registrado? expurgo após prazo?).
5. **Divergência de schema SQLite (drizzle) × D1 (`db/schema.d1.sql`)** —
   `consents`: FK `CASCADE` no D1 apaga a prova de consentimento ao excluir
   usuário (LGPD art. 37 exige guarda), enquanto SQLite usa `SET NULL`; D1 não
   tem `granted_at`/`revoked_at`/`patient_id`; CHECK do D1 aceita 3 dos 6
   `consentTypes` do zod. Precisa de migração planejada, não hotfix.
6. **`consents_idempotency_idx` inclui `accepted_at` nullable** — NULLs são
   distintos em índice único: retry duplica consentimento. Corrigir exige
   migração de dados (backfill de `accepted_at` + índice novo).
7. **`reusePort: true` no listen** — deploy sobreposto no Linux divide tráfego
   entre build velho e novo sem erro. Se a plataforma de deploy depende disso
   para zero-downtime, manter; senão, remover para falhar alto com
   `EADDRINUSE`.
8. **CORS permanente para `superneuroped.vercel.app`** — se o mirror Vercel
   ainda é oficial, manter; se foi abandonado, remover (subdomínio `.vercel.app`
   abandonado é reivindicável por terceiros).
9. **`masterPin` é stub que aceita qualquer PIN** — declarado intencional no
   código, mas `PrivateGate` e `generic-scale` ainda RENDERIZAM prompt de PIN
   que autentica nada; e com backend inacessível o modo `auto` rebaixa para
   `local` = tudo aberto. Ou remover os prompts (honestidade de UI), ou
   implementar PIN local de verdade.
10. **Middleware Cloudflare com `!env.DB` roda sem auth** — hoje só expõe
    fixtures demo, mas a decisão "sem banco = aberto" é estruturalmente
    fail-open; qualquer handler futuro que leia dado real no ramo `!env.DB`
    nasce sem autenticação. Backstop atual depende de `ENVIRONMENT ===
    "production"` exato.

## 3. Corrigido nesta espiral (resumo)

Servidor: lockout que nunca zerava (bloqueio permanente da vítima), revogação
de todas as sessões em double-refresh benigno (janela de graça 10s),
revalidação de usuário por request (desativação/troca de papel vale na hora),
`requireTLS` no SMTP 587, `JwtConfigurationError` não mais lavado em 401,
validação de boot (JWT secret/NODE_ENV), remoção do fallback de cookie (CSRF),
verify-pin fora do rate limit de login, envelope crypto **v2** (PBKDF2 1× por
processo: 300 decrypts 30s→4ms) com leitura retrocompatível de v1, decrypt
fail-soft por campo (linha corrompida não derruba mais a listagem), 404 JSON
para `/api/*` desconhecido, error handler após static, `/api/patients` com
`q`/`page`/`total` (busca e paginação funcionais no runtime Node),
`/api/results` paginável, item malformado não apaga mais as demais respostas,
rate limit no files/confirm.

Cloudflare Functions: webhook Asaas e aceite de convite desbloqueados
(PUBLIC_API_PATHS), LIKE com escape+cap na memória clínica, trilha de auditoria
de operações restrita a `canConfigure`, nota órfã corrigível por admin.

Client: refresh 5xx não destrói mais o vault (só 401/403 encerra sessão), wipe
de troca de conta funcional (removeItem nunca mais bloqueado + limpeza antes do
login), barreira de PHI fail-closed sem `VITE_AUTH_MODE`, chave de sessão sem
corrida (promise memoizada), `patientId` lido do hash nas 3 páginas quebradas
(prontuário/laudo/receita salvavam nunca), invalidação por prefixo (lista de
pacientes não fica mais eterna), retry sem duplicar paciente, dropdown com
limit, dirty-guard no prontuário (anamnese digitada não é mais sobrescrita),
`onError` no editar paciente, "NaN anos" eliminado, agenda sem TypeError de
perfil ausente e com debounce, favoritos sem lost-update, upload com
abort/timeout, cooldown de chunk-recovery coerente.

PWA/build: instalação do SW não-atômica para chunks (5xx transitório não
bricka mais o update), fallback offline de HTML só para navegação (dados
recebem 503 JSON), cache legado cross-build só para assets hasheados
(content-addressed), `envDir` na raiz (VITE_* do `.env` documentado volta a
entrar no bundle), `no-store` para `sw-assets.js`, `id` no manifest.
