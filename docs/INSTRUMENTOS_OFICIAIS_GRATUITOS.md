# Instrumentos Oficiais Gratuitos — Psiquiatria Infantil e Neuropediatria

**Branch de integração:** `feat/escalas-oficiais-gratuitas-ped-neuro-v1`  
**Revisão inicial:** 2026-05-29  
**Responsável editorial:** Dr. Jadson Fraga Araújo Júnior · CRM-PE 25227 · RQE 17756

## Objetivo

Ampliar o NeuroPed EDJ com acesso organizado a instrumentos oficiais gratuitos ou com acesso sem custo, mantendo duas travas:

1. nenhum item protegido será copiado para o app público sem permissão formal para reprodução eletrônica;
2. instrumentos de segurança em saúde mental somente poderão ser aplicados em ambiente clínico seguro, com fluxo de resposta definido.

## Regra de contagem

Estes instrumentos **não entram automaticamente na contagem de formulários autorais preenchíveis** do app. São classificados como fontes oficiais, candidatas a integração ou acesso externo controlado.

## Instrumentos e status atual

| Instrumento / família | Área | Status no app público | Próxima etapa |
|---|---|---|---|
| PSC-35, Y-PSC, PSC-17, Y-PSC-17 | Saúde mental global | Link oficial seguro | Confirmar permissão para formulário interno em português |
| CRAFFT 2.1 e CRAFFT 2.1+N | Substâncias no adolescente | Integração privada futura possível | Implementar somente em ambiente clínico seguro |
| ASQ Toolkit / PHQ-A+ASQ | Segurança em saúde mental | Link oficial + alerta de fluxo | Não aplicar publicamente; exige plano para resultado positivo |
| Columbia Protocol / C-SSRS | Segurança em saúde mental | Link oficial + alerta de fluxo | Não aplicar publicamente; exige triagem e conduta definida |
| M-CHAT-R/F | TEA precoce | Somente fonte oficial | Não incorporar em app público sem licença |
| SDQ | Comportamento e saúde mental | Somente fonte oficial | Não construir versão eletrônica sem autorização |
| PHQ/GAD Screeners | Humor e ansiedade | Termos a verificar | Confirmar permissão eletrônica para adolescente |
| RCADS | Ansiedade e depressão | Termos a verificar | Confirmar termos e tradução antes de integrar |
| PSWQ-C | Preocupação/ansiedade | Termos a verificar | Confirmar termos antes de integrar |
| My Thoughts about Therapy | Engajamento | Termos a verificar | Confirmar termos antes de integrar |
| SWYC / PPSC / POSI / BPSC | Primeira infância | Termos a verificar | Confirmar redistribuição eletrônica e idioma |
| NICHQ Vanderbilt | TDAH | Termos a verificar | Confirmar direitos de reprodução e versão pt-BR |
| GMFCS-E&R | Paralisia cerebral | Termos a verificar | Incorporar apenas após confirmação de uso/idioma |
| CDC Developmental Milestones | Vigilância do desenvolvimento | Link oficial educativo | Não tratar como escala diagnóstica |

## Permissões já suficientemente claras para catalogação qualificada

### PSC — Massachusetts General Hospital

A fonte oficial oferece os formulários PSC, Y-PSC, PSC-17 e PSC-17-Y, incluindo versão `Portuguese (Brazilian-American)`. A página descreve aplicação por papel, formulários eletrônicos e portais associados ao prontuário, além de informar que o instrumento é de rastreio e não produz diagnóstico específico.

**Decisão no app:** disponibilizar o link oficial e preparar integração futura apenas após confirmação de redistribuição no produto público ou implantação em área privada autorizada.

### CRAFFT — Boston Children's Hospital

A página oficial declara que a ferramenta é gratuita, está disponível para autorrelato e aplicação pelo profissional, em vários idiomas, e pode ser reproduzida para as necessidades da prática, inclusive integrada ao prontuário eletrônico.

**Decisão no app:** candidato prioritário para próxima integração privada preenchível, com preservação da redação original, atribuição e fluxo clínico apropriado.

### ASQ — NIMH

O NIMH informa que o ASQ é gratuito, disponível em múltiplos idiomas, destinado a pacientes a partir de 8 anos em cenários médicos e associado a vias clínicas para resultados positivos. Também oferece materiais combinados PHQ-A/ASQ.

**Decisão no app:** permanecer como link oficial nesta etapa. Integração preenchível somente em ambiente profissional seguro, com avaliação breve de segurança e encaminhamento configurados.

### Columbia Protocol / C-SSRS

O Columbia Lighthouse Project informa que o protocolo e seu treinamento estão disponíveis sem custo para saúde e comunidade, com versões em múltiplos idiomas e aplicação vinculada à determinação de próximos passos.

**Decisão no app:** link oficial e informação clínica; não implementar coleta pública de respostas de risco.

## Implementação nesta branch

Arquivos adicionados:

- `official-free-instruments-data.js` — registro de fontes, status, domínio e permissão;
- `escalas-oficiais-gratuitas.html` — biblioteca navegável, com busca e filtro por área.

Arquivos alterados:

- `routes.config.js` — registra a nova rota pública;
- `escalas.html` — inclui card e botão para a biblioteca oficial.

## Próximo lote recomendado

1. Revisar licença formal e tradução de PSC e CRAFFT para uso interno em pt-BR.
2. Criar módulo privado para CRAFFT, sem salvar dados em ambiente público.
3. Inserir classificações funcionais neuropediátricas com permissão confirmada: GMFCS-E&R, MACS, Mini-MACS, CFCS e EDACS.
4. Avaliar SWYC/POSI/PPSC/BPSC para primeira infância.
5. Manter M-CHAT-R/F e SDQ somente como acesso oficial até licença expressa para aplicação eletrônica.
