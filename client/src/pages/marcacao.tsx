import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  HelpCircle,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  BoaConsultaScheduleGateway,
  BOACONSULTA_PROFILE_URL,
} from "@/components/BoaConsultaScheduleWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AssistantIntent = "start" | "booking" | "manage" | "questions";

function whatsappUrl(message: string) {
  return `https://wa.me/5587991055790?text=${encodeURIComponent(message)}`;
}

const SECRETARIA_WHATSAPP_URL = whatsappUrl(
  "Olá, gostaria de falar com a secretaria sobre o processo de agendamento.",
);
const MANAGE_WHATSAPP_URL = whatsappUrl(
  "Olá, gostaria de remarcar ou cancelar uma solicitação feita no BoaConsulta.",
);
const BOOKING_WHATSAPP_URL = whatsappUrl(
  "Olá, fiz uma solicitação de pré-agendamento no BoaConsulta. Gostaria de receber as instruções para a caução de R$ 150 e a conferência do horário pela secretaria.",
);

const appointmentTimes = ["09:30", "10:30", "11:30", "12:30", "13:30"];

const trustCards = [
  {
    icon: ShieldCheck,
    title: "Privacidade",
    description:
      "Não coletamos história clínica, documentos ou texto livre nesta porta administrativa.",
  },
  {
    icon: CheckCircle2,
    title: "Fonte única",
    description:
      "Disponibilidade e ocupação são controladas pelo perfil oficial do BoaConsulta.",
  },
  {
    icon: MessageCircle,
    title: "Canal verificado",
    description:
      "Assuntos de caução e confirmação são tratados apenas pelo WhatsApp informado nesta página.",
  },
];

