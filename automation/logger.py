"""
Lumina Automation — Shared Logger
"""

import sys
from datetime import datetime
from pathlib import Path
from automation.config import LOG_FILE

_log_path = Path(LOG_FILE)


def _write(line: str):
    with open(_log_path, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def _ts() -> str:
    return datetime.now().strftime("%H:%M:%S")


def log(msg: str):
    line = f"[{_ts()}]  {msg}"
    print(line)
    _write(line)


def ok(msg: str):
    line = f"[{_ts()}] \033[32m✓\033[0m {msg}"
    print(line)
    _write(f"[{_ts()}] OK  {msg}")


def fail(msg: str):
    line = f"[{_ts()}] \033[31m✗\033[0m {msg}"
    print(line, file=sys.stderr)
    _write(f"[{_ts()}] ERR {msg}")


def warn(msg: str):
    line = f"[{_ts()}] \033[33m⚠\033[0m {msg}"
    print(line)
    _write(f"[{_ts()}] WRN {msg}")


def section(title: str):
    bar = "─" * 60
    line = f"\n{bar}\n  {title}\n{bar}"
    print(f"\033[36m{line}\033[0m")
    _write(line)
