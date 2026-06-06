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
import drJadsonLogo from "@assets/dr-jadson-logo.jpeg";
import neuralAbstractImg from "@assets/images/neural-abstract.png";
import drSelfie from "@assets/images/dr-jadson-selfie.jpeg";
import drBatman from "@assets/images/dr-jadson-consultorio-batman.jpeg";
import drSuperman from "@assets/images/dr-jadson-consultorio-superman.jpeg";
import drFull from "@assets/images/dr-jadson-consultorio-full.jpeg";
import drArte from "@assets/images/dr-jadson-arte.jpeg";
import drLogoSuper from "@assets/images/dr-jadson-logo-super.jpeg";

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
            <img src={drLogoSuper} alt="Dr. Jadson Fraga" className="w-full h-full object-contain bg-white" />
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
              <p className="text-xs text-muted-foreground italic">"Cada criança é um universo. Meu papel é decifrar esse universo com ciência, empatia e respeito."</p>
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
              <Button variant="outline" size="sm" className="w-full gap-2 h-10">
                <Phone className="w-3.5 h-3.5" />
                <span className="text-xs">(87) 3201-3648</span>
              </Button>
            </a>
            <a href="https://wa.me/5587991055790" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="w-full gap-2 h-10 bg-emerald-600 hover:bg-emerald-700 text-white">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="text-xs">WhatsApp</span>
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a href="https://www.drjadsonfraga.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full gap-2 h-9">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-xs">drjadsonfraga.com</span>
              </Button>
            </a>
            <a href="https://www.instagram.com/drjadsonfraganeuroped" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full gap-2 h-9">
                <Instagram className="w-3.5 h-3.5" />
                <span className="text-xs">@drjadsonfraganeuroped</span>
              </Button>
            </a>
          </div>

          <a href="mailto:jadsonfraga@hotmail.com">
            <Button variant="outline" size="sm" className="w-full gap-2 h-9 mt-1">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-xs">jadsonfraga@hotmail.com</span>
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* ═══ VALORES DE CONSULTA ═══ */}
      <Card className="border-amber-500/20 shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-amber-500 to-yellow-500" />
        <CardContent className="p-6 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            Consultas
          </h2>
          <div className="max-w-xs mx-auto">
            <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center space-y-1">
              <Stethoscope className="w-6 h-6 text-amber-600 mx-auto" />
              <p className="text-xs font-semibold text-foreground">Consulta Presencial</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">R$ 750</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">Aceita Unimed como convênio</p>
        </CardContent>
      </Card>

      {/* ═══ FORMAÇÃO ACADÊMICA ═══ */}
      <Card className="shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-violet-600" />
            Formação Acadêmica
          </h2>
          <div className="space-y-3">
            {[
              { title: "Graduação em Medicina", place: "UFPE — Universidade Federal de Pernambuco", local: "Recife, PE", color: "bg-blue-500" },
              { title: "Residência em Pediatria", place: "Hospital Federal da Lagoa", local: "Rio de Janeiro, RJ", color: "bg-emerald-500" },
              { title: "Residência em Neuropediatria", place: "Hospital Santo Antônio — Obras Sociais Irmã Dulce", local: "Salvador, BA", color: "bg-amber-500" },
              { title: "Título de Neurologista Infantil", place: "Obras Sociais Irmã Dulce", local: "2017", color: "bg-violet-500" },
              { title: "Pós-graduação em Psiquiatria Infantil", place: "Em andamento", local: "", color: "bg-rose-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
                  {i < 4 && <div className="w-0.5 h-8 bg-border" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.place}</p>
                  {item.local && <p className="text-[11px] text-muted-foreground/70">{item.local}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ ÁREAS DE ATUAÇÃO ═══ */}
      <Card className="shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary to-chart-2" />
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Áreas de Atuação
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "TDAH", "Autismo / TEA", "Epilepsia", "Atraso do Desenvolvimento",
              "Cefaleia Infantil", "Tiques / Tourette", "Paralisia Cerebral",
              "Deficiência Intelectual", "Distúrbios do Sono", "Transtornos de Aprendizagem",
              "Psiquiatria Infantil", "Neurodesenvolvimento"
            ].map((area) => (
              <div key={area} className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50 border text-xs font-medium text-foreground">
                <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                {area}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ DEPOIMENTOS ═══ */}
      <Card className="shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-500" />
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            O Que Dizem os Pacientes
          </h2>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
            </div>
            <span className="text-xs text-muted-foreground">Nota máxima na Doctoralia — 31 avaliações</span>
          </div>
          <div className="space-y-3">
            {[
              { text: "O melhor neuropediatra do Vale do São Francisco. Atencioso, didático e extremamente competente.", author: "Mãe de paciente" },
              { text: "Dr. Jadson tem uma paciência incrível com as crianças. Explica tudo com calma e carinho. Meu filho adora ir na consulta.", author: "Pai de paciente" },
              { text: "Profissional excepcional. Conduziu a investigação do meu filho com rigor científico e muita empatia. Recomendo de olhos fechados.", author: "Mãe de paciente" },
            ].map((dep, i) => (
              <div key={i} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30">
                <p className="text-xs text-foreground italic leading-relaxed">"{dep.text}"</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">— {dep.author}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ GALLERY STRIP (mini thumbnails) ═══ */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[drSuperman, drBatman, drFull, drArte, drSelfie].map((src, i) => (
          <div key={i} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden shadow-md">
            <img src={src} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
          </div>
        ))}
      </div>

      {/* ═══ CTA FINAL ═══ */}
      <Card className="bg-gradient-to-br from-primary via-chart-2 to-primary/80 text-white shadow-xl overflow-hidden">
        <CardContent className="p-6 text-center space-y-3">
          <Stethoscope className="w-8 h-8 mx-auto opacity-80" />
          <h2 className="text-lg font-bold">Agende Sua Consulta</h2>
          <p className="text-sm text-white/80">Avaliação completa do neurodesenvolvimento do seu filho</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <a href="tel:+558732013648">
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 gap-2 font-bold shadow-lg">
                <Phone className="w-4 h-4" /> (87) 3201-3648
              </Button>
            </a>
            <a href="https://wa.me/5587991055790" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-bold shadow-lg">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* ═══ FOOTER ═══ */}
      <div className="text-center space-y-1 pt-4">
        <p className="text-[11px] text-muted-foreground">NeuroPed Escalas — Propriedade Intelectual</p>
        <p className="text-[10px] text-muted-foreground/50">Dr. Jadson Fraga Araújo Júnior — CRM-PE 25227 — Petrolina, PE</p>
      </div>
    </div>
  );
}
