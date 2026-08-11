# Auditoria Espiral NeuroPed — 11 de agosto de 2026

## Método

Auditoria iterativa e ostensiva em espiral. Cada volta:

1. revalida o HEAD real da `main`;
2. compara com o último release comprovadamente saudável;
3. cruza código, CI, deploy e contratos de segurança;
4. corrige apenas achados reproduzíveis e reversíveis;
5. adiciona antirregressão quando a falha pode reaparecer;
6. audita a própria correção na volta seguinte;
7. distingue código resolvível de dependências externas/migrações de dados.

Base previamente certificada antes desta auditoria: `408d4b7baa59faa5dc8b5bc21ef8db6dcc636d4c`.

---

## Volta 1 — drift depois do release certificado

A `main` avançou diretamente por dois commits de auditoria até `b4f175b8390219a5f878f49f1423f41f51f41398`, sem PR. A API do GitHub reportava `protected=false` e nenhum required status check no servidor.

### Achados

- o deploy Cloudflare do novo HEAD estava vermelho;
- `npm run verify` falhava porque o lint encontrou quatro warnings e o projeto usa `--max-warnings=0`;
- portanto havia drift real: código na `main` sem promoção para o backend canônico.

### Ação

Foi aberto o issue #584 para proteção server-side da `main`. Workflow não substitui ruleset/branch protection do GitHub.

---

## Volta 2 — regressões introduzidas pelos commits diretos

### Compatibilidade criptográfica

`server/lib/crypto.ts` passou a decodificar `NEUROPED_MASTER_KEY` como Base64. Historicamente o valor é um segredo opaco em UTF-8 usado como material para PBKDF2 e HMAC. Reinterpretar a mesma string muda a chave derivada e os hashes determinísticos sem versionar o envelope.

**Correção:** restaurada a semântica histórica `Buffer.from(raw, "utf8")`. Qualquer mudança futura de representação exige versão de chave/envelope e migração coordenada.

### AuthContext

Uma tentativa de memoização criava callbacks inline e não reduzia renders. Mais importante: se `logoutRequest()` falhasse, a limpeza de cache React Query e rascunhos cifrados podia não ocorrer.

**Correção:** fluxo simples preservado; `logout()` limpa o estado clínico local em `finally`, independentemente do resultado da rede.

### SuccessToast

Retirar `onDismiss` das dependências do timer evitava reset, porém deixava stale closure.

**Correção:** callback atual mantido em `ref`; timer depende apenas de `durationMs`.

### Cognitive Lab / áudio

O encerramento do `AudioContext` foi colocado na mesma fila de timers de ensaio cancelada por `clearTimers()`. A troca de trial podia cancelar `osc.stop()`/`ctx.close()`.

**Correção:** lifecycle de áudio voltou a ter timer independente e encerramento protegido.

### Script temporário

`analyze-a11y.sh` era grep ad-hoc sem integração com os gates reais axe/Lighthouse.

**Correção:** removido.

---

## Volta 3 — a CI auditando a própria correção

O primeiro `Verify NeuroPed` do branch corretivo revelou um teste estático legado acoplado à sintaxe `async function logout()`, em conflito com a tentativa de `useCallback`.

**Decisão:** não enfraquecer o contrato nem insistir em otimização cosmética. O AuthContext voltou à forma simples, mantendo o `finally` de segurança. O Verify então voltou a ficar verde.

---

## Volta 4 — autenticação canônica Cloudflare

### Lockout por conta com corrida

O backend canônico fazia read → bcrypt assíncrono → write absoluto de `failed_login_attempts`. Tentativas simultâneas podiam ler o mesmo valor e sobrescrever incrementos.

**Correção:** incremento e decisão de lockout agora ocorrem atomicamente no próprio `UPDATE` D1 com `COALESCE(...)+1`.

### Credential stuffing entre contas

O middleware global possuía rate limit de 60 req/min em memória por isolate. Isso não é durável e o lockout por conta não bloqueia ataque distribuído contra muitos e-mails inexistentes.

**Correção:** criado `functions/api/auth/_rateLimit.ts`:

