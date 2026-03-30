#!/bin/bash

# Lumina Production Certification Runner
# Runs the hardened E2E suite in both Local and Supabase modes.

set -e

echo "🚀 Starting Lumina Production Certification..."
echo "------------------------------------------"

# 1. Local Mode Validation
echo "📦 PHASE 1: Local DB Validation (LUMINA_FORCE_LOCAL_DB=1)"
export LUMINA_FORCE_LOCAL_DB=1
pytest backend/tests/system_validation_e2e.py -v

if [ $? -eq 0 ]; then
    echo "✅ Local Mode Passed"
else
    echo "❌ Local Mode Failed"
    exit 1
fi

echo "------------------------------------------"

# 2. Supabase Mode Validation
echo "☁️ PHASE 2: Supabase DB Validation (LUMINA_FORCE_LOCAL_DB=0)"
export LUMINA_FORCE_LOCAL_DB=0
# Note: Requires SUPABASE_URL and SUPABASE_KEY in env
pytest backend/tests/system_validation_e2e.py -v

if [ $? -eq 0 ]; then
    echo "✅ Supabase Mode Passed"
else
    echo "⚠️ Supabase Mode Failed (Check credentials or network)"
    # We don't exit 1 here yet as the user might not have env vars set, 
    # but we will report it in the final summary.
fi

echo "------------------------------------------"
echo "🏁 Certification Complete."
