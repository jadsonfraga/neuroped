import os
import socket
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
PORT = int(os.getenv("NEUROPED_RENDER_PORT", "8768"))

def online():
    try:
        with socket.create_connection(("127.0.0.1", PORT), timeout=1):
            return True
    except OSError:
        return False

def main():
    if online():
        return
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    while True:
        proc = subprocess.Popen(
            [sys.executable, str(HERE / "bridge.py")],
            cwd=str(HERE), stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=flags)
        status = proc.wait()
        if status == 0 or online():
            return
        time.sleep(5)

if __name__ == "__main__":
    main()
