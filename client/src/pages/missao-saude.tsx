/**
 * Estilo Missão Saúde: editorial infantil calmo, com cartões orgânicos em petróleo,
 * lavanda e menta. A interação é sempre educativa, local e sem coleta clínica.
 */
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  HeartHandshake,
  Home,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import "@/styles/missao-saude.css";

type StationId = "movimento" | "comunicacao" | "rotina";

type Station = {
  id: StationId;
  eyebrow: string;
  title: string;
  description: string;
  prompt: string;
  image: string;
  imageAlt: string;
  color: "mint" | "lilac" | "sun";
};

const STATIONS: Station[] = [
  {
    id: "movimento",
    eyebrow: "Estação 01 · Movimento",
    title: "Corpo em descoberta",
    description: "Escolha uma ideia simples para uma pausa de brincar, explorar e se movimentar com segurança.",
    prompt: "Qual convite combina com o momento de hoje?",
    image: "/missao-saude/media/movimento-brincar.jpg",
    imageAlt: "Cartaz educativo sobre brincar, movimento e exploração segura.",
    color: "mint",
  },
  {
    id: "comunicacao",
    eyebrow: "Estação 02 · Comunicação",
    title: "Uma conversa por vez",
    description: "Monte um roteiro acolhedor para lembrar que comunicação acontece em turnos, com tempo para ouvir.",
    prompt: "Organize os cartões do seu jeito e confirme quando quiser.",
    image: "/missao-saude/media/linguagem-comunicacao.jpg",
    imageAlt: "Cartaz educativo sobre linguagem, escuta e comunicação.",
    color: "lilac",
  },
  {
    id: "rotina",
    eyebrow: "Estação 03 · Rotina",
    title: "Ritmo que acolhe",
    description: "Explore uma sequência de transição tranquila. Não existe desempenho a atingir: é apenas uma ideia para conversar em casa.",
    prompt: "Mude a ordem dos cartões e crie um ritual de encerramento.",
    image: "/missao-saude/media/rotina-sono.jpg",
    imageAlt: "Cartaz educativo sobre sono, transições e rotina.",
    color: "sun",
  },
];

const MOVEMENT_CHOICES = [
  { id: "passos", title: "Passos curiosos", detail: "Caminhar junto até um ponto combinado e observar o caminho." },
  { id: "equilibrio", title: "Equilíbrio brincante", detail: "Inventar uma linha no chão e experimentar diferentes jeitos de atravessar." },
  { id: "pausa", title: "Pausa para respirar", detail: "Alongar os braços, notar o ar entrar e escolher o próximo movimento." },
];

const CONVERSATION_CARDS = ["Cumprimentar com presença", "Ouvir o outro com calma", "Responder no próprio tempo"];
const ROUTINE_CARDS = ["Avisar que a transição vem aí", "Escolher uma atividade tranquila", "Encerrar com um gesto de cuidado"];

