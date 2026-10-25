# NeuroPed Solo — desenho do primeiro SaaS vendável

**Data:** 2026-10-25  
**Estado:** aguardando aprovação do proprietário  
**Decisão de produto:** Solo primeiro; Clínicas depois.

## Intenção

Transformar a experiência comercial existente do NeuroPed em uma oferta simples para o
neuropediatra que trabalha sozinho: cadastro próprio, avaliação por 14 dias, primeiro valor em
menos de 30 minutos e assinatura mensal sem intervenção manual do criador. O produto continua
tecnicamente multi-tenant; o lançamento apenas reduz posicionamento, navegação e suporte ao caso
de um profissional por consultório.

## Por que este caminho

O repositório já possui tenant, owner, onboarding persistido, cobrança Asaas, trial, isolamento,
auditoria e jornada de aceite. Construir outra aplicação ou remover a arquitetura de clínica
criaria risco sem reduzir o principal gargalo. O caminho mais curto é usar cada consultório solo
como um tenant com um owner e vender uma única oferta inicial.

## Objetivos

- Posicionar publicamente o NeuroPed para neuropediatras com consultório próprio.
- Oferecer um único produto visível: **NeuroPed Solo**, R$ 99/mês, 14 dias de avaliação.
- Levar cadastro confirmado a primeiro paciente e primeiro documento em menos de 30 minutos.
- Tornar a cobrança e o estado da assinatura verificáveis no servidor.
- Obter três pilotos pagos e ao menos duas segundas faturas antes de expandir para clínicas.
- Preservar integralmente isolamento de tenant, LGPD, auditoria e limites clínicos.

## Não objetivos desta etapa

- Lançar plano para clínicas, preço por equipe ou múltiplos tiers.
- Criar aplicativo móvel nativo, WhatsApp/SMS ou lembretes automáticos.
- Adicionar novas escalas, automação diagnóstica ou conduta clínica.
- Reescrever backend, trocar Cloudflare/D1 ou criar uma segunda fonte de verdade.
- Migrar ou apagar registros legados sem censo, backup restaurado e autorização explícita.

## Antiobjetivos

- Não anunciar como disponível aquilo que ainda estiver bloqueado em produção.
- Não usar configuração presente, teste local ou checkout criado como prova de pagamento real.
- Não permitir pacientes reais de terceiros antes dos gates LGPD, jurídico e recuperação.
- Não enfraquecer o fail-closed, o predicado final por tenant ou os testes clínicos.

## Abordagens consideradas

### A. Empacotar a plataforma existente como Solo — escolhida

Manter o tenant como “consultório”, usar um owner e uma assinatura de um profissional no fluxo
principal. Reposicionar telas públicas e simplificar o onboarding sem remover capacidades futuras.

**Vantagens:** menor delta, menor risco, aproveita código e testes existentes e preserva evolução
para clínicas. **Custo:** alguns conceitos internos continuam chamados `clinic` e o backend
multiassento permanece dormente por compatibilidade.

### B. Criar backend e plano exclusivos para Solo

Adicionar novo `plan_id`, novos limites e migrações agora. Produziria separação mais rígida, mas
tocaria billing, entitlements, triggers, convites e muitos testes sem benefício para validar a
primeira venda.

### C. Lançar diretamente para clínicas pequenas

Exploraria agenda multiprofissional e equipe, porém amplia onboarding, suporte, permissões,
contrato, decisão de compra e ciclo comercial. Não é o caminho mais fácil para a primeira receita.

## Oferta inicial

- **Nome público:** NeuroPed Solo.
- **Cliente:** neuropediatra com consultório próprio e operação individual.
- **Preço:** R$ 99 por mês para o profissional.
- **Avaliação:** 14 dias, mantendo o contrato canônico atual.
- **Promessa central:** organizar escalas, informações da família, registro e documento clínico em
  um fluxo único, sem fechar diagnóstico pelo médico.
