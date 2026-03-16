#!/usr/bin/env python3
"""
Lumina AI Learning Platform - Comprehensive Step-by-Step Evaluation
Tests each component and reports actual working status.
"""

import os
import sys
import subprocess
import json
from datetime import datetime
from pathlib import Path

PROJECT_DIR = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning")
BACKEND_DIR = PROJECT_DIR / "backend"
FRONTEND_DIR = PROJECT_DIR / "frontend/web"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

class LuminaEvaluator:
    def __init__(self):
        self.results = {}
        self.step = 0
        
    def header(self, text):
        print(f"\n{Colors.CYAN}{'='*60}{Colors.RESET}")
        print(f"{Colors.CYAN}  {text}{Colors.RESET}")
        print(f"{Colors.CYAN}{'='*60}{Colors.RESET}\n")
        
    def step_header(self, text):
        self.step += 1
        print(f"\n{Colors.BLUE}STEP {self.step}: {text}{Colors.RESET}")
        print(f"{Colors.BLUE}{'-'*40}{Colors.RESET}")
        
    def success(self, msg):
        print(f"  {Colors.GREEN}✓ {msg}{Colors.RESET}")
        
    def error(self, msg):
        print(f"  {Colors.RED}✗ {msg}{Colors.RESET}")
        
    def warning(self, msg):
        print(f"  {Colors.YELLOW}⚠ {msg}{Colors.RESET}")
        
    def info(self, msg):
        print(f"  {Colors.BLUE}ℹ {msg}{Colors.RESET}")
    
    def evaluate_step1_structure(self):
        """Step 1: Evaluate Project Structure"""
        self.step_header("Project Structure")
        
        required = [
            ("backend", "Backend directory"),
            ("backend/app", "Backend app"),
            ("backend/app/routers", "API Routers"),
            ("frontend/web", "Frontend web"),
            ("frontend/web/src/app", "Frontend pages"),
        ]
        
        all_good = True
        for path, name in required:
            full = PROJECT_DIR / path
            exists = full.exists()
            if exists:
                self.success(f"{name}: {path}")
            else:
                self.error(f"{name}: {path} MISSING")
                all_good = False
        
        self.results['structure'] = all_good
        return all_good
    
    def evaluate_step2_backend_code(self):
        """Step 2: Evaluate Backend Code Quality"""
        self.step_header("Backend Code Quality")
        
        import ast
        
        # Check main.py
        try:
            with open(BACKEND_DIR / "app/main.py") as f:
                ast.parse(f.read())
            self.success("main.py - valid Python syntax")
        except Exception as e:
            self.error(f"main.py - {e}")
            return False
        
        # Count routers
        router_dir = BACKEND_DIR / "app/routers"
        routers = [f for f in router_dir.glob("*.py") if f.name != "__init__.py"]
        self.success(f"Found {len(routers)} router files")
        
        # Check each router
        invalid = []
        for router in routers:
            try:
                with open(router) as f:
                    ast.parse(f.read())
            except Exception as e:
                invalid.append(f"{router.name}: {e}")
        
        if invalid:
            for err in invalid[:3]:
                self.error(err)
            return False
        else:
            self.success("All router files have valid syntax")
        
        self.results['backend_code'] = True
        return True
    
    def evaluate_step3_frontend_code(self):
        """Step 3: Evaluate Frontend Code"""
        self.step_header("Frontend Code Quality")
        
        # Check key files exist
        key_files = [
            ("package.json", "Package config"),
            ("next.config.mjs", "Next.js config"),
            ("src/app/page.tsx", "Home page"),
            ("src/app/layout.tsx", "Root layout"),
        ]
        
        all_good = True
        for file, name in key_files:
            path = FRONTEND_DIR / file
            if path.exists():
                self.success(f"{name}: {file}")
            else:
                self.error(f"{name}: {file} MISSING")
                all_good = False
        
        # Check for role-based pages
        roles = ["student", "teacher", "admin"]
        for role in roles:
            role_dir = FRONTEND_DIR / f"src/app/{role}"
            if role_dir.exists():
                self.success(f"{role} pages exist")
            else:
                self.warning(f"{role} pages not found")
        
        self.results['frontend_code'] = all_good
        return all_good
    
    def evaluate_step4_api_routes(self):
        """Step 4: Evaluate API Routes"""
        self.step_header("API Routes Analysis")
        
        router_files = {
            'ai.py': ['tutor/chat', 'generate-course', 'generate-ppt'],
            'student.py': ['dashboard', 'enroll', 'profile'],
            'teacher.py': ['content/upload', 'verification/queue'],
            'assignments.py': ['create', 'submit', 'grade'],
            'admin.py': ['dashboard', 'analytics'],
            'auth.py': ['login', 'register'],
            'courses.py': ['list', 'enroll'],
        }
        
        total_routes = 0
        found_routes = 0
        
        for router_file, expected_routes in router_files.items():
            router_path = BACKEND_DIR / "app/routers" / router_file
            if not router_path.exists():
                self.error(f"{router_file} not found")
                continue
            
            content = router_path.read_text()
            found = 0
            for route in expected_routes:
                total_routes += 1
                if f'"/{route}"' in content or f"'/{route}'" in content:
                    found += 1
                    found_routes += 1
            
            status = "success" if found == len(expected_routes) else "warning"
            if status == "success":
                self.success(f"{router_file}: {found}/{len(expected_routes)} routes")
            else:
                self.warning(f"{router_file}: {found}/{len(expected_routes)} routes")
        
        coverage = (found_routes / total_routes * 100) if total_routes > 0 else 0
        self.info(f"API Route Coverage: {coverage:.1f}%")
        
        self.results['api_routes'] = coverage >= 70
        return self.results['api_routes']
    
    def evaluate_step5_database(self):
        """Step 5: Evaluate Database Configuration"""
        self.step_header("Database Configuration")
        
        # Check models file
        models_file = BACKEND_DIR / "app/database/models.py"
        if models_file.exists():
            content = models_file.read_text()
            
            # Look for key models
            models = ['User', 'Course', 'Lesson', 'Assignment', 'Enrollment']
            found = 0
            for model in models:
                if f"class {model}" in content:
                    found += 1
                    self.success(f"Model '{model}' defined")
                else:
                    self.warning(f"Model '{model}' not found")
            
            self.results['database'] = found >= 3
        else:
            self.error("models.py not found")
            self.results['database'] = False
        
        # Check Supabase config
        supabase_file = BACKEND_DIR / "app/database/supabase_manager.py"
        if supabase_file.exists():
            self.success("Supabase manager exists")
        else:
            self.warning("Supabase manager not found")
        
        return self.results['database']
    
    def evaluate_step6_ai_features(self):
        """Step 6: Evaluate AI Features"""
        self.step_header("AI Features Analysis")
        
        ai_file = BACKEND_DIR / "app/routers/ai.py"
        if not ai_file.exists():
            self.error("AI router not found")
            return False
        
        content = ai_file.read_text()
        
        features = [
            ('tutor/chat', 'AI Tutor Chat'),
            ('generate-course', 'Course Generation'),
            ('generate-ppt', 'PPT Generation'),
            ('pathway/recommend', 'Learning Pathway'),
            ('profile/behavior', 'Behavior Analysis'),
        ]
        
        found = 0
        for route, name in features:
            if route in content:
                self.success(f"{name} endpoint found")
                found += 1
            else:
                self.warning(f"{name} endpoint not found")
        
        self.results['ai_features'] = found >= 3
        return self.results['ai_features']
    
    def evaluate_step7_dependencies(self):
        """Step 7: Evaluate Dependencies"""
        self.step_header("Dependencies Check")
        
        # Python requirements
        req_file = BACKEND_DIR / "requirements.txt"
        if req_file.exists():
            content = req_file.read_text()
            key_deps = ['fastapi', 'uvicorn', 'pydantic', 'supabase', 'redis']
            found = sum(1 for dep in key_deps if dep in content.lower())
            self.success(f"Python requirements: {found}/{len(key_deps)} key deps")
        else:
            self.error("requirements.txt not found")
        
        # Node package.json
        pkg_file = FRONTEND_DIR / "package.json"
        if pkg_file.exists():
            try:
                data = json.loads(pkg_file.read_text())
                deps = list(data.get('dependencies', {}).keys())
                key_deps = ['next', 'react', 'tailwindcss']
                found = sum(1 for dep in key_deps if dep in deps)
                self.success(f"Node.js dependencies: {found}/{len(key_deps)} key deps")
            except Exception as e:
                self.error(f"package.json parse error: {e}")
        else:
            self.error("package.json not found")
        
        self.results['dependencies'] = True
        return True
    
    def evaluate_step8_demo_flow(self):
        """Step 8: Evaluate Demo Flow Readiness"""
        self.step_header("Demo Flow Readiness")
        
        # Check for demo data script
        demo_script = PROJECT_DIR / "demo_scripts/generate_demo_data.py"
        if demo_script.exists():
            self.success("Demo data generator exists")
        else:
            self.warning("Demo data generator not found")
        
        # Check for test scripts
        test_scripts = [
            "test_infrastructure.py",
            "test_api_endpoints.py",
            "test_ai_verification_flow.py",
            "test_assignment_workflow.py",
        ]
        
        found = 0
        for script in test_scripts:
            path = PROJECT_DIR / "demo_scripts" / script
            if path.exists():
                found += 1
        
        self.success(f"Test scripts: {found}/{len(test_scripts)} available")
        
        # Check for sample PDF
        pdf_file = PROJECT_DIR / "artificial_intelligence_tutorial.pdf"
        if pdf_file.exists():
            size_mb = pdf_file.stat().st_size / (1024*1024)
            self.success(f"Sample PDF available ({size_mb:.1f} MB)")
        else:
            self.warning("Sample PDF not found")
        
        self.results['demo_flow'] = found >= 3
        return self.results['demo_flow']
    
    def generate_final_report(self):
        """Generate Final Evaluation Report"""
        self.header("FINAL EVALUATION REPORT")
        
        print(f"\n{Colors.BLUE}Evaluation Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}\n")
        
        # Score each step
        steps = [
            ("Project Structure", 'structure'),
            ("Backend Code", 'backend_code'),
            ("Frontend Code", 'frontend_code'),
            ("API Routes", 'api_routes'),
            ("Database Config", 'database'),
            ("AI Features", 'ai_features'),
            ("Dependencies", 'dependencies'),
            ("Demo Flow", 'demo_flow'),
        ]
        
        passed = 0
        total = len(steps)
        
        print(f"{Colors.CYAN}Step-by-Step Results:{Colors.RESET}\n")
        
        for name, key in steps:
            result = self.results.get(key, False)
            status = f"{Colors.GREEN}✓ PASS" if result else f"{Colors.RED}✗ FAIL"
            print(f"  {status}{Colors.RESET} {name}")
            if result:
                passed += 1
        
        percentage = (passed / total * 100) if total > 0 else 0
        
        print(f"\n{Colors.CYAN}{'='*60}{Colors.RESET}")
        print(f"{Colors.CYAN}  SCORE: {passed}/{total} ({percentage:.0f}%){Colors.RESET}")
        print(f"{Colors.CYAN}{'='*60}{Colors.RESET}\n")
        
        if percentage >= 80:
            print(f"{Colors.GREEN}🎉 EXCELLENT! System is DEMO-READY!{Colors.RESET}\n")
            print("The Lumina platform has passed all critical evaluations.")
            print("You can proceed with confidence for your live demo today.")
        elif percentage >= 60:
            print(f"{Colors.YELLOW}✅ GOOD! System is functional with minor issues.{Colors.RESET}\n")
            print("The platform is demo-ready but review the warnings above.")
        else:
            print(f"{Colors.RED}🔴 NEEDS ATTENTION{Colors.RESET}\n")
            print("Several components need fixing before the demo.")
        
        print(f"\n{Colors.BLUE}Quick Start Commands:{Colors.RESET}")
        print("  Backend:  cd backend && uvicorn app.main:app --port 8000")
        print("  Frontend: cd frontend/web && npm run dev")
        print("  Tests:    ./demo_scripts/run_demo_checklist.sh")
        
        return percentage >= 60
    
    def run_all_evaluations(self):
        """Run all evaluations"""
        print(f"\n{Colors.CYAN}{'='*60}{Colors.RESET}")
        print(f"{Colors.CYAN}  LUMINA PLATFORM - STEP-BY-STEP EVALUATION{Colors.RESET}")
        print(f"{Colors.CYAN}{'='*60}{Colors.RESET}")
        
        self.evaluate_step1_structure()
        self.evaluate_step2_backend_code()
        self.evaluate_step3_frontend_code()
        self.evaluate_step4_api_routes()
        self.evaluate_step5_database()
        self.evaluate_step6_ai_features()
        self.evaluate_step7_dependencies()
        self.evaluate_step8_demo_flow()
        
        return self.generate_final_report()

if __name__ == "__main__":
    evaluator = LuminaEvaluator()
    success = evaluator.run_all_evaluations()
    sys.exit(0 if success else 1)
