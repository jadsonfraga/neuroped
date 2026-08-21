/**
 * Integração externa — Eletroencefalograma
 * Este ponto de passagem preserva a navegação interna do NeuroPed e encaminha
 * o usuário, a partir da aba dourada, ao site institucional de vídeo-EEG.
 */
import { useEffect } from "react";
import { ExternalLink, Waves } from "lucide-react";

const VIDEO_EEG_URL = "https://videoeeg-zoprmuxs.manus.space";

export default function EletroencefalogramaPage() {
  useEffect(() => {
    window.location.assign(VIDEO_EEG_URL);
  }, []);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-amber-200 to-amber-500 p-8 text-amber-950 shadow-xl shadow-amber-400/35">
        <Waves className="h-8 w-8" aria-hidden="true" />
        <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em]">Eletroencefalograma</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Abrindo o site de Vídeo-EEG Domiciliar</h1>
        <p className="mt-4 text-sm leading-6">Você será direcionado automaticamente. Se isso não acontecer, use o botão abaixo.</p>
        <a href={VIDEO_EEG_URL} className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber-950 px-5 py-3 text-sm font-bold text-amber-50 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]">
          Abrir site de Vídeo-EEG <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>
    </main>
  );
}
