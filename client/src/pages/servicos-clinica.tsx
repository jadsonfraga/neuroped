import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileCheck2,
  Home,
  Info,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mascote } from "@/components/Mascote";
import { drJadsonMasterShieldLogo } from "@/assets/drJadsonMasterShieldLogo";
import { useToast } from "@/hooks/use-toast";

const officialReferences = [
  {
    label: "Nesplora · referência oficial",
    href: "https://nesplora.com/en/neuropsychological-tests/adhd-assessment-tool/",
  },
  {
    label: "Unimed Vale do São Francisco · prestadores",
    href: "https://www.unimed.coop.br/site/web/valedosaofrancisco/prestadores",
  },
];

const nesploraAdvantages = [
  "Observa atenção, impulsividade e atividade motora em uma tarefa padronizada e envolvente.",
  "Ajuda a aproximar a investigação do cotidiano da criança, sem depender apenas de uma conversa ou questionário.",
  "Pode complementar história clínica, escalas, informações de família/escola e exame neuropediátrico.",
];

const nesploraLimits = [
  "Não confirma nem exclui TDAH sozinho; a conclusão precisa ser clínica e multidimensional.",
  "O resultado depende de idade, compreensão da tarefa, colaboração, contexto e interpretação especializada.",
  "A ferramenta oficial é apresentada para faixas etárias específicas; a indicação deve ser individualizada.",
];

const eegAdvantages = [
  "Registra atividade elétrica cerebral junto ao vídeo por período prolongado, aumentando a chance de documentar eventos.",
  "O formato domiciliar pode preservar rotinas e sono mais próximos do ambiente habitual da pessoa.",
  "Pode apoiar a caracterização de episódios paroxísticos quando há indicação médica e equipe habilitada.",
];

const eegLimits = [
  "Não substitui avaliação médica, nem transforma qualquer alteração do traçado em diagnóstico automático.",
  "A qualidade depende do preparo, posicionamento dos eletrodos, sinal, segurança e acompanhamento técnico.",
  "Cobertura, autorização, elegibilidade e disponibilidade devem ser confirmadas previamente com a operadora ou no atendimento particular.",
];

