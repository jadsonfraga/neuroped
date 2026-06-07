# NeuroPed 9.9 — Consolidação de ganhos e pendências

## Data

07/06/2026

## Objetivo

Consolidar o que já entrou na `main`, separar o que foi suplantado/fechado, e manter uma lista objetiva do que ainda falta para elevar o NeuroPed de forma segura, sem regressão e sem redesign.

## Ganhos já consolidados na `main`

### 1. Acesso local mais seletivo

- `PasswordGate` global removido do `client/src/main.tsx`.
- `client/src/security/accessPolicy.ts` criado.
- `client/src/components/SensitiveRouteGate.tsx` criado.
- `client/src/lib/localUnlock.ts` passou a considerar o nível de acesso da rota.
- `localUnlock.ts` reavalia o estado em `hashchange` e `popstate`.
- `RouteGuard.tsx` passou a reutilizar `LocalUnlockGate` em áreas protegidas.

### 2. Pré-retorno familiar

- `client/src/pages/pre-retorno.tsx` criado.
- `/pre-retorno` registrado em `client/src/App.tsx`.
- `/pre-retorno` adicionado ao grupo “Recepção e pré-consulta” em `client/src/data/navigation.ts`.
- Salvamento local em `neuroped:pre-retornos`.
- Botões de salvar, copiar, WhatsApp e imprimir.
- Resumo pronto para médico/recepção.

### 3. Campo de sintomas/efeitos percebidos

Como a rota separada `/efeitos-colaterais` ainda não pôde ser registrada via conector, o valor clínico foi incorporado com segurança dentro de `/pre-retorno`:

- campo “Sintomas ou efeitos percebidos pela família”;
- inclusão no resumo final;
- linguagem prudente;
- sem causalidade automática;
- sem orientação de ajuste de dose.

### 4. Compartilhamento de texto

- `client/src/lib/shareText.ts` criado.
- Funções para formatar texto para WhatsApp, copiar texto e abrir compartilhamento via `wa.me` após clique do usuário.

### 5. PRs antigos tratados

PRs #365, #367, #368, #369 e #370 foram bloqueados por conflito e depois suplantados por consolidações seguras na `main`.

PRs #347 e #324 foram fechados como suplantados/obsoletos e não devem ser mergeados diretamente:

- #347: conteúdo central já absorvido pela `main`; branch muito defasada.
- #324: altera artefatos estáticos/legados e poderia regredir o app React atual.

## Pendências reais

### Alta prioridade

1. Confirmar deploy visual de `/pre-retorno` em produção.
2. Rodar localmente:

```bash
npm run check
npm run validate:catalog
npm run test:clinical
npm run build
```

3. Corrigir qualquer erro de build/teste.
4. Verificar rotas no celular:

```txt
#/pre-retorno
#/portal-familia
#/filtro
#/recepcao
#/pacientes
#/prontuario
#/caa
#/vou-falar
```

### Média prioridade

5. Registrar `/efeitos-colaterais` como rota própria quando o ambiente local permitir.
6. Expandir `client/src/pages/efeitos-colaterais.tsx` de placeholder para formulário completo.
7. Atualizar `/recepcao` com atalhos para pré-retorno e resumos salvos.
8. Adicionar `/efeitos-colaterais` na navegação após a rota estar funcional.

### Baixa prioridade

9. Refino visual leve sem redesign.
10. Auditoria mobile/PWA após deploy confirmado.
11. Evidência em prints ou vídeo curto de fluxo família → recepção → médico.

## Travas anti-regressão

Não reintroduzir `PasswordGate` global.

Não remover:

- `/pre-retorno`;
- `shareText.ts`;
- `accessPolicy.ts`;
- `SensitiveRouteGate.tsx`;
- rechecagem de rota em `localUnlock.ts`;
- `neuroped:pre-retornos`;
- filtro clínico;
- CAA;
- portal familiar;
- documentos/receitas;
- PWA.

Não mergear PRs antigos defasados sem rebase e build verde.

## Critério para declarar 8.5+

- Build verde;
- deploy confirmado;
- `/pre-retorno` funcionando em produção;
- portal familiar abrindo sem bloqueio indevido;
- rotas clínicas protegidas;
- filtro e CAA sem regressão;
- recepção integrada ao pré-retorno.

## Critério para declarar 9.0 real

Além do 8.5:

- `/efeitos-colaterais` completo e integrado;
- recepção com painel de resumos;
- testes clínicos/catalogação sem falha;
- evidência visual mobile;
- fluxo família → recepção → médico validado ponta a ponta.

## Veredito atual

A `main` tem ganho real e incremental. O eixo mais forte agora é o `/pre-retorno`, que já concentra evolução, medicação e sintomas/efeitos percebidos com linguagem prudente. O app ainda não deve ser declarado 9.0 porque faltam build/deploy confirmados e integração completa da recepção/efeitos colaterais.
