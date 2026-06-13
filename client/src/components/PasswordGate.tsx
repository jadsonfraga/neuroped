import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark, BrandWatermark } from "@/components/BrandAssets";

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate(_props: PasswordGateProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.20),transparent_32%),linear-gradient(135deg,#0f172a,#111827_48%,#2b1118)] p-4 text-white">
      <BrandWatermark className="right-[-3rem] top-[-3rem] h-72 w-72" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_32%,rgba(201,169,97,0.08))]" aria-hidden="true" />

      <section className="relative w-full max-w-md" aria-label="Acesso clinico NeuroPed">
        <div className="rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 text-center shadow-2xl backdrop-blur-2xl sm:p-7">
          <div className="flex justify-center">
            <BrandMark size="lg" showWordmark titleClassName="text-white" subtitle="Acesso clinico restrito" />
          </div>
          <div className="mx-auto mt-6 flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200">
            <Lock className="h-4 w-4" />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight">Login necessario</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/70">
            O desbloqueio por senha local foi desativado. Areas clinicas com dados identificaveis exigem autenticacao nominal no backend seguro.
          </p>
          <Button
            className="mt-6 h-11 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-600 font-black text-slate-950 hover:from-amber-300 hover:to-yellow-500"
            onClick={() => {
              window.location.hash = "/login";
            }}
          >
            Ir para login
          </Button>
        </div>
      </section>
    </main>
  );
}
