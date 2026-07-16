import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Search, ClipboardCheck, Pill, GraduationCap, Users,
  ArrowRight, ArrowLeft, Sparkles, Stethoscope, Filter,
  Printer, Mail, Smartphone, HeartHandshake,
} from "lucide-react";
import neuropedLogo from "@assets/neuroped-logo.webp";
import childAssessmentImg from "@assets/images/child-assessment.webp";
import teamImg from "@assets/images/team-multiprofessional.webp";
import { appMetrics } from "@/data/appMetrics";
import { SafeImage } from "@/components/SafeImage";
import { softTap, softTick, softSuccess, softWhoosh } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import {
  fadeIn, slideRightFadeIn, slideUpFadeIn,
  easing, duration,
} from "@/lib/motion";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Bem-vindo ao NeuroPed",
    subtitle: "Escalas e instrumentos de neuropediatria",
    content: (
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.normal, ease: easing.smooth }}
          className="w-full h-32 rounded-2xl overflow-hidden mx-auto mb-2 shadow-md bg-muted/40"
        >
          <SafeImage src={childAssessmentImg} alt="" aria-hidden="true" className="w-full h-full object-contain p-2" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: duration.normal, ease: easing.spring }}
          className="mx-auto w-20 h-20"
        >
          <SafeImage src={neuropedLogo} alt="NeuroPed" fallbackLabel="NeuroPed" className="w-20 h-20 object-contain drop-shadow-md" />
        </motion.div>

        <p className="text-sm text-center text-muted-foreground leading-relaxed max-w-sm mx-auto text-cozy">
          Ferramenta educacional completa de neuropediatria e psiquiatria infantil,
          desenvolvida pelo <strong className="text-foreground">Dr. Jadson Fraga</strong>.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {[
            { icon: ClipboardCheck, label: `${appMetrics.scaleCount} Escalas`, color: "from-blue-500 to-cyan-500" },
            { icon: Pill, label: `${appMetrics.medicationCount} Medicações`, color: "from-emerald-500 to-teal-500" },
            { icon: Filter, label: `${appMetrics.filterableInstrumentCount} Filtráveis`, color: "from-amber-500 to-orange-500" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08, duration: duration.normal, ease: easing.smooth }}
                className="text-center space-y-1.5"
              >
                <div className={`mx-auto w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br ${item.color}`}>
                  <Icon className="w-4 h-4 text-white" strokeWidth={1.75} />
                </div>
                <p className="text-[10px] font-medium text-foreground">{item.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    ),
  },
  {
    title: "Três caminhos rápidos",
    subtitle: "Formas de encontrar o que precisa",
    content: (
      <div className="space-y-3">
        {[
          {
            icon: Filter, gradient: "from-primary to-chart-2",
            title: "Filtro Clínico Inteligente",
            desc: "Digite a queixa ou selecione idade. Toda busca retorna Ouro, Prata, Bronze, Teste Direto e Questionário Escolar."
          },
          {
            icon: Search, gradient: "from-emerald-500 to-teal-500",
            title: "Busca na Home",
            desc: "Use a barra de busca para encontrar escala, questionário, inventário, página ou ferramenta."
          },
          {
            icon: Stethoscope, gradient: "from-amber-500 to-orange-500",
            title: "Menu em camadas",
            desc: "Navegue por Fluxo clínico, Escalas, Pacientes, Documentos, Medicamentos e área dos pais."
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: duration.normal, ease: easing.smooth }}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/30 border border-card-border"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-4 h-4 text-white" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    ),
  },
  {
    title: "Pais e psicoeducação segura",
    subtitle: "Tudo que é não sensível vai para a aba dos pais",
    content: (
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.normal, ease: easing.smooth }}
          className="w-full h-28 rounded-2xl overflow-hidden mx-auto mb-1 shadow-md bg-muted/40"
        >
          <SafeImage src={teamImg} alt="" aria-hidden="true" className="w-full h-full object-contain p-2" />
        </motion.div>
        {[
          {
            icon: HeartHandshake, gradient: "from-teal-500 to-emerald-600",
            title: "Aba dos pais",
            desc: "Orientações gerais, rotina, escola, sinais de alerta e material educativo ficam concentrados para a família."
          },
          {
            icon: Users, gradient: "from-pink-500 to-rose-500",
            title: "Sem prontuário exposto",
            desc: "Dados médicos individualizados, documentos sensíveis e informações clínicas só aparecem se forem liberados pelo profissional."
          },
          {
            icon: GraduationCap, gradient: "from-amber-500 to-orange-500",
            title: "Escola e família",
            desc: "Questionários escolares e conteúdos de psicoeducação ficam fáceis de encontrar no tour, menu e portal."
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: duration.normal, ease: easing.smooth }}
              className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-card-border"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-4 h-4 text-white" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    ),
  },
  {
    title: "Resultados que viajam",
    subtitle: "PDF, e-mail e acompanhamento longitudinal",
    content: (
      <div className="space-y-3">
        {[
          { icon: Printer, gradient: "from-violet-500 to-purple-600", title: "PDF / Imprimir", desc: "Ao finalizar uma escala aplicável, gere documento para consulta e acompanhamento." },
          { icon: Mail, gradient: "from-blue-500 to-indigo-600", title: "Envio e registro", desc: "Relatórios podem ser organizados no fluxo clínico quando a rota estiver disponível." },
          { icon: Smartphone, gradient: "from-emerald-500 to-teal-500", title: "Instalar offline", desc: "Funciona como app no celular e computador. Sem conexão depois de instalado." },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: duration.normal, ease: easing.smooth }}
              className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-card-border"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-4 h-4 text-white" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    ),
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  function next() {
    softWhoosh();
    haptic.tap();
    if (step < steps.length - 1) setStep(step + 1);
  }
  function prev() {
    softTick();
    haptic.tap();
    if (step > 0) setStep(step - 1);
  }
  function finish() {
    softSuccess();
    haptic.success();
    onComplete();
  }
  function skip() {
    softTap();
    haptic.tap();
    onComplete();
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <motion.div
        variants={slideUpFadeIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md rounded-3xl bg-card border border-card-border shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideRightFadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="min-h-[420px] flex flex-col"
            >
              <div className="text-center mb-5">
                <h2 id="onboarding-title" className="text-xl font-bold text-foreground">{current.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{current.subtitle}</p>
              </div>
              <div className="flex-1">{current.content}</div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-1.5 my-4">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            {step > 0 ? (
              <Button variant="ghost" onClick={prev} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
            ) : (
              <Button variant="ghost" onClick={skip}>Pular</Button>
            )}
            <Button onClick={isLast ? finish : next} className="gap-1.5">
              {isLast ? "Começar" : "Próximo"}
              {!isLast && <ArrowRight className="w-4 h-4" />}
              {isLast && <Sparkles className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