/** Porta administrativa guiada: não recebe texto livre, sintomas ou documentos clínicos. */
export default function MarcacaoPage() {
  const [intent, setIntent] = useState<AssistantIntent>("start");

  const scrollToSchedule = () => {
    document
      .getElementById("agenda-boaconsulta")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-rose-900/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <img
                alt="Marca Dr. Jadson Fraga"
                className="h-14 w-14 object-contain"
                src="/dr-jadson-shield-logo.svg"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                  NeuroPed SDG
                </p>
                <p className="text-sm font-semibold text-slate-200">
                  Dr. Jadson Fraga · Neuropediatra
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-white/5 px-3 py-1.5 text-xs font-semibold text-amber-200">
              <Sparkles className="h-3.5 w-3.5" /> Secretária IA · agenda
              oficial BoaConsulta
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Seu pré-agendamento, simples e acompanhado.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Escolha um dos cinco horários de segunda a sexta. A secretaria
              confere a caução de R$ 150 antes de confirmar efetivamente a
              consulta.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                className="h-12 gap-2 bg-amber-300 px-5 font-black text-amber-950 hover:bg-amber-200"
                onClick={scrollToSchedule}
              >
                Ver horários <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                asChild
                className="h-12 gap-2 border-white/25 bg-white/5 px-5 text-white hover:bg-white/10"
                variant="outline"
              >
                <a
                  href={SECRETARIA_WHATSAPP_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Falar com a secretaria <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-amber-300" /> Perfil Premium
                BoaConsulta
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-300" /> Sem relato
                clínico nesta página
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div
              aria-hidden="true"
              className="absolute inset-5 rounded-full bg-amber-300/15 blur-2xl"
            />
            <img
              alt="Mascote NeuroPed com escudo de proteção"
              className="relative mx-auto max-h-80 w-full object-contain drop-shadow-2xl"
              src="/neuroped-mascot-premium.webp"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section
          aria-label="Condições do agendamento"
          className="grid gap-4 md:grid-cols-3"
        >
          <Card className="border-amber-300/60 bg-white shadow-sm dark:bg-slate-950">
            <CardContent className="p-5">
              <CalendarClock className="h-6 w-6 text-rose-900 dark:text-amber-300" />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Agenda
              </p>
              <h2 className="mt-1 text-lg font-black">
                5 pacientes por dia útil
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Segunda a sexta, exceto feriados nacionais.
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-300/60 bg-white shadow-sm dark:bg-slate-950">
            <CardContent className="p-5">
              <Clock3 className="h-6 w-6 text-rose-900 dark:text-amber-300" />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Duração
              </p>
              <h2 className="mt-1 text-lg font-black">1 hora por consulta</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {appointmentTimes.map((time) => (
                  <span
                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800"
                    key={time}
                  >
                    {time}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-300/60 bg-white shadow-sm dark:bg-slate-950">
            <CardContent className="p-5">
              <CircleDollarSign className="h-6 w-6 text-rose-900 dark:text-amber-300" />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Consulta particular
              </p>
              <h2 className="mt-1 text-lg font-black">
                Valor atualizado no BoaConsulta
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Consulte o valor exibido no perfil oficial. A caução obrigatória
                é de R$ 150 e é conferida pela secretaria.
              </p>
            </CardContent>
          </Card>
        </section>

        <section
          className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
          aria-labelledby="secretaria-ia-title"
        >
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="bg-gradient-to-r from-rose-900 to-rose-950 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Sparkles className="h-5 w-5 text-amber-200" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">
                    Assistente administrativa
                  </p>
                  <h2 className="text-xl font-black" id="secretaria-ia-title">
                    Como posso ajudar?
                  </h2>
                </div>
              </div>
            </div>
            <CardContent className="space-y-4 p-5">
              <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Olá! Este atendimento é guiado e exclusivamente administrativo.
                Escolha uma opção — não envie sintomas, diagnósticos, exames ou
                medicamentos.
              </div>

              <div className="grid gap-2">
                <button
                  aria-pressed={intent === "booking"}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-left text-sm font-bold transition hover:border-rose-900/50 hover:bg-rose-900/5 dark:border-slate-700"
                  onClick={() => setIntent("booking")}
                  type="button"
                >
                  Agendar uma consulta <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  aria-pressed={intent === "manage"}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-left text-sm font-bold transition hover:border-rose-900/50 hover:bg-rose-900/5 dark:border-slate-700"
                  onClick={() => setIntent("manage")}
                  type="button"
                >
                  Remarcar ou cancelar <CalendarClock className="h-4 w-4" />
                </button>
                <button
                  aria-pressed={intent === "questions"}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-left text-sm font-bold transition hover:border-rose-900/50 hover:bg-rose-900/5 dark:border-slate-700"
                  onClick={() => setIntent("questions")}
                  type="button"
                >
                  Dúvidas sobre caução <HelpCircle className="h-4 w-4" />
                </button>
              </div>

              {intent !== "start" && (
                <div
                  aria-live="polite"
                  className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-amber-100 p-4 text-sm leading-6 text-slate-800 dark:bg-rose-950 dark:text-slate-100"
                >
                  {intent === "booking" && (
                    <>
                      <p>
                        Escolha abaixo um horário livre no BoaConsulta. Depois,
                        avise a secretaria para receber as instruções da caução.
                      </p>
                      <Button
                        className="mt-3 gap-2 bg-rose-900 text-white hover:bg-rose-950"
                        onClick={scrollToSchedule}
                        size="sm"
                      >
                        Ir para a agenda <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {intent === "manage" && (
                    <>
                      <p>
                        Use o e-mail enviado pelo BoaConsulta para gerenciar a
                        solicitação ou fale com a secretaria de agendamento.
                      </p>
                      <Button
                        asChild
                        className="mt-3 gap-2"
                        size="sm"
                        variant="outline"
                      >
                        <a
                          href={MANAGE_WHATSAPP_URL}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Abrir WhatsApp <MessageCircle className="h-4 w-4" />
                        </a>
                      </Button>
                    </>
                  )}
                  {intent === "questions" && (
                    <p>
                      A caução é de R$ 150 e é obrigatória. A secretaria envia
                      as instruções pelo canal oficial e só confirma o horário
                      depois de conferir o pagamento.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-rose-900/25 bg-amber-50 shadow-sm dark:border-amber-300/25 dark:bg-slate-950">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-6 w-6 shrink-0 text-rose-900 dark:text-amber-300" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-900 dark:text-amber-300">
                    Confirmação em duas etapas
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">
                    A escolha online ainda é um pré-agendamento.
                  </h2>
                </div>
              </div>

              <ol className="mt-6 space-y-4">
                {[
                  [
                    "1",
                    "Escolha o horário",
                    "A disponibilidade exibida vem diretamente do perfil oficial no BoaConsulta.",
                  ],
                  [
                    "2",
                    "Avise a secretaria",
                    "Use o WhatsApp Agendamento (Dr. Jadson Fraga): (87) 99105-5790.",
                  ],
                  [
                    "3",
                    "Receba as instruções",
                    "A secretaria orienta o pagamento da caução obrigatória de R$ 150 pelo canal oficial.",
                  ],
                  [
                    "4",
                    "Aguarde a conferência",
                    "A consulta só fica efetivamente confirmada após a validação da caução pela secretaria.",
                  ],
                ].map(([number, title, description]) => (
                  <li className="flex gap-3" key={number}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-900 text-sm font-black text-white">
                      {number}
                    </span>
                    <div>
                      <h3 className="font-black">{title}</h3>
                      <p className="mt-0.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <Button
                asChild
                className="mt-6 h-12 w-full gap-2 bg-emerald-800 font-black text-white hover:bg-emerald-900"
              >
                <a
                  href={BOOKING_WHATSAPP_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Já solicitei: avisar a secretaria{" "}
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section
          className="scroll-mt-6 space-y-5"
          id="agenda-boaconsulta"
          aria-labelledby="agenda-title"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-900 dark:text-amber-300">
                Agenda oficial
              </p>
              <h2
                className="mt-1 text-3xl font-black tracking-tight"
                id="agenda-title"
              >
                Escolha um horário no BoaConsulta
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Horários ocupados deixam de aparecer automaticamente. Feriados
                nacionais permanecem bloqueados.
              </p>
            </div>
            <Button asChild className="gap-2" variant="outline">
              <a
                href={BOACONSULTA_PROFILE_URL}
                rel="noreferrer"
                target="_blank"
              >
                Abrir perfil oficial <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <BoaConsultaScheduleGateway />

          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
            <strong>Importante:</strong> a mensagem automática do BoaConsulta
            registra a solicitação, mas não substitui a confirmação da
            secretaria. Não considere a consulta confirmada antes da conferência
            da caução.
          </div>
        </section>

        <section
          className="grid gap-4 sm:grid-cols-3"
          aria-label="Segurança e confiança"
        >
          {trustCards.map(({ icon: Icon, title, description }) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
              key={title}
            >
              <Icon className="h-5 w-5 text-rose-900 dark:text-amber-300" />
              <h3 className="mt-3 font-black">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </div>
          ))}
        </section>

        <footer className="border-t border-slate-200 py-7 text-center text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <p className="font-bold text-slate-900 dark:text-white">
            Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756
          </p>
          <p>NeuroPed SDG · Petrolina-PE</p>
        </footer>
      </div>
    </main>
  );
}
