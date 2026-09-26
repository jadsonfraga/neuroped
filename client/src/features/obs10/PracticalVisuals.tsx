import { useId, type ReactNode } from "react";
import type { MaterialId, Scene } from "./practical";

const ink = "var(--o-ink)";
const paper = "var(--o-paper)";
const purple = "var(--o-primary)";
const soft = "var(--o-lilac)";
const mint = "var(--o-mint)";
const cream = "var(--o-cream)";
/** Original instructional SVGs. No external image requests, identifying people or scored stimuli. */
function Picture({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  const id = useId();
  return <svg viewBox={wide ? "0 0 320 180" : "0 0 160 120"} role="img" aria-labelledby={id} className="obs10-picture"><title id={id}>{label}</title><g stroke={ink} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">{children}</g></svg>;
}
function Block({ x = 32, y = 50, fill = soft }: { x?: number; y?: number; fill?: string }) {
  return <g><rect x={x} y={y} width="36" height="34" rx="7" fill={fill} /><path d={`M${x + 10} ${y + 6}v22m16-22v22`} strokeOpacity=".16" /></g>;
}
function Toy({ x = 75, y = 38 }: { x?: number; y?: number }) {
  return <g transform={`translate(${x},${y})`}><circle cx="-18" cy="-6" r="9" fill={cream} /><circle cx="18" cy="-6" r="9" fill={cream} /><ellipse cy="12" rx="28" ry="25" fill={cream} /><ellipse cy="25" rx="15" ry="10" fill={paper} /><circle cx="-10" cy="10" r="2" fill={ink} /><circle cx="10" cy="10" r="2" fill={ink} /><path d="M-4 21h8l-4 4zm-4 9q4 5 8 0" fill={ink} /><ellipse cy="59" rx="26" ry="22" fill={cream} /><ellipse cx="-22" cy="73" rx="13" ry="8" fill={cream} /><ellipse cx="22" cy="73" rx="13" ry="8" fill={cream} /></g>;
}
function Person({ x, y, child = false, seated = false, arms = "down" }: { x: number; y: number; child?: boolean; seated?: boolean; arms?: "down" | "forward" | "wide" | "nose" }) {
  const s = child ? .72 : 1;
  return <g transform={`translate(${x},${y}) scale(${s})`}><circle cy="-37" r="14" fill={cream} /><path d="M-12-44q12-15 24 0" fill={soft} /><circle cx="-5" cy="-37" r="1" fill={ink} /><circle cx="5" cy="-37" r="1" fill={ink} /><path d="M-4-29q4 3 8 0" fill="none" /><rect x="-15" y="-19" width="30" height="41" rx="12" fill={child ? soft : mint} /><path d={seated ? "M-9 21l-15 15h-20m53-15 15 15h20" : "M-8 21l-7 31h-7m30-31 7 31h7"} fill="none" strokeWidth="6" /><path d={arms === "forward" ? "M-14-10h-34m62 0h34" : arms === "wide" ? "M-14-10l-23-18m51 18 23-18" : arms === "nose" ? "M-14-10l-10-9 19-17m19 26 13 27" : "M-15-10l-12 27m42-27 12 27"} fill="none" strokeWidth="5" /></g>;
}
function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const a = Math.atan2(y2-y1, x2-x1), l = 8;
  return <g stroke={purple} strokeWidth="3" fill="none"><path d={`M${x1} ${y1}L${x2} ${y2}`} strokeDasharray="5 5" /><path d={`M${x2-l*Math.cos(a-.55)} ${y2-l*Math.sin(a-.55)}L${x2} ${y2}L${x2-l*Math.cos(a+.55)} ${y2-l*Math.sin(a+.55)}`} /></g>;
}
export function MaterialPicture({ id, label }: { id: MaterialId; label: string }) {
  let content: ReactNode;
  switch (id) {
    case "device": content = <><path d="M80 72v31m0-14-24 18m24-18 24 18" fill="none" strokeWidth="4" /><rect x="22" y="18" width="116" height="62" rx="12" fill={soft} /><rect x="35" y="27" width="86" height="43" rx="5" fill={paper} /><circle cx="129" cy="49" r="3" fill={purple} /><path d="M49 42v-7h12m45 7v-7H94m-45 19v7h12m45-7v7H94" stroke={purple} fill="none" /></>; break;
    case "mat": content = <><path d="M28 43h103l18 50H12z" fill={mint} /><path d="M28 43v-9h103v9m-97 8L20 87m111-36 10 36" fill="none" /><path d="M48 45v40m22-40v40m23-40v40m23-40v40" strokeOpacity=".15" /></>; break;
    case "target": content = <><ellipse cx="80" cy="91" rx="52" ry="10" fill={mint} stroke="none" /><Toy x={80} y={18} /></>; break;
    case "blocks": content = <><Block x={23} y={68} fill={mint} /><Block x={67} y={68} fill={cream} /><Block x={53} y={28} /><Block x={107} y={61} fill={soft} /></>; break;
    case "bowl": content = <><path d="M25 40h110l-12 53H37z" fill={mint} /><ellipse cx="80" cy="40" rx="55" ry="12" fill={paper} /><path d="M45 72h70" strokeOpacity=".2" /><ellipse cx="101" cy="19" rx="39" ry="7" fill={soft} /></>; break;
    case "cloth": content = <><path d="M39 28q38 10 71-2l28 67q-31-10-104 3L19 47z" fill={soft} /><path d="m39 29-5 67m76-70 12 63M24 47q60 10 94-1" fill="none" strokeOpacity=".35" /></>; break;
    case "doll": content = <><ellipse cx="80" cy="105" rx="40" ry="6" fill={mint} stroke="none" /><Person x={80} y={53} child /></>; break;
    case "spoon": content = <g transform="rotate(25 80 60)"><ellipse cx="80" cy="30" rx="21" ry="25" fill={soft} /><rect x="73" y="48" width="14" height="60" rx="7" fill={mint} /></g>; break;
    case "cup": content = <><path d="M48 30h60l-6 63H54z" fill={mint} /><path d="M108 43h11q25 0 9 25l-22 4" fill="none" strokeWidth="7" /><ellipse cx="78" cy="30" rx="30" ry="9" fill={paper} /></>; break;
    case "car": content = <><path d="M23 72v-19h22l16-25h39l20 25h17v26H23z" fill={soft} /><path d="M67 36h27l12 17H55z" fill={paper} /><circle cx="46" cy="80" r="13" fill={mint} /><circle cx="115" cy="80" r="13" fill={mint} /></>; break;
    case "book": content = <><path d="M17 27q31-9 63 5 32-14 63-5v68q-32-9-63 5-32-14-63-5z" fill={paper} /><path d="M80 32v68" /><circle cx="48" cy="55" r="13" fill={cream} /><path d="m102 83 14-31 15 31z" fill={mint} /></>; break;
    case "paper": content = <><rect x="37" y="17" width="75" height="95" rx="5" fill={soft} transform="rotate(8 80 65)" /><path d="M37 10h67l17 18v74H37z" fill={paper} /><path d="M104 10v18h17" fill={mint} /></>; break;
    case "crayon": content = <><g transform="rotate(20 60 63)"><path d="m47 24 12-17 12 17v77H47z" fill={soft} /><path d="M47 46h24v37H47z" fill={mint} /></g><g transform="rotate(-12 101 65)"><path d="m89 34 12-17 12 17v77H89z" fill={cream} /><path d="M89 56h24v37H89z" fill={soft} /></g></>; break;
    case "pencil": content = <g transform="rotate(32 80 60)"><path d="m72 22 8-17 8 17v81H72z" fill={cream} /><path d="M76 16h8l-4-10z" fill={ink} /><path d="M80 23v70m-8 1h16" /><rect x="72" y="94" width="16" height="13" rx="3" fill={soft} /></g>; break;
    case "ball": content = <><circle cx="80" cy="60" r="43" fill={cream} /><path d="M41 43q35-14 74 24M69 18q-6 52 33 82M43 85q51 0 70-52" fill="none" stroke={purple} strokeWidth="4" /></>; break;
    case "chair": content = <><rect x="47" y="15" width="67" height="43" rx="9" fill={mint} /><path d="M51 54v20m59-20v20" strokeWidth="5" /><rect x="35" y="72" width="90" height="12" rx="5" fill={soft} /><path d="M45 84v24m70-24v24" strokeWidth="6" /></>; break;
    case "path": content = <><path d="M15 80h130" strokeWidth="3" /><path d="M25 68v22m110-22v22" stroke={purple} strokeWidth="6" /><Arrow x1={37} y1={43} x2={123} y2={43} /><ellipse cx="61" cy="72" rx="7" ry="13" fill={mint} /><ellipse cx="83" cy="75" rx="7" ry="13" fill={soft} /></>; break;
  }
  return <Picture label={label}>{content}</Picture>;
}
export function TaskPicture({ scene, label }: { scene: Scene; label: string }) {
  let content: ReactNode;
  const floor = <path d="M20 150h280" strokeOpacity=".35" />;
  switch (scene) {
    case "frame-face": content = <><rect x="20" y="10" width="280" height="158" rx="16" fill={paper} /><path d="M34 45V25h25m227 20V25h-25M34 135v20h25m227-20v20h-25" stroke={purple} fill="none" /><Person x={190} y={100} child /><Person x={107} y={98} seated /><path d="M146 136h78" /></>; break;
    case "frame-body": content = <><rect x="20" y="10" width="280" height="158" rx="16" fill={paper} />{floor}<Person x={110} y={106} child /><Person x={230} y={95} /><Arrow x1={44} y1={156} x2={266} y2={156} /></>; break;
    case "frame-hands": content = <><rect x="25" y="18" width="270" height="148" rx="13" fill={mint} /><rect x="92" y="49" width="130" height="95" rx="4" fill={paper} /><path d="M37 109q37-35 75-36l13 19-25 23-45 19m225-55-57 40-20-8 22-39 47-27" fill={cream} /><path d="m182 131 52-77 6 4-52 77z" fill={soft} /></>; break;
    case "mat": case "prone": content = <>{floor}<path d="M30 146h190l23 13H16z" fill={mint} /><circle cx="60" cy="113" r="18" fill={cream} /><ellipse cx="111" cy="128" rx="35" ry="14" fill={soft} /><path d={scene === "prone" ? "m84 127-18 16H45m98-15 43 12m-39-13 31-3" : "m85 124-22 11m78-5 34 15m-30-17 31 3"} fill="none" strokeWidth="7" /><Person x={265} y={89} /><path d="M222 104q-21 4-26 25" fill="none" strokeDasharray="4 4" /></>; break;
    case "target": case "reach": content = <>{floor}<Person x={110} y={105} child seated /><g transform="translate(155 3) scale(.8)"><Toy x={80} y={18} /></g><Arrow x1={143} y1={82} x2={187} y2={65} />{scene === "target" && <Arrow x1={209} y1={27} x2={265} y2={27} />}</>; break;
    case "hide": content = <>{floor}<g transform="translate(102 15) scale(.8)"><Toy x={80} y={18} /></g><path d="M169 65q35-7 47 6l26 67H150z" fill={soft} /><path d="m235 60 28 2-6-20" fill="none" stroke={purple} /></>; break;
    case "blocks": content = <>{floor}<Block x={79} y={103} fill={mint} /><Block x={122} y={103} fill={cream} /><Block x={121} y={66} /><path d="M207 102h70l-7 40h-56z" fill={soft} /><Arrow x1={166} y1={85} x2={232} y2={90} /></>; break;
    case "pretend": content = <>{floor}<Person x={155} y={112} child seated /><path d="M62 99h48l-5 40H67z" fill={mint} /><ellipse cx="106" cy="59" rx="14" ry="9" fill={soft} /><path d="m57 76 40-13" strokeWidth="7" /><Arrow x1={117} y1={58} x2={136} y2={72} /></>; break;
    case "walk": content = <>{floor}<Person x={100} y={109} child /><Person x={240} y={94} /><Arrow x1={65} y1={161} x2={201} y2={161} /><path d="M46 145v10m169-10v10" stroke={purple} strokeWidth="6" /></>; break;
    case "rise": content = <>{floor}<Person x={76} y={119} child seated /><Arrow x1={106} y1={86} x2={166} y2={60} /><Person x={189} y={109} child /><Person x={271} y={94} /></>; break;
    case "arms": content = <>{floor}<g aria-hidden="true"><circle cx="142" cy="66" r="13" fill={cream} /><path d="m153 62 6 6-7 3" fill={cream} /><rect x="131" y="83" width="27" height="34" rx="9" fill={soft} /><path d="m136 117-5 28h-7m27-28 5 28h7" fill="none" strokeWidth="5" /><path d="M155 92h77q6 0 10-6M154 106h75q6 0 10-6" fill="none" strokeWidth="5" /><Arrow x1={179} y1={129} x2={233} y2={129} /></g></>; break;
    case "nose": content = <>{floor}<Person x={132} y={106} child arms="nose" /><path d="M250 86h-53m11-9-13 9 13 5" fill="none" strokeWidth="5" /><Arrow x1={187} y1={70} x2={142} y2={70} /></>; break;
    case "jump": content = <>{floor}<Person x={241} y={94} /><ellipse cx="116" cy="150" rx="27" ry="3" fill={mint} stroke="none" /><circle cx="116" cy="70" r="12" fill={cream} /><rect x="103" y="85" width="26" height="32" rx="9" fill={soft} /><path d="m108 117-12 19h13m13-19 12 19h-13m-17-42-17 7m42-7 17 7" fill="none" strokeWidth="5" /><Arrow x1={67} y1={143} x2={67} y2={116} /></>; break;
    case "balance": content = <>{floor}<Person x={238} y={94} /><circle cx="117" cy="70" r="12" fill={cream} /><rect x="105" y="85" width="26" height="32" rx="9" fill={soft} /><path d="M110 117v32h-9m23-32 17 18-13 5M106 92l-19 8m43-8 18 8" fill="none" strokeWidth="5" /></>; break;
    case "ball": content = <>{floor}<Person x={75} y={109} child /><Person x={255} y={94} /><circle cx="169" cy="127" r="20" fill={cream} /><path d="M153 115q12 30 29 24m-22-32q21 20 8 41" fill="none" stroke={purple} /><Arrow x1={185} y1={75} x2={220} y2={83} /></>; break;
    case "draw": content = <><rect x="36" y="26" width="245" height="124" rx="16" fill={mint} /><rect x="65" y="42" width="116" height="95" rx="3" fill={paper} /><circle cx="111" cy="78" r="18" fill="none" stroke={purple} /><path d="M80 116q13-20 32-9t40-8" fill="none" /><path d="m198 111 34-64 10 5-33 65z" fill={cream} /><path d="m194 126 4-15 11 6z" fill={ink} /></>; break;
    case "hands": content = <><rect x="30" y="107" width="260" height="41" rx="9" fill={mint} /><path d="M69 124V69q2-12 9 0V45q5-12 10 0v19-30q7-10 11 1v29-21q8-9 12 1v45l8-10q10-6 9 8l-14 36z" fill={cream} /><path d="M210 125V84l-8-16q3-12 10-2l8 16V48q5-12 10 0v30-25q8-10 12 1v29-22q8-9 11 1v32-20q9-6 10 6v46z" fill={cream} /><Arrow x1={137} y1={64} x2={180} y2={64} /></>; break;
    case "words": content = <>{floor}<Person x={81} y={93} seated /><Person x={252} y={106} child seated /><path d="M127 29h74v44h-24l-15 12V73h-35z" fill={paper} /><circle cx="146" cy="51" r="3" fill={purple} /><circle cx="164" cy="51" r="3" fill={purple} /><circle cx="182" cy="51" r="3" fill={purple} /></>; break;
    case "plan": content = <><rect x="45" y="35" width="61" height="92" rx="10" fill={mint} /><rect x="129" y="35" width="61" height="92" rx="10" fill={soft} /><rect x="213" y="35" width="61" height="92" rx="10" fill={cream} /><path d="M58 57h34m-34 17h26m-26 17h31m54-34h34m-34 17h26m-26 17h31m54-34h34m-34 17h26m-26 17h31" strokeOpacity=".4" /><Arrow x1={102} y1={145} x2={224} y2={145} /></>; break;
    case "rule": content = <><circle cx="104" cy="80" r="29" fill={cream} /><path d="M104 29v12m0 78v12M53 80h12m78 0h12m-87-36 9 9m55 55 9 9m0-73-9 9m-55 55-9 9" stroke={purple} /><path d="M239 45a39 39 0 1 0 12 64q-45 0-12-64z" fill={soft} /></>; break;
    case "picture-play": content = <><path d="M15 146h290" strokeOpacity=".3" /><Person x={108} y={109} child /><circle cx="204" cy="128" r="21" fill={cream} /><path d="m149 134 29-8" stroke={purple} fill="none" /></>; break;
    case "picture-eat": content = <><Person x={170} y={97} child seated /><path d="M74 122h184v10H74zm12 10v34m160-34v34" fill={mint} /><ellipse cx="168" cy="118" rx="28" ry="8" fill={paper} /><path d="m222 109-36-16" strokeWidth="5" /><ellipse cx="181" cy="90" rx="10" ry="5" fill={soft} /></>; break;
    case "picture-cat": content = <>{floor}<path d="M83 102h159v13H83zm12 13v37m136-37v37" fill={mint} /><ellipse cx="165" cy="83" rx="46" ry="19" fill={cream} /><path d="m117 83-9-22 13 6 9-11 8 23" fill={cream} /><ellipse cx="123" cy="82" rx="20" ry="16" fill={cream} /><path d="m116 82 5 1m7-1 5-1m19 13h24m28-12q47 0 25-25" fill="none" /></>; break;
    case "book": content = <><path d="M49 39q55-8 110 10 54-18 111-10v101q-57-10-111 10-55-20-110-10z" fill={paper} /><path d="M159 49v101" /><circle cx="106" cy="80" r="20" fill={cream} /><path d="m206 116 23-44 20 44z" fill={mint} /></>; break;
    case "face": case "welcome": case "finish": content = <>{floor}<Person x={90} y={93} seated /><Person x={235} y={105} child arms={scene === "finish" ? "wide" : "down"} /><path d="M139 40h48v27h-14l-9 10V67h-25z" fill={soft} /><path d="m150 54 7 5 18-13" stroke={purple} fill="none" /></>; break;
  }
  return <Picture wide label={label}>{content}</Picture>;
}
