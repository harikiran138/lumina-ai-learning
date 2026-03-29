/**
 * Demo Accounts Seed
 * ------------------
 * Inserts 6 demo users (2 students, 2 faculty, 1 HOD, 1 college admin)
 * into `users` and corresponding rows into `demo_accounts`.
 *
 * Idempotent — uses ON CONFLICT DO NOTHING via upsert with ignoreDuplicates.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node db/seeds/demo_accounts.ts
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SALT_ROUNDS = 10;

interface DemoSpec {
  email: string;
  full_name: string;
  role: string;
  roll_number?: string;
  employee_id?: string;
  plaintext_password: string;
  primary_login_type: "roll_number" | "employee_id" | "email";
  // demo_accounts fields
  label: string;
  display_name: string;
  identifier: string;
  sort_order: number;
}

const DEMO_SPECS: DemoSpec[] = [
  // ── Students ──────────────────────────────────────────────────────────────
  {
    email:              "priya.sharma@demo.nsrit.edu.in",
    full_name:          "Priya Sharma",
    role:               "student",
    roll_number:        "22NU1A0519",
    plaintext_password: "student@123",
    primary_login_type: "roll_number",
    label:              "Demo Student 1",
    display_name:       "Priya Sharma",
    identifier:         "22NU1A0519",
    sort_order:         1,
  },
  {
    email:              "rahul.kumar@demo.nsrit.edu.in",
    full_name:          "Rahul Kumar",
    role:               "student",
    roll_number:        "23NU1A0234",
    plaintext_password: "student@123",
    primary_login_type: "roll_number",
    label:              "Demo Student 2",
    display_name:       "Rahul Kumar",
    identifier:         "23NU1A0234",
    sort_order:         2,
  },

  // ── Faculty ───────────────────────────────────────────────────────────────
  {
    email:              "anand.rao@demo.nsrit.edu.in",
    full_name:          "Dr. Anand Rao",
    role:               "faculty",
    employee_id:        "FAC001",
    plaintext_password: "faculty@123",
    primary_login_type: "employee_id",
    label:              "Demo Faculty 1",
    display_name:       "Dr. Anand Rao",
    identifier:         "FAC001",
    sort_order:         3,
  },
  {
    email:              "meena.devi@demo.nsrit.edu.in",
    full_name:          "Prof. Meena Devi",
    role:               "faculty",
    employee_id:        "FAC042",
    plaintext_password: "faculty@123",
    primary_login_type: "employee_id",
    label:              "Demo Faculty 2",
    display_name:       "Prof. Meena Devi",
    identifier:         "FAC042",
    sort_order:         4,
  },

  // ── HOD ───────────────────────────────────────────────────────────────────
  {
    email:              "k.srinivas@demo.nsrit.edu.in",
    full_name:          "Dr. K. Srinivas",
    role:               "hod",
    employee_id:        "HOD001",
    plaintext_password: "admin@123",
    primary_login_type: "employee_id",
    label:              "Demo HOD",
    display_name:       "Dr. K. Srinivas",
    identifier:         "HOD001",
    sort_order:         5,
  },

  // ── College Admin ─────────────────────────────────────────────────────────
  {
    email:              "admin@demo.nsrit.edu.in",
    full_name:          "Vijay Reddy",
    role:               "college_admin",
    plaintext_password: "admin@123",
    primary_login_type: "email",
    label:              "Demo College Admin",
    display_name:       "Vijay Reddy",
    identifier:         "admin@demo.nsrit.edu.in",
    sort_order:         6,
  },
];

async function upsertUser(spec: DemoSpec): Promise<string | null> {
  const password_hash = await bcrypt.hash(spec.plaintext_password, SALT_ROUNDS);

  const userData: Record<string, unknown> = {
    email:               spec.email,
    name:                spec.full_name,
    full_name:           spec.full_name,
    role:                spec.role,
    password_hash,
    is_active:           true,
    primary_login_type:  spec.primary_login_type,
  };
  if (spec.roll_number)  userData.roll_number  = spec.roll_number;
  if (spec.employee_id)  userData.employee_id  = spec.employee_id;

  // Try insert; on email conflict fall through to fetch existing id
  const { data: inserted, error: insertErr } = await supabase
    .from("users")
    .upsert(userData, { onConflict: "email", ignoreDuplicates: true })
    .select("id")
    .maybeSingle();

  if (insertErr) {
    console.error(`  ✗ upsert user ${spec.email}:`, insertErr.message);
    return null;
  }

  if (inserted?.id) return inserted.id as string;

  // Row already existed — fetch it
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", spec.email)
    .maybeSingle();

  return (existing?.id as string) ?? null;
}

async function upsertDemoAccount(userId: string, spec: DemoSpec) {
  const { error } = await supabase.from("demo_accounts").upsert(
    {
      user_id:      userId,
      label:        spec.label,
      display_name: spec.display_name,
      role:         spec.role,
      identifier:   spec.identifier,
      is_active:    true,
      sort_order:   spec.sort_order,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error(`  ✗ demo_accounts for ${spec.full_name}:`, error.message);
  }
}

async function seed() {
  console.log("Seeding demo accounts…\n");

  for (const spec of DEMO_SPECS) {
    process.stdout.write(`  • ${spec.full_name} (${spec.role}) … `);

    const userId = await upsertUser(spec);
    if (!userId) {
      process.stdout.write("FAILED (user)\n");
      continue;
    }

    await upsertDemoAccount(userId, spec);
    process.stdout.write(`✓  [${spec.identifier}]\n`);
  }

  console.log("\nDone.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