- bucket por IP do Cloudflare pseudonimizado via HMAC-SHA256;
- IP nunca é persistido em claro;
- contador D1 atômico por janela de 15 minutos;
- bloqueio após 30 falhas na janela;
- e-mail inexistente e senha incorreta alimentam o mesmo bucket;
- índice por `updated_at`;
- limpeza oportunística de buckets inativos após 24 horas para evitar crescimento ilimitado;
- ausência do header Cloudflare mantém o lockout por conta e deixa o limitador distribuído inerte em ambientes locais.

---

## Volta 5 — sistemas de Toast

Existe um segundo sistema de Toast em `client/src/components/Toast.tsx`.

### Achados

- `ToastItem` recebia `onDismiss={() => ...}` novo em cada render;
- o timer dependia de `onDismiss`;
- adicionar um novo toast podia reiniciar o tempo dos toasts existentes;
- o fallback de `useToast()` sem provider imprimia mensagem de erro no console, superfície desnecessária para texto potencialmente sensível.

### Correção

- `onDismiss` mantido em `ref`;
- timer depende apenas da duração;
- fallback sem provider virou no-op silencioso.

---

## Volta 6 — UX honesta e auditoria da própria correção

A busca da Home diz `Buscar escala, paciente ou página…`, mas a implementação local pesquisa apenas páginas e escalas. O achado é real.

Uma tentativa de substituir `home.tsx` integralmente para alterar apenas o placeholder trouxe alterações colaterais de outra revisão da Home: um fluxo clínico e o aviso de uso responsável saíam do diff.

**Ação da espiral:** a mudança foi revertida bit a bit para o blob atual da `main` antes do merge. `home.tsx` não permanece no diff deste PR. O issue #586 registra a correção mínima de uma linha para micro-PR separado, justamente para impedir nova alteração colateral.

---

## Volta 7 — código clínico e scripts órfãos

Foram encontrados scripts históricos na raiz sem referência ativa em `package.json`/workflows:

- `run-audit-loop-20min.sh` — caminho absoluto `/home/user/...`, janela de execução datada;
- `audit-filter-random-patients.mjs` — simulador aleatório que não exercitava a pipeline real e continha heurísticas clínicas simplificadas;
- `add-clinical-report.cjs` — reescrevia páginas de escalas em massa com classificações/cutoffs hardcoded;
- `generate-report.cjs` — gerador DOCX clínico antigo, com conteúdo e credenciais institucionais estáticas.

**Correção:** todos removidos da árvore ativa. O histórico Git permanece disponível, mas essas ferramentas deixam de parecer parte suportada do produto.

---

## Volta 8 — backlog e PRs fósseis

PRs antigos foram comparados com a `main`:

- #481: 152 commits atrás;
- #465: 183 commits atrás;
- #527: 106 commits atrás e com workflows one-shot próprios.

Todos foram encerrados **sem merge** como snapshots superseded. Intenções ainda úteis de filtro/escalas permanecem nos issues atuais #416/#438.

Issues de arquitetura explicitamente obsoleta também foram triados:

- #288 fechado como `not_planned`: premissa de gate PIN em Curvas não existe mais;
- #31 fechado como `not_planned`: escopo v41 ultrapassado por Clinical OS/Operational Suite;
- #293 fechado como `completed`: versão/build hoje deriva do `package.json` + commit;
- #297 fechado como `completed`: os três emojis formais explicitamente descritos não existem mais nesses locais.

---

## Volta 9 — PWA, cache e armazenamento local

### PWA

`client/public/sw.js` foi revisado:

- `/api/*` e superfícies clínicas usam Network Only;
- assets estáticos são cacheados separadamente;
- HTML usa network-first;
- caches são versionados;
- cache anterior é preservado somente para recuperação de lazy chunks antigos.

**Nenhum bug material novo encontrado nesta volta.**

### Secure Storage

`secureStorage` usa chave AES efêmera por carregamento como política deliberada de sessão clínica. Chamadores críticos de quota/erro foram verificados e tratam `false` sem alegar persistência bem-sucedida.

**Nenhum bug material novo encontrado nesta volta.**

---

## Volta 10 — Clinical Core, Conecta e persistência D1

Clinical Core e Conecta Cloudflare mantêm tabelas `*_demo` com `payload_json` em claro. A tabela `clinical_events_demo` e `conecta_events_demo` estavam zeradas no preflight seguro do issue #580.

Isso não deve ser confundido com storage LIVE criptografado. A dívida mais ampla já está corretamente classificada no P0 #514, pois também existem poucos registros legados em `patients_demo`, `consultations_demo`, `scale_results_demo`, `documents_demo` e `memory_notes` que exigem migração coordenada.

