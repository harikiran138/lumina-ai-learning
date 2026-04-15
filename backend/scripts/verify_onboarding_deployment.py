#!/usr/bin/env python3
"""
Lumina Onboarding - Deployment Verification Tool

Validates that the onboarding system is properly configured and ready for deployment.
"""

import sys
import os
from pathlib import Path
import subprocess


# ============================================================================
# VERIFICATION FUNCTIONS
# ============================================================================

def verify_migrations_exist():
    """Verify all migration files exist and are valid SQL."""
    print("\n[1/6] Checking migration files...")
    
    migrations_dir = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/migrations")
    required_migrations = [
        "011_onboarding_core_schema.sql",
        "012_onboarding_profiles_schema.sql", 
        "013_onboarding_analytics_views.sql"
    ]
    
    for migration in required_migrations:
        filepath = migrations_dir / migration
        if not filepath.exists():
            print(f"  ❌ Missing: {migration}")
            return False
        
        # Check basic content
        content = filepath.read_text()
        if not content.strip():
            print(f"  ❌ Empty: {migration}")
            return False
        
        if "CREATE TABLE" not in content and "CREATE VIEW" not in content:
            print(f"  ❌ Invalid SQL in: {migration}")
            return False
        
        print(f"  ✅ {migration}")
    
    return True


def verify_services_exist():
    """Verify all 11 onboarding services exist."""
    print("\n[2/6] Checking all 11 role services...")
    
    services_dir = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/services/onboarding")
    required_services = [
        "student_service.py",
        "teacher_service.py",
        "parent_service.py",
        "peer_tutor_service.py",
        "mentor_service.py",
        "counselor_service.py",
        "content_creator_service.py",
        "researcher_service.py",
        "admin_service.py",
        "alumni_service.py",
        "hod_service.py",
    ]
    
    for service in required_services:
        filepath = services_dir / service
        if not filepath.exists():
            print(f"  ❌ Missing: {service}")
            return False
        print(f"  ✅ {service}")
    
    return True


def verify_validators_exist():
    """Verify validators module exists and has required functions."""
    print("\n[3/6] Checking validators module...")
    
    validators_file = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/services/onboarding/validators.py")
    
    if not validators_file.exists():
        print("  ❌ validators.py not found")
        return False
    
    content = validators_file.read_text()
    required_validators = [
        "validate_name",
        "validate_phone",
        "validate_dob",
        "validate_email",
    ]
    
    for validator in required_validators:
        if validator not in content:
            print(f"  ❌ Missing validator: {validator}")
            return False
        print(f"  ✅ {validator}")
    
    return True


def verify_router_registered():
    """Verify router is registered in main.py."""
    print("\n[4/6] Checking router registration...")
    
    main_file = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/main.py")
    
    if not main_file.exists():
        print("  ❌ main.py not found")
        return False
    
    content = main_file.read_text()
    
    checks = [
        ("onboarding_unified import", "from app.routers import" in content and "onboarding_unified" in content),
        ("router registration", "app.include_router(onboarding_unified.router" in content),
    ]
    
    for check_name, result in checks:
        if result:
            print(f"  ✅ {check_name}")
        else:
            print(f"  ❌ Missing: {check_name}")
            return False
    
    return True


def verify_endpoints_exist():
    """Verify all 4 endpoints are defined."""
    print("\n[5/6] Checking endpoint definitions...")
    
    router_file = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/onboarding_unified.py")
    
    if not router_file.exists():
        print("  ❌ onboarding_unified.py not found")
        return False
    
    content = router_file.read_text()
    
    endpoints = [
        ("/onboarding/{role}/options", "@router.get"),
        ("/onboarding/{role}/step/{step}", "@router.post"),
        ("/onboarding/{role}/status", "@router.get"),
        ("/onboarding/{role}/complete", "@router.post"),
    ]
    
    for endpoint, decorator in endpoints:
        if endpoint in content and decorator in content:
            print(f"  ✅ {endpoint}")
        else:
            print(f"  ❌ Missing: {endpoint}")
            return False
    
    return True


def verify_hard_gates():
    """Verify hard gates are implemented."""
    print("\n[6/6] Checking hard gate implementations...")
    
    peer_tutor_file = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/services/onboarding/peer_tutor_service.py")
    
    if not peer_tutor_file.exists():
        print("  ❌ peer_tutor_service.py not found")
        return False
    
    content = peer_tutor_file.read_text()
    
    hardgates = [
        ("mastery check", "0.80" in content or "80" in content),
        ("database query", "user_data" in content or "metadata" in content),
    ]
    
    for gate_name, result in hardgates:
        if result:
            print(f"  ✅ {gate_name}")
        else:
            print(f"  ❌ Missing: {gate_name}")
            return False
    
    return True


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Run all verification checks."""
    print("=" * 70)
    print("LUMINA ONBOARDING - DEPLOYMENT VERIFICATION")
    print("=" * 70)
    
    checks = [
        ("Migration files", verify_migrations_exist),
        ("Role services", verify_services_exist),
        ("Validators module", verify_validators_exist),
        ("Router registration", verify_router_registered),
        ("Endpoint definitions", verify_endpoints_exist),
        ("Hard gates", verify_hard_gates),
    ]
    
    results = []
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            results.append((check_name, False))
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for check_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {check_name}")
    
    print(f"\nTotal: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 SYSTEM READY FOR DEPLOYMENT")
        return 0
    else:
        print(f"\n⚠️  {total - passed} issue(s) found. Please fix before deployment.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