- **Suporte inicial:** assíncrono e limitado ao uso do software; sem vender implantação ou
  consultoria clínica.

O identificador interno `saas-professional` permanece nesta etapa. A interface inicia checkout com
um assento e não oferece gestão de equipe como parte da oferta. O backend multiassento não é
removido nem reescrito; continua compatível com dados existentes e com a futura edição Clínica.

### Compatibilidade com consultórios existentes

Nenhuma conta existente perde assentos, membros, convites ou rotas. A comunicação pública e a
trilha primária de uma conta nova são Solo, mas um tenant que já tenha mais de um membro ativo ou
mais de um assento contratado mantém a navegação e a gestão de equipe atuais. O checkout Solo
inicia com um assento; o endpoint existente continua aceitando a quantidade necessária para
tenants legados, sempre cobrando por assento e nunca abaixo do número de membros ativos. Assim, a
primeira oferta comercial fica simples sem converter dados nem simular downgrade.

## Jornada do usuário

1. A página `/planos` apresenta apenas NeuroPed Solo, preço, trial, limites e capacidades reais.
2. O médico cria conta, aceita os documentos jurídicos vigentes e confirma o e-mail.
3. Cria “Meu consultório”; por baixo, isto cria o tenant e a membership `owner` existentes.
4. O onboarding mostra cinco marcos compreensíveis: conta, e-mail, consultório, primeiro paciente
   e primeiro documento. Os dez marcos server-side permanecem como evidência; passos técnicos ou
   futuros ficam fora da trilha principal.
5. O médico configura identificação profissional e dados mínimos do consultório.
6. Registra o primeiro paciente e conclui um documento usando o fluxo clínico já existente.
7. O sistema mostra dias restantes e leva ao checkout de um assento.
8. Só o webhook autenticado `charge_paid` ativa a assinatura paga e alimenta a métrica.

Estados externos indisponíveis devem produzir mensagem acionável, sem atalhos de e-mail, billing
ou entitlement. Após o trial, exportação e encerramento permanecem acessíveis conforme as regras
atuais.

## Mudanças de produto previstas

### Superfícies públicas

- Reescrever `/planos` de “para clínicas/equipes” para “para seu consultório”.
- Trocar “Plano profissional” por “NeuroPed Solo”.
- Retirar do destaque equipe, papéis, recepção compartilhada e preço por assento.
- Manter limitações explícitas: sem diagnóstico automático, WhatsApp/SMS ou promessa clínica.
- Só exibir claims de cifra, exportação e entrega que a auditoria publicada comprovar.

### Cadastro e onboarding

- Preservar `SAAS_SIGNUP_ENABLED` fechado por padrão.
- Ajustar a linguagem de “clínica” para “consultório” no caminho Solo, sem renomear schema.
- Manter confirmação de e-mail antes de criar o tenant.
- Projetar uma trilha visual Solo a partir dos fatos persistidos atuais; nenhuma etapa pode ser
  concluída por estado local ou redirect.
- Não semear prontuário fictício no ambiente clínico de produção.

### Cobrança

- Reutilizar Asaas, `CANONICAL_PRICE_CENTS`, `CANONICAL_TRIAL_DAYS` e o plan ID existente.
- O CTA Solo solicita um assento; o preço mostrado continua derivado do domínio de billing.
- Checkout criado, probe aceito e configuração presente não contam como receita.
- Cobrança comprovada exige `billing_invoice_events.kind = 'charge_paid'` com processamento
  concluído.

### Arquitetura futura

A futura edição Clínica poderá reexpor convites, papéis, recepção e quantidade de assentos. Ela não
faz parte do lançamento Solo e exigirá nova decisão de packaging; nenhuma estrutura multi-tenant é
apagada nesta etapa.

## Gates antes do primeiro terceiro pagante

Todos precisam ser revalidados no estado publicado; evidência histórica não basta.

