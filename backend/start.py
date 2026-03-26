import sys
import os
import subprocess
import socket


def _project_python(root_dir: str) -> str:
    candidate = os.path.join(root_dir, ".venv", "Scripts", "python.exe")
    if os.path.exists(candidate):
        return candidate
    return sys.executable


def main() -> int:
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(backend_dir)
    python_executable = _project_python(root_dir)

    def _port_in_use(port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.2)
            return s.connect_ex(("127.0.0.1", port)) == 0

    def _find_listening_pid(port: int) -> str | None:
        try:
            p = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True,
                text=True,
                check=False,
            )
            for line in p.stdout.splitlines():
                if f":{port}" not in line:
                    continue
                if "LISTENING" not in line.upper():
                    continue
                parts = line.split()
                if len(parts) >= 5:
                    return parts[-1]
        except Exception:
            return None
        return None

    backend_file = os.path.join(backend_dir, "app", "main.py")
    if not os.path.exists(backend_file):
        print(f"ERROR: {backend_file} not found")
        return 1

    if _port_in_use(8000):
        pid = _find_listening_pid(8000)
        print("ERROR: Port 8000 is already in use.")
        if pid:
            print(f"PID using port 8000: {pid}")
            print(f"Fix: taskkill /F /PID {pid}")
        else:
            print("Fix: run this to find PID: netstat -ano | findstr :8000")
        return 1

    print("Starting backend...")
    print("Backend URL: http://127.0.0.1:8000")
    print("API Docs:   http://127.0.0.1:8000/docs")
    print(f"Python:     {python_executable}")
    print("Press Ctrl+C to stop")

    try:
        return subprocess.call(
            [
                python_executable,
                "-m",
                "uvicorn",
                "main:app",
                "--host",
                "127.0.0.1",
                "--port",
                "8000",
            ],
            cwd=os.path.join(backend_dir, "app"),
        )
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
