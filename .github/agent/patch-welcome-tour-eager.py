from pathlib import Path
import re

path = Path("client/src/App.tsx")
text = path.read_text(encoding="utf-8")


def sub_once(pattern: str, replacement: str) -> None:
    global text
    text, count = re.subn(pattern, lambda _match: replacement, text, count=1)
    if count != 1:
        raise SystemExit(f"App.tsx: expected one eager-tour target, found {count}")


sub_once(
    r'import \{ FloatingHelp \} from "@/components/FloatingHelp";\n',
    'import { FloatingHelp } from "@/components/FloatingHelp";\nimport { WelcomeTour } from "@/components/WelcomeTour";\n',
)
sub_once(
    r'const WelcomeTour = lazy\(\(\) =>\n\s*import\("@/components/WelcomeTour"\)\.then\(\(mod\) => \(\{\n\s*default: mod\.WelcomeTour,\n\s*\}\)\),\n\);\n',
    '',
)
sub_once(
    r'<Suspense fallback=\{null\}>\n\s*<WelcomeTour openRequest=\{tourRequest\} />\n\s*</Suspense>',
    '<WelcomeTour openRequest={tourRequest} />',
)

path.write_text(text, encoding="utf-8")