1. Chaves clínicas configuradas e leitura/escrita cifrada comprovada.
2. R2/LGPD configurado e exportação real verificada sem PHI em logs.
3. Backup e restauração ensaiados com ciphertext real.
4. Registros legados legitimamente associados ou descartados com autorização e trilha.
5. Resend entregando confirmação de e-mail no domínio de produção.
6. Asaas sandbox exercitado ponta a ponta; depois, credencial de produção e webhook autenticado.
7. Termos B2B/Solo, Política de Privacidade, DPA aplicável, retenção e canal do encarregado
   revisados por advogado.
8. Smoke publicado: cadastro → e-mail → consultório → paciente → documento → checkout → webhook.
9. Cliente Zero concluído antes de convidar médico externo.

“Cliente Zero concluído” significa o roteiro de 14 dias da clínica do proprietário encerrado com:

- pré-condições G1/G3/G4, backup operacional e trial válido comprovados antes do dia 1;
- smoke sintético publicado verde nos dias 1–2;
- 14 dias sem incidente de isolamento ou cifra;
- pelo menos 8 dos 10 marcos server-side concluídos;
- primeiro documento em menos de 30 minutos, repetido em pelo menos três pacientes;
- decisão `go/no-go` registrada em `DECISIONS.md`, sem PHI;
- aceite final do proprietário. Falha de cifra/decifra, vazamento cross-tenant, perda documental ou
  divergência após restauração interrompe o roteiro e mantém o cadastro externo fechado.

## Métricas e critério de sucesso

- 25 convites individuais para entrevista/piloto.
- 10 entrevistas com neuropediatras individuais.
- Pelo menos 6 relatos espontâneos da dor central.
- 3 pilotos que aceitem pagar R$ 99/mês.
- Primeiro documento em menos de 30 minutos, sem intervenção do criador.
- Pelo menos 2 pilotos com segunda fatura `charge_paid`.

Se nenhuma pessoa aceitar piloto pago após dez entrevistas, pausar engenharia de produto e revisar
proposta de valor. Não confundir cadastro, checkout ou elogio com venda.

## Segurança, privacidade e clínica

- Fixtures e testes permanecem integralmente sintéticos.
- Nenhum PHI entra em analytics, logs, GitHub, e-mail operacional ou evidência de deploy.
- Toda rota clínica deriva tenant de sessão + membership persistida e repete `clinic_id` no SQL.
- O produto estrutura e registra; diagnóstico e conduta permanecem sob responsabilidade médica.
- Direitos LGPD só ficam `completed` depois do efeito físico comprovado.

## Verificação e aceite técnico

- Testes de contrato da página comercial impedem preço literal e claims não sustentados.
- Testes da jornada Solo cobrem signup fechado/aberto, confirmação de e-mail, tenant owner,
  onboarding derivado do servidor, checkout de um assento e webhook idempotente.
- Regressões multi-tenant continuam cobrindo anti-IDOR e isolamento entre dois consultórios.
- `npm run test:saas-self-service`, `npm run test:quick-wins`, `npm run check` e
  `npm run build:client` precisam terminar com exit 0.
- O smoke publicado e os gates externos geram evidência sem segredos nem dados clínicos.

## Rollback

As mudanças iniciais são de posicionamento, composição da jornada e defaults de UI. O rollback
restaura o copy e a navegação anteriores sem tocar em dados clínicos. Nenhuma migração destrutiva
faz parte deste desenho. Cadastro self-service pode ser fechado imediatamente por
`SAAS_SIGNUP_ENABLED=false`; billing e rotas clínicas continuam fail-closed.

## Chamadas deixadas ao implementador

- Reutilizar os componentes visuais e tokens existentes; não criar um segundo design system.
- Escolher a composição exata dos cinco marcos na UI sem alterar suas fontes server-side.
- Manter APIs e IDs internos compatíveis quando a mudança puder ser resolvida só na apresentação.
- Dividir a execução em PRs atômicas: posicionamento, onboarding Solo, billing/smoke e go-live.

