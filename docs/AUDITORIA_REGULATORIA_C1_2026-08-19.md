# Auditoria regulatória — Receita C1 e documentos clínicos

Data da verificação: 19/08/2026.

## Fontes consultadas

1. [Portaria SVS/MS nº 344/1998 — BVS/MS](https://bvsms.saude.gov.br/bvs/saudelegis/svs/1998/prt0344_12_05_1998_rep.html)
2. [Anvisa — Lista de substâncias sujeitas a controle especial no Brasil](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias), página modificada em 13/07/2026.
3. [Anvisa — Receituário Físico / SNCR](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/receituario-fisico), página modificada em 30/06/2026.

## Achados aplicados como requisitos de software

A Portaria 344/1998 distingue Notificação de Receita e Receita de Controle Especial. Para a Lista C1, o sistema não deve apresentar o documento como se fosse uma notificação colorida das listas A/B: o modelo deve ser tratado como Receita de Controle Especial, com campos e vias exigidos pelo modelo vigente.

A Anvisa informa que os modelos constantes dos anexos antigos da Portaria 344/1998 foram revogados. A página oficial do Receituário Físico informa que a Versão 2 dos modelos atuais é vigente e obrigatória para impressões realizadas a partir de 18/05/2026. Portanto, qualquer template antigo do app deve ser marcado como não validado para impressão e substituído/atualizado antes de uso operacional.

A Anvisa também mantém a lista sujeita a alterações periódicas. O app não deve validar a substância C1 por uma lista estática desatualizada, nem autorizar automaticamente uma prescrição só porque o usuário digitou o nome do medicamento. A validação deve ser informativa e exigir conferência profissional/da base oficial; a decisão de prescrever continua do médico habilitado.

## Salvaguardas necessárias

O fluxo deve exigir paciente vinculado, dados do prescritor e estabelecimento, medicamento/denominação, apresentação, quantidade, posologia, data e assinatura válida no documento final. O PDF gerado deve ser rascunho até que o profissional valide e assine conforme o meio aceito. O app não deve prometer conformidade regulatória automática.

A Receita C1 deve exibir um aviso de revisão normativa e indicar a data de vigência do template usado. O laudo deve permanecer como documento elaborado pelo médico, com identificação do paciente, data, finalidade, conteúdo clínico baseado em dados registrados e identificação profissional, sem gerar diagnóstico automático.

## Limitações da auditoria

A confirmação de aceitação pela farmácia, VISA local, SNCR e assinatura digital depende do contexto de emissão, do modelo vigente, do prescritor e das regras locais. Este arquivo é requisito de produto e não substitui validação pelo responsável técnico, conselho profissional e autoridade sanitária.

## Complemento profissional

4. [CFM Prescrição Eletrônica — validade das receitas](https://prescricaoeletronica.cfm.org.br/faq_farmaceuticos/validade-das-receitas/): informa validade de 30 dias para Receita de Controle Especial a partir da emissão e orienta que a farmácia não dispense após o vencimento.
5. [CFM — Resolução sobre documentos médicos](https://portal.cfm.org.br/noticias/cfm-atualiza-resolucao-que-regulamenta-emissao-de-atestado-medico/): resume a Resolução CFM nº 2.381/2024 e registra a necessidade de identificação do paciente, data, identificação/CRM/RQE do médico, contato e endereço profissional; para documento eletrônico, assinatura qualificada.

Essas fontes reforçam o bloqueio de impressão incompleta, a exibição de validade de 30 dias e a exigência de revisão/assinatura profissional antes do uso.
