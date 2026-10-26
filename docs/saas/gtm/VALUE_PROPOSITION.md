# Proposta de valor (ICP decidido: NeuroPed Solo)

Estado: ICP decidido; dor e linguagem ainda serão validadas em 10 entrevistas Solo. Nada aqui
transforma capacidade testada em disponibilidade de produção.

## Frase única (rascunho v1)
"Para o neuropediatra que conduz o próprio consultório, o NeuroPed organiza agenda, escalas
com a família e documentação clínica num só fluxo, para reduzir papel, planilha e mensagem
solta, sem nunca fechar diagnóstico pelo profissional."

## Âncoras no produto real (verificáveis no repositório)
- Agenda própria e página pública de pedido de horário, remarcação e cancelamento pelo código da reserva (`/agendar`).
- Envio de escala/pré-consulta para a família responder de casa, sem conta, com trilha de auditoria.
- Documento PDF com identificação do consultório e isolamento por tenant.
- Preço: R$ 99/mês para um profissional, trial de 14 dias (`shared/billing.ts`).

## Limites que viram diferencial de confiança (já declarados em `planos.tsx`)
Não emite diagnóstico; não substitui julgamento; não envia WhatsApp/SMS/lembrete automático.

## Alertas de honestidade (não publicar antes de resolver)
1. **Produção:** Asaas, Resend, R2/LGPD, revisão jurídica, legado e smoke publicado continuam
   com validações externas próprias. Não divulgar recurso como ativo até a evidência do ambiente.
2. **Lembrete por WhatsApp** é uma ausência que o neuropediatra independente pode
   cobrar (falta/no-show). Hipótese H3 abaixo; só vira roadmap se as entrevistas confirmarem.

## Hipóteses a refutar ou confirmar
- H1: o problema nº 1 do ICP é a fragmentação entre agenda, escalas, registro e documento.
- H2: o decisor e usuário principal é o neuropediatra independente.
- H3: a falta de lembrete por WhatsApp é impeditiva para fechar.
- H4: R$ 99/mês para um profissional é aceitável; a faixa real é desconhecida.
