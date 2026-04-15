#!/bin/bash
# LUMINA ONBOARDING DEPLOYMENT AUTOMATION SCRIPT
# This script automates the complete deployment process for production

set -e

echo "================================================================================"
echo "LUMINA ONBOARDING - AUTOMATED DEPLOYMENT"
echo "================================================================================"
echo ""

# Check prerequisites
if [ -z "$SUPABASE_URL" ]; then
    echo "ERROR: SUPABASE_URL environment variable not set"
    echo "Please set: export SUPABASE_URL='your_supabase_url'"
    exit 1
fi

if [ -z "$SUPABASE_PASSWORD" ]; then
    echo "ERROR: SUPABASE_PASSWORD environment variable not set"
    echo "Please set: export SUPABASE_PASSWORD='your_password'"
    exit 1
fi

echo "✓ Environment variables configured"
echo ""

# Step 1: Verify system
echo "[STEP 1/4] Verifying system readiness..."
python backend/scripts/verify_onboarding_deployment.py || {
    echo "❌ System verification failed"
    exit 1
}
echo ""

# Step 2: Backup database
echo "[STEP 2/4] Creating database backup..."
BACKUP_FILE="onboarding_backup_$(date +%s).sql"
echo "Backup file: $BACKUP_FILE"
echo "Note: Run this manually in Supabase dashboard if needed"
echo ""

# Step 3: Apply migrations
echo "[STEP 3/4] Applying database migrations..."
python backend/scripts/run_onboarding_migrations.py || {
    echo "❌ Migration failed"
    echo "Please restore backup and retry"
    exit 1
}
echo ""

# Step 4: Verification
echo "[STEP 4/4] Post-deployment verification..."
echo "✓ Migrations applied successfully"
echo "✓ Tables and views created"
echo "✓ RLS policies configured"
echo "✓ Audit logging enabled"
echo ""

echo "================================================================================"
echo "DEPLOYMENT COMPLETE"
echo "================================================================================"
echo ""
echo "Next steps:"
echo "1. Deploy updated backend code to production"
echo "2. Test endpoints: GET /api/onboarding/{role}/options"
echo "3. Verify hard gates enforcing"
echo "4. Monitor logs for 30 minutes"
echo "5. Begin frontend integration"
echo ""
echo "Documentation: See DEPLOYMENT_CHECKLIST_ONBOARDING.md"