function moveItem(items: string[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

function StationSequence({
  items,
  onMove,
  label,
}: {
  items: string[];
  onMove: (index: number, direction: -1 | 1) => void;
  label: string;
}) {
  return (
    <ol className="missao-sequence" aria-label={label}>
      {items.map((item, index) => (
        <li key={item} className="missao-sequence__item">
          <span className="missao-sequence__number" aria-hidden="true">{index + 1}</span>
          <span className="missao-sequence__text">{item}</span>
          <span className="missao-sequence__actions">
            <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Mover “${item}” para cima`}>
              <ChevronUp aria-hidden="true" />
            </button>
            <button type="button" onClick={() => onMove(index, 1)} disabled={index === items.length - 1} aria-label={`Mover “${item}” para baixo`}>
              <ChevronDown aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function MissaoSaudePage() {
  const [activeStation, setActiveStation] = useState<StationId | null>(null);
  const [completed, setCompleted] = useState<StationId[]>([]);
  const [movementChoice, setMovementChoice] = useState<string | null>(null);
  const [conversation, setConversation] = useState(CONVERSATION_CARDS);
  const [routine, setRoutine] = useState(ROUTINE_CARDS);
  const [announcement, setAnnouncement] = useState("Escolha uma estação para começar sua exploração.");

  const active = useMemo(
    () => STATIONS.find((station) => station.id === activeStation) ?? null,
    [activeStation],
  );
  const stars = completed.length;
  const isComplete = completed.length === STATIONS.length;

  function completeStation(station: StationId, message: string) {
    setCompleted((current) => current.includes(station) ? current : [...current, station]);
    setAnnouncement(message);
  }

  function selectStation(station: StationId) {
    setActiveStation(station);
    const selected = STATIONS.find((item) => item.id === station);
    setAnnouncement(`${selected?.title ?? "Estação"} aberta.`);
  }

  function restartMission() {
    setActiveStation(null);
    setCompleted([]);
    setMovementChoice(null);
    setConversation(CONVERSATION_CARDS);
    setRoutine(ROUTINE_CARDS);
    setAnnouncement("Nova exploração iniciada. Nenhuma resposta foi salva.");
  }

  return (
    <div className="missao-saude">
      <a className="missao-skip-link" href="#missao-conteudo">Pular para o conteúdo da Missão Saúde</a>
      <header className="missao-header">
        <a className="missao-brand" href="#/familia" aria-label="Voltar à página da família no NeuroPed">
          <span className="missao-brand__mark" aria-hidden="true">+</span>
          <span>NeuroPed <small>Missão Saúde</small></span>
        </a>
        <a className="missao-header__back" href="#/familia"><Home aria-hidden="true" />Famílias</a>
      </header>

      <main id="missao-conteudo" className="missao-main" tabIndex={-1}>
        <section className="missao-hero" aria-labelledby="missao-title">
          <div className="missao-hero__copy">
            <p className="missao-eyebrow"><Sparkles aria-hidden="true" /> Percurso educativo</p>
            <h1 id="missao-title">Pequenas explorações.<br /><em>Grandes conversas.</em></h1>
            <p className="missao-hero__lead">Uma jornada breve por movimento, comunicação e rotina. Sem respostas certas, sem avaliação e sem coleta de dados.</p>
            <div className="missao-safety"><ShieldCheck aria-hidden="true" /><span>O progresso fica somente nesta tela e desaparece ao sair.</span></div>
          </div>
          <div className="missao-hero__progress" aria-label={`${stars} de 3 estrelas de exploração conquistadas`}>
            <div className="missao-progress__top"><span>Seu mapa de exploração</span><strong>{stars}/3</strong></div>
            <div className="missao-progress__stars" aria-hidden="true">
              {[0, 1, 2].map((index) => <Star key={index} className={index < stars ? "is-earned" : ""} fill="currentColor" />)}
            </div>
            <p>{stars === 0 ? "Comece por onde fizer sentido." : isComplete ? "Seu mapa está completo." : "Mais uma estação quando desejar."}</p>
          </div>
        </section>

        <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

        {!active && (
          <section className="missao-stations" aria-labelledby="missao-estacoes-title">
            <div className="missao-section-heading">
              <div><p className="missao-kicker">Três estações</p><h2 id="missao-estacoes-title">Escolha um ponto de partida</h2></div>
              <p>Você pode entrar, sair e retornar à qualquer estação. Cada passo é apenas um convite para experimentar.</p>
            </div>
            <div className="missao-station-grid">
              {STATIONS.map((station, index) => {
                const done = completed.includes(station.id);
                return (
                  <article key={station.id} className={`missao-station-card missao-station-card--${station.color}`}>
                    <div className="missao-station-card__visual"><img src={station.image} alt={station.imageAlt} /><span>0{index + 1}</span></div>
                    <div className="missao-station-card__body">
                      <p>{station.eyebrow}</p><h3>{station.title}</h3><span>{station.description}</span>
                      <button type="button" className="missao-station-card__button" onClick={() => selectStation(station.id)}>
                        {done ? <><CheckCircle2 aria-hidden="true" /> Revisitar estação</> : <>Entrar na estação <ArrowRight aria-hidden="true" /></>}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {active && (
          <section className={`missao-workspace missao-workspace--${active.color}`} aria-labelledby="missao-estacao-title">
            <button type="button" className="missao-back" onClick={() => { setActiveStation(null); setAnnouncement("Você voltou ao mapa de estações."); }}><ArrowLeft aria-hidden="true" /> Voltar ao mapa</button>
            <div className="missao-workspace__grid">
              <aside className="missao-workspace__aside"><img src={active.image} alt={active.imageAlt} /><p>{active.eyebrow}</p><h2 id="missao-estacao-title">{active.title}</h2><span>{active.description}</span></aside>
              <div className="missao-workspace__activity">
                <p className="missao-kicker">Seu experimento</p><h3>{active.prompt}</h3>
                {active.id === "movimento" && (
                  <div className="missao-choice-grid" role="group" aria-label="Convites de movimento">
                    {MOVEMENT_CHOICES.map((choice) => <button key={choice.id} type="button" aria-pressed={movementChoice === choice.id} className={movementChoice === choice.id ? "is-selected" : ""} onClick={() => { setMovementChoice(choice.id); completeStation("movimento", `Você escolheu ${choice.title}. Uma estrela de exploração foi adicionada.`); }}><strong>{choice.title}</strong><span>{choice.detail}</span></button>)}
                  </div>
                )}
                {active.id === "comunicacao" && <><StationSequence items={conversation} label="Sequência de comunicação" onMove={(index, direction) => setConversation((items) => moveItem(items, index, direction))} /><button type="button" className="missao-confirm" onClick={() => completeStation("comunicacao", "Seu roteiro de conversa foi registrado somente nesta sessão. Uma estrela de exploração foi adicionada.")}>Marcar minha exploração <Star aria-hidden="true" /></button></>}
                {active.id === "rotina" && <><StationSequence items={routine} label="Sequência de rotina" onMove={(index, direction) => setRoutine((items) => moveItem(items, index, direction))} /><button type="button" className="missao-confirm" onClick={() => completeStation("rotina", "Seu ritual de encerramento está pronto para inspirar uma conversa. Uma estrela de exploração foi adicionada.")}>Guardar esta ideia <HeartHandshake aria-hidden="true" /></button></>}
                {completed.includes(active.id) && <p className="missao-complete-note"><CheckCircle2 aria-hidden="true" /> Estação explorada. Você pode ajustar suas escolhas ou seguir para outra.</p>}
              </div>
            </div>
          </section>
        )}

        {isComplete && !active && (
          <section className="missao-finish" aria-labelledby="missao-finish-title">
            <img src="/missao-saude/media/marcos-desenvolvimento.jpg" alt="Cartaz educativo sobre marcos do desenvolvimento." />
            <div><p className="missao-kicker">Mapa concluído</p><h2 id="missao-finish-title">Toda descoberta merece espaço.</h2><p>Este percurso não substitui acompanhamento profissional nem interpreta habilidades. Se quiser conversar sobre cuidado, desenvolvimento ou uma necessidade da família, a equipe pode orientar os próximos passos.</p><div className="missao-finish__actions"><a href="#/marcacao"><CircleHelp aria-hidden="true" /> Falar com a Secretaria IA</a><a href="#/marcacao"><CalendarDays aria-hidden="true" /> Ver horários</a><button type="button" onClick={restartMission}><RotateCcw aria-hidden="true" /> Recomeçar</button></div></div>
          </section>
        )}

        <section className="missao-disclaimer" aria-label="Limites da Missão Saúde"><HeartHandshake aria-hidden="true" /><p><strong>Um conteúdo para conversar, não para medir.</strong> A Missão Saúde não realiza triagem, diagnóstico ou comparação de habilidades. Ela não pede nome, idade, sintomas ou histórico.</p></section>
      </main>
      <footer className="missao-footer"><span>NeuroPed · Missão Saúde</span><span>Exploração educativa, sem registros clínicos.</span></footer>
    </div>
  );
}