function EvidenceList({ items, negative = false }: { items: string[]; negative?: boolean }) {
  const Icon = negative ? XCircle : CheckCircle2;
  return (
    <ul className="space-y-2.5" aria-label={negative ? "Limitações" : "Vantagens"}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${negative ? "text-amber-600" : "text-emerald-600"}`} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ServiceHeader({ icon: Icon, eyebrow, title, description, accent }: {
  icon: typeof Activity;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant="outline" className="w-fit gap-1 border-primary/25 bg-primary/[0.05] text-primary">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Uso complementar
      </Badge>
    </div>
  );
}

export default function ServicosClinicaPage() {
  const { toast } = useToast();
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}#/servicos-clinica`
    : "https://neuroped.pages.dev/#/servicos-clinica";
  const shareText = "Conheça o NeuroPed e os serviços institucionais da Clínica Jadson Fraga: tecnologia, escuta clínica e cuidado responsável.";

  async function sharePage() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "NeuroPed · Clínica Jadson Fraga", text: shareText, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({ title: "Link copiado", description: "Você já pode compartilhar a apresentação." });
    } catch {
      toast({ title: "Compartilhamento cancelado", description: "O conteúdo continua disponível pelo link desta página." });
    }
  }

  async function copyPageLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copiado", description: "A página institucional foi copiada para a área de transferência." });
    } catch {
      toast({ title: "Não foi possível copiar o link", variant: "destructive" });
    }
  }

  return (
    <div className="proportion-safe-page space-y-7 pb-12" data-testid="servicos-clinica-page">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/[0.12] via-card to-chart-2/[0.12] p-5 shadow-[0_26px_70px_-40px_hsl(var(--primary)/0.75)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-chart-2/15 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5 border-primary/25 bg-primary/10 text-primary hover:bg-primary/15">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Clínica Jadson Fraga
              </Badge>
              <Badge variant="outline" className="border-chart-2/30 bg-chart-2/10 text-chart-2">Conheça o trabalho</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-4xl">Serviços que aproximam a avaliação da vida real.</h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Uma apresentação institucional do trabalho realizado na Clínica Jadson Fraga, com tecnologia, escuta clínica e cuidado para investigar sinais e sintomas com responsabilidade.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+5587991097371">
                <Button className="gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2 shadow-lg shadow-primary/20">
                  <Phone className="h-4 w-4" aria-hidden="true" /> Falar com a clínica
                </Button>
              </a>
              <Link href="/sobre">
                <Button variant="outline" className="gap-2 rounded-xl border-primary/25 bg-card/70">
                  Conhecer o Dr. Jadson <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Esta página é informativa. A indicação, interpretação e conduta pertencem à consulta e à equipe habilitada; nenhum serviço descrito aqui substitui avaliação clínica individual.
            </p>
          </div>
          <Mascote contexto="home" size="lg" fala="Tecnologia só faz sentido quando ajuda a compreender melhor cada criança e cada família." className="hidden lg:flex" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Pilares da Clínica Jadson Fraga">
        {[
          { icon: Stethoscope, title: "Escuta clínica", text: "História, contexto e funcionalidade vêm antes de qualquer resultado." },
          { icon: BrainCircuit, title: "Tecnologia com critério", text: "Ferramentas complementares ajudam a organizar hipóteses, não substituem o raciocínio clínico." },
          { icon: BadgeCheck, title: "Autoria e cuidado", text: "Conteúdo e fluxos do NeuroPed são desenvolvidos no trabalho autoral da clínica." },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title} className="border-primary/15 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="space-y-3 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h2 className="font-bold text-foreground">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="overflow-hidden border-chart-2/20 shadow-lg" id="nesplora">
        <div className="h-1.5 bg-gradient-to-r from-chart-2 via-primary to-chart-2" />
        <CardHeader className="p-5 pb-3 sm:p-7 sm:pb-4">
          <ServiceHeader
            icon={BrainCircuit}
            eyebrow="Avaliação atencional"
            title="Nesplora: investigar sinais em ambiente ecológico"
            description="O Nesplora pode ser utilizado como recurso complementar para observar atenção, impulsividade e atividade motora em uma tarefa imersiva. Na investigação de suspeita de TDAH, o resultado é integrado à história clínica, aos diferentes contextos de vida e às informações de família e escola."
            accent="from-chart-2 to-primary"
          />
        </CardHeader>
        <CardContent className="space-y-6 p-5 pt-2 sm:p-7 sm:pt-3">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.045] p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Vantagens potenciais</h3>
              <EvidenceList items={nesploraAdvantages} />
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.045] p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Info className="h-4 w-4 text-amber-600" /> Limitações e cuidados</h3>
              <EvidenceList items={nesploraLimits} negative />
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> A referência oficial descreve o Nesplora Attention Kids Aula para crianças e adolescentes de 6 a 16 anos. A indicação real depende da avaliação profissional e da disponibilidade do serviço.</p>
            <a href={officialReferences[0].href} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:underline">Fonte oficial <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/20 shadow-lg" id="video-eeg">
        <div className="h-1.5 bg-gradient-to-r from-primary via-chart-2 to-primary" />
        <CardHeader className="p-5 pb-3 sm:p-7 sm:pb-4">
          <ServiceHeader
            icon={Video}
            eyebrow="Neurofisiologia em casa"
            title="Vídeo-EEG domiciliar noturno prolongado"
            description="Registro prolongado de atividade elétrica cerebral associado a vídeo durante a noite, realizado em domicílio quando houver indicação e condições técnicas adequadas. O objetivo é documentar e caracterizar eventos para interpretação especializada."
            accent="from-primary to-chart-2"
          />
        </CardHeader>
        <CardContent className="space-y-6 p-5 pt-2 sm:p-7 sm:pt-3">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.045] p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Vantagens potenciais</h3>
              <EvidenceList items={eegAdvantages} />
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.045] p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Info className="h-4 w-4 text-amber-600" /> Limitações e cuidados</h3>
              <EvidenceList items={eegLimits} negative />
            </div>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-bold text-foreground">Sobre a Unimed Vale do São Francisco</p>
            <p className="mt-1">O serviço é informado pela clínica. Cobertura, credenciamento, autorização, elegibilidade e eventual coparticipação precisam ser confirmados previamente com a Unimed e com a equipe responsável pelo atendimento. Não trate esta página como autorização de cobertura.</p>
            <a href={officialReferences[1].href} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Consultar canal oficial da Unimed <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-sky-500/20 shadow-lg" id="eeg-particular">
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-chart-2 to-sky-500" />
        <CardHeader className="p-5 pb-3 sm:p-7 sm:pb-4">
          <ServiceHeader
            icon={Activity}
            eyebrow="Atendimento particular"
            title="EEG prolongado particular em domicílio"
            description="Uma alternativa domiciliar para registros prolongados quando a equipe médica indicar acompanhamento neurofisiológico fora do ambiente hospitalar, respeitando critérios técnicos, logísticos e de segurança."
            accent="from-sky-500 to-chart-2"
          />
        </CardHeader>
        <CardContent className="space-y-5 p-5 pt-2 sm:p-7 sm:pt-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Home, title: "Em casa", text: "Mais conforto para a rotina familiar quando o formato for adequado." },
              { icon: CalendarClock, title: "Com planejamento", text: "Preparo, instalação, acompanhamento e retirada são combinados antes." },
              { icon: FileCheck2, title: "Com laudo", text: "O registro deve ser interpretado e documentado por profissional habilitado." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.04] p-4">
                <Icon className="mb-3 h-5 w-5 text-sky-600" aria-hidden="true" />
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <p className="flex items-start gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> A realização depende de indicação, condições do domicílio, disponibilidade de equipe e avaliação de segurança. Em situações de urgência, procure um serviço de emergência.</p>
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <Card className="border-primary/15 shadow-sm">
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg"><CalendarClock className="h-5 w-5 text-primary" /> Como entrar em contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm leading-relaxed text-muted-foreground">A equipe orienta a indicação, o preparo, os detalhes técnicos e o próximo passo para cada família ou profissional.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <a href="tel:+5587991097371" className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-3 transition hover:-translate-y-0.5 hover:shadow-md"><Phone className="h-4 w-4 text-primary" aria-hidden="true" /><span><strong className="block text-sm text-foreground">Telefone</strong><span className="text-xs text-muted-foreground">(87) 99109-7371</span></span></a>
              <a href="mailto:drjadsonfraga@proton.me" className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-3 transition hover:-translate-y-0.5 hover:shadow-md"><Mail className="h-4 w-4 text-primary" aria-hidden="true" /><span><strong className="block text-sm text-foreground">E-mail institucional</strong><span className="text-xs text-muted-foreground">drjadsonfraga@proton.me</span></span></a>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Petrolina — PE · Clínica Jadson Fraga</p>
            <Link href="/sobre"><Button variant="outline" className="gap-2 rounded-xl">Ver apresentação profissional <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button></Link>
          </CardContent>
        </Card>
        <Card className="border-chart-2/20 bg-gradient-to-br from-chart-2/[0.09] to-primary/[0.06] shadow-sm">
          <CardContent className="flex h-full flex-col justify-between gap-5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <img src={drJadsonMasterShieldLogo} alt="Marca do Dr. Jadson Fraga" className="h-16 w-16 object-contain" />
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Presença profissional</p><h2 className="mt-1 text-lg font-bold text-foreground">Ciência, autoria e cuidado em um só lugar.</h2></div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">O NeuroPed é um projeto autoral desenvolvido a partir da prática da Clínica Jadson Fraga. Instagram, site, currículo, artigos e palestras podem ser adicionados aqui assim que os URLs oficiais forem confirmados.</p>
            <Link href="/sobre-neuroped"><Button className="w-fit gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">Conhecer a história do NeuroPed <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button></Link>
          </CardContent>
        </Card>
      </section>

      <Card className="border-primary/15 bg-gradient-to-r from-primary/[0.07] via-card to-chart-2/[0.07] shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Share2 className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h2 className="font-bold text-foreground">Divulgação responsável</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">Compartilhe esta apresentação com famílias, profissionais e parceiros. O conteúdo é informativo, gratuito e não substitui consulta.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="gap-2 rounded-xl" onClick={sharePage}><Share2 className="h-3.5 w-3.5" aria-hidden="true" /> Compartilhar</Button>
            <Button type="button" size="sm" variant="outline" className="gap-2 rounded-xl" onClick={copyPageLink}><Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar link</Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`} target="_blank" rel="noreferrer">
              <Button type="button" size="sm" variant="outline" className="rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10">WhatsApp</Button>
            </a>
            <a href={`mailto:?subject=${encodeURIComponent("NeuroPed · Clínica Jadson Fraga")}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}>
              <Button type="button" size="sm" variant="outline" className="rounded-xl">E-mail</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <footer className="space-y-2 border-t border-border pt-5 text-[11px] leading-relaxed text-muted-foreground">
        <p>Conteúdo institucional da Clínica Jadson Fraga. O NeuroPed não substitui consulta, diagnóstico, prescrição ou atendimento de urgência.</p>
        <p>Fontes de referência: <a href={officialReferences[0].href} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Nesplora</a> · <a href={officialReferences[1].href} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Unimed Vale do São Francisco</a>.</p>
      </footer>
    </div>
  );
}
