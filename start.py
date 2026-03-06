import os
import socket
import subprocess
import sys
import time


def _is_port_free(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.2)
        return s.connect_ex((host, port)) != 0


def _pick_free_port(preferred: int) -> int:
    if _is_port_free(preferred):
        return preferred
    for p in range(preferred + 1, preferred + 50):
        if _is_port_free(p):
            return p
    return preferred


def main() -> int:
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "react-app")

    backend_port = 8000
    frontend_port = _pick_free_port(3000)

    backend_cmd = [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", str(backend_port)]
    frontend_cmd = ["npm", "start"]

    backend_env = os.environ.copy()
    frontend_env = os.environ.copy()
    frontend_env["PORT"] = str(frontend_port)

    print(f"Starting backend on http://127.0.0.1:{backend_port}")
    backend_proc = subprocess.Popen(backend_cmd, cwd=backend_dir, env=backend_env)

    time.sleep(1.0)

    print(f"Starting frontend on http://localhost:{frontend_port}")
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=frontend_dir, env=frontend_env, shell=True)

    print("\nRunning. Close this window to stop both processes.")

    try:
        while True:
            b = backend_proc.poll()
            f = frontend_proc.poll()
            if b is not None:
                print(f"Backend stopped with code {b}")
                break
            if f is not None:
                print(f"Frontend stopped with code {f}")
                break
            time.sleep(0.5)
    except KeyboardInterrupt:
        pass
    finally:
        for p in [frontend_proc, backend_proc]:
            try:
                if p.poll() is None:
                    p.terminate()
            except Exception:
                pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
