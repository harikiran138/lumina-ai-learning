#!/usr/bin/env python3
"""
Lumina AI Learning Platform - Project Structure Audit
Simple file-based audit without heavy imports.
"""

import os
import sys
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning")

def check_file(path, name):
    exists = path.exists()
    status = "✓" if exists else "✗"
    return exists, f"  {status} {name}: {path}"

def main():
    print("="*60)
    print("  LUMINA AI LEARNING PLATFORM - PROJECT AUDIT")
    print("="*60)
    print(f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Project: {PROJECT_DIR}")
    
    checks = []
    
    # Project Structure
    print("\n📁 PROJECT STRUCTURE:")
    checks.append(check_file(PROJECT_DIR / "backend", "Backend directory"))
    checks.append(check_file(PROJECT_DIR / "backend/app", "Backend app"))
    checks.append(check_file(PROJECT_DIR / "backend/app/routers", "API Routers"))
    checks.append(check_file(PROJECT_DIR / "frontend/web", "Frontend web"))
    checks.append(check_file(PROJECT_DIR / "frontend/web/src", "Frontend source"))
    checks.append(check_file(PROJECT_DIR / "ml_service", "ML Service"))
    checks.append(check_file(PROJECT_DIR / "scripts", "Scripts"))
    
    for _, msg in checks:
        print(msg)
    
    # Core Modules
    print("\n🔧 CORE MODULES:")
    modules = [
        ("backend/app/routers/teacher.py", "Teacher Pipeline"),
        ("backend/app/routers/student.py", "Student Engine"),
        ("backend/app/routers/assignments.py", "Assignment Workflow"),
        ("backend/app/routers/admin.py", "Admin Dashboard"),
        ("backend/app/routers/auth.py", "Authentication"),
        ("backend/app/routers/ai.py", "AI Tutor Service"),
        ("backend/app/routers/courses.py", "Course Management"),
    ]
    
    module_checks = []
    for path, name in modules:
        module_checks.append(check_file(PROJECT_DIR / path, name))
    
    for _, msg in module_checks:
        print(msg)
    
    checks.extend(module_checks)
    
    # Configuration
    print("\n⚙️  CONFIGURATION:")
    config_checks = [
        check_file(PROJECT_DIR / ".env", "Environment file"),
        check_file(PROJECT_DIR / "docker-compose.yml", "Docker Compose"),
        check_file(PROJECT_DIR / "backend/requirements.txt", "Python requirements"),
        check_file(PROJECT_DIR / "frontend/web/package.json", "Node.js package.json"),
        check_file(PROJECT_DIR / "backend/app/main.py", "Backend entry"),
    ]
    
    for _, msg in config_checks:
        print(msg)
    
    checks.extend(config_checks)
    
    # Database
    print("\n🗄️  DATABASE:")
    db_checks = [
        check_file(PROJECT_DIR / "backend/app/database/models.py", "SQLAlchemy models"),
        check_file(PROJECT_DIR / "backend/app/database/supabase_manager.py", "Supabase manager"),
        check_file(PROJECT_DIR / "ecosystem_seed.sql", "Seed data"),
    ]
    
    for _, msg in db_checks:
        print(msg)
    
    checks.extend(db_checks)
    
    # Summary
    print("\n" + "="*60)
    print("  SUMMARY")
    print("="*60)
    
    total = len(checks)
    passed = sum(1 for ok, _ in checks if ok)
    
    print(f"\n  Files/Directories found: {passed}/{total}")
    print(f"  Success rate: {passed/total*100:.1f}%")
    
    if passed == total:
        print("\n  🎉 EXCELLENT - All core components present!")
        return 0
    elif passed >= total * 0.8:
        print("\n  ✅ GOOD - Most components present")
        return 0
    else:
        print("\n  ⚠ Some components missing")
        return 1

if __name__ == "__main__":
    sys.exit(main())
