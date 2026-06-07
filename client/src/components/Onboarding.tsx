import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Search, ClipboardCheck, Pill, GraduationCap, Users,
  ArrowRight, ArrowLeft, Sparkles, Stethoscope, Filter,
  Printer, Mail, Smartphone,
} from "lucide-react";
import { BrandMark, brandAssets } from "@/components/BrandAssets";
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
    subtitle: "Ecossistema clínico Dr. Jadson Fraga",
    content: (
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.normal, ease: easing.smooth }}
          className="w-full h-32 rounded-2xl overflow-hidden mx-auto mb-2 shadow-md"
        >
          <img src={brandAssets.illustrations.childAssessment} alt="" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: duration.normal, ease: easing.spring }}
          className="flex justify-center"
        >
          <BrandMark size="lg" />
        </motion.div>

        <p
          className="text-sm text-center text-muted-foreground leading-relaxed max-w-sm mx-auto text-cozy"
        >
          Ferramenta educacional completa de neuropediatria e psiquiatria infantil,
          desenvolvida pelo <strong className="text-foreground">Dr. Jadson Fraga</strong>.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {[
            { icon: ClipboardCheck, label: "450+ Escalas", color: "from-blue-500 to-cyan-500" },
            { icon: Pill, label: "142 Medicações", color: "from-emerald-500 to-teal-500" },
            { icon: GraduationCap, label: "Testes Diretos", color: "from-amber-500 to-orange-500" },
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
                <div
                  className="mx-auto w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${item.color.split(" ")[0].replace("from-", "")}, ${item.color.split(" ")[1].replace("to-", "")})`,
                  }}
                >
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
            title: "Filtro Inteligente",
            desc: "Digite a queixa (agitado, autismo, desatento) ou selecione idade. A escala ideal aparece em dourado."
          },
          {
            icon: Search, gradient: "from-emerald-500 to-teal-500",
            title: "Busca na Home",
            desc: "Use a barra de busca na tela inicial para encontrar qualquer escala, teste ou ferramenta."
          },
          {
            icon: Stethoscope, gradient: "from-amber-500 to-orange-500",
            title: "Menu Lateral",
            desc: "Navegue por 12 categorias: escalas clínicas, testes diretos, guias educativos e ferramentas."
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
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}
              >
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.normal, ease: easing.smooth }}
          className="w-full h-28 rounded-2xl overflow-hidden mx-auto mb-1 shadow-md"
        >
          <img src={brandAssets.illustrations.teamMultiprofessional} alt="" className="w-full h-full object-cover" />
        </motion.div>
        {[
          {
            icon: Printer, gradient: "from-violet-500 to-purple-600",
            title: "PDF / Imprimir",
            desc: "Ao finalizar qualquer escala, o botão 'Gerar PDF' cria documento A4 profissional."
          },
          {
            icon: Mail, gradient: "from-blue-500 to-indigo-600",
            title: "E-mail automático",
            desc: "Relatório por extenso enviado para o e-mail do Dr. Jadson."
          },
          {
            icon: Users, gradient: "from-pink-500 to-rose-500",
            title: "Pacientes",
            desc: "Cadastre pacientes e vincule resultados para acompanhamento longitudinal."
          },
          {
            icon: Smartphone, gradient: "from-emerald-500 to-teal-500",
            title: "Instalar offline",
            desc: "Funciona como app no celular e computador. Sem conexão depois de instalado."
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
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}
              >
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at top, hsl(var(--sidebar) / 0.95) 0%, hsl(var(--background) / 0.96) 70%)",
        backdropFilter: "blur(10px)",
      }}
    >
      <motion.div
        variants={slideUpFadeIn}
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--card-border))",
        }}
      >
        {/* Gradient header bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-2)), hsl(var(--chart-3)))",
          }}
        />

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 28 : 8,
                opacity: i === step ? 1 : 0.35,
              }}
              transition={{ duration: 0.25, ease: easing.smooth }}
              className="h-1.5 rounded-full"
              style={{
                background: i <= step ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              }}
            />
          ))}
        </div>

        {/* Header text */}
        <div className="px-6 pt-5 pb-1 text-center">
          <h2
            className="text-2xl text-foreground"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            {current.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 italic">{current.subtitle}</p>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 pt-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideRightFadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 flex items-center gap-3">
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={prev} className="gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </Button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <Button
              onClick={finish}
              className="gap-2 text-white shadow-lg btn-glow"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
              }}
            >
              Começar a usar <Sparkles className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={skip} className="text-xs text-muted-foreground">
                Pular
              </Button>
              <Button onClick={next} className="gap-1 btn-glow">
                Próximo <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
