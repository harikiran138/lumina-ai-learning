#!/usr/bin/env python3
"""
Lumina AI Learning Platform - Demo Readiness Report Generator
Generates comprehensive demo status report without requiring running services.
"""

import os
import sys
from datetime import datetime
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

class DemoReadinessReport:
    def __init__(self):
        self.project_dir = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning")
        self.checks = {}
        
    def log(self, message, status="info"):
        if status == "success":
            print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")
        elif status == "error":
            print(f"{Colors.RED}✗ {message}{Colors.RESET}")
        elif status == "warning":
            print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")
        elif status == "header":
            print(f"{Colors.CYAN}{message}{Colors.RESET}")
        else:
            print(f"{Colors.BLUE}ℹ {message}{Colors.RESET}")
    
    def check_project_structure(self):
        """Verify project structure"""
        self.log("\n📁 PROJECT STRUCTURE CHECK", "header")
        
        required_dirs = [
            ("backend", "Backend API"),
            ("backend/app", "Backend App"),
            ("backend/app/routers", "API Routers"),
            ("frontend/web", "Frontend Web"),
            ("frontend/web/src", "Frontend Source"),
            ("ml_service", "ML Service"),
            ("scripts", "Scripts"),
            ("docs", "Documentation"),
        ]
        
        for dir_path, name in required_dirs:
            full_path = self.project_dir / dir_path
            exists = full_path.exists()
            self.checks[f"dir_{name}"] = exists
            status = "success" if exists else "error"
            self.log(f"{name}: {full_path}", status)
        
        return all(self.checks.get(f"dir_{name}", False) for _, name in required_dirs)
    
    def check_core_modules(self):
        """Verify core modules exist"""
        self.log("\n🔧 CORE MODULES CHECK", "header")
        
        modules = [
            ("backend/app/routers/teacher.py", "Teacher Content Pipeline"),
            ("backend/app/routers/teacher.py", "Teacher Verification Queue"),
            ("backend/app/routers/student.py", "Student Learning Engine"),
            ("backend/app/routers/assignments.py", "Assignment Workflow"),
            ("backend/app/routers/admin.py", "Admin Dashboard"),
            ("backend/app/routers/auth.py", "Authentication + Roles"),
            ("backend/app/routers/ai.py", "AI Tutor Service"),
        ]
        
        all_exist = True
        for file_path, name in modules:
            full_path = self.project_dir / file_path
            exists = full_path.exists()
            self.checks[f"module_{name}"] = exists
            status = "success" if exists else "error"
            self.log(f"{name}", status)
            if not exists:
                all_exist = False
        
        return all_exist
    
    def check_dependencies(self):
        """Check dependencies"""
        self.log("\n📦 DEPENDENCIES CHECK", "header")
        
        # Check Python dependencies
        python_deps = [
            "fastapi", "uvicorn", "pydantic", "sqlalchemy", 
            "redis", "supabase", "torch", "transformers"
        ]
        
        python_ok = True
        for dep in python_deps:
            try:
                __import__(dep)
                self.log(f"Python: {dep}", "success")
                self.checks[f"dep_{dep}"] = True
            except ImportError:
                self.log(f"Python: {dep} (not installed)", "warning")
                self.checks[f"dep_{dep}"] = False
                python_ok = False
        
        # Check Node.js dependencies
        node_modules = self.project_dir / "frontend/web/node_modules"
        if node_modules.exists():
            self.log("Node.js: node_modules present", "success")
            self.checks["node_modules"] = True
        else:
            self.log("Node.js: node_modules missing", "warning")
            self.checks["node_modules"] = False
        
        return python_ok
    
    def check_configuration(self):
        """Check configuration files"""
        self.log("\n⚙️  CONFIGURATION CHECK", "header")
        
        config_files = [
            (".env", "Environment variables"),
            ("docker-compose.yml", "Docker Compose"),
            ("backend/requirements.txt", "Python requirements"),
            ("frontend/web/package.json", "Node.js package.json"),
            ("backend/app/main.py", "Backend entry point"),
            ("frontend/web/next.config.mjs", "Next.js config"),
        ]
        
        all_exist = True
        for file_path, name in config_files:
            full_path = self.project_dir / file_path
            exists = full_path.exists()
            self.checks[f"config_{name}"] = exists
            status = "success" if exists else "error"
            self.log(f"{name}", status)
            if not exists:
                all_exist = False
        
        return all_exist
    
    def check_database_schema(self):
        """Check database schema files"""
        self.log("\n🗄️  DATABASE SCHEMA CHECK", "header")
        
        schema_files = [
            ("backend/app/database/models.py", "SQLAlchemy models"),
            ("backend/app/database/supabase_manager.py", "Supabase manager"),
            ("ecosystem_seed.sql", "Seed data"),
        ]
        
        all_exist = True
        for file_path, name in schema_files:
            full_path = self.project_dir / file_path
            exists = full_path.exists()
            self.checks[f"db_{name}"] = exists
            status = "success" if exists else "error"
            self.log(f"{name}", status)
            if not exists:
                all_exist = False
        
        return all_exist
    
    def check_api_endpoints(self):
        """Check API endpoint definitions"""
        self.log("\n🔌 API ENDPOINTS CHECK", "header")
        
        routers_path = self.project_dir / "backend/app/routers"
        if not routers_path.exists():
            self.log("Routers directory not found", "error")
            return False
        
        expected_routers = [
            "ai.py", "student.py", "teacher.py", "admin.py",
            "auth.py", "courses.py", "assignments.py"
        ]
        
        all_exist = True
        for router in expected_routers:
            full_path = routers_path / router
            exists = full_path.exists()
            self.checks[f"router_{router}"] = exists
            status = "success" if exists else "error"
            self.log(f"Router: {router}", status)
            if not exists:
                all_exist = False
        
        return all_exist
    
    def check_frontend_pages(self):
        """Check frontend pages"""
        self.log("\n🎨 FRONTEND PAGES CHECK", "header")
        
        pages_path = self.project_dir / "frontend/web/src"
        if not pages_path.exists():
            self.log("Frontend src directory not found", "error")
            return False
        
        # Check for app router structure
        app_path = pages_path / "app"
        if app_path.exists():
            self.log("Next.js app router structure found", "success")
            self.checks["frontend_app_router"] = True
        else:
            self.log("Next.js app router not found", "warning")
            self.checks["frontend_app_router"] = False
        
        return True
    
    def generate_summary(self):
        """Generate final summary"""
        self.log("\n" + "="*60, "header")
        self.log("  LUMINA DEMO READINESS SUMMARY", "header")
        self.log("="*60, "header")
        
        total = len(self.checks)
        passed = sum(1 for v in self.checks.values() if v)
        
        print(f"\n{Colors.BLUE}Overall Status:{Colors.RESET}")
        print(f"  Checks passed: {passed}/{total}")
        print(f"  Success rate: {passed/total*100:.1f}%")
        
        # Categorize results
        categories = {
            "Project Structure": [k for k in self.checks if k.startswith("dir_")],
            "Core Modules": [k for k in self.checks if k.startswith("module_")],
            "Dependencies": [k for k in self.checks if k.startswith("dep_") or k == "node_modules"],
            "Configuration": [k for k in self.checks if k.startswith("config_")],
            "Database": [k for k in self.checks if k.startswith("db_")],
            "API Routers": [k for k in self.checks if k.startswith("router_")],
            "Frontend": [k for k in self.checks if k.startswith("frontend_")],
        }
        
        print(f"\n{Colors.BLUE}Category Breakdown:{Colors.RESET}")
        for category, keys in categories.items():
            if keys:
                cat_passed = sum(1 for k in keys if self.checks.get(k, False))
                cat_total = len(keys)
                status_color = Colors.GREEN if cat_passed == cat_total else Colors.YELLOW
                print(f"  {status_color}{category}: {cat_passed}/{cat_total}{Colors.RESET}")
        
        print(f"\n{Colors.BLUE}Demo Readiness:{Colors.RESET}")
        if passed >= total * 0.8:
            print(f"  {Colors.GREEN}🎉 EXCELLENT - Ready for demo!{Colors.RESET}")
        elif passed >= total * 0.6:
            print(f"  {Colors.YELLOW}⚠ GOOD - Minor issues to address{Colors.RESET}")
        else:
            print(f"  {Colors.RED}🔴 NEEDS WORK - Significant issues found{Colors.RESET}")
        
        print(f"\n{Colors.BLUE}Next Steps:{Colors.RESET}")
        print("  1. Start backend: cd backend && uvicorn app.main:app --port 8000")
        print("  2. Start frontend: cd frontend/web && npm run dev")
        print("  3. Run full test suite: ./demo_scripts/run_demo_checklist.sh")
        
        return passed >= total * 0.6
    
    def generate(self):
        """Generate complete report"""
        print(f"\n{Colors.CYAN}{'='*60}{Colors.RESET}")
        print(f"{Colors.CYAN}  LUMINA AI LEARNING PLATFORM{Colors.RESET}")
        print(f"{Colors.CYAN}  DEMO READINESS REPORT{Colors.RESET}")
        print(f"{Colors.CYAN}{'='*60}{Colors.RESET}")
        print(f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Project: {self.project_dir}")
        
        self.check_project_structure()
        self.check_core_modules()
        self.check_dependencies()
        self.check_configuration()
        self.check_database_schema()
        self.check_api_endpoints()
        self.check_frontend_pages()
        
        return self.generate_summary()

if __name__ == "__main__":
    report = DemoReadinessReport()
    success = report.generate()
    sys.exit(0 if success else 1)
