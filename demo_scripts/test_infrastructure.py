#!/usr/bin/env python3
"""
Lumina AI Learning Platform - Infrastructure Test Script
Validates all infrastructure services are running and accessible.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, '/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend')

from dotenv import load_dotenv
load_dotenv('/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/.env')

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

class InfrastructureTester:
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
    
    async def test_postgresql(self):
        """Test PostgreSQL/Supabase connection"""
        self.log("Testing PostgreSQL connection...", "info")
        try:
            import asyncpg
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                self.log("DATABASE_URL not set in environment", "error")
                return False
            
            conn = await asyncpg.connect(database_url)
            result = await conn.fetch("SELECT 1 as test")
            await conn.close()
            
            if result and result[0]['test'] == 1:
                self.log("PostgreSQL connection successful", "success")
                return True
        except Exception as e:
            self.log(f"PostgreSQL connection failed: {e}", "error")
            return False
    
    async def test_redis(self):
        """Test Redis connection"""
        self.log("Testing Redis connection...", "info")
        try:
            import redis.asyncio as redis
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            
            r = redis.from_url(redis_url)
            await r.set("test_key", "test_value", ex=10)
            value = await r.get("test_key")
            await r.close()
            
            if value and value.decode() == "test_value":
                self.log("Redis connection successful", "success")
                return True
        except Exception as e:
            self.log(f"Redis connection failed: {e}", "error")
            return False
    
    async def test_supabase(self):
        """Test Supabase connection"""
        self.log("Testing Supabase connection...", "info")
        try:
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_ANON_KEY")
            
            if not supabase_url or not supabase_key:
                self.log("Supabase credentials not set", "warning")
                return False
            
            supabase = create_client(supabase_url, supabase_key)
            response = supabase.table('users').select('count', count='exact').limit(0).execute()
            self.log("Supabase connection successful", "success")
            return True
        except Exception as e:
            self.log(f"Supabase connection failed: {e}", "error")
            return False
    
    async def test_backend_api(self):
        """Test if backend API is running"""
        self.log("Testing Backend API...", "info")
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("http://localhost:8000/api/v1/health")
                if response.status_code == 200:
                    self.log("Backend API is running", "success")
                    return True
                else:
                    self.log(f"Backend API returned status {response.status_code}", "warning")
                    return False
        except Exception as e:
            self.log(f"Backend API not accessible: {e}", "error")
            return False
    
    async def test_frontend(self):
        """Test if frontend is running"""
        self.log("Testing Frontend...", "info")
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("http://localhost:3000")
                if response.status_code == 200:
                    self.log("Frontend is running", "success")
                    return True
                else:
                    self.log(f"Frontend returned status {response.status_code}", "warning")
                    return False
        except Exception as e:
            self.log(f"Frontend not accessible: {e}", "error")
            return False
    
    async def run_all_tests(self):
        """Run all infrastructure tests"""
        print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BLUE}  LUMINA INFRASTRUCTURE TEST SUITE{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
        
        tests = [
            ("PostgreSQL", self.test_postgresql),
            ("Redis", self.test_redis),
            ("Supabase", self.test_supabase),
            ("Backend API", self.test_backend_api),
            ("Frontend", self.test_frontend),
        ]
        
        results = {}
        for name, test_func in tests:
            try:
                result = await test_func()
                results[name] = result
            except Exception as e:
                self.log(f"Test {name} crashed: {e}", "error")
                results[name] = False
        
        # Print summary
        print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BLUE}  TEST SUMMARY{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
        
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        
        for name, result in results.items():
            status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if result else f"{Colors.RED}✗ FAIL{Colors.RESET}"
            print(f"  {name:.<40} {status}")
        
        print(f"\n  Total: {passed}/{total} tests passed")
        
        if passed == total:
            print(f"\n{Colors.GREEN}  🎉 All infrastructure services are healthy!{Colors.RESET}")
            return 0
        else:
            print(f"\n{Colors.YELLOW}  ⚠ Some services are not running. Check logs above.{Colors.RESET}")
            return 1

if __name__ == "__main__":
    tester = InfrastructureTester()
    exit_code = asyncio.run(tester.run_all_tests())
    sys.exit(exit_code)
