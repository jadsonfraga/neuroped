# Seletor de paciente nas escalas LIVE

**Escopo:** corrigir apenas a descoberta de pacientes no componente compartilhado
`SaveToPatient`. Sem alterar as gravações, o cálculo da escala, a visibilidade
familiar, o PDF ou a resolução de tenant no backend.

**Baseline:** em `89c8d0d`, com 156 perfis fictícios, a tela Pacientes encontra
o perfil mais antigo pela busca privada. Na tela de resultado da GAD-7, somente
os 50 primeiros pacientes estão disponíveis e o seletor oferece cadastro novo.

**Correção:** navegar pelas páginas usando o cursor vigente. A busca nominal usa
`POST /api/live/patients/search` com corpo, não URL. Alterar a busca ou a página
limpa a seleção; durante falha de leitura não é possível salvar pela seleção
remota. O fluxo local continua usando `/api/patients`.

**Reprodução:** execute `npm run build:client`, prepare o D1 fictício com
`node --import tsx tests/e2e/fixtures/live-patient-discovery.mts /tmp/new-live-fixture.sqlite`
e sirva o frontend e o Worker compilado em loopback, conforme o
[roteiro de descoberta LIVE](../superpowers/plans/2026-11-24-live-patient-discovery.md).
Use `LIVE_DISCOVERY_EMAIL=owner-a@example.test` e a mesma senha fictícia do seed
em `LIVE_DISCOVERY_PASSWORD`, então execute `node tests/e2e/live-scale-patient-picker.mjs`.
O teste exige que a escala encontre o paciente original, não faça POST de
cadastro, grave avaliação e documento com referência cruzada, e reabra a
avaliação após login em um novo contexto. O documento interno preserva a
visibilidade familiar desabilitada. Não há interceptação de API.

**Rollback:** reverta este commit. Não há migrações nem alteração de dados
preexistentes. Este teste não prova recuperação após falha parcial entre os
dois POSTs nem publicação para o portal da família. Não comprova geração,
arquivo ou assinatura de PDF clínico.
