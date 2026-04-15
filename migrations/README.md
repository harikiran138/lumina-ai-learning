# Root Migrations

This directory contains supplemental root-level SQL patches that are not part of the canonical Supabase CLI migration history.

- Canonical versioned migrations live in `supabase/migrations/`
- Files here should be treated as manual reconciliation material until they are either retired or converted into versioned migrations

Current files:

- `20260405_counselor_system.sql`
- `20260405_system_hardening.sql`
- `add_sm2_and_behavior_pipeline.sql`
