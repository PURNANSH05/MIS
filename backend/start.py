import sys


def main() -> int:
    try:
        import uvicorn
    except Exception:
        print("uvicorn is not installed. Run: pip install -r requirements.txt")
        return 1

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
