# Onboarding System - Deployment Tools

This directory contains production-ready tools for deploying and managing the Lumina onboarding system.

## Tools Available

### 1. Deployment Verification Script
**File:** `verify_onboarding_deployment.py`

Validates that the onboarding system is correctly implemented and ready for production deployment.

**Usage:**
```bash
python verify_onboarding_deployment.py
```

**Output:**
```
✅ PASS - Migration files
✅ PASS - Role services  
✅ PASS - Validators module
✅ PASS - Router registration
✅ PASS - Endpoint definitions
✅ PASS - Hard gates

Total: 6/6 checks passed
🎉 SYSTEM READY FOR DEPLOYMENT
```

**What it checks:**
- All 3 migration files exist and are valid
- All 11 role services implemented
- Validators module complete
- Router properly registered in main.py
- All 4 REST endpoints defined
- Hard gates implemented

### 2. Migration Runner
**File:** `run_onboarding_migrations.py`

Applies all onboarding migrations to the Supabase database in the correct order.

**Prerequisites:**
- Set environment variables:
  ```bash
  export SUPABASE_URL="your_supabase_url"
  export SUPABASE_PASSWORD="your_db_password"
  export SUPABASE_USER="postgres"
  export SUPABASE_DB="postgres"
  ```

**Usage:**
```bash
python run_onboarding_migrations.py
```

**What it does:**
1. Connects to Supabase database
2. Applies migration 011 (core schema)
3. Applies migration 012 (role profiles)
4. Applies migration 013 (analytics)
5. Reports successes and failures

**Output:**
```
✅ Applied: 011_onboarding_core_schema.sql
✅ Applied: 012_onboarding_profiles_schema.sql
✅ Applied: 013_onboarding_analytics_views.sql

Migration completed: 3/3 successful
🎉 All migrations applied successfully!
```

## Recommended Deployment Order

1. **Verify System**
   ```bash
   python verify_onboarding_deployment.py
   ```
   Ensure output shows: `✅ SYSTEM READY FOR DEPLOYMENT`

2. **Backup Database** (from your Supabase dashboard)
   ```bash
   # Export current database as backup
   ```

3. **Apply Migrations**
   ```bash
   export SUPABASE_URL="your_url"
   export SUPABASE_PASSWORD="your_password"
   python run_onboarding_migrations.py
   ```

4. **Verify in Database**
   ```sql
   -- Check tables created
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'onboarding%';
   
   -- Check views created
   SELECT table_name FROM information_schema.views
   WHERE table_schema = 'public' AND table_name LIKE 'onboarding%';
   ```

5. **Deploy Backend**
   - Push Docker image with updated code
   - Ensure environment variables are set
   - Verify endpoints accessible at `/api/onboarding/*`

## Troubleshooting

### Verification script fails
**Problem:** Some checks fail  
**Solution:** Review the DEPLOYMENT_CHECKLIST_ONBOARDING.md for specific requirements

### Migration fails to connect
**Problem:** Database connection error  
**Solution:**
```bash
# Verify credentials
echo $SUPABASE_URL
echo $SUPABASE_PASSWORD

# Test connection manually
psql -h your-db.supabase.co -U postgres -d postgres
```

### Migration partially applies
**Problem:** Some migrations fail  
**Solution:** 
1. Check database logs in Supabase dashboard
2. Verify no conflicting code exists
3. Restore from backup and retry

## File Locations

| Component | Location |
|-----------|----------|
| Verification Script | `backend/scripts/verify_onboarding_deployment.py` |
| Migration Runner | `backend/scripts/run_onboarding_migrations.py` |
| Migrations | `backend/migrations/011_*.sql`, `012_*.sql`, `013_*.sql` |
| Services | `backend/app/services/onboarding/` |
| Router | `backend/app/routers/onboarding_unified.py` |
| Tests | `backend/tests/test_onboarding_integration.py` |

## Documentation Reference

- **Main Deployment Guide:** `DEPLOYMENT_CHECKLIST_ONBOARDING.md`
- **System Overview:** `LUMINA_ONBOARDING_DELIVERABLES.md`
- **Final Verification:** `FINAL_VERIFICATION_REPORT.md`
- **Integration Guide:** `vault/ONBOARDING_INTEGRATION_GUIDE.md`

## System Requirements

- Python 3.8+
- psycopg2 (PostgreSQL adapter)
- Access to Supabase database
- Valid database credentials

## Support

For issues or questions, refer to:
1. `DEPLOYMENT_CHECKLIST_ONBOARDING.md` - Troubleshooting section
2. `FINAL_VERIFICATION_REPORT.md` - Production deployment checklist
3. Run verification script and check output

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** 2024
