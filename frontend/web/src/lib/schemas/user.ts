import { z } from "zod";

// ─── User profile update schema ───────────────────────────────────────────────

export const UserProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .regex(
      /^[\p{L}\s'\-\.]+$/u,
      "Name can only contain letters, spaces, hyphens, apostrophes, and dots"
    ),

  bio: z
    .string()
    .max(1000, "Bio must be under 1000 characters")
    .optional()
    .nullable(),

  avatar: z
    .string()
    .url("Avatar must be a valid URL")
    .regex(
      /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i,
      "Avatar must link to an image file (jpg, png, webp, gif)"
    )
    .optional()
    .nullable(),

  skills: z
    .array(z.string().min(1, "Skill cannot be empty").max(50, "Skill name too long"))
    .max(20, "Maximum 20 skills allowed")
    .refine(
      (skills) => new Set(skills.map((s) => s.toLowerCase())).size === skills.length,
      "Duplicate skills are not allowed"
    )
    .optional(),

  role: z
    .enum([
      "super_admin",
      "system_admin",
      "college_admin",
      "institution_admin",
      "admin",
      "hod",
      "supervisor",
      "teacher",
      "student",
      "parent",
      "mentor",
      "peer_tutor",
      "counselor",
      "content_creator",
      "researcher",
      "auditor",
      "finance",
      "alumni",
      "guest",
    ])
    .optional(),

  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number")
    .optional()
    .nullable(),
});

export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;

// ─── User creation schema (admin invites) ────────────────────────────────────

export const UserCreateSchema = UserProfileUpdateSchema.extend({
  email: z.string().email("Invalid email address"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .regex(/^[\p{L}\s'\-\.]+$/u, "Name contains invalid characters"),
  role: z.enum([
    "super_admin", "system_admin", "college_admin", "institution_admin", "admin",
    "hod", "supervisor", "teacher", "student", "parent", "mentor", "peer_tutor",
    "counselor", "content_creator", "researcher", "auditor", "finance", "alumni", "guest",
  ]),
  institution_id: z.string().uuid("Institution ID must be a valid UUID"),
});

export type UserCreate = z.infer<typeof UserCreateSchema>;
