#!/usr/bin/env python3
"""
Lumina AI Learning Platform - Database Integrity Test
Validates database schema and required tables exist.
"""

import asyncio
import sys
import os
from datetime import datetime

sys.path.insert(0, '/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend')

from dotenv import load_dotenv
load_dotenv('/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/.env')

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

REQUIRED_TABLES = [
    'users',
    'roles',
    'courses',
    'lessons',
    'question_bank',
    'ai_answer_queue',
    'assignments',
    'physical_submissions',
    'guardian_log',
    'enrollments',
    'progress',
    'content_items',
]

class DatabaseTester:
    def __init__(self):
        self.results = {}
        
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
    
    async def connect_db(self):
        """Connect to database"""
        try:
            import asyncpg
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                self.log("DATABASE_URL not set", "error")
                return None
            return await asyncpg.connect(database_url)
        except Exception as e:
            self.log(f"Database connection failed: {e}", "error")
            return None
    
    async def check_tables(self, conn):
        """Check if required tables exist"""
        self.log("Checking required tables...", "info")
        
        try:
            result = await conn.fetch("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            existing_tables = {row['table_name'] for row in result}
            
            missing_tables = []
            for table in REQUIRED_TABLES:
                if table in existing_tables:
                    self.log(f"Table '{table}' exists", "success")
                else:
                    self.log(f"Table '{table}' missing", "error")
                    missing_tables.append(table)
            
            return missing_tables
        except Exception as e:
            self.log(f"Error checking tables: {e}", "error")
            return REQUIRED_TABLES
    
    async def check_indexes(self, conn):
        """Check if important indexes exist"""
        self.log("Checking indexes...", "info")
        try:
            result = await conn.fetch("""
                SELECT indexname, tablename 
                FROM pg_indexes 
                WHERE schemaname = 'public'
            """)
            indexes = [(row['indexname'], row['tablename']) for row in result]
            
            # Check for key indexes
            key_indexes = ['users_email_idx', 'courses_id_idx', 'assignments_id_idx']
            found = 0
            for idx_name, table in indexes:
                if any(key in idx_name.lower() for key in key_indexes):
                    found += 1
            
            self.log(f"Found {len(indexes)} indexes", "success")
            return True
        except Exception as e:
            self.log(f"Error checking indexes: {e}", "error")
            return False
    
    async def check_foreign_keys(self, conn):
        """Check foreign key constraints"""
        self.log("Checking foreign keys...", "info")
        try:
            result = await conn.fetch("""
                SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
            """)
            self.log(f"Found {len(result)} foreign key constraints", "success")
            return True
        except Exception as e:
            self.log(f"Error checking foreign keys: {e}", "error")
            return False
    
    async def check_user_count(self, conn):
        """Check if users exist"""
        self.log("Checking user data...", "info")
        try:
            result = await conn.fetch("SELECT COUNT(*) as count FROM users")
            count = result[0]['count']
            self.log(f"Found {count} users in database", "success" if count > 0 else "warning")
            return count
        except Exception as e:
            self.log(f"Error checking users: {e}", "error")
            return 0
    
    async def check_course_count(self, conn):
        """Check if courses exist"""
        self.log("Checking course data...", "info")
        try:
            result = await conn.fetch("SELECT COUNT(*) as count FROM courses")
            count = result[0]['count']
            self.log(f"Found {count} courses in database", "success" if count > 0 else "warning")
            return count
        except Exception as e:
            self.log(f"Error checking courses: {e}", "error")
            return 0
    
    async def run_all_tests(self):
        """Run all database tests"""
        print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BLUE}  LUMINA DATABASE INTEGRITY TEST{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
        
        conn = await self.connect_db()
        if not conn:
            self.log("Failed to connect to database", "error")
            return 1
        
        try:
            # Run tests
            missing_tables = await self.check_tables(conn)
            await self.check_indexes(conn)
            await self.check_foreign_keys(conn)
            user_count = await self.check_user_count(conn)
            course_count = await self.check_course_count(conn)
            
            # Summary
            print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
            print(f"{Colors.BLUE}  DATABASE SUMMARY{Colors.RESET}")
            print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
            
            if not missing_tables:
                print(f"  {Colors.GREEN}✓ All required tables present{Colors.RESET}")
            else:
                print(f"  {Colors.RED}✗ Missing tables: {', '.join(missing_tables)}{Colors.RESET}")
            
            print(f"  Users: {user_count}")
            print(f"  Courses: {course_count}")
            
            if not missing_tables:
                print(f"\n{Colors.GREEN}  🎉 Database schema is healthy!{Colors.RESET}")
                return 0
            else:
                print(f"\n{Colors.YELLOW}  ⚠ Database schema incomplete{Colors.RESET}")
                return 1
                
        finally:
            await conn.close()

if __name__ == "__main__":
    tester = DatabaseTester()
    exit_code = asyncio.run(tester.run_all_tests())
    sys.exit(exit_code)
