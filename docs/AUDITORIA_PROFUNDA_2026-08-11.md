# Auditoria profunda NeuroPed — 11 de agosto de 2026

## Base auditada

- Repositório: `jadsonfraga/neuroped`
- Base inicial: `main@31c88a365ea09e5d2f8a252e4969b2053e5e51a6`
- Escopo: fronteira público × privado, Flow OS mobile, busca global, autoagendamento, automação diária, CI/release e riscos de persistência/segredos.

## Achados corrigidos

### 1. Dock clínico aparecia em fluxos públicos

O `MobilePrimaryDock` era montado globalmente no host autorizado e escondia apenas uma lista incompleta de rotas. Fluxos familiares como `/agendar`, `/familia`, `/pre-consulta`, `/pre-retorno` e `/efeitos-colaterais` podiam receber atalhos para Pacientes, Agenda e busca clínica.

**Correção:** os fluxos familiares passam a esconder o dock. O contrato fica protegido por teste estático.

### 2. Dock podia sobrepor dialogs e Command Palette

O dock usava `z-[99970]`, acima da camada convencional de dialogs/paleta. Isso permitia que a barra inferior permanecesse visualmente e interativamente acima de overlays.

**Correção:** dock rebaixado para `z-40`, preservando dialogs/paleta acima dele.

### 3. Command Palette tratava rota pública no host completo como privada

A paleta verificava `IS_PUBLIC_ZONE`, mas não a rota atual. Em uma rota pública servida pelo host completo, `Cmd/Ctrl+K` podia ativar consulta de pacientes e listar atalhos/páginas privadas. Em backend remoto a API ainda exigiria autenticação, mas a fronteira de UI e instalações locais não deveria depender disso.

**Correção:** a paleta acompanha o hash atual e, em qualquer rota explicitamente pública, opera em modo público: sem consulta de pacientes, ações privadas, escalas privadas ou páginas médicas.

### 4. Data do autoagendamento dependia do fuso do visitante

O calendário público calculava “hoje” pelo timezone do navegador. Próximo da meia-noite, uma família em outro fuso poderia receber uma data inicial/mínima diferente da agenda do profissional.

**Correção:** após carregar o perfil, a data inicial e o `min` do calendário usam `profile.timezone` via `Intl.DateTimeFormat(..., { timeZone })`.

### 5. Sincronização diária podia promover um SHA diferente do solicitado

`daily-authorial-static-sync.yml` aceitava `expected_commit`, mas se `main` tivesse avançado apenas registrava um aviso e publicava a revisão mais recente. O job do Vercel fazia novo checkout de `main`, criando outra janela de TOCTOU.

**Correção:**

- `expected_commit` divergente agora falha fechado antes de publicar;
- Cloudflare expõe o SHA efetivamente fixado como output;
- Vercel faz checkout exatamente desse SHA e confirma igualdade antes do build;
- o espelho continua condicionado à confirmação do Cloudflare no mesmo commit.

## Proteções adicionadas

- `tests/unit/deep-audit-regressions-static.test.mjs` trava os cinco grupos de regressão acima.
- `.github/workflows/deep-audit-regressions.yml` executa os contratos, TypeScript e lint em PR e em push para `main` quando as superfícies auditadas mudarem.
- O contrato Flow OS existente também foi ampliado para fronteira pública e stacking.

## Riscos relevantes não mascarados

### P0 — criptografia clínica D1

A issue #514 permanece válida: persistência clínica D1 ainda requer migração coordenada para criptografia de campo, backup e rollback verificável. Não foi feita alteração destrutiva nesta auditoria.

### P0 — revogação de credenciais históricas

A issue #515 depende de evidência nos provedores. Alteração de código não prova revogação/rotação e, portanto, não deve ser declarada como resolvida sem confirmação externa.

### Separação da chave operacional

A Operational Suite aceita `OPERATIONAL_DATA_KEY`, mas mantém compatibilidade com `NEUROPED_JWT_SECRET` no envelope atual. Separar essas chaves exige uma migração versionada que preserve leitura do ciphertext existente e provisionamento estável do segredo dedicado. Uma troca direta poderia tornar dados operacionais históricos ilegíveis; por isso não foi executada nesta correção de bugs.

## Critério de promoção

Este branch só deve ser integrado se os workflows de PR, hard release, build, lint, TypeScript, acessibilidade/navegação e contratos clínicos permanecerem verdes. Após merge, o mesmo SHA deve ser confirmado em Cloudflare, Vercel e GitHub Pages antes de encerrar o release.
