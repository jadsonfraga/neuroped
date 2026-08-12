# NeuroPed Clinical OS — definição de produto e arquitetura 2026

## 1. Decisão de produto

O NeuroPed deixa de ser definido como um catálogo de escalas e documentos e passa a ser um **sistema clínico longitudinal de neuropediatria**, centrado no paciente e na proveniência de cada informação.

Nome operacional da arquitetura: **NeuroPed Clinical OS**.

O produto não compete para “ter mais escalas”. O produto organiza a jornada inteira:

**captura → proveniência → interpretação humana → decisão → documento → acompanhamento → desfecho**.

## 2. Problema que o produto resolve

A prática neuropediátrica acumula dados heterogêneos: relato familiar, escola, terapias, exame neurológico, estado mental, escalas, EEG, neuroimagem, genética, medicações, eventos adversos, documentos e evolução. Quando cada módulo armazena isso isoladamente, o médico precisa reconstruir a história manualmente a cada consulta.

O NeuroPed Clinical OS transforma esses fragmentos em uma linha clínica longitudinal auditável, sem apagar a distinção entre:

- relato;
- observação direta;
- medida/instrumento;
- documento externo;
- inferência clínica;
- decisão médica.

## 3. Usuário primário

Profissional médico responsável pelo caso, especialmente neuropediatria e neurofisiologia clínica.

Usuários secundários, sempre com escopo limitado e autorização explícita:

- equipe multiprofissional;
- escola;
- família/responsável;
- operadores administrativos.

## 4. Domínios do sistema

### 4.1 Registry
Cadastro, ownership, consentimento, identidade do paciente e permissões.

### 4.2 Clinical Core
Fonte canônica da jornada longitudinal. Registra eventos clínicos estruturados e sua proveniência.

Tipos iniciais:

- `encounter` — encontro/consulta;
- `problem` — hipótese, problema ativo, confirmação ou exclusão;
- `medication` — uso e decisões medicamentosas já realizadas;
- `observation` — achado observado, medido ou não avaliado;
- `plan` — plano de seguimento/intervenção;
- `outcome` — evolução e desfecho;
- `safety` — risco e resposta de segurança.

### 4.3 Conecta
Captação longitudinal entre consultas: sono, comportamento, escola, medicação percebida, crise epiléptica, cefaleia e outros eventos. Conecta é uma fonte do Clinical Core, não um prontuário paralelo.

### 4.4 Notes
Captura e normalização da consulta. O Notes deve transformar segmentos revisados em eventos do Clinical Core e documentos em rascunho.

### 4.5 Instruments
Escalas e instrumentos. O resultado bruto permanece preservado; qualquer interpretação deve carregar fonte, versão, limitações e estado de validação.

### 4.6 Documents
PANT/PANTY, relatórios, encaminhamentos, documentos escolares e prescrições. Documentos são saídas derivadas do prontuário e permanecem rascunho até revisão/assinatura quando aplicável.

### 4.7 Safety & Governance
Hard stops, auditoria, consentimentos, rastreabilidade, controle de acesso, trilha de mudanças, LGPD e limites para IA.

### 4.8 Outcomes & Analytics
Indicadores longitudinais e de qualidade. Não deve inferir causalidade ou diagnóstico a partir de associação observacional.

## 5. Regras não negociáveis

1. **Ausência de dado nunca equivale a normalidade.**
2. **Inferência nunca é armazenada como relato ou observação.**
3. **Correções não apagam história:** um novo evento supersede o anterior.
4. **IA não fecha diagnóstico nem prescreve autonomamente.**
5. **Decisões clínicas permanecem atribuíveis ao profissional responsável.**
6. **Dado real de saúde não entra no backend público demo.**
7. **Toda saída automatizada deve ser rastreável à fonte.**
8. **Dose, escore, data e código diagnóstico precisam ser verificáveis e versionáveis.**

## 6. Modelo de dados clínico

Cada evento canônico deve responder, no mínimo:

- **quem é o paciente**;
- **o que aconteceu** (`eventType` + `data`);
- **quando aconteceu** (`occurredAt`);
- **de onde veio a informação** (`provenance.kind` + `provenance.source`);
- **qual consulta o contextualiza**, quando houver (`encounterId`);
- **quem registrou** (`authorUserId`);
- **se corrige um registro anterior** (`supersedesEventId`);
- **quando entrou no sistema** (`createdAt`).

