/**
 * MongoDB has been removed from this project.
 * The app uses Supabase (PostgreSQL) exclusively.
 *
 * This file exports null so that any legacy imports
 * don't break the build. The functions in gemini.ts
 * that use MongoDB have been migrated to use Supabase.
 */

const clientPromise: Promise<null> = Promise.resolve(null);
export default clientPromise;
