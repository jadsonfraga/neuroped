import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Brain, MapPin, Phone, Mail, Globe, Instagram, Clock,
  GraduationCap, Award, Heart, Stethoscope, Star, Users,
  Shield, BookOpen, MessageCircle, ChevronLeft, ChevronRight,
  Zap, Sparkles, Calendar, ExternalLink
} from "lucide-react";
import { drJadsonMasterShieldLogo } from "@/assets/drJadsonMasterShieldLogo";
import neuralAbstractImg from "@assets/images/neural-abstract.png";
import drSelfie from "@assets/images/dr-jadson-selfie.jpeg";
import drBatman from "@assets/images/dr-jadson-consultorio-batman.jpeg";
import drSuperman from "@assets/images/dr-jadson-consultorio-superman.jpeg";
import drFull from "@assets/images/dr-jadson-consultorio-full.jpeg";
import drArte from "@assets/images/dr-jadson-arte.jpeg";

const photos = [
  { src: drSuperman, alt: "Dr. Jadson — SuperNeuroPed", caption: "O SuperNeuroPed no consultório" },
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
    <div className="relative group">
      <div className="overflow-hidden rounded-2xl aspect-[4/3] bg-muted shadow-xl">
        <img
          src={photos[current].src}
          alt={photos[current].alt}
          className="w-full h-full object-cover transition-all duration-500"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-sm font-medium">{photos[current].caption}</p>
        </div>
      </div>
      <button
        onClick={prev}
        aria-label="Foto anterior"
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Próxima foto"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="flex justify-center gap-1.5 mt-3">
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
    <div className="space-y-8 pb-12">

      {/* ═══ HERO BANNER ═══ */}
      <div className="relative overflow-hidden rounded-3xl">
        <img src={neuralAbstractImg} alt="" className="w-full h-56 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-6 flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-background shadow-2xl flex-shrink-0">
            <img src={drJadsonMasterShieldLogo} alt="Dr. Jadson Fraga" className="w-full h-full object-contain bg-white" />
          </div>
          <div>
            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 mb-1">
              <Star className="w-3 h-3 mr-1" /> Neuropediatra Mais Recomendado de Petrolina
            </Badge>
            <h1 className="text-xl font-black text-foreground">Dr. Jadson Fraga Araújo Júnior</h1>
          </div>
        </div>
      </div>

      {/* ═══ IDENTITY CARD ═══ */}
      <Card className="border-primary/20 shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-chart-2 to-primary" />
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 ring-2 ring-primary/20">
              <img src={drSelfie} alt="Dr. Jadson Fraga" className="w-full h-full object-cover" />
            </div>
            <div className="text-center sm:text-left space-y-1.5">
              <h2 className="text-lg font-bold text-foreground">Neurologista Infantil / Neuropediatra</h2>
              <p className="text-sm text-primary font-semibold">O SuperNeuroPed</p>
              <p className="text-xs text-muted-foreground italic">“Cada criança é um universo. Meu papel é decifrar esse universo com ciência, empatia e respeito.”</p>
            </div>
          </div>

          {/* CRM / RQE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <Shield className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CRM-PE</p>
                <p className="text-sm font-bold text-foreground">25227</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <Shield className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CRM-BA</p>
                <p className="text-sm font-bold text-foreground">23384</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">RQE</p>
                <p className="text-sm font-bold text-foreground">17756 / 14499 / 13119</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ PHOTO GALLERY ═══ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Consultório e Bastidores
        </h2>
        <PhotoCarousel />
      </div>

      {/* ═══ CONTATO E AGENDAMENTO ═══ */}
      <Card className="border-emerald-500/20 shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            Agendamento e Contato
          </h2>

          <div className="grid gap-3">
            {/* Petrolina */}
            <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Petrolina — PE</span>
                <Badge variant="outline" className="text-[10px]">Principal</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">Rua Raimundo Lacerda, 1 — CEP 56302-470</p>
              <p className="text-xs text-muted-foreground pl-6 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Segunda a sexta, 8h às 16h
              </p>
            </div>

            {/* Juazeiro */}
            <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-chart-2" />
                <span className="text-sm font-bold text-foreground">Juazeiro — BA</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">Rua do Paraíso, 409</p>
            </div>
          </div>

          {/* Contact buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a href="tel:+558732013648">
              <Button variant="outline" className="w-full gap-2">
                <Phone className="w-4 h-4" /> Ligar
              </Button>
            </a>
            <a href="mailto:drjadsonfraga@proton.me">
              <Button variant="outline" className="w-full gap-2">
                <Mail className="w-4 h-4" /> E-mail
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
