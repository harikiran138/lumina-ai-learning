#!/usr/bin/env python3
"""
Backend Error Scanner
Scans all Python files for common errors and issues.
"""

import os
import sys
import ast
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple


# Colors for terminal output
class Colors:
    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    NC = "\033[0m"  # No Color


def print_header(text: str):
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"{text}")
    print(f"{'='*60}{Colors.NC}\n")


def print_success(text: str):
    print(f"{Colors.GREEN}✓ {text}{Colors.NC}")


def print_error(text: str):
    print(f"{Colors.RED}✗ {text}{Colors.NC}")


def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.NC}")


def scan_syntax_errors(directory: str) -> List[Tuple[str, str]]:
    """Scan for Python syntax errors."""
    print_header("Scanning for Syntax Errors")
    errors = []

    for py_file in Path(directory).rglob("*.py"):
        try:
            with open(py_file, "r", encoding="utf-8") as f:
                ast.parse(f.read(), filename=str(py_file))
        except SyntaxError as e:
            errors.append((str(py_file), f"Line {e.lineno}: {e.msg}"))
            print_error(f"{py_file}: Line {e.lineno}: {e.msg}")

    if not errors:
        print_success("No syntax errors found!")
    else:
        print_error(f"Found {len(errors)} syntax errors")

    return errors


def scan_import_errors(directory: str) -> List[Tuple[str, str]]:
    """Scan for import errors."""
    print_header("Scanning for Import Errors")
    errors = []

    # Change to directory to ensure imports work
    original_dir = os.getcwd()
    os.chdir(directory)

    for py_file in Path(".").rglob("*.py"):
        if "__pycache__" in str(py_file) or ".venv" in str(py_file):
            continue

        try:
            with open(py_file, "r", encoding="utf-8") as f:
                tree = ast.parse(f.read())

            for node in ast.walk(tree):
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    # Extract module names
                    if isinstance(node, ast.Import):
                        modules = [alias.name for alias in node.names]
                    else:
                        modules = [node.module] if node.module else []

                    for module in modules:
                        if module and not module.startswith("."):
                            try:
                                __import__(module.split(".")[0])
                            except ImportError as e:
                                error_msg = f"Cannot import '{module}': {str(e)}"
                                errors.append((str(py_file), error_msg))
                                print_warning(f"{py_file}: {error_msg}")
        except Exception as e:
            print_warning(f"Could not analyze {py_file}: {e}")

    os.chdir(original_dir)

    if not errors:
        print_success("No import errors found!")
    else:
        print_warning(f"Found {len(errors)} potential import issues")

    return errors


def run_flake8(directory: str) -> bool:
    """Run flake8 linter."""
    print_header("Running Flake8 Linter")

    try:
        result = subprocess.run(
            [
                "flake8",
                directory,
                "--max-line-length=120",
                "--exclude=.venv,__pycache__,.pytest_cache",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            print_success("No flake8 issues found!")
            return True
        else:
            print_error("Flake8 found issues:")
            print(result.stdout)
            return False
    except FileNotFoundError:
        print_warning("flake8 not installed. Install with: pip install flake8")
        return False


def run_bandit(directory: str) -> bool:
    """Run bandit security scanner."""
    print_header("Running Bandit Security Scanner")

    try:
        result = subprocess.run(
            ["bandit", "-r", directory, "-ll", "--exclude", ".venv,__pycache__"],
            capture_output=True,
            text=True,
        )

        if "No issues identified" in result.stdout:
            print_success("No security issues found!")
            return True
        else:
            print_warning("Bandit found potential security issues:")
            print(result.stdout)
            return False
    except FileNotFoundError:
        print_warning("bandit not installed. Install with: pip install bandit")
        return False


def check_requirements(directory: str) -> bool:
    """Check if all requirements are installed."""
    print_header("Checking Requirements")

    req_file = Path(directory) / "requirements.txt"
    if not req_file.exists():
        print_warning("requirements.txt not found")
        return False

    try:
        result = subprocess.run(["pip", "check"], capture_output=True, text=True)

        if result.returncode == 0:
            print_success("All requirements are satisfied!")
            return True
        else:
            print_error("Dependency issues found:")
            print(result.stdout)
            return False
    except Exception as e:
        print_error(f"Error checking requirements: {e}")
        return False


def generate_report(results: Dict) -> None:
    """Generate summary report."""
    print_header("SCAN SUMMARY")

    total_issues = sum(len(v) if isinstance(v, list) else (0 if v else 1) for v in results.values())

    print(f"Syntax Errors: {len(results['syntax_errors'])}")
    print(f"Import Issues: {len(results['import_errors'])}")
    print(f"Flake8: {'✓ PASS' if results['flake8'] else '✗ FAIL'}")
    print(f"Bandit: {'✓ PASS' if results['bandit'] else '✗ FAIL'}")
    print(f"Requirements: {'✓ PASS' if results['requirements'] else '✗ FAIL'}")

    print(f"\n{Colors.BLUE}Total Issues: {total_issues}{Colors.NC}")

    if total_issues == 0:
        print(f"\n{Colors.GREEN}🎉 All checks passed! Your code looks good!{Colors.NC}")
    else:
        print(f"\n{Colors.YELLOW}⚠️  Please fix the issues above before deploying.{Colors.NC}")


def main():
    # Determine backend directory
    script_dir = Path(__file__).parent
    backend_dir = script_dir / "app"

    if not backend_dir.exists():
        backend_dir = script_dir

    print(f"{Colors.BLUE}Backend Error Scanner{Colors.NC}")
    print(f"Scanning directory: {backend_dir}\n")

    results = {
        "syntax_errors": scan_syntax_errors(str(backend_dir)),
        "import_errors": scan_import_errors(str(backend_dir)),
        "flake8": run_flake8(str(backend_dir)),
        "bandit": run_bandit(str(backend_dir)),
        "requirements": check_requirements(str(script_dir)),
    }

    generate_report(results)

    # Exit with error code if issues found
    total_issues = len(results["syntax_errors"]) + len(results["import_errors"])
    sys.exit(1 if total_issues > 0 else 0)


if __name__ == "__main__":
    main()
