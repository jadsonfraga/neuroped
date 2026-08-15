from pathlib import Path


def replace_once(path: str, before: str, after: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(before)
    if count != 1:
        raise SystemExit(f"{path}: expected one literal eager-event target, found {count}")
    file.write_text(text.replace(before, after, 1), encoding="utf-8")


replace_once(
    "client/src/App.tsx",
    '''  const [currentPath, setCurrentPath] = useState(getCurrentHashPath);
  const [tourRequest, setTourRequest] = useState(0);
''',
    '''  const [currentPath, setCurrentPath] = useState(getCurrentHashPath);
''',
)
replace_once(
    "client/src/App.tsx",
    '''          <WelcomeTour openRequest={tourRequest} />
          <FloatingHelp
            onStartTour={() => setTourRequest((request) => request + 1)}
          />''',
    '''          <WelcomeTour />
          <FloatingHelp />''',
)

replace_once(
    "client/src/components/FloatingHelp.tsx",
    '''interface FloatingHelpProps {
  onStartTour?: () => void;
}

export function FloatingHelp({ onStartTour }: FloatingHelpProps) {''',
    '''export function FloatingHelp() {''',
)
replace_once(
    "client/src/components/FloatingHelp.tsx",
    '''  function openAuxiliarySurface(eventName: string, onOpen?: () => void) {
    if (onOpen) {
      // Registra a intenção antes de desmontar o diálogo. O host do tour
      // mantém o pedido durante lazy load e aguarda a saída visual da ajuda.
      onOpen();
      setOpen(false);
      return;
    }
    setOpen(false);
    window.setTimeout(() => {
      window.dispatchEvent(new Event(eventName));
    }, 220);
  }''',
    '''  function openAuxiliarySurface(eventName: string) {
    setOpen(false);
    // O receptor do tour é montado no bundle inicial. O evento só é emitido
    // após a animação de saída da ajuda, preservando um único modal e foco.
    window.setTimeout(() => {
      window.dispatchEvent(new Event(eventName));
    }, 220);
  }''',
)
replace_once(
    "client/src/components/FloatingHelp.tsx",
    'onClick={() => openAuxiliarySurface(OPEN_TOUR_EVENT, onStartTour)}',
    'onClick={() => openAuxiliarySurface(OPEN_TOUR_EVENT)}',
)

replace_once(
    "client/src/components/WelcomeTour.tsx",
    '''
interface WelcomeTourProps {
  openRequest?: number;
}
''',
    '\n',
)
replace_once(
    "client/src/components/WelcomeTour.tsx",
    'export function WelcomeTour({ openRequest = 0 }: WelcomeTourProps) {',
    'export function WelcomeTour() {',
)
replace_once(
    "client/src/components/WelcomeTour.tsx",
    '''  const previousFocusRef = useRef<HTMLElement | null>(null);
  const handledOpenRequestRef = useRef(0);
''',
    '''  const previousFocusRef = useRef<HTMLElement | null>(null);
''',
)
replace_once(
    "client/src/components/WelcomeTour.tsx",
    '''
  useEffect(() => {
    if (openRequest <= handledOpenRequestRef.current) return;
    handledOpenRequestRef.current = openRequest;
    const handoffTimer = window.setTimeout(() => start(), 220);
    return () => window.clearTimeout(handoffTimer);
  }, [openRequest, start]);''',
    '',
)

assistance = Path("tests/unit/assistance-surface-static.test.mjs")
assistance_text = assistance.read_text(encoding="utf-8")
start_marker = '''assert.match(
  app,
  /<WelcomeTour openRequest=\{tourRequest\} \/>/,'''
end_marker = '''assert.match(
  welcomeTour,
  /openRequest\?: number/,
  "o tour deve aceitar solicitações persistentes durante lazy load",
);'''
start = assistance_text.find(start_marker)
end = assistance_text.find(end_marker)
if start < 0 or end < 0:
    raise SystemExit("assistance contract callback block not found")
end += len(end_marker)
replacement = '''assert.match(
  app,
  /import \{ WelcomeTour \} from "@\/components\/WelcomeTour";/,
  "o receptor do tour deve estar no bundle inicial",
);
assert.match(
  app,
  /<WelcomeTour \/>[\s\S]{0,120}<FloatingHelp \/>/,
  "tour e ajuda devem compartilhar o host auxiliar persistente",
);
assert.doesNotMatch(
  app,
  /<PrivateGate>[\s\S]*<WelcomeTour[\s\S]*<\/PrivateGate>/,
  "o tour não pode depender do ciclo de vida do gate clínico",
);'''
assistance.write_text(assistance_text[:start] + replacement + assistance_text[end:], encoding="utf-8")

replace_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    '''assert.match(
  app,
  /auxiliarySurfacesVisible && \([\s\S]{0,420}<WelcomeTour openRequest=\{tourRequest\} \/>/,
  "WelcomeTour não pode competir com o aviso legal nem com o onboarding",
);''',
    '''assert.match(
  app,
  /auxiliarySurfacesVisible && \([\s\S]{0,420}<WelcomeTour \/>/,
  "WelcomeTour não pode competir com o aviso legal nem com o onboarding",
);''',
)
replace_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    '''assert.match(
  app,
  /auxiliarySurfacesVisible && \([\s\S]*?<FloatingHelp[\s\S]{0,180}onStartTour=/,
  "FloatingHelp deve permanecer protegido pelos gates e expor o callback do tour",
);''',
    '''assert.match(
  app,
  /auxiliarySurfacesVisible && \([\s\S]*?<FloatingHelp \/>/,
  "FloatingHelp deve permanecer protegido pelos gates de entrada",
);''',
)
replace_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    '/openAuxiliarySurface\\(OPEN_TOUR_EVENT,\\s*onStartTour\\)/,',
    '/openAuxiliarySurface\\(OPEN_TOUR_EVENT\\)/,',
)
