# Proposta de valor (ICP provisório A: clínica pequena de neurodesenvolvimento infantil)

Estado: HIPÓTESE a validar em entrevistas (INTERVIEW_PLAYBOOK.md). Nada aqui é claim público.

## Frase única (rascunho v1)
"Para clínicas pequenas de neurodesenvolvimento infantil, o NeuroPed junta agenda, coleta de
escalas com a família e documento clínico assinado num só fluxo, para a equipe parar de
espalhar o caso em papel, planilha e mensagem solta, sem nunca fechar diagnóstico por você."

## Âncoras no produto real (verificáveis no repositório)
- Agenda multiprofissional com uma recepção para vários profissionais (`docs/saas/MULTI_PROVIDER_AGENDA.md`).
- Página pública de pedido de horário, remarcação e cancelamento pelo código da reserva (`/agendar`).
- Envio de escala/pré-consulta para a família responder de casa, sem conta, com trilha de auditoria.
- Documento PDF com identificação da clínica; clínica isolada por tenant; papéis e assentos.
- Preço: R$ 99/assento/mês, trial de 14 dias (`shared/billing.ts`).

## Limites que viram diferencial de confiança (já declarados em `planos.tsx`)
Não emite diagnóstico; não substitui julgamento; não envia WhatsApp/SMS/lembrete automático.

## Alertas de honestidade (não publicar antes de resolver)
1. **Cifra clínica:** a página de planos descreve registro cifrado. Em produção a cripto clínica
   está NÃO configurada (audit Clinical/LGPD). Não divulgar essa promessa como ativa até o
   audit passar (`ready: true`). Publicidade médica (CFM) e LGPD tornam isso risco real.
2. **Lembrete por WhatsApp** é a ausência que um dono de clínica pequena mais provavelmente
   cobrará (falta/no-show). Hipótese H3 abaixo; só vira roadmap se as entrevistas confirmarem.

## Hipóteses a refutar ou confirmar
- H1: o problema nº 1 do ICP é fragmentação do caso entre profissionais (não é "falta de laudo").
- H2: o decisor de compra é o dono/coordenador da clínica, não o neuropediatra empregado.
- H3: a falta de lembrete por WhatsApp é impeditiva para fechar.
- H4: R$ 99/assento/mês é aceitável; a faixa de aceitação real é desconhecida.
