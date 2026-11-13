import os
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

SOURCE = Path(__file__).resolve().parent
TARGET = Path(os.getenv("NEUROPED_RENDER_HOME", r"C:\NeuroPed\PantChatBridge"))
STARTUP = (Path(os.environ.get("APPDATA", str(Path.home() / "AppData/Roaming"))) /
           "Microsoft/Windows/Start Menu/Programs/Startup")

def online(port=8768):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1):
            return True
    except OSError:
        return False

def main():
    if os.name != "nt":
        raise SystemExit("Somente Windows.")
    TARGET.mkdir(parents=True, exist_ok=True)
    for name in ("bridge.py", "supervisor.py"):
        shutil.copy2(SOURCE / name, TARGET / name)
    for folder in ("entrada", "saida", "aceites", "recibos"):
        (TARGET / folder).mkdir(exist_ok=True)
    STARTUP.mkdir(parents=True, exist_ok=True)
    pythonw = Path(sys.executable).with_name("pythonw.exe")
    exe = pythonw if pythonw.exists() else Path(sys.executable)
    command = '"' + str(exe) + '" "' + str(TARGET / "supervisor.py") + '"'
    vbs = 'Set sh = CreateObject("WScript.Shell")\r\nsh.Run "' + command.replace('"', '""') + '", 0, False\r\n'
    (STARTUP / "NeuroPed_Renderizador.vbs").write_text(vbs, encoding="utf-8")
    if not online():
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        subprocess.Popen(
            [str(exe), str(TARGET / "supervisor.py")],
            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL, creationflags=flags,
            cwd=str(TARGET), close_fds=True)
    for _ in range(24):
        if online():
            break
        time.sleep(0.5)
    print("INSTALACAO=" + ("ATIVA" if online() else "PENDENTE"))
    print("SERVICO=http://127.0.0.1:8768")
    print("INBOX=" + str(TARGET / "entrada"))
    print("SAIDA=" + str(TARGET / "saida"))

if __name__ == "__main__":
    main()
