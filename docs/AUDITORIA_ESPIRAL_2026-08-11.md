# Auditoria Espiral NeuroPed — 11 de agosto de 2026

## Método

Auditoria iterativa em espiral: cada volta revalida o estado atual, investiga deltas recentes, cruza código com CI/deploy e transforma achados reproduzíveis em correções + contratos antirregressão.

## Volta 1 — delta após o último release certificado

Base previamente validada: `408d4b7baa59faa5dc8b5bc21ef8db6dcc636d4c`.

A `main` avançou diretamente por dois commits de auditoria até `b4f175b8390219a5f878f49f1423f41f51f41398`, sem PR. O branch principal permanece sem proteção obrigatória observável pela API do repositório.

### Achados confirmados

1. **Deploy Cloudflare bloqueado no HEAD**: `npm run verify` falhou no lint com quatro warnings tratados como erro.
2. **AuthContext com memoização falsa**: `login`, `logout` e `refreshUser` eram recriados a cada render e invalidavam o `useMemo`.
3. **Logout podia preservar cache/rascunhos se a chamada remota falhasse**: limpeza local não estava em `finally`.
4. **SuccessToast com stale closure**: remover `onDismiss` das dependências evitou reset do timer, mas podia chamar callback obsoleta.
5. **Regressão criptográfica de compatibilidade**: reinterpretar `NEUROPED_MASTER_KEY` de UTF-8 para Base64 alterou o material usado em PBKDF2 e HMAC sem versionar o envelope, com risco de tornar ciphertexts/hashes históricos incompatíveis.
6. **Lifecycle de áudio acoplado ao timer de ensaio**: o timer que encerra `AudioContext` foi colocado na mesma lista cancelada por `clearTimers()`, podendo impedir `osc.stop()`/`ctx.close()`.
7. **Artefato temporário de auditoria na raiz**: `analyze-a11y.sh` duplicava gates reais e não era usado por workflow/package.

### Correções desta volta

- callbacks de autenticação estabilizados com `useCallback`;
- logout limpa estado clínico local em `finally`;
- toast usa `ref` para callback atual sem reiniciar o timer;
- `NEUROPED_MASTER_KEY` volta a ser segredo opaco UTF-8, preservando a semântica histórica;
- áudio volta a ter timer de encerramento independente do scheduler de ensaios;
- script ad-hoc removido;
- `test:loose-ends` ampliado para travar essas regressões.

## Próximas voltas

- auth/cookies/CORS/CSRF e sessão;
- persistência/PII/PHI/ownership/logs;
- Clinical Core/Conecta/Agenda/Booking;
- PWA/cache/offline;
- documentos/PDF/assinatura;
- escalas/licença/scoring/safety;
- integrações e imports;
- workflows, deploy e governança;
- rotas mortas, PRs antigos e código órfão;
- performance, recursos e acessibilidade.

## Regra de promoção

Nenhum merge/deploy deve ocorrer com gate vermelho. Achados que exigem rotação/revogação de credenciais, migração de dados reais ou evidência externa permanecem explicitamente abertos até serem comprovados fora do código.