Esse contrato permite que Conecta, Notes, escalas, EEG, genética e documentos sejam integrados sem fundir fatos e inferências.

## 7. Arquitetura de IA

Modelos de IA são componentes substituíveis, não a fonte da verdade.

A camada durável do NeuroPed é:

**dados estruturados + proveniência + regras clínicas + auditoria + experiência do usuário + validação**.

A IA pode:

- transcrever;
- resumir;
- sugerir organização;
- apontar inconsistências;
- recuperar evidência;
- gerar rascunhos;
- comparar evolução;
- priorizar itens para revisão.

A IA não pode, por padrão:

- transformar dado ausente em achado normal;
- alterar prescrição sem decisão médica;
- confirmar diagnóstico por conta própria;
- esconder incerteza ou proveniência;
- apagar um registro clínico corrigido.

## 8. Produto mínimo vendável

O MVP comercial não é “centenas de escalas”. É um fluxo fechado:

1. selecionar paciente;
2. visualizar jornada longitudinal;
3. abrir consulta;
4. incorporar família/escola/terapia/escalas;
5. registrar problemas, achados, medicações e plano;
6. gerar documento revisável;
7. acompanhar eventos entre consultas;
8. medir desfecho no retorno.

Se esse ciclo não estiver fechado, novas funcionalidades não têm prioridade.

## 9. Métricas de produto

### North-star clínica
**Percentual de pacientes ativos com linha longitudinal útil para preparar a próxima decisão clínica.**

### Métricas operacionais

- tempo de preparação de consulta;
- tempo entre fim da consulta e documento revisado;
- percentual de eventos com proveniência explícita;
- percentual de problemas ativos com plano associado;
- percentual de medicações com dose estruturada e alvo clínico;
- percentual de red flags com ação registrada;
- percentual de retornos com desfecho documentado;
- redução de campos livres redundantes;
- número de retrabalhos/correções documentais;
- falhas de segurança e tentativas de acesso negadas.

## 10. Roadmap de productização

### Fase A — Kernel longitudinal
- contrato `shared/clinical-core.ts`;
- ledger `clinical_events`/`clinical_events_demo`;
- API autenticada;
- proveniência obrigatória;
- supersessão append-only;
- testes de segurança do contrato.

### Fase B — Patient Cockpit
- nova visão do paciente unificando consultas, Conecta, escalas e Clinical Core;
- listas ativas de problemas e medicações derivadas da timeline;
- red flags visíveis;
- filtros por período e fonte.

### Fase C — Consulta estruturada
- Notes grava encontro e achados no Clinical Core;
- exame neurológico e estado mental com `present/absent/not_assessed/unknown`;
- plano e medicação estruturados;
- PANT/PANTY derivado dos dados revisados.

### Fase D — Outcomes
- objetivos por problema;
- medidas repetidas;
- comparação longitudinal;
- dashboard de resposta e segurança.

### Fase E — Plataforma
- organização/tenant;
- permissões por equipe;
- integração FHIR quando houver caso de uso concreto;
- pacote regulatório e validação para funcionalidades enquadráveis como SaMD;
- métricas agregadas anonimizadas somente sob governança adequada.

## 11. O que NÃO construir agora

- novo catálogo paralelo de escalas;
- mais um gerador de laudo independente do prontuário;
- chatbot diagnóstico autônomo;
- recomendador automático de medicamento/dose;
- dashboards sem dados longitudinais confiáveis;
- marketplace antes de fechar o ciclo clínico principal;
- multi-tenant complexo antes de validar o Patient Cockpit em uso real controlado.

## 12. Critério para qualquer nova feature

Uma feature só entra no roadmap se melhorar pelo menos um destes pontos:

1. qualidade da decisão clínica;
2. segurança;
3. continuidade longitudinal;
4. redução de trabalho operacional;
5. rastreabilidade;
6. mensuração de desfecho;
7. distribuição do sistema para outros profissionais.

Se não melhorar nenhum deles, é distração de produto.
