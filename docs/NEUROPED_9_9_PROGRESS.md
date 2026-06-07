# NeuroPed 9.9 — Progresso operacional

## Status

Execução parcial realizada em 07/06/2026.

## Já aplicado

- `client/src/security/accessPolicy.ts` criado.
- `client/src/components/SensitiveRouteGate.tsx` criado.
- `client/src/lib/shareText.ts` criado.
- `client/src/main.tsx` atualizado para remover o `PasswordGate` global.
- `client/src/lib/localUnlock.ts` atualizado para permitir rotas públicas antes do desbloqueio local e manter exigência em rotas clínicas.
- `client/src/components/RouteGuard.tsx` atualizado para reutilizar `LocalUnlockGate` em rotas protegidas.
- `client/src/pages/pre-retorno.tsx` criado com formulário funcional, resumo, salvar, copiar, WhatsApp e imprimir.
- `client/src/pages/efeitos-colaterais.tsx` criado como rota mínima/placeholder seguro.

## Bloqueios encontrados

O conector bloqueou atualizações grandes em `client/src/App.tsx`. Por isso, as rotas novas ainda precisam ser registradas no roteador pelo Codex/Cursor local.

O conector também bloqueou a versão completa da página de efeitos colaterais com lista farmacológica detalhada. Foi criada uma versão mínima segura para posterior expansão local.

## Próximo passo obrigatório no Codex/Cursor

1. Atualizar `client/src/App.tsx`:
   - importar `PreRetornoPage` de `@/pages/pre-retorno`;
   - importar `EfeitosColateraisPage` de `@/pages/efeitos-colaterais`;
   - adicionar rotas `/pre-retorno` e `/efeitos-colaterais` próximas de `/pre-consulta` e `/recepcao`.

2. Atualizar `client/src/data/navigation.ts`:
   - adicionar `Pré-retorno`;
   - adicionar `Efeitos colaterais`;
   - manter o visual atual.

3. Rodar:

```bash
npm run build
npm run check
npm run validate:catalog
npm run test:clinical
```

4. Testar produção:

```txt
#/portal-familia
#/pre-consulta
#/pre-retorno
#/efeitos-colaterais
#/recepcao
#/pacientes
#/prontuario
```

## Veredito

A arquitetura começou a ser corrigida, mas a entrega 9.9 ainda não está concluída enquanto `App.tsx` não registrar as rotas e o build/deploy não forem validados.
