# Lumina Database Migration Guide

This guide outlines the process for modifying the Lumina database schema and Row-Level Security (RLS) policies.

## 1. Migration File Structure
Migrations are stored in `backend/app/database/migrations/` and use a sequential naming convention:
- `001_initial_schema.sql`
- `002_rls_policies.sql`
- `003_advanced_features.sql`
- `004_advanced_rls.sql`

## 2. Adding a New Table
When adding a new table, follow these steps:
1. **Create Migration**: Add a new `.sql` file with the next sequence number.
2. **Idempotency**: Use `CREATE TABLE IF NOT EXISTS` to ensure the migration can be run multiple times safely.
3. **Common Columns**: Always include `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and `created_at TIMESTAMPTZ DEFAULT NOW()`.
4. **Foreign Keys**: Ensure all foreign keys have appropriate `ON DELETE` policies (usually `CASCADE` or `SET NULL`).

## 3. Implementing RLS
Every table in Lumina MUST have RLS enabled.
1. **Enable RLS**: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. **Define Policies**:
   - **Student Access**: `USING (auth.uid() = user_id)`
   - **Teacher Access**: Use `EXISTS` to check if the user is the teacher of the related course.
   - **Public Access**: Use `is_published = TRUE` check where applicable.

## 4. Seeding Data
After adding tables, update `backend/app/seed.py`:
1. Add the table name to `LUMINA_TABLES` for clearing.
2. Implement a generator function to create realistic mock data.
3. Link new data to existing entities (Users, Courses) to maintain referential integrity.

## 5. Verification
Verify changes using:
1. `python3 backend/test_supabase.py` (Core logic).
2. Supabase SQL Editor: `SELECT * FROM pg_policies;`
