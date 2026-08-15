from pathlib import Path
import re


def sub_once(path: str, pattern: str, replacement: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, lambda _match: replacement, text, count=1)
    if count != 1:
        raise SystemExit(f"{path}: expected one timing target, found {count}")
    file.write_text(updated, encoding="utf-8")


sub_once(
    "client/src/components/FloatingHelp.tsx",
    r'''  function openAuxiliarySurface\(eventName: string, onOpen\?: \(\) => void\) \{
    setOpen\(false\);
    // Aguarda a saída do Dialog para manter um único modal e um único
    // dono de foco\. O callback preserva a solicitação mesmo com lazy load\.
    window\.setTimeout\(\(\) => \{
      if \(onOpen\) \{
        onOpen\(\);
        return;
      \}
      window\.dispatchEvent\(new Event\(eventName\)\);
    \}, 220\);
  \}''',
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
)

sub_once(
    "client/src/components/WelcomeTour.tsx",
    r'''  useEffect\(\(\) => \{
    if \(openRequest <= handledOpenRequestRef\.current\) return;
    handledOpenRequestRef\.current = openRequest;
    start\(\);
  \}, \[openRequest, start\]\);''',
    '''  useEffect(() => {
    if (openRequest <= handledOpenRequestRef.current) return;
    handledOpenRequestRef.current = openRequest;
    const handoffTimer = window.setTimeout(() => start(), 220);
    return () => window.clearTimeout(handoffTimer);
  }, [openRequest, start]);''',
)
