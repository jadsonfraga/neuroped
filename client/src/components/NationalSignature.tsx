import { ArrowUpRight, Compass, HeartHandshake, Layers3, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import teamImage from "@assets/images/team-multiprofessional.webp";
import { drJadsonMasterShieldLogo } from "@/assets/drJadsonMasterShieldLogo";

interface NationalSignatureProps {
  /** Compacto para a home e páginas de suporte; amplo para a página institucional. */
  compact?: boolean;
  className?: string;
}

const pillars = [
  {
    icon: Compass,
    label: "Contexto",
    text: "Instrumentos e observações organizados para o ritmo real do cuidado.",
  },
  {
    icon: HeartHandshake,
    label: "Acolhimento",
    text: "Uma linguagem que aproxima profissionais, famílias e escola.",
  },
  {
    icon: ShieldCheck,
    label: "Responsabilidade",
    text: "Privacidade, limites claros e tecnologia a serviço do julgamento clínico.",
  },
];

export function NationalSignature({ compact = false, className = "" }: NationalSignatureProps) {
  return (
    <section
      className={`np-national-signature ${compact ? "np-national-signature-compact" : ""} ${className}`}
      aria-labelledby="national-signature-title"
    >
      <div className="np-national-signature-glow" aria-hidden="true" />
      <div className="np-national-signature-copy">
        <div className="np-national-eyebrow">
          <span className="np-national-mark" aria-hidden="true">
            <img src={drJadsonMasterShieldLogo} alt="" />
          </span>
          <span>NeuroPed · uma plataforma brasileira</span>
        </div>
        <h2 id="national-signature-title">
          Tecnologia clínica com <em>alma humana.</em>
        </h2>
        <p>
          Feito para transformar informação dispersa em contexto, o NeuroPed conecta a
          observação, a conversa e o próximo passo com a calma que cada criança merece.
        </p>
        <div className="np-national-pillars">
          {pillars.map(({ icon: Icon, label, text }) => (
            <div key={label} className="np-national-pillar">
              <span className="np-national-pillar-icon" aria-hidden="true">
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div>
                <strong>{label}</strong>
                <span>{text}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="np-national-signature-footer">
          <span className="np-national-origin">
            <span className="np-origin-dot" aria-hidden="true" />
            Pensado em Petrolina/PE · desenhado para o Brasil
          </span>
          <Link href="/sobre" className="np-national-link">
            Conheça a origem
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="np-national-signature-media" aria-hidden="true">
        <div className="np-national-media-frame">
          <img src={teamImage} alt="" loading={compact ? "lazy" : "eager"} decoding="async" />
          <div className="np-national-media-caption">
            <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Da consulta à escola</span>
          </div>
        </div>
        <div className="np-national-orbit np-national-orbit-one" />
        <div className="np-national-orbit np-national-orbit-two" />
      </div>
    </section>
  );
}
