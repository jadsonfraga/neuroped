# Briefing para revisão jurídica (G6) — Ciclo 7

Para entregar a um advogado de saúde digital/LGPD. Não é parecer jurídico: as referências
normativas abaixo vêm da memória do engenheiro-assistente e das fontes já citadas no repositório;
TODAS precisam de confirmação do advogado. Sem dado de paciente neste material.

## 1. O produto em 5 linhas
SaaS B2B multi-clínica (R$/assento/mês, trial 14 dias) para neurodesenvolvimento infantil:
agenda e pedido de horário pela família, escalas respondidas de casa, prontuário e documentos
clínicos (PDF), equipe com papéis. Dado tratado: saúde (sensível) de crianças e adolescentes,
contatos de responsáveis, dados de profissionais e de cobrança. O produto não emite diagnóstico.

## 2. Fatos do repositório que o advogado deve ver
- Termos atuais (`client/src/pages/termos.tsx`) descrevem o app como **educativo, "não é
  dispositivo médico, não estabelece relação médico-paciente"**. Isso não é um contrato de SaaS
  clínico e contradiz o uso B2B com prontuário.
- Retenção × eliminação de prontuário em aberto: `docs/audits/LEGAL_REVIEW_REQUIRED_CLINICAL_RETENTION_FLOOR_2026-09-27.md`.
- Subprocessadores evidenciados no código: Cloudflare (Pages/D1; R2 e Workers AI planejados),
  Resend (e-mail), Asaas (cobrança), Google Gemini (integração de vídeo OBS60; confirmar se ativa).
- Documentos clínicos: `docs/AUDITORIA_REGULATORIA_C1_2026-08-19.md` (receita C1, CFM 2.381/2024).
- Direitos do titular, consentimentos e DPO: `docs/COMPLIANCE_LGPD.md` registra "revisão jurídica
  formal não foi realizada".

## 3. Perguntas (P1 = antes do 1º terceiro pagante; P2 = antes de escalar)

**P1-1 Papéis.** A clínica cliente é controladora e o NeuroPed é operador (LGPD art. 5º, VI e VII)?
Em quais tratamentos o NeuroPed seria controlador (cobrança, contas, métricas)? Quem é a pessoa
jurídica contratante (CNPJ ou o médico como pessoa física)? Impacto em responsabilidade.

**P1-2 Contrato de assinatura e DPA.** Redigir Termos de Serviço B2B e Acordo de Tratamento de
Dados: objeto, preço/trial/cancelamento, SLA, responsabilidade civil, limitação de responsabilidade,
foro, obrigações da clínica (base legal, consentimento dos responsáveis, uso por profissionais
habilitados), instruções de tratamento, auditoria, devolução/eliminação ao fim do contrato.

**P1-3 Política de Privacidade.** Há política dedicada e atual? Quais bases legais (art. 7º e 11,
inclusive tutela da saúde) e como tratar consentimento de responsáveis por menores (art. 14).

**P1-4 Retenção do prontuário.** A eliminação a pedido do titular deve ser recusada com base em
obrigação legal de guarda (art. 16, II; Lei 13.787/2018; resoluções do CFM; outros conselhos)?
Prazo mínimo, exceções e registros de outras profissões (psicologia, fonoaudiologia, TO).

**P1-5 Subprocessadores e transferência internacional.** Cláusulas e base para Cloudflare, Resend,
Asaas e Gemini (art. 33). Como comunicar subprocessadores às clínicas.

**P1-6 Encarregado (DPO).** Quem exerce a função, como divulgar o canal (art. 41) e se o porte
permite tratamento simplificado (regulamento da ANPD para agentes de pequeno porte — confirmar
número e aplicabilidade).

**P1-7 Incidentes.** Procedimento e prazo de comunicação à ANPD e aos titulares (regulamento
específico da ANPD — confirmar prazo vigente) e quem comunica quando o NeuroPed é operador.

**P2-8 Software como dispositivo médico.** Escalas pontuadas, sugestões de instrumento ("filtro
inteligente") e rascunho por IA (escuta clínica) podem enquadrar o produto como software com
finalidade médica perante a Anvisa (RDC sobre software como dispositivo médico — confirmar
número)? Que salvaguardas e declarações de finalidade são necessárias.

**P2-9 Publicidade médica.** Limites do CFM para o site, `/planos`, convites e conteúdo para
captar clínicas e pacientes (resolução vigente de publicidade médica — confirmar). Rascunho de
ajuste em `PLANOS_COPY_D004.md`.

**P2-10 Instrumentos licenciados.** Escalas/testes de terceiros: o produto pode exibi-las, pontuá-las
ou redistribuí-las a clínicas assinantes? O repositório já impede norma/ponto de corte oficial
sem licença; confirmar o risco de direitos autorais ao operar como SaaS.

**P2-11 Assinatura e documentos.** Validade de laudos, receitas e atestados eletrônicos (ICP-Brasil
e CFM 2.381/2024, citada no repositório); responsabilidade do emissor × da plataforma.

## 4. O que enviar ao advogado (sem PHI)
Este briefing; `termos.tsx` e `lgpd-consent.tsx` (textos); `COMPLIANCE_LGPD.md`;
`LEGAL_REVIEW_REQUIRED_CLINICAL_RETENTION_FLOOR_2026-09-27.md`; `PLANOS_COPY_D004.md`;
lista de subprocessadores acima.

## 5. Critério de conclusão do G6
Parecer escrito do advogado cobrindo P1-1 a P1-7, Termos B2B e DPA em versão final, textos
públicos atualizados e uma versão/data registrada em DECISIONS.md.