**Decisão:** não criar criptografia parcial apenas para dois endpoints. A solução segura exige:

- `CLINICAL_DATA_KEY` dedicada;
- backup/Time Travel já registrado;
- envelope versionado;
- migração idempotente;
- dual-read apenas durante transição;
- verificação de ausência de plaintext;
- restore sentinela;
- rollback comprovado.

O preflight #580 confirmou que os secrets clínicos ainda não estão provisionados; por isso nenhuma migração destrutiva foi iniciada nesta auditoria.

---

## Volta 11 — chave operacional

O preflight #580 confirmou que `appointments`, `waitlist_entries`, `appointment_reviews` e `notification_outbox` estavam vazios. Portanto é seguro separar `OPERATIONAL_DATA_KEY` sem recriptografia de registros operacionais existentes.

Contudo, o secret dedicado ainda não existe no Cloudflare Pages e o deploy atual regrava apenas secrets de auth/admin. Remover o fallback antes de provisionar a chave transformaria o primeiro write operacional em indisponibilidade.

**Estado:** #575 permanece aberto até o secret ser realmente provisionado no provedor e o deploy confirmar leitura/escrita. Não foi feita uma mudança de código que fingisse solucionar infraestrutura ausente.

---

## Volta 12 — senha inicial e conta E2E

`must_change_password` existe no contrato, mas o bootstrap canônico grava `0` porque não há fluxo de troca de senha. O deploy ainda pode usar `ADMIN_INITIAL_PASSWORD` como smoke E2E quando `NEUROPED_E2E_*` não está provisionado.

Foi aberto #585 para:

- conta E2E dedicada;
- endpoint autenticado de troca de senha;
- UI de rotação;
- revogação de refresh sessions;
- primeiro login com `mustChangePassword=true` após separar a identidade de teste.

Ativar a trava antes disso quebraria o próprio deploy, portanto ficou explicitamente bloqueado por provisionamento externo.

---

## Estado de governança e riscos externos/remanescentes

### P0 externos/migratórios

- **#514** — criptografia de campo do D1 clínico legado + rollback/restore;
- **#515** — revogação comprovada de credenciais históricas nos provedores;
- **#533** — cadeia documental/proveniência do módulo de mutismo seletivo;
- **#575** — provisionar `OPERATIONAL_DATA_KEY` dedicada e remover fallback JWT;
- **#584** — ativar ruleset/branch protection da `main` no GitHub.

### P1 de autenticação

- **#585** — separar conta E2E e implementar rotação/troca de senha no backend canônico.

### P2 de UX

- **#586** — corrigir apenas o placeholder da busca da Home em micro-PR de uma linha.

### Produto ainda em desenvolvimento

- #416 / #438 — qualidade clínica e influência de sinais/sintomas no filtro;
- #565 — SaaS Phase 1 permanece draft e divergiu da `main`; não deve ser mesclado sem reextração/rebase cuidadoso depois dos P0.

---

## Antirregressão acrescentada

`tests/unit/loose-ends-regression.test.mjs` agora protege, entre outros:

- sem reinterpretar `NEUROPED_MASTER_KEY` como Base64;
- logout sempre limpa estado clínico local;
- lockout por conta atômico;
- rate limit distribuído presente no login Cloudflare e com retenção limitada;
- Toast sem stale closure/reset de timer;
- Cognitive Lab sem timer de áudio cancelável pelo scheduler de trial;
- ausência de scripts temporários/legados capazes de reescrever clínica fora dos contratos atuais.

---

## Critério de encerramento desta rodada

O PR só pode sair de draft e ser integrado quando, no HEAD final:

- `Verify NeuroPed` = success;
- `PR Check` = success;
- `Test, Lint & Build` + Production Readiness = success;
- `No password regression` = success;
- `Visual reset premium` = success;
- `Filter and scales spiral audit` = success, incluindo Chromium/axe/Lighthouse;
- branch não estiver atrás da `main`.

Depois do merge, Cloudflare, Vercel e GitHub Pages devem confirmar o mesmo SHA; Cloudflare também deve confirmar D1/auth/health/CORS/login E2E.

Nenhum item que dependa de secret externo, ruleset do GitHub, revogação de credencial ou migração de PHI deve ser declarado resolvido sem evidência do provedor.
