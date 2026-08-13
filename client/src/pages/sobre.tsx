import { useState } from "react";
import { Award, Calendar, ChevronLeft, ChevronRight, Clock, Mail, MapPin, Phone, Shield, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { drJadsonMasterShieldLogo } from "@/assets/drJadsonMasterShieldLogo";
import neuralAbstractImg from "@assets/images/neural-abstract.webp";
import drSelfie from "@assets/images/dr-jadson-selfie.jpeg";
import drBatman from "@assets/images/dr-jadson-consultorio-batman.jpeg";
import drSuperman from "@assets/images/dr-jadson-consultorio-superman.jpeg";
import drFull from "@assets/images/dr-jadson-consultorio-full.jpeg";
import drArte from "@assets/images/dr-jadson-arte.jpeg";
import drLogoSuper from "@assets/images/dr-jadson-logo-super.jpeg";

const photos = [
  { src: drSuperman, alt: "Dr. Jadson — SuperNeuroPed", caption: "O SuperNeuroPed no consultório" },
  { src: drLogoSuper, alt: "Mascote SuperNeuroPed — arte original", caption: "SuperNeuroPed — o mascote original do app" },
  { src: drBatman, alt: "Dr. Jadson — Consultório", caption: "Avaliação lúdica com brinquedos terapêuticos" },
  { src: drFull, alt: "Dr. Jadson — Sala de Avaliação", caption: "Sala de avaliação neuropediátrica completa" },
  { src: drSelfie, alt: "Dr. Jadson Fraga", caption: "Dr. Jadson Fraga Araújo Júnior" },
  { src: drArte, alt: "Dr. Jadson — Arte", caption: "Além da medicina — arte e criatividade" },
];

function PhotoCarousel() {
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? photos.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === photos.length - 1 ? 0 : c + 1));

  return (
    <div className="group relative">
      <div className="asset-proportion-box aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-xl">
        <img
          src={photos[current].src}
          alt={photos[current].alt}
          className="no-zoom-media h-full w-full object-contain transition-all duration-500"
        />
        <div className="text-overlay-safe absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-sm font-medium text-white">{photos[current].caption}</p>
        </div>
      </div>
      <button
        onClick={prev}
        aria-label="Foto anterior"
        className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="Próxima foto"
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="mt-3 flex justify-center gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Ir para a foto ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function SobrePage() {
  return (
    <div className="proportion-safe-page space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-3xl">
        <img src={neuralAbstractImg} alt="" className="h-56 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 flex items-end gap-4 p-6">
          <div className="asset-proportion-box h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-white shadow-2xl">
            <img src={drJadsonMasterShieldLogo} alt="Dr. Jadson Fraga" className="no-zoom-media h-full w-full object-contain" />
          </div>
          <div>
            <Badge className="mb-1 border-amber-500/30 bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Star className="mr-1 h-3 w-3" /> Neuropediatria infantil em Petrolina
            </Badge>
            <h1 className="text-xl font-bold text-foreground">Dr. Jadson Fraga Araújo Júnior</h1>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/20 shadow-lg">
        <div className="h-1.5 bg-gradient-to-r from-primary via-chart-2 to-primary" />
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="asset-proportion-box h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-muted shadow-lg ring-2 ring-primary/20">
              <img src={drSelfie} alt="Dr. Jadson Fraga" className="no-zoom-media h-full w-full object-contain" />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-bold text-foreground">Neurologista Infantil / Neuropediatra</h2>
              <p className="text-sm font-semibold text-primary">O SuperNeuroPed</p>
              <p className="text-xs italic text-muted-foreground">“Cada criança é um universo. Meu papel é decifrar esse universo com ciência, empatia e respeito.”</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/5 p-3">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CRM-PE</p>
                <p className="text-sm font-bold text-foreground">25227</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3">
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">RQE</p>
                <p className="text-sm font-bold text-foreground">17756</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Consultório e bastidores
        </h2>
        <PhotoCarousel />
      </div>

      {/* Todas as gerações de mascotes do app, lado a lado: o acervo é parte
          da identidade e permanece integral dentro do produto. */}
      <Card className="overflow-hidden border-primary/20 shadow-lg">
        <div className="h-1.5 bg-gradient-to-r from-chart-2 via-primary to-chart-2" />
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Star className="h-4 w-4 text-chart-2" />
              Mascotes do NeuroPed
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Cada era do app deixou um personagem. Todos continuam em casa: o acervo aparece
              em cameos pelas páginas e o Nino guia a jornada atual.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <figure className="m-0 space-y-2 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 text-center">
              <div className="asset-proportion-box mx-auto h-28 w-28 overflow-hidden rounded-2xl bg-white/60 dark:bg-white/[0.06]">
                <img
                  src="/neuroped-mascot-premium.webp"
                  alt="Nino, mascote cerebral do NeuroPed, de jaleco e escudo"
                  loading="lazy"
                  decoding="async"
                  className="no-zoom-media h-full w-full object-contain"
                />
              </div>
              <figcaption className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">Nino</p>
                <p className="text-[11px] leading-snug text-muted-foreground">Guia atual do NeuroPed — organiza o caminho clínico.</p>
              </figcaption>
            </figure>
            <figure className="m-0 space-y-2 rounded-2xl border border-chart-2/15 bg-chart-2/[0.04] p-4 text-center">
              <div className="asset-proportion-box mx-auto h-28 w-28 overflow-hidden rounded-2xl bg-muted">
                <img
                  src={drLogoSuper}
                  alt="SuperNeuroPed, o mascote original do aplicativo"
                  loading="lazy"
                  decoding="async"
                  className="no-zoom-media h-full w-full object-cover object-top"
                />
              </div>
              <figcaption className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">SuperNeuroPed</p>
                <p className="text-[11px] leading-snug text-muted-foreground">O mascote original — herói da primeira era do app.</p>
              </figcaption>
            </figure>
            <figure className="m-0 space-y-2 rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-4 text-center">
              <div className="asset-proportion-box mx-auto h-28 w-28 overflow-hidden rounded-2xl bg-muted">
                <img
                  src={drArte}
                  alt="Arte comemorativa do Dr. Jadson"
                  loading="lazy"
                  decoding="async"
                  className="no-zoom-media h-full w-full object-cover"
                />
              </div>
              <figcaption className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">Acervo em cameo</p>
                <p className="text-[11px] leading-snug text-muted-foreground">Seis artes históricas revezam no canto das páginas.</p>
              </figcaption>
            </figure>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-emerald-500/20 shadow-lg">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardContent className="space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Phone className="h-4 w-4 text-emerald-600" />
            Agendamento e contato
          </h2>

          <div className="grid gap-3">
            <div className="space-y-2 rounded-xl border bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Petrolina — PE</span>
                <Badge variant="outline" className="text-[10px]">Principal</Badge>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">Rua Raimundo Lacerda, nº 001 — Bairro São José — CEP 56302-470</p>
              <p className="flex items-center gap-1.5 pl-6 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> Segunda a sexta, 8h às 16h
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a href="tel:+5587991097371">
              <Button variant="outline" className="w-full gap-2">
                <Phone className="h-4 w-4" /> Ligar
              </Button>
            </a>
            <a href="mailto:drjadsonfraga@proton.me">
              <Button variant="outline" className="w-full gap-2">
                <Mail className="h-4 w-4" /> E-mail
              </Button>
            </a>
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> Dados institucionais revisados para uso público no NeuroPed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
