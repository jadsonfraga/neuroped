# MAPA DE ABAS E COMPONENTES — NeuroPed EDJ
> Levantamento completo de rotas, componentes e status  
> Atualizado: 2026-05-08

---

## Componentes Principais

| Componente | Arquivo | Função | Status |
|-----------|---------|--------|--------|
| PasswordGate | `client/src/components/PasswordGate.tsx` | Tela de entrada com senha | ✅ Corrigido (SHA-256) |
| Layout | `client/src/components/Layout.tsx` | Sidebar + header mobile + dark mode | ✅ Funcional |
| GenericScale | `client/src/components/GenericScale.tsx` | Componente genérico de escala | ✅ Funcional |
| SaveToPatient | `client/src/components/SaveToPatient.tsx` | Vinculação de resultado a paciente | ✅ Funcional |
| ClinicalReport | `client/src/components/ClinicalReport.tsx` | Relatório clínico para impressão | ⬜ A auditar |
| RadarChart | `client/src/components/RadarChart.tsx` | Gráfico radar para scores | ✅ Funcional |
| Onboarding | `client/src/components/Onboarding.tsx` | Tutorial inicial | ⬜ A auditar |
| InstallPrompt | `client/src/components/InstallPrompt.tsx` | Prompt de instalação PWA | ✅ Funcional |
| ScaleReference | `client/src/components/ScaleReference.tsx` | Referências bibliográficas das escalas | ✅ Funcional |
| PerplexityAttribution | `client/src/components/PerplexityAttribution.tsx` | Atribuição de fonte AI | ⬜ Verificar se necessário |

---

## Rotas e Páginas

### 🔐 Áreas Protegidas por PIN

| Rota | Arquivo | PIN Necessário | Status Segurança |
|------|---------|---------------|-----------------|
| `/pacientes` | `pacientes.tsx` | ✅ SHA-256 (corrigido) | ✅ Corrigido |
| `/paciente/:id` | `paciente-detalhe.tsx` | ✅ SHA-256 (corrigido) | ✅ Corrigido |

### 🏠 Página Inicial

| Rota | Arquivo | Função | Status |
|------|---------|--------|--------|
| `/` | `home.tsx` | Dashboard com todas as escalas | ✅ Funcional |
| `/sobre` | `sobre.tsx` | Sobre Dr. Jadson | ✅ Funcional |
| `/ajuda` | `ajuda.tsx` | FAQ e ajuda | ✅ Funcional |

### 🧠 Neurodesenvolvimento e TEA

| Rota | Arquivo | Escala | Status |
|------|---------|--------|--------|
| `/mchat` | (scale page) | M-CHAT-R/F | ⬜ A auditar |
| `/cars` | (scale page) | CARS-2 | ⬜ A auditar |
| `/denver` | `denver.tsx` | Denver II | ⬜ A auditar |
| `/asq3` | (scale page) | ASQ-3 | ⬜ A auditar |
| `/gmfcs` | `gmfcs.tsx` | GMFCS | ⬜ A auditar |
| `/tea` | `tea.tsx` | Checklists TEA | ⬜ A auditar |
| `/tea-comportamentos` | `tea-behaviors.tsx` | Comportamentos Atípicos TEA | ⬜ A auditar |
| `/aq10` | `aq10.tsx` | AQ-10 | ⬜ A auditar |

### ⚡ Comportamento e TDAH

| Rota | Escala | Status |
|------|--------|--------|
| `/snap` | SNAP-IV | ⬜ |
| `/sdq` | `sdq.tsx` / SDQ | ⬜ |
| `/conners` | `conners.tsx` / Conners | ⬜ |
| `/cbcl` | CBCL | ⬜ |
| `/vanderbilt` | Vanderbilt | ⬜ |
| `/brief2` | BRIEF-2 | ⬜ |
| `/abc` | ABC | ⬜ |
| `/vineland` | `vineland.tsx` / Vineland-3 | ⬜ |

### 💙 Saúde Mental

| Rota | Escala | Status |
|------|--------|--------|
| `/scared` | `scared.tsx` / SCARED | ⬜ |
| `/cdi2` | CDI-2 | ⬜ |
| `/phqa` | PHQ-A | ⬜ |
| `/cssrs` | C-SSRS | ⬜ |
| `/crafft` | `crafft.tsx` / CRAFFT | ⬜ |
| `/psc17` | `psc17.tsx` / PSC-17 | ⬜ |
| `/gad7` | `gad7.tsx` / GAD-7 | ⬜ |

### ❤️ Regulação Emocional (Escalas Autorais Dr. Jadson)

