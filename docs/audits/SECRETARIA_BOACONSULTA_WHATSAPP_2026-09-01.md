# Auditoria — avisos de pré-agendamento por WhatsApp

Data: 2026-09-01
Escopo: Secretaria IA institucional × BoaConsulta

## Resultado

O perfil Premium oferece widget oficial, confirmação manual e integração com Google Calendar. A conta inspecionada não expõe webhook de novos agendamentos nem integração direta com WhatsApp.

Na configuração operacional do BoaConsulta foram validados:

- rotina de segunda a sexta, das 09:30 às 14:30, com duração de uma hora, de 31/08/2026 a 31/08/2027;
- preço particular de R$ 800, com pagamento no local e cartão BoaConsulta desligado;
- confirmação automática desligada para particular e convênio;
- um bloqueio para cada feriado nacional em dia útil dentro do período: 07/09/2026, 12/10/2026, 02/11/2026, 20/11/2026, 25/12/2026, 01/01/2027, 26/03/2027 e 21/04/2027.

Os bloqueios cobrem 08:00–14:30 na grade do BoaConsulta, abrangendo integralmente os cinco horários online de 09:30 a 13:30.

Por isso, o aviso automático para **Agendamento (Dr. Jadson Fraga), (87) 99105-5790**, com repetição a cada 30 minutos, não pode ser ativado de forma confiável apenas pelo frontend ou pelo widget.

## Entrega segura atual

- botão de WhatsApp após o pré-agendamento;
- mensagem administrativa pré-preenchida, sem dado clínico;
- confirmação automática do BoaConsulta mantida desligada;
- caução de R$ 150 explicitamente pendente de conferência da secretaria.

## Dependências externas para concluir a automação

- autorizar a sincronização com um Google Calendar operacional dedicado;
- provisionar WhatsApp Business Platform com `phone_number_id` e token guardados como secrets;
- aprovar o modelo de mensagem administrativa;
- definir o sinal de encerramento do reenvio: confirmação da caução ou reconhecimento explícito da secretaria;
- implantar fila durável e log idempotente no backend canônico.

Nenhuma credencial, chave Pix ou dado de paciente deve ser incluído no repositório.
