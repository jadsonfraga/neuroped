import { useId } from "react";
export const ART_LABELS: Record<string, string> = {
  bola: "bola",
  carro: "carro",
  bebe: "bebê",
  colher: "colher",
  copo: "copo",
  telefone: "telefone",
  caixa: "caixa",
  banana: "banana",
  "bola-grande": "bola grande",
  "bola-pequena": "bola pequena",
  cachorro: "cachorro",
  gato: "gato",
  coelho: "coelho",
  peixe: "peixe",
  sol: "sol",
  lua: "lua",
};
/** Vetores autorais estáveis: nenhum emoji, fonte de ícones ou imagem remota é o estímulo. */
export function SondaObject({ item }: { item: string }) {
  const title = useId();
  const ball = item.startsWith("bola");
  return (
    <svg
      viewBox="0 0 160 140"
      role="img"
      aria-labelledby={title}
      className="h-full w-full"
    >
      <title id={title}>{ART_LABELS[item] ?? item}</title>
      {ball && (
        <g
          transform={
            item === "bola-pequena" ? "translate(40 35) scale(.5)" : undefined
          }
        >
          <circle cx="80" cy="70" r="51" fill="hsl(205 75% 48%)" />
          <path
            d="M37 43 Q80 78 123 43 M31 83 Q80 45 129 83"
            fill="none"
            stroke="white"
            strokeWidth="8"
          />
        </g>
      )}
      {item === "carro" && (
        <g>
          <path
            d="M18 72 L42 66 L58 39 H108 L126 67 H142 V103 H18Z"
            fill="hsl(4 70% 52%)"
          />
          <path
            d="M63 46 H80 V66 H51Z M88 46 H105 L118 66 H88Z"
            fill="hsl(192 70% 85%)"
          />
          <circle cx="47" cy="103" r="16" fill="hsl(220 20% 20%)" />
          <circle cx="117" cy="103" r="16" fill="hsl(220 20% 20%)" />
        </g>
      )}
      {item === "bebe" && (
        <g>
          <ellipse cx="80" cy="96" rx="38" ry="35" fill="hsl(168 45% 56%)" />
          <circle cx="80" cy="47" r="31" fill="hsl(28 66% 78%)" />
          <circle cx="69" cy="47" r="3" />
          <circle cx="91" cy="47" r="3" />
          <path
            d="M68 59 Q80 69 92 59"
            fill="none"
            stroke="hsl(20 40% 32%)"
            strokeWidth="3"
          />
        </g>
      )}
      {item === "colher" && (
        <g fill="hsl(211 18% 58%)">
          <ellipse cx="80" cy="40" rx="24" ry="30" />
          <rect x="73" y="60" width="14" height="67" rx="7" />
        </g>
      )}
      {item === "copo" && (
        <g>
          <path d="M43 33 H108 L101 118 H50Z" fill="hsl(180 53% 58%)" />
          <path
            d="M108 47 C152 38 153 102 106 94"
            fill="none"
            stroke="hsl(180 53% 45%)"
            strokeWidth="11"
          />
          <ellipse cx="75" cy="33" rx="32" ry="7" fill="hsl(180 45% 28%)" />
        </g>
      )}
      {item === "telefone" && (
        <g>
          <rect
            x="46"
            y="14"
            width="68"
            height="116"
            rx="14"
            fill="hsl(220 24% 24%)"
          />
          <rect x="54" y="30" width="52" height=" 70" fill="none" />
          <rect
            x="55"
            y="31"
            width="50"
            height="65"
            rx="4"
            fill="hsl(180 55% 78%)"
          />
          <circle cx="80" cy="112" r="7" fill="white" />
        </g>
      )}
      {item === "caixa" && (
        <g>
          <path
            d="M25 46 L78 21 L135 45 V106 L81 131 L25 103Z"
            fill="hsl(33 62%  60)"
          />
          <path d="M25 46 L78 21 L135 45 L81 70Z" fill="hsl(33 65% 72%)" />
          <path d="M25 46 V103 L81 131 V70Z" fill="hsl(33 50% 52%)" />
          <path d="M81 70 L135 45 V106 L81 131Z" fill="hsl(33 45%  40)" />
        </g>
      )}
      {item === "banana" && (
        <path
          d="M34 30 Q41 110 126 55 Q101 143 49 106 Q18 83 34 30Z"
          fill="hsl(48 90% 60%)"
          stroke="hsl(39 70% 38%)"
          strokeWidth="3"
        />
      )}
      {["cachorro", "gato", "coelho"].includes(item) && (
        <g>
          <path
            d={
              item === "coelho"
                ? "M52 53 Q20 -15 55 5 L75 56 M87 56 L104 5 Q140 -15 110  60"
                : "M45 42 L20 14 L24 91 L58  70 M100 42 L139 14 L139 91 L102  70"
            }
            fill="hsl(28 43% 46%)"
          />
          <ellipse
            cx="80"
            cy="78"
            rx="46"
            ry=" 40"
            fill={
              item === "gato"
                ? "hsl(32 75% 66%)"
                : item === "coelho"
                  ? "hsl(210 15%  80)"
                  : "hsl(28  40% 65%)"
            }
          />
          <circle cx="64" cy="69" r="5" />
          <circle cx="96" cy="69" r="5" />
          <ellipse cx="80" cy="89" rx="8" ry="6" fill="hsl(20 30% 25%)" />
          {item === "gato" && (
            <path
              d="M35 86 H65 M95 86 H125 M36 98 L65 92 M95 92 L125 98"
              stroke="hsl(20 30% 25%)"
              strokeWidth="3"
            />
          )}
        </g>
      )}
      {item === "peixe" && (
        <g fill="hsl(192 65%  50)">
          <ellipse cx="68" cy=" 70" rx=" 40" ry="30" />
          <path d="M103 70 L141 36 V104Z" />
          <circle cx="47" cy="63" r="5" fill="hsl(220 20% 20%)" />
        </g>
      )}
      {item === "sol" && (
        <g stroke="hsl( 40 90% 50%)" strokeWidth="8">
          <circle cx="80" cy="70" r="32" fill="hsl(48  90%  60%)" />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              transform={`rotate(${i * 45} 80 70)`}
              d="M80 14 V26"
            />
          ))}
        </g>
      )}
      {item === "lua" && (
        <path
          d="M104 19 C38 0 14 88 66 116 Q102 136 132 98 C71 109 59 48 104 19Z"
          fill="hsl(221 45%  60)"
        />
      )}
      {!ART_LABELS[item] && (
        <text
          x="80"
          y="80"
          textAnchor="middle"
          fontSize={item.length > 5 ? 19 : 38}
          fontWeight="700"
          fill="currentColor"
        >
          {item}
        </text>
      )}
    </svg>
  );
}
function Person({
  x,
  y,
  shirt = "hsl(203  60%  40%)",
}: {
  x: number;
  y: number;
  shirt?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cy="-35" r="22" fill="hsl(28  60%  70%)" />
      <path d="M-20 0 Q0 -15 20 0 L28 65 H-28Z" fill={shirt} />
      <path
        d="M-12 65 V112 M12 65 V112 M-20 12 L- 40 55 M20 12 L40 55"
        stroke="hsl(220  20%  30%)"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </g>
  );
}
export function SondaScene({
  kind,
}: {
  kind: "rain" | "juice" | "social" | "message";
}) {
  if (kind === "message")
    return (
      <div className="w-full max-w-md rounded-3xl border-2 border-slate-300 bg-slate-50 p-6 text-slate-950">
        <div className="border-b pb-4 font-semibold">Conversa fictícia</div>
        <div className="ml-8 mt-8 rounded-2xl bg-cyan-100 p-5 text-xl">
          Vamos fazer o trabalho juntos amanhã?
          <p className="mt-4 text-right text-sm">Visualizada ✓✓</p>
        </div>
        <div className="h-28" />
      </div>
    );
  return (
    <svg
      viewBox="0 0 760 430"
      role="img"
      aria-label={
        kind === "social"
          ? "Cena: duas crianças conversam perto de uma mesa; outra chega com uma mochila."
          : "Cena para contar uma história."
      }
      className="w-full max-w-4xl rounded-3xl bg-sky-50"
    >
      <path d="M0 335 H760 V430 H0Z" fill="hsl(143  30%  80%)" />
      {kind === "rain" && (
        <>
          <path
            d="M490 175 L610 85 L730 175 V330 H490Z"
            fill="hsl(36  60%  70%)"
          />
          <path
            d="M475 175 L610 70 L745 175"
            fill="none"
            stroke="hsl(15  50%  40%)"
            strokeWidth="15"
          />
          <path d="M260 130 Q380 -20 490 130Z" fill="hsl(2  60%  60%)" />
          <path
            d="M375 130 V285 Q375 310 352 297"
            fill="none"
            stroke="hsl(220  20%  30%)"
            strokeWidth="9"
          />
          <Person x={290} y={215} />
          {Array.from({ length: 16 }, (_, i) => (
            <path
              key={i}
              d={`M${25 + i * 40} ${25 + (i % 3) * 20} l-10 25`}
              stroke="hsl(205  50%  60%)"
              strokeWidth="4"
            />
          ))}
        </>
      )}
      {kind === "juice" && (
        <>
          <Person x={205} y={210} />
          <Person x={565} y={215} shirt="hsl(340  40%  60%)" />
          <path
            d="M280 240 H500 M300 240 V350 M480 240 V350"
            stroke="hsl(28  40%  40%)"
            strokeWidth="20"
          />
          <ellipse cx="410" cy="358" rx="68" ry="16" fill="hsl(35  90%  60%)" />
          <path
            d="M410 275 L440 260 L465 296 L435 310Z"
            fill="hsl(180  50%  60%)"
          />
        </>
      )}
      {kind === "social" && (
        <>
          <Person x={170} y={220} />
          <Person x={285} y={218} shirt="hsl(340  40%  60%)" />
          <Person x={580} y={218} shirt="hsl(35  70%  60%)" />
          <rect
            x="610"
            y="228"
            width="36"
            height="65"
            rx="12"
            fill="hsl(264  40%  50%)"
          />
          <path
            d="M325 280 H455 M345 280 V360 M435 280 V360"
            stroke="hsl(28  40%  40%)"
            strokeWidth="14"
          />
        </>
      )}
    </svg>
  );
}
