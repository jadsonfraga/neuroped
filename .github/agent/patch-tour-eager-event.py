from pathlib import Path
import re


def sub_once(path: str, pattern: str, replacement: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, lambda _match: replacement, text, count=1)
    if count != 1:
        raise SystemExit(f"{path}: expected one eager-event target, found {count}")
    file.write_text(updated, encoding="utf-8")


sub_once(
    "client/src/App.tsx",
    r'\n\s*const \[tourRequest, setTourRequest\] = useState\(0\);',
    '',
)
sub_once(
    "client/src/App.tsx",
    r'<WelcomeTour openRequest=\{tourRequest\} />\n\s*<FloatingHelp\n\s*onStartTour=\{\(\) => setTourRequest\(\(request\) => request \+ 1\)\}\n\s*/>',
    '''<WelcomeTour />
          <FloatingHelp />''',
)

sub_once(
    "client/src/components/FloatingHelp.tsx",
    r'interface FloatingHelpProps \{\n\s*onStartTour\?: \(\) => void;\n\}\n\nexport function FloatingHelp\(\{ onStartTour \}: FloatingHelpProps\) \{',
    'export function FloatingHelp() {',
)
sub_once(
    "client/src/components/FloatingHelp.tsx",
    r'''  function openAuxiliarySurface\(eventName: string, onOpen\?: \(\) => void\) \{
    if \(onOpen\) \{
      // Registra a intenção antes de desmontar o diálogo\. O host do tour
      // mantém o pedido durante lazy load e aguarda a saída visual da ajuda\.
      onOpen\(\);
      setOpen\(false\);
      return;
    \}
    setOpen\(false\);
    window\.setTimeout\(\(\) => \{
      window\.dispatchEvent\(new Event\(eventName\)\);
    \}, 220\);
  \}''',
    '''  function openAuxiliarySurface(eventName: string) {
    setOpen(false);
    // O receptor do tour é montado no bundle inicial. O evento só é emitido
    // após a animação de saída da ajuda, preservando um único modal e foco.
    window.setTimeout(() => {
      window.dispatchEvent(new Event(eventName));
    }, 220);
  }''',
)
sub_once(
    "client/src/components/FloatingHelp.tsx",
    r'onClick=\{\(\) => openAuxiliarySurface\(OPEN_TOUR_EVENT, onStartTour\)\}',
    'onClick={() => openAuxiliarySurface(OPEN_TOUR_EVENT)}',
)

sub_once(
    "client/src/components/WelcomeTour.tsx",
    r'\ninterface WelcomeTourProps \{\n\s*openRequest\?: number;\n\}',
    '',
)
sub_once(
    "client/src/components/WelcomeTour.tsx",
    r'export function WelcomeTour\(\{ openRequest = 0 \}: WelcomeTourProps\) \{',
    'export function WelcomeTour() {',
)
sub_once(
    "client/src/components/WelcomeTour.tsx",
    r'\n\s*const handledOpenRequestRef = useRef\(0\);',
    '',
)
sub_once(
    "client/src/components/WelcomeTour.tsx",
    r'''\n\s*useEffect\(\(\) => \{
\s*if \(openRequest <= handledOpenRequestRef\.current\) return;
\s*handledOpenRequestRef\.current = openRequest;
\s*const handoffTimer = window\.setTimeout\(\(\) => start\(\), 220\);
\s*return \(\) => window\.clearTimeout\(handoffTimer\);
\s*\}, \[openRequest, start\]\);''',
    '',
)

sub_once(
    "tests/unit/assistance-surface-static.test.mjs",
    r'''assert\.match\(
\s*app,
\s*/<WelcomeTour openRequest=\\\{tourRequest\\\} \\/>/,
[\s\S]*?assert\.match\(
\s*welcomeTour,
\s*/openRequest\\\?: number/,
\s*"o tour deve aceitar solicitações persistentes durante lazy load",
\s*\);''',
    r'''assert.match(
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
);''',
)

sub_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    r'/auxiliarySurfacesVisible && \\(\\s*<Suspense\[\\s\\S\]\{0,120\}<CommandPalette \\/>/,',
    r'/auxiliarySurfacesVisible && \(\s*<Suspense[\s\S]{0,120}<CommandPalette \/>/,',
)
sub_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    r'/auxiliarySurfacesVisible && \\(\[\\s\\S\]\{0,420\}<WelcomeTour openRequest=\\\{tourRequest\\\} \\/>/,',
    r'/auxiliarySurfacesVisible && \([\s\S]{0,420}<WelcomeTour \/>/,',
)
sub_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    r'/auxiliarySurfacesVisible && \\(\[\\s\\S\]\*\?<FloatingHelp\[\\s\\S\]\{0,180\}onStartTour=/,',
    r'/auxiliarySurfacesVisible && \([\s\S]*?<FloatingHelp \/>/,',
)
sub_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    r'"FloatingHelp deve permanecer protegido pelos gates e expor o callback do tour"',
    '"FloatingHelp deve permanecer protegido pelos gates de entrada"',
)
sub_once(
    "tests/unit/flow-os-navigation-static.test.mjs",
    r'/openAuxiliarySurface\\\(OPEN_TOUR_EVENT,\\s\*onStartTour\\\)/,',
    r'/openAuxiliarySurface\(OPEN_TOUR_EVENT\)/,',
)
