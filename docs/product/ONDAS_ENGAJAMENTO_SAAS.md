# Ondas de engajamento — roteiro de execução

Status em 22/10/2026. Origem: diagnóstico de engajamento e funcionalidades
sugeridas (dez itens). Este documento organiza os dez itens em cinco ondas,
com gate de entrada, gate de saída e critério de aceite. Cada onda vira uma
ou mais PRs pequenas por domínio (AGENTS.md, "Política de PRs").

## Regras que valem para todas as ondas

- Nenhuma onda grava dado clínico de criança no servidor antes do #514
  (criptografia em repouso dos dados clínicos). Até lá, o que fica fora do
  servidor fica no aparelho, cifrado.
- Nenhuma onda cria norma, escore, ponto de corte ou classificação
  (AGENTS.md, "Verdade clínica").
- Nenhuma onda cobra, envia e-mail ou WhatsApp real sem o gate externo
  correspondente aprovado.

## Achados de base que condicionam o roteiro

1. **Diários inacessíveis ao pai em produção.** As rotas dos diários estão
   fora da allowlist pública (`getAccessLevel` trata como clínica qualquer rota
   fora de `client/src/lib/publicRoutes.ts`). Em modo remoto, sem sessão, o
   pai cai no login. Com sessão, o `DiarioClinico` bloqueia a gravação local
   por política. O diário, como está, só funciona no aparelho da clínica
   com PIN local.
2. **Marcos tinham padrão de "atingido" e dois cortes inventados.** Todos os
   marcos vinham marcados por padrão; havia alerta com "2 ou mais" e outro com
   "4 ou mais". Ambos violam AGENTS.md. Corrigido na onda 1.
3. **Não há papel de escola no modelo de acesso.** `shared/clinic-roles.ts`
   não tem papel para escola. Só existem tipos de evento escolar.

## Onda 1 — Hábito e isca sem servidor

**Itens:** 10 (checklist de marcos, parte sem captura) e 1 (check-in "Hoje",
versão só no aparelho).

**Entregue (local, não commitado):**
- Marcos: cada marco recebe "Sim", "Ainda não" ou "Não sei". Sem resposta não
  conta como atingido. Não há pontuação, nem limiar. Alerta único: "leve esta
  lista ao pediatra". Respostas preservadas ao trocar de idade (estado subiu
  para a página). Nada é salvo nem enviado.
- `/hoje`: check-in diário de três perguntas mais texto opcional (até 280
  caracteres), um registro por data, cofre local cifrado (`diario:hoje:v1`),
  janela de 7 dias sem pontuação. Sem chamada de rede. Em sessão remota
  autenticada, falha fechado, como o diário. Gate: login ou PIN.

**Não entregue, de propósito:** captura de e-mail (exige consentimento e
Resend), acesso da família ao check-in (decisão abaixo).

**Aceite verificado:** `tsc` sem erro; `lint --max-warnings=0` nos arquivos
tocados; 18 testes unitários novos; `validate:public`, guarda de navegação e
guarda de política de acesso aprovados; build do cliente; navegador em
390px com 11 de 11 verificações (o único 404 é `/api/health`, ausente no
preview estático).

## Onda 2 — Metas e programa com conteúdo revisado

**Itens:** 4 (metas da semana, por criança) e 5 (programa guiado em módulos).

**Gate de entrada:** revisão clínica do conteúdo, com fonte primária citada
para cada afirmação. Decisão do autor sobre o formato dos módulos.

**Gate de saída:** cada módulo com fonte; nenhum efeito quantitativo que não
esteja na fonte original; progresso de meta rotulado como registro familiar,
nunca como instrumento.

**Aceite:** metas e módulos funcionam sem servidor, no aparelho, com o mesmo
cofre da onda 1.

## Onda 3 — Servidor e compartilhamento

**Itens:** 1 (migrar o Hoje para o tenant), 6 (resumo para a consulta por
link), 2 (lembretes).

**Gates:** #514 concluído; B7 (revisão jurídica de Política e Termos) e B10
(consentimento específico para dado sensível) fechados. Lembretes por
e-mail exigem o Resend operacional. Lembretes por WhatsApp exigem canal
homologado (decisão sua).

**Aceite:** o dado sai do aparelho somente com consentimento registrado; o
link reutiliza o portal familiar já existente (consentimento, expiração,
limite de visualizações, auditoria); lembrete sem conteúdo clínico.

**Evidência que sustenta os lembretes:** em um RCT pediátrico, somar SMS ao
lembrete de voz reduziu faltas de 38,1% para 23,5%, em um único centro
([Lin et al., 2016](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5227159/)).
Um RCT odontológico encontrou o contrário. Medir na própria clínica antes de
vender o ganho.

## Onda 4 — Escola e prescrição

**Itens:** 3 (papel escola) e 8 (missões prescritas no Arena).

**Gates:** papel de escola modelado no tenant, com permissões próprias; parecer
sobre dados de menores, incluindo o artigo 20 do ECA Digital (Lei 15.211/2025),
conferido na fonte primária no Planalto; decisão sobre o que a escola recebe.

**Aceite:** a escola nunca vê dado clínico bruto, só o plano autorizado pela
família; missões sem caixa de recompensa, sem moeda comprável e sem chat; o
Arena não faz alegação terapêutica.

## Onda 5 — Monetização e diferencial

**Itens:** 9 (planos de dois lados) e 7 (vídeo guiado de observação).

**Gates:** 10 entrevistas registradas em `docs/saas/gtm/INTERVIEW_LOG.md`
(hoje vazio); pilotos pagos para escolher preço; Asaas operacional em ambiente
autorizado; parecer de software como dispositivo médico para o vídeo, pelas
RDC 657/2022 e 751/2022 da Anvisa.

**Aceite:** preço não muda sem decisão sua; o vídeo fica como captura com
revisão humana, sem classificação automática, até o parecer regulatório.

## Decisões tomadas nesta onda (reversíveis)

1. Marcos passa a começar sem resposta, e os cortes de 2 e 4 saem.
2. `/hoje` fica atrás de login ou PIN, como os diários.
3. As respostas dos marcos não são persistidas.
4. Os dois testes novos entram em `test:quick-wins`.

## Decisão que é sua

**Acesso da família ao check-in.** Hoje a família não consegue usar o `/hoje`
nem o diário em produção. Opções:

- **(a) Manter clínico até a onda 3.** Recomendado. Dado de saúde de criança
  não deve estar numa zona pública, e a própria política do repositório diz
  que rota sensível não entra na allowlist.
- **(b) Incluir `/hoje` na allowlist pública**, com armazenamento só no
  aparelho. Exige revisão LGPD (B7 e B10) e quebra a regra atual de que dado
  de saúde nunca fica público. Também exige ajustar a política dos diários.

## Limites desta etapa

- Verificação feita com build local e backend ausente. Nada foi publicado.
- Nada foi commitado nem enviado; não há PR, porque não foi pedida.
- A revisão adversarial da onda 1 cobre código e testes, não o comportamento
  em produção.