| Rota | Arquivo | Escala | Status |
|------|---------|--------|--------|
| `/ecar-si` | `ecar-si.tsx` | ECAR-SI J26 | ⬜ |
| `/edi` | `edi.tsx` | EDI-J26 | ⬜ |
| `/eai` | `eai.tsx` | EAI-J26 | ⬜ |
| `/easi` | (scale page) | EASI-J26 | ⬜ |
| `/ems` | `ems.tsx` | EMS-J26 | ⬜ |
| `/etare` | `etare.tsx` | ETARE-J26 | ⬜ |
| `/eaah` | `eaah.tsx` | EAAH-J26 | ⬜ |

### 🛠️ Ferramentas Clínicas

| Rota | Arquivo | Função | Status |
|------|---------|--------|--------|
| `/filtro` | `filtro.tsx` | Filtro por queixa/idade | ⬜ A auditar |
| `/prontuario` | `prontuario.tsx` | Prontuário SOAP | ⬜ A auditar |
| `/satisfacao-medicacao` | `satisfacao-medicacao.tsx` | Satisfação com medicação | ⬜ A auditar |
| `/calculadora-dose` | `calculadora-dose.tsx` | Calculadora pediátrica | ⬜ A auditar |
| `/curvas-crescimento` | `curvas-crescimento.tsx` | Curvas OMS | ⬜ A auditar |
| `/marcos-desenvolvimento` | `marcos-desenvolvimento.tsx` | Marcos 0-60m | ⬜ A auditar |
| `/valores-referencia` | `valores-referencia.tsx` | Sinais vitais/labs | ⬜ A auditar |
| `/espasticidade` | `espasticidade.tsx` | Ashworth/Tardieu | ⬜ A auditar |
| `/fluxogramas` | `fluxogramas.tsx` | Algoritmos clínicos | ⬜ A auditar |
| `/classificacoes` | `classificacoes.tsx` | ILAE, FMS, CIF | ⬜ A auditar |

### 📚 Guias e Referências

| Rota | Arquivo | Conteúdo | Status |
|------|---------|----------|--------|
| `/farmacologia` | (data: `farmacologia.ts`) | Psicofármacos/antiepilépticos | ⬜ |
| `/neuropsicologia` | `neuropsicologia.tsx` | Guia avaliação neuropsicológica | ⬜ |
| `/pac` | `pac.tsx` | Processamento Auditivo Central | ⬜ |
| `/psiquiatria` | (scale page) | Guia DSM-5 | ⬜ |
| `/pant` | (data: `pantScales.ts`) | PANT 100 escalas passivas | ⬜ |
| `/avaliacao-multiprofissional` | `avaliacao-multiprofissional.tsx` | Mapa de instrumentos | ⬜ |
| `/plano-terapeutico` | `plano-terapeutico.tsx` | PTI gerador PDF | ⬜ |
| `/plano-intervencao` | `plano-intervencao.tsx` | Intervenção por habilidades | ⬜ |
| `/orientacao-parental` | `orientacao-parental.tsx` | Guias para famílias | ⬜ |
| `/fichas-registro` | `fichas-registro.tsx` | Fichas comerciais | ⬜ |

### 📓 Diários Clínicos

| Rota | Arquivo | Função | Status |
|------|---------|--------|--------|
| `/epilepsia` | (scale page) | Diário de crises | ⬜ A auditar |
| `/cefaleia` | (scale page) | Calendário cefaleia | ⬜ A auditar |

### 🧬 Bateria Dr. Jadson

| Rota | Escala | Status |
|------|--------|--------|
| `/bateria-jadson` | Hub da bateria | ⬜ |
| `/emdi` | `emdi.tsx` / EMDI | ⬜ |
| `/eaf` | EAF | ⬜ |
| `/pdae` | PDAE | ⬜ |
| `/ecsm` | ECSM | ⬜ |
| `/ips` | IPS | ⬜ |

---

## Dados e Configurações

| Arquivo | Conteúdo |
|---------|----------|
| `client/src/data/scales.ts` | Definições das escalas principais |
| `client/src/data/expandedScales.ts` | Escalas expandidas |
| `client/src/data/newScales.ts` | Novas escalas |
| `client/src/data/farmacologia.ts` | Base de dados de farmacologia |
| `client/src/data/autismScales.ts` | Escalas de autismo |
| `client/src/data/bateriaJadson.ts` | Bateria autoral |
| `client/src/data/bateriaJadsonPsiq.ts` | Bateria autoral psiquiatria |
| `client/src/data/pantScales.ts` | PANT 100 escalas passivas |
| `client/src/data/scaleReferences.ts` | Referências bibliográficas |
| `client/src/data/teaBehaviors.ts` | Comportamentos atípicos TEA |
| `client/src/data/escalasAutorais.ts` | Escalas autorais J26 |
| `client/src/data/scaleFilter.ts` | Lógica do filtro inteligente |
| `client/src/data/psychiatryGuide.ts` | Guia de psiquiatria infantil |

---

## Legenda

- ✅ Auditado e OK
- ⬜ Não auditado — pendente para próxima sessão
- ⚠️ Auditado — problema encontrado, pendente correção
- 🔴 Problema crítico ativo
