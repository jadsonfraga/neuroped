import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Brain, Search, ClipboardCheck, Pill, GraduationCap, Users,
  ArrowRight, ArrowLeft, Sparkles, Stethoscope, Filter,
  Printer, Mail, Smartphone, Monitor, ChevronRight
} from "lucide-react";
import neuropedLogo from "@assets/neuroped-logo.png";
import childAssessmentImg from "@assets/images/child-assessment.png";
import teamImg from "@assets/images/team-multiprofessional.png";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Bem-vindo ao NeuroPed",
    subtitle: "Escalas de Neuropediatria",
    content: (
      <div className="space-y-6">
        <div className="w-full h-32 rounded-xl overflow-hidden mx-auto mb-2">
          <img src={childAssessmentImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="mx-auto w-24 h-24">
          <img src={neuropedLogo} alt="NeuroPed" className="w-24 h-24 object-contain" />
        </div>
        <p className="text-sm text-center text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Ferramenta educacional completa para neuropediatria e psiquiatria infantil.
          Desenvolvida pelo <strong>Dr. Jadson Fraga</strong>.
        </p>
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {[
            { icon: ClipboardCheck, label: "450+ Escalas", color: "text-blue-500" },
            { icon: Pill, label: "142 Medicações", color: "text-emerald-500" },
            { icon: GraduationCap, label: "Testes Diretos", color: "text-amber-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center space-y-1">
                <Icon className={`w-6 h-6 mx-auto ${item.color}`} />
                <p className="text-[10px] font-medium text-foreground">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    ),
  },
  {
    title: "Como Usar",
    subtitle: "3 formas de encontrar o que precisa",
    content: (
      <div className="space-y-4">
        {[
          {
            icon: Filter, color: "bg-primary/10 text-primary",
            title: "Filtro Inteligente",
            desc: "Digite a queixa (agitado, autismo, desatento) ou selecione idade. A escala ideal aparece em dourado."
          },
          {
            icon: Search, color: "bg-emerald-500/10 text-emerald-600",
            title: "Busca na Home",
            desc: "Use a barra de busca na tela inicial para encontrar qualquer escala, teste ou ferramenta."
          },
          {
            icon: Stethoscope, color: "bg-amber-500/10 text-amber-600",
            title: "Sidebar (Menu Lateral)",
            desc: "Navegue por 12 categorias: escalas clínicas, testes diretos, guias educativos e ferramentas."
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border">
              <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    ),
  },
  {
    title: "Resultados Automáticos",
    subtitle: "PDF, email e acompanhamento",
    content: (
      <div className="space-y-4">
        <div className="w-full h-28 rounded-xl overflow-hidden mx-auto mb-2">
          <img src={teamImg} alt="" className="w-full h-full object-cover" />
        </div>
        {[
          {
            icon: Printer, color: "bg-violet-500/10 text-violet-600",
            title: "PDF / Imprimir",
            desc: "Ao finalizar qualquer escala, botão 'Gerar PDF' cria documento A4 profissional com todas as respostas."
          },
          {
            icon: Mail, color: "bg-blue-500/10 text-blue-600",
            title: "Email Automático",
            desc: "O relatório completo (por extenso) é enviado automaticamente para o email do Dr. Jadson."
          },
          {
            icon: Users, color: "bg-pink-500/10 text-pink-600",
            title: "Pacientes",
            desc: "Cadastre pacientes e vincule resultados de escalas para acompanhamento longitudinal."
          },
          {
            icon: Smartphone, color: "bg-emerald-500/10 text-emerald-600",
            title: "Instalar Offline",
            desc: "Funciona como app no celular e computador. Clique em 'Instalar NeuroPed' quando aparecer."
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border">
              <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
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

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-3xl shadow-2xl overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-8 bg-primary" : "w-2 bg-muted-foreground/20"}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">{current.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{current.subtitle}</p>
          </div>
          {current.content}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex items-center gap-3">
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </Button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <Button onClick={onComplete} className="gap-2 bg-gradient-to-r from-primary to-chart-2 text-white shadow-lg">
              Começar a usar <Sparkles className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onComplete} className="text-xs text-muted-foreground">
                Pular
              </Button>
              <Button onClick={() => setStep(step + 1)} className="gap-1">
                Próximo <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
