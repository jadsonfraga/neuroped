from pathlib import Path
import re


def sub_once(path: str, pattern: str, replacement: str, flags: int = 0) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    updated, count = re.subn(
        pattern,
        lambda _match: replacement,
        text,
        count=1,
        flags=flags,
    )
    if count != 1:
        raise SystemExit(f"{path}: expected one replacement target, found {count}")
    file.write_text(updated, encoding="utf-8")


sub_once(
    "client/src/App.tsx",
    r'  const \[currentPath, setCurrentPath\] = useState\(getCurrentHashPath\);\n',
    '''  const [currentPath, setCurrentPath] = useState(getCurrentHashPath);
  const [tourRequest, setTourRequest] = useState(0);
''',
)
sub_once(
    "client/src/App.tsx",
    r'\n\s*\{auxiliarySurfacesVisible && \(\n\s*<Suspense fallback=\{null\}>\n\s*<WelcomeTour />\n\s*</Suspense>\n\s*\)\}',
    '',
)
sub_once(
    "client/src/App.tsx",
    r'\s*<InstallPrompt />\n\s*<Suspense fallback=\{null\}>\n\s*<PreferencesPanel />\n\s*</Suspense>\n\s*<FloatingHelp />',
    '''
          <InstallPrompt />
          <Suspense fallback={null}>
            <PreferencesPanel />
          </Suspense>
          <Suspense fallback={null}>
            <WelcomeTour openRequest={tourRequest} />
          </Suspense>
          <FloatingHelp
            onStartTour={() => setTourRequest((request) => request + 1)}
          />''',
)

sub_once(
    "client/src/components/FloatingHelp.tsx",
    r'export function FloatingHelp\(\) \{',
    '''interface FloatingHelpProps {
  onStartTour?: () => void;
}

export function FloatingHelp({ onStartTour }: FloatingHelpProps) {''',
)
sub_once(
    "client/src/components/FloatingHelp.tsx",
    r'  function openAuxiliarySurface\(eventName: string\) \{\n\s*setOpen\(false\);\n\s*window\.requestAnimationFrame\(\(\) => \{\n\s*window\.dispatchEvent\(new Event\(eventName\)\);\n\s*\}\);\n\s*\}',
    '''  function openAuxiliarySurface(eventName: string, onOpen?: () => void) {
    setOpen(false);
    // Aguarda a saída do Dialog para manter um único modal e um único
    // dono de foco. O callback preserva a solicitação mesmo com lazy load.
    window.setTimeout(() => {
      if (onOpen) {
        onOpen();
        return;
      }
      window.dispatchEvent(new Event(eventName));
    }, 220);
  }''',
)
sub_once(
    "client/src/components/FloatingHelp.tsx",
    r'onClick=\{\(\) => openAuxiliarySurface\(OPEN_TOUR_EVENT\)\}',
    'onClick={() => openAuxiliarySurface(OPEN_TOUR_EVENT, onStartTour)}',
)

sub_once(
    "client/src/components/WelcomeTour.tsx",
    r'interface Rect \{\n  left: number;\n  top: number;\n  width: number;\n  height: number;\n\}',
    '''interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface WelcomeTourProps {
  openRequest?: number;
}''',
)
sub_once(
    "client/src/components/WelcomeTour.tsx",
    r'export function WelcomeTour\(\) \{',
    'export function WelcomeTour({ openRequest = 0 }: WelcomeTourProps) {',
)
sub_once(
    "client/src/components/WelcomeTour.tsx",
    r'  const previousFocusRef = useRef<HTMLElement \| null>\(null\);\n',
    '''  const previousFocusRef = useRef<HTMLElement | null>(null);
  const handledOpenRequestRef = useRef(0);
''',
)
sub_once(
    "client/src/components/WelcomeTour.tsx",
    r'  useEffect\(\(\) => \{\n    const openTour = \(\) => start\(\);\n    window\.addEventListener\("neuroped:open-tour", openTour\);\n    return \(\) => window\.removeEventListener\("neuroped:open-tour", openTour\);\n  \}, \[start\]\);',
    '''  useEffect(() => {
    const openTour = () => start();
    window.addEventListener("neuroped:open-tour", openTour);
    return () => window.removeEventListener("neuroped:open-tour", openTour);
  }, [start]);

  useEffect(() => {
    if (openRequest <= handledOpenRequestRef.current) return;
    handledOpenRequestRef.current = openRequest;
    start();
  }, [openRequest, start]);''',
)

sub_once(
    "scripts/audit-assistance-states.mjs",
    r'      const visible = \(element\) => \{\n\s*if \(!\(element instanceof HTMLElement\)\) return false;\n\s*const style = getComputedStyle\(element\);\n\s*const box = element\.getBoundingClientRect\(\);\n\s*return style\.display !== "none"\n\s*&& style\.visibility !== "hidden"\n\s*&& Number\(style\.opacity\) !== 0\n\s*&& box\.width > 0\n\s*&& box\.height > 0;\n\s*\};',
    '''      const visible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        if (
          element.closest('[hidden], [inert], [aria-hidden="true"], [data-state="closed"]')
        ) return false;
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity) !== 0
          && box.width > 0
          && box.height > 0
          && box.right > 0
          && box.bottom > 0
          && box.left < innerWidth
          && box.top < innerHeight;
      };''',
)

sub_once(
    "tests/unit/assistance-surface-static.test.mjs",
    r'\nconsole\.log\("\[assistance-surface\]',
    r'''
assert.match(
  app,
  /<WelcomeTour openRequest=\{tourRequest\} \/>/,
  "o pedido de tour deve permanecer registrado no host React",
);
assert.match(
  app,
  /<FloatingHelp[\s\S]{0,180}onStartTour=\{\(\) => setTourRequest/,
  "a ajuda deve solicitar o tour por estado explícito",
);
assert.doesNotMatch(
  app,
  /<PrivateGate>[\s\S]*<WelcomeTour[\s\S]*<\/PrivateGate>/,
  "o tour não pode depender do ciclo de vida do gate clínico",
);
assert.match(
  floatingHelp,
  /onStartTour\?: \(\) => void/,
  "a ajuda deve aceitar callback direto para o tour",
);
assert.match(
  welcomeTour,
  /openRequest\?: number/,
  "o tour deve aceitar solicitações persistentes durante lazy load",
);

console.log("[assistance-surface]''',
)

sub_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    r'for \(const surface of \["CommandPalette", "WelcomeTour"\]\) \{[\s\S]*?\n\}',
    r'''assert.match(
  app,
  /auxiliarySurfacesVisible && \(\s*<Suspense[\s\S]{0,120}<CommandPalette \/>/,
  "CommandPalette não pode competir com o aviso legal nem com o onboarding",
);
assert.match(
  app,
  /auxiliarySurfacesVisible && \([\s\S]{0,420}<WelcomeTour openRequest=\{tourRequest\} \/>/,
  "WelcomeTour não pode competir com o aviso legal nem com o onboarding",
);''',
)
sub_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    r'/openAuxiliarySurface\\\(OPEN_TOUR_EVENT\\\)/,',
    r'/openAuxiliarySurface\(OPEN_TOUR_EVENT,\s*onStartTour\)/,',
)
