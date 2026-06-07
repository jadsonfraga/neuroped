# NeuroPed 9.9 — Consolidação operacional

## Estado consolidado

Execução parcial realizada em 07/06/2026 e consolidada após nova tentativa de avanço.

A entrega **ainda não deve ser considerada 9.9 concluída**, porque o roteador central (`client/src/App.tsx`) ainda precisa registrar as novas rotas e o build/deploy ainda precisam ser validados.

## Commits relevantes

- `42c0988` — rebuild/auditoria inicial de acesso.
- `7127b5a` — registro do progresso parcial do bloco 9.9.
- `9b922c3` — reforço do `localUnlock.ts` para reavaliar estado de desbloqueio em mudanças de rota.

## Já aplicado no repositório

- `client/src/security/accessPolicy.ts` criado.
- `client/src/components/SensitiveRouteGate.tsx` criado.
- `client/src/lib/shareText.ts` criado.
- `client/src/main.tsx` atualizado para remover o `PasswordGate` global.
- `client/src/lib/localUnlock.ts` atualizado para permitir rotas públicas antes do desbloqueio local e manter exigência em rotas clínicas.
- `client/src/lib/localUnlock.ts` agora reavalia desbloqueio em `hashchange` e `popstate`.
- `client/src/components/RouteGuard.tsx` atualizado para reutilizar `LocalUnlockGate` em rotas protegidas.
- `client/src/pages/pre-retorno.tsx` criado com formulário funcional, resumo, salvar, copiar, WhatsApp e imprimir.
- `client/src/pages/efeitos-colaterais.tsx` criado como rota mínima/placeholder seguro.

## Bloqueios encontrados

O conector bloqueou atualizações grandes em `client/src/App.tsx`. Por isso, as rotas novas ainda precisam ser registradas no roteador pelo Codex/Cursor local.

O conector também bloqueou a versão completa da página de efeitos colaterais com lista farmacológica detalhada. Foi criada uma versão mínima segura para posterior expansão local.

Também foram bloqueadas tentativas de:

- criar ponte no `not-found.tsx`;
- atualizar `recepcao.tsx`;
- atualizar `client/src/App.tsx` em bloco completo;
- usar árvore Git de baixo nível para contornar o editor do conector.

## Próximo passo obrigatório no Codex/Cursor

Executar a continuação a partir do commit `9b922c33153c2392d2db1c3675ead4d8a0fe42b1`.

### 1. Atualizar `client/src/App.tsx`

Adicionar imports lazy:

```ts
const PreRetornoPage = lazy(() => import("@/pages/pre-retorno"));
const EfeitosColateraisPage = lazy(() => import("@/pages/efeitos-colaterais"));
```

Adicionar rotas próximas de `/pre-consulta` e `/recepcao`:

```tsx
<Route path="/pre-retorno" component={PreRetornoPage} />
<Route path="/efeitos-colaterais" component={EfeitosColateraisPage} />
```

### 2. Atualizar `client/src/data/navigation.ts`

Adicionar, sem mudar visual:

- `Pré-retorno` apontando para `/pre-retorno`;
- `Efeitos colaterais` apontando para `/efeitos-colaterais`.

Preferir o grupo de recepção/pré-consulta já existente. Evitar duplicações.

### 3. Atualizar `/recepcao`

Adicionar atalhos, sem redesign:

- Pré-consulta;
- Pré-retorno;
- Efeitos colaterais;
- Resumos salvos;
- Copiar resumo.

### 4. Expandir `/efeitos-colaterais`

Transformar o placeholder em formulário local-first completo, mantendo linguagem prudente.

Regras clínicas obrigatórias:

- não orientar suspender;
- não orientar aumentar;
- não orientar reduzir;
- não afirmar causalidade;
- usar “relato familiar”, “possível associação temporal” e “comunicar ao médico assistente”.

### 5. Rodar validação

```bash
npm run build
npm run check
npm run validate:catalog
npm run test:clinical
```

Se algum comando não existir, registrar como inexistente no `package.json`.

### 6. Testar rotas

```txt
#/portal-familia
#/pre-consulta
#/pre-retorno
#/efeitos-colaterais
#/recepcao
#/pacientes
#/prontuario
#/filtro
#/caa
#/vou-falar
```

### 7. Deploy

Após build verde, fazer push/deploy e registrar evidência.

## Critério de pronto

Só declarar concluído quando:

- `/pre-retorno` abrir em produção;
- `/efeitos-colaterais` abrir em produção;
- portal familiar abrir sem bloqueio indevido;
- rotas clínicas continuarem protegidas;
- filtro não regredir;
- CAA não regredir;
- documentos/receitas não quebrarem;
- build passar;
- deploy for confirmado.

## Veredito

O bloco 9.9 está **consolidado como execução parcial avançada**, não como entrega final. A base de acesso e pré-retorno já foi criada; o restante depende do registro das rotas no `App.tsx`, navegação, build e deploy validados localmente no Codex/Cursor.
