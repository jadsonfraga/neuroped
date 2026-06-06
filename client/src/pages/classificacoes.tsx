import { BookOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function ClassificacoesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Classificações e Frameworks</h1>
          <p className="text-xs text-muted-foreground">
            Referências clínicas: ILAE 2017, FMS, CIF e GMFCS
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 p-4">
        <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
          Página de referência rápida para as principais classificações utilizadas em Neuropediatria.
          Expanda cada seção para ver os detalhes completos.
        </p>
      </div>

      <Accordion type="multiple" className="space-y-3">

        {/* ── ILAE 2017 ──────────────────────────────────────────────── */}
        <AccordionItem value="ilae" className="border border-card-border rounded-xl overflow-hidden" data-testid="acc-ilae">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/20 [&[data-state=open]]:bg-muted/20">
            <div className="flex items-center gap-3 text-left">
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs font-semibold px-2">ILAE 2017</Badge>
              <span className="text-sm font-semibold">Classificação de Crises Epilépticas</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                Proposta pela International League Against Epilepsy em 2017 (Fisher et al., Epilepsia 2017;58:522–530).
                Classifica as crises com base no local de início, nível de consciência e características motoras/não-motoras.
              </p>

              <div className="space-y-3">
                {/* Focal */}
                <div>
                  <h3 className="font-semibold text-foreground mb-1">1. Crises de Início Focal</h3>
                  <div className="ml-3 space-y-1">
                    <p className="text-muted-foreground">Consciência: <span className="font-medium text-foreground">Preservada</span> ou <span className="font-medium text-foreground">Comprometida</span></p>
                    <div className="ml-3">
                      <p className="font-medium text-foreground">A) Motor:</p>
                      <ul className="ml-4 list-disc space-y-0.5 text-muted-foreground">
                        <li>Automatismos</li>
                        <li>Atônica</li>
                        <li>Clônica</li>
                        <li>Espasmo epiléptico</li>
                        <li>Hipercinética</li>
                        <li>Mioclônica</li>
                        <li>Tônica</li>
                      </ul>
                      <p className="font-medium text-foreground mt-1">B) Não-Motor:</p>
                      <ul className="ml-4 list-disc space-y-0.5 text-muted-foreground">
                        <li>Autonômica</li>
                        <li>Parada comportamental</li>
                        <li>Cognitiva</li>
                        <li>Emocional</li>
                        <li>Sensorial</li>
                      </ul>
                    </div>
                    <p className="text-muted-foreground mt-1"><span className="font-medium text-foreground">Evolução bilateral tônico-clônica:</span> focal → bilateral tônico-clônica</p>
                  </div>
                </div>

                {/* Generalizada */}
                <div>
                  <h3 className="font-semibold text-foreground mb-1">2. Crises de Início Generalizado</h3>
                  <div className="ml-3 space-y-1">
                    <p className="font-medium text-foreground">A) Motor:</p>
                    <ul className="ml-4 list-disc space-y-0.5 text-muted-foreground">
                      <li>Tônico-clônica</li>
                      <li>Clônica</li>
                      <li>Tônica</li>
                      <li>Mioclônica</li>
                      <li>Mioclônico-tônico-clônica</li>
                      <li>Mioclônico-atônica</li>
                      <li>Atônica</li>
                      <li>Espasmo epiléptico</li>
                    </ul>
                    <p className="font-medium text-foreground mt-1">B) Não-Motor (Ausência):</p>
                    <ul className="ml-4 list-disc space-y-0.5 text-muted-foreground">
                      <li>Típica</li>
                      <li>Atípica</li>
                      <li>Mioclônica</li>
                      <li>Com mioclonia palpebral</li>
                    </ul>
                  </div>
                </div>

                {/* Início desconhecido */}
                <div>
                  <h3 className="font-semibold text-foreground mb-1">3. Início Desconhecido</h3>
                  <div className="ml-3 text-muted-foreground space-y-0.5">
                    <p>Motor: tônico-clônica, espasmo epiléptico</p>
                    <p>Não-motor: parada comportamental</p>
                    <p className="text-muted-foreground italic">Classificar como &quot;não classificada&quot; quando informações insuficientes</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-3">
                <p className="font-medium text-red-800 dark:text-red-300 mb-1">Notas clínicas importantes:</p>
                <ul className="list-disc ml-4 space-y-0.5 text-red-700 dark:text-red-400">
                  <li>Consciência se refere à consciência de si e do ambiente durante a crise</li>
                  <li>A nova classificação substituiu &quot;simples&quot; e &quot;complexo&quot; da terminologia anterior</li>
                  <li>O termo &quot;parcial&quot; foi substituído por &quot;focal&quot;</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── FMS ─────────────────────────────────────────────────────── */}
        <AccordionItem value="fms" className="border border-card-border rounded-xl overflow-hidden" data-testid="acc-fms">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/20 [&[data-state=open]]:bg-muted/20">
            <div className="flex items-center gap-3 text-left">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs font-semibold px-2">FMS</Badge>
              <span className="text-sm font-semibold">Functional Mobility Scale</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                Escala de mobilidade funcional avaliada em 3 distâncias representativas do ambiente cotidiano:
                5m (domicílio), 50m (escola/trabalho), 500m (comunidade).
              </p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { dist: "5 m", context: "Domicílio" },
                  { dist: "50 m", context: "Escola" },
                  { dist: "500 m", context: "Comunidade" },
                ].map((d) => (
                  <Card key={d.dist} className="border-card-border">
                    <CardContent className="p-3 text-center">
                      <p className="text-base font-bold text-primary">{d.dist}</p>
                      <p className="text-[11px] text-muted-foreground">{d.context}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  { score: "1", label: "Cadeira de rodas", desc: "Usa cadeira de rodas motorizada ou manual para todas as distâncias" },
                  { score: "2", label: "Andador/Muleta axilar", desc: "Requer andador ou muleta axilar para deambular" },
                  { score: "3", label: "Muletas canadenses", desc: "Usa muletas canadenses (antebraço) para deambular" },
                  { score: "4", label: "Bengala/Independente em superfície plana", desc: "Deambula independentemente em superfícies planas; pode usar bengala" },
                  { score: "5", label: "Independente em todas as superfícies", desc: "Deambula independentemente em todas as superfícies incluindo terrenos irregulares, rampas e escadas" },
                  { score: "6", label: "Totalmente independente", desc: "Deambula em todas as superfícies sem restrições ou dificuldades" },
                ].map((item) => (
                  <div key={item.score} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                      {item.score}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 p-3">
                <p className="text-green-800 dark:text-green-300">
                  <strong>Como documentar:</strong> Registre 3 escores separados para cada distância.
                  Ex.: FMS 5m = 2, FMS 50m = 3, FMS 500m = 1.
                  Essa combinação reflete melhor o perfil de mobilidade funcional.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── CIF ─────────────────────────────────────────────────────── */}
        <AccordionItem value="cif" className="border border-card-border rounded-xl overflow-hidden" data-testid="acc-cif">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/20 [&[data-state=open]]:bg-muted/20">
            <div className="flex items-center gap-3 text-left">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-semibold px-2">CIF</Badge>
              <span className="text-sm font-semibold">Classificação Internacional de Funcionalidade</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                A CIF (OMS, 2001) fornece uma linguagem padronizada para descrever saúde e funcionalidade. 
                Estruturada em dois componentes: <strong>Funcionalidade e Incapacidade</strong> e <strong>Fatores Contextuais</strong>.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    code: "b",
                    name: "Funções do Corpo",
                    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
                    desc: "Funções fisiológicas dos sistemas do corpo, incluindo funções psicológicas. Ex.: b130 Funções de energia e impulso, b140 Funções de atenção, b167 Funções mentais da linguagem.",
                  },
                  {
                    code: "s",
                    name: "Estruturas do Corpo",
                    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
                    desc: "Partes anatômicas do corpo, como órgãos, membros e seus componentes. Ex.: s110 Estrutura do cérebro, s730 Estrutura do membro superior.",
                  },
                  {
                    code: "d",
                    name: "Atividade e Participação",
                    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                    desc: "Execução de tarefas e envolvimento em situações de vida. Ex.: d110 Observar, d330 Falar, d730 Relacionar-se com estranhos.",
                  },
                  {
                    code: "e",
                    name: "Fatores Ambientais",
                    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
                    desc: "Ambiente físico, social e atitudinal no qual as pessoas vivem e conduzem suas vidas. Podem ser facilitadores (+) ou barreiras (ponto).",
                  },
                ].map((item) => (
                  <div key={item.code} className="p-3 rounded-lg bg-muted/30 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${item.color} text-xs font-mono font-bold`}>{item.code}</Badge>
                      <p className="font-semibold text-foreground">{item.name}</p>
                    </div>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Qualificadores (grau de comprometimento)</h3>
                <div className="grid grid-cols-5 gap-1 text-center">
                  {[
                    { val: "0", label: "Nenhuma", range: "0–4%" },
                    { val: "1", label: "Leve", range: "5–24%" },
                    { val: "2", label: "Moderada", range: "25–49%" },
                    { val: "3", label: "Grave", range: "50–95%" },
                    { val: "4", label: "Completa", range: "96–100%" },
                  ].map((q) => (
                    <div key={q.val} className="p-2 rounded-lg bg-muted/30 space-y-0.5">
                      <p className="text-base font-bold text-primary">{q.val}</p>
                      <p className="font-medium text-foreground">{q.label}</p>
                      <p className="text-muted-foreground">{q.range}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3">
                <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Como usar no relatório:</p>
                <p className="text-blue-700 dark:text-blue-400">
                  Exemplo: <span className="font-mono">b140.2</span> = Funções de atenção, comprometimento moderado (25–49%).{" "}
                  <span className="font-mono">e310+3</span> = Família imediata como facilitador substancial.
                  Use sempre o qualificador após o ponto para indicar o grau.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── GMFCS ─────────────────────────────────────────────────── */}
        <AccordionItem value="gmfcs" className="border border-card-border rounded-xl overflow-hidden" data-testid="acc-gmfcs">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/20 [&[data-state=open]]:bg-muted/20">
            <div className="flex items-center gap-3 text-left">
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 text-xs font-semibold px-2">GMFCS</Badge>
              <span className="text-sm font-semibold">GMFCS Expandido e Revisado — 5 Níveis</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                Gross Motor Function Classification System — Expanded and Revised (Palisano et al., 2007).
                Classifica a função motora grossa de crianças com paralisia cerebral em 5 níveis, com descritores por faixa etária.
              </p>

              {[
                {
                  nivel: "I",
                  title: "Anda sem restrições",
                  color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
                  badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                  faixas: [
                    { age: "0–2 anos", desc: "Senta, engatinha, puxa para ficar em pé, anda com apoio, começa a andar independentemente" },
                    { age: "2–4 anos", desc: "Anda sem precisar de dispositivo auxiliar, sobe e desce escadas segurando corrimão" },
                    { age: "4–6 anos", desc: "Anda dentro e fora de casa e sobe escadas. Corre e pula mas velocidade e equilíbrio são limitados" },
                    { age: "6–12 anos", desc: "Anda em casa, escola e comunidade. Sobe e desce escadas sem apoio de corrimão. Corre e pula mas com limitações" },
                    { age: "12–18 anos", desc: "Anda em casa, escola e comunidade. Sobe e desce escadas sem apoio. Realiza atividade física e esporte" },
                  ],
                },
                {
                  nivel: "II",
                  title: "Anda com limitações",
                  color: "border-lime-400 bg-lime-50 dark:bg-lime-950/20",
                  badgeColor: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
                  faixas: [
                    { age: "0–2 anos", desc: "Mantém posição sentada. Engatinha reciprocamente. Puxa para ficar em pé e anda com apoio" },
                    { age: "2–4 anos", desc: "Anda com dispositivo auxiliar de mobilidade. Sobe escadas com apoio. Pode correr mas não saltar" },
                    { age: "4–6 anos", desc: "Anda sem dispositivos em ambientes familiares. Pode precisar de dispositivo em locais desconhecidos" },
                    { age: "6–12 anos", desc: "Anda na maioria dos ambientes mas com limitações em terrenos irregulares, inclinações e multidões" },
                    { age: "12–18 anos", desc: "Anda na maioria dos ambientes mas tem limitações em longa distância, terrenos irregulares e multidões" },
                  ],
                },
                {
                  nivel: "III",
                  title: "Anda com dispositivo auxiliar manual",
                  color: "border-amber-400 bg-amber-50 dark:bg-amber-950/20",
                  badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                  faixas: [
                    { age: "0–2 anos", desc: "Senta com apoio lombar. Rola, engatinha ou arrasta" },
                    { age: "2–4 anos", desc: "Senta independentemente. Arrasta ou engatinha. Anda com dispositivo auxiliar manual" },
                    { age: "4–6 anos", desc: "Anda com dispositivo auxiliar manual em ambientes fechados. Senta e levanta com apoio" },
                    { age: "6–12 anos", desc: "Anda com dispositivo auxiliar em ambientes fechados. Em exteriors usa cadeira de rodas" },
                    { age: "12–18 anos", desc: "Anda com dispositivo auxiliar em ambientes fechados. Em comunidade usa cadeira de rodas" },
                  ],
                },
                {
                  nivel: "IV",
                  title: "Auto-mobilidade com limitações; pode usar mobilidade motorizada",
                  color: "border-orange-400 bg-orange-50 dark:bg-orange-950/20",
                  badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
                  faixas: [
                    { age: "0–2 anos", desc: "Controle cefálico com apoio. Senta com suporte. Pode rolar" },
                    { age: "2–4 anos", desc: "Senta com apoio. Anda com bengala de 4 pontos ou andador, pequenas distâncias" },
                    { age: "4–6 anos", desc: "Senta com apoio. Pode usar mobilidade motorizada" },
                    { age: "6–12 anos", desc: "Usa cadeira de rodas na maioria dos ambientes. Pode andar com suporte físico" },
                    { age: "12–18 anos", desc: "Usa cadeira de rodas manual em casa e motorizada em exteriores e comunidade" },
                  ],
                },
                {
                  nivel: "V",
                  title: "Transportado em cadeira de rodas manual",
                  color: "border-red-400 bg-red-50 dark:bg-red-950/20",
                  badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                  faixas: [
                    { age: "0–2 anos", desc: "Limitações graves no controle voluntário de movimentos antigravitacionais" },
                    { age: "2–4 anos", desc: "Não se senta sem apoio. Não engatinha nem anda. Requer transporte" },
                    { age: "4–6 anos", desc: "Limitações físicas graves. Não é capaz de controlar movimentos voluntários antigravitacionais" },
                    { age: "6–12 anos", desc: "Transportado em cadeira de rodas manual em todos os ambientes. Limitações severas" },
                    { age: "12–18 anos", desc: "Transportado em cadeira de rodas manual em todos os ambientes. Pode usar mobilidade motorizada" },
                  ],
                },
              ].map((level) => (
                <div key={level.nivel} className={`rounded-xl border-l-4 ${level.color} p-4 space-y-2`}>
                  <div className="flex items-center gap-2">
                    <Badge className={`${level.badgeColor} font-bold text-sm`}>Nível {level.nivel}</Badge>
                    <span className="font-semibold text-foreground">{level.title}</span>
                  </div>
                  <div className="space-y-1">
                    {level.faixas.map((f) => (
                      <div key={f.age} className="flex gap-2">
                        <span className="flex-shrink-0 font-medium text-muted-foreground w-24">{f.age}:</span>
                        <span className="text-muted-foreground">{f.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 p-3">
                <p className="font-medium text-orange-800 dark:text-orange-300 mb-1">Aspectos importantes:</p>
                <ul className="list-disc ml-4 space-y-0.5 text-orange-700 dark:text-orange-400">
                  <li>O GMFCS avalia a função motora grossa, não prediz prognóstico individual de forma isolada</li>
                  <li>Classificar sempre pela melhor performance habitual, não pelo potencial máximo</li>
                  <li>A classificação pode mudar entre faixas etárias; reclassificar a cada consulta</li>
                  <li>Usar junto com MACS (função manual) e CFCS (comunicação) para perfil funcional completo</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
