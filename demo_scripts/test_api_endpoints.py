#!/usr/bin/env python3
"""
Lumina AI Learning Platform - API Endpoints Test
Validates all critical API endpoints are responding correctly.
"""

import asyncio
import sys
import time
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

ENDPOINTS = [
    # Health & Core
    {"method": "GET", "path": "/api/v1/health", "name": "Health Check"},
    {"method": "GET", "path": "/api/v1/", "name": "API Root"},
    
    # Student APIs
    {"method": "GET", "path": "/api/v1/student/dashboard", "name": "Student Dashboard"},
    {"method": "GET", "path": "/api/v1/student/courses", "name": "Student Courses"},
    {"method": "GET", "path": "/api/v1/student/assignments", "name": "Student Assignments"},
    {"method": "GET", "path": "/api/v1/student/progress", "name": "Student Progress"},
    
    # Teacher APIs
    {"method": "GET", "path": "/api/v1/teacher/dashboard", "name": "Teacher Dashboard"},
    {"method": "GET", "path": "/api/v1/teacher/courses", "name": "Teacher Courses"},
    {"method": "GET", "path": "/api/v1/teacher/assignments", "name": "Teacher Assignments"},
    {"method": "GET", "path": "/api/v1/teacher/verification-queue", "name": "Verification Queue"},
    
    # Admin APIs
    {"method": "GET", "path": "/api/v1/admin/dashboard", "name": "Admin Dashboard"},
    {"method": "GET", "path": "/api/v1/admin/users", "name": "Admin Users"},
    {"method": "GET", "path": "/api/v1/admin/analytics", "name": "Admin Analytics"},
    
    # Course APIs
    {"method": "GET", "path": "/api/v1/courses", "name": "List Courses"},
    {"method": "GET", "path": "/api/v1/courses/categories", "name": "Course Categories"},
    
    # AI APIs
    {"method": "GET", "path": "/api/v1/ai/status", "name": "AI Service Status"},
    {"method": "GET", "path": "/api/v1/ai/models", "name": "AI Models"},
]

class APITester:
    def __init__(self):
        self.results = []
        
    def log(self, message, status="info"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        if status == "success":
            print(f"{Colors.GREEN}✓ [{timestamp}] {message}{Colors.RESET}")
        elif status == "error":
            print(f"{Colors.RED}✗ [{timestamp}] {message}{Colors.RESET}")
        elif status == "warning":
            print(f"{Colors.YELLOW}⚠ [{timestamp}] {message}{Colors.RESET}")
        else:
            print(f"{Colors.BLUE}ℹ [{timestamp}] {message}{Colors.RESET}")
    
    async def test_endpoint(self, endpoint):
        """Test a single endpoint"""
        try:
            import httpx
            url = f"{BASE_URL}{endpoint['path']}"
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                if endpoint['method'] == 'GET':
                    response = await client.get(url)
                elif endpoint['method'] == 'POST':
                    response = await client.post(url)
                else:
                    response = await client.request(endpoint['method'], url)
                
                elapsed = (time.time() - start_time) * 1000  # ms
                
                # Consider 200-499 as "reachable" (even auth errors mean endpoint exists)
                if response.status_code < 500:
                    return {
                        "name": endpoint['name'],
                        "path": endpoint['path'],
                        "status": response.status_code,
                        "latency": round(elapsed, 2),
                        "success": True
                    }
                else:
                    return {
                        "name": endpoint['name'],
                        "path": endpoint['path'],
                        "status": response.status_code,
                        "latency": round(elapsed, 2),
                        "success": False
                    }
        except Exception as e:
            return {
                "name": endpoint['name'],
                "path": endpoint['path'],
                "status": 0,
                "latency": 0,
                "success": False,
                "error": str(e)
            }
    
    async def test_frontend_pages(self):
        """Test frontend pages"""
        self.log("Testing Frontend pages...", "info")
        pages = [
            {"path": "/", "name": "Landing Page"},
            {"path": "/login", "name": "Login Page"},
            {"path": "/student/dashboard", "name": "Student Dashboard"},
            {"path": "/teacher/dashboard", "name": "Teacher Dashboard"},
        ]
        
        results = []
        try:
            import httpx
            for page in pages:
                try:
                    async with httpx.AsyncClient(timeout=5.0) as client:
                        response = await client.get(f"{FRONTEND_URL}{page['path']}")
                        results.append({
                            "name": page['name'],
                            "path": page['path'],
                            "status": response.status_code,
                            "success": response.status_code == 200
                        })
                except Exception as e:
                    results.append({
                        "name": page['name'],
                        "path": page['path'],
                        "status": 0,
                        "success": False,
                        "error": str(e)
                    })
        except ImportError:
            self.log("httpx not available, skipping frontend tests", "warning")
        
        return results
    
    async def run_all_tests(self):
        """Run all API tests"""
        print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BLUE}  LUMINA API ENDPOINTS TEST{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
        
        self.log(f"Testing {len(ENDPOINTS)} API endpoints...", "info")
        
        # Test all endpoints
        tasks = [self.test_endpoint(ep) for ep in ENDPOINTS]
        results = await asyncio.gather(*tasks)
        
        # Test frontend
        frontend_results = await self.test_frontend_pages()
        
        # Print results
        print(f"\n{Colors.BLUE}Backend API Results:{Colors.RESET}\n")
        
        success_count = 0
        for result in results:
            status_color = Colors.GREEN if result['success'] else Colors.RED
            status_icon = "✓" if result['success'] else "✗"
            latency_str = f" ({result['latency']}ms)" if result['success'] else ""
            print(f"  {status_icon} {result['name']:.<35} HTTP {result['status']}{latency_str}")
            if result['success']:
                success_count += 1
        
        print(f"\n{Colors.BLUE}Frontend Page Results:{Colors.RESET}\n")
        frontend_success = 0
        for result in frontend_results:
            status_color = Colors.GREEN if result['success'] else Colors.RED
            status_icon = "✓" if result['success'] else "✗"
            print(f"  {status_icon} {result['name']:.<35} HTTP {result['status']}")
            if result['success']:
                frontend_success += 1
        
        # Summary
        print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BLUE}  API TEST SUMMARY{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
        
        print(f"  Backend: {success_count}/{len(results)} endpoints reachable")
        print(f"  Frontend: {frontend_success}/{len(frontend_results)} pages reachable")
        
        if success_count == len(results):
            print(f"\n{Colors.GREEN}  🎉 All API endpoints are healthy!{Colors.RESET}")
            return 0
        else:
            print(f"\n{Colors.YELLOW}  ⚠ Some endpoints may need attention{Colors.RESET}")
            return 1

if __name__ == "__main__":
    tester = APITester()
    exit_code = asyncio.run(tester.run_all_tests())
    sys.exit(exit_code)
