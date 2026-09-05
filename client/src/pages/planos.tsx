import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  FileLock2,
  Layers,
  LifeBuoy,
  Mail,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CANONICAL_PRICE_CENTS,
  CANONICAL_TRIAL_DAYS,
  POST_CANCEL_RETENTION_DAYS,
} from "@shared/billing";

/**
 * Página comercial pública do NeuroPed (Fase 6 — experiência SaaS).
 *
 * Antes desta página, um visitante não tinha COMO descobrir o preço: o funil
 * começava em /cadastro, que já pede nome e senha. Quem não conhecia o produto
 * não tinha nada para decidir.
 *
 * Duas regras que esta página não pode violar:
 *
 * 1. O preço vem do domínio (`shared/billing.ts`), NUNCA de um literal aqui.
 *    Preço duplicado é preço que diverge do que o checkout cobra. A regressão
 *    `tests/unit/planos-page-contract.test.mjs` falha se um número aparecer
 *    escrito à mão nesta tela.
 * 2. Só entra aqui capacidade que existe no produto hoje. Vender função que
 *    não roda é o inverso da verdade clínica que o resto do repositório
 *    protege — e a conta chega no primeiro cliente que tentar usar.
 */

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

/** Preço mensal por profissional, derivado do domínio de billing. */
const MONTHLY_PRICE = priceFormatter.format(CANONICAL_PRICE_CENTS / 100);

/** Capacidades que o produto realmente executa hoje. */
const INCLUDED = [
  {
    icon: Layers,
    title: "Clínica isolada por padrão",
    body:
      "Cada clínica é um tenant próprio. Pacientes, documentos e escalas de uma clínica não são alcançáveis por outra — o isolamento é decidido no servidor, a partir do vínculo do usuário, e não do que o navegador envia.",
  },
  {
    icon: Users,
    title: "Equipe com papéis e assentos",
    body:
      "Convide profissionais por e-mail, defina o papel de cada um, revogue o convite ou remova o acesso. O teto de assentos da assinatura é aplicado no servidor, não na tela.",
  },
  {
    icon: Mail,
    title: "Escalas respondidas pela família",
    body:
      "Envie um convite para a família responder de casa, sem criar conta. A resposta volta para o prontuário da clínica com trilha de auditoria do envio, e a pontuação continua sendo lida pelo profissional.",
  },
  {
    icon: FileLock2,
    title: "Documentos e prontuário cifrados",
    body:
      "O conteúdo clínico do NeuroPed LIVE é cifrado no servidor e emitido em documentos PDF com identificação da clínica. O navegador não guarda dado clínico identificável.",
  },
  {
    icon: ShieldCheck,
    title: "LGPD executável, não declarativa",
    body:
      "Consentimentos versionados, trilha de auditoria das operações e pedidos de exportação e de eliminação atendidos pelo próprio sistema — com retenção e bloqueio legal respeitados.",
  },
  {
    icon: LifeBuoy,
    title: "Encerramento sem refém",
    body:
      `Cancele a assinatura e solicite o encerramento pelo painel. Há uma janela para desistir, e os dados permanecem recuperáveis por ${POST_CANCEL_RETENTION_DAYS} dias antes da eliminação definitiva.`,
  },
];

/** O que o produto NÃO faz — a mesma honestidade das telas clínicas. */
const NOT_INCLUDED = [
  "Não emite diagnóstico. Nenhuma escala do NeuroPed conclui um quadro clínico.",
  "Não substitui o julgamento profissional: instrumentos incompletos ou de aplicação assistida são rotulados como tal, e não se apresentam como versão oficial.",
  "Não vende consultoria, implantação ou treinamento — a assinatura é só o software.",
];

export default function PlanosPage() {
  return (
    <div className="space-y-6 pb-12">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent p-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          NeuroPed para clínicas
        </span>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          O acompanhamento do neurodesenvolvimento organizado em um lugar só
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Para pediatras, neuropediatras e equipes multiprofissionais que hoje
          espalham escalas em papel, planilhas e mensagens soltas. O NeuroPed
          reúne a escolha do instrumento, a coleta com a família, o registro
          cifrado e o documento assinado no mesmo fluxo — com a clínica isolada
          e a trilha de auditoria que a LGPD exige.
        </p>
      </header>

      <Card className="border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Plano profissional
              </h2>
              <p className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground" data-testid="plan-price">
                  {MONTHLY_PRICE}
                </span>
                <span className="text-sm text-muted-foreground">
                  por profissional, por mês
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {CANONICAL_TRIAL_DAYS} dias de avaliação antes da primeira
                cobrança. Você paga pelos assentos que usar; adicionar ou
                remover profissionais muda o valor do ciclo seguinte.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href="/cadastro" data-testid="link-signup">
                  Criar conta e avaliar
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>

          <p className="mt-4 rounded-2xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            O cadastro self-service pode estar fechado nesta instalação. Se for
            o caso, a tela de cadastro diz isso na hora e o acesso continua
            possível por convite da clínica — nenhuma etapa exige intervenção
            manual no banco.
          </p>
        </CardContent>
      </Card>

      <section aria-labelledby="incluido">
        <h2 id="incluido" className="mb-3 text-lg font-bold text-foreground">
          O que está incluído
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {INCLUDED.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardContent className="p-5">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
            <XCircle className="h-4 w-4" aria-hidden="true" /> O que o plano não faz
          </h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {NOT_INCLUDED.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Segurança e privacidade
          </h2>
          <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            <li>
              • Autenticação com sessão revogável, rotação de refresh e detecção
              de reuso; recuperação de senha por link de uso único.
            </li>
            <li>
              • Autorização decidida no servidor a cada requisição — o que a tela
              esconde não é o que protege o dado.
            </li>
            <li>
              • Trilha de auditoria das operações sensíveis, sem conteúdo clínico
              nos metadados.
            </li>
            <li>
              • Direitos do titular (exportação e eliminação) atendidos pelo
              próprio sistema, com evidência de execução.
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Detalhes de uso e limites legais em{" "}
            <Link href="/termos" className="underline">
              Termos de uso
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
