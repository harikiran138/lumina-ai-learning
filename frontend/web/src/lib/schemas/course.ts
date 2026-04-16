import { z } from "zod";

// ─── Course module schema ─────────────────────────────────────────────────────

export const CourseModuleSchema = z.object({
  id: z.string().uuid("Module ID must be a valid UUID"),
  title: z.string().min(1, "Module title cannot be empty").max(200, "Module title too long"),
  order: z.number().int("Order must be an integer").min(0, "Order cannot be negative"),
  type: z.enum(
    ["video", "reading", "quiz", "assignment", "live_session", "coding_sandbox"],
    { errorMap: () => ({ message: "Invalid module type" }) }
  ),
  content_url: z.string().url("Content URL must be valid").optional().nullable(),
  duration_minutes: z
    .number()
    .int()
    .positive("Duration must be positive")
    .optional()
    .nullable(),
  is_required: z.boolean().default(true),
  knowledge_node_ids: z
    .array(z.string().uuid())
    .default([])
    .describe("Links to knowledge graph nodes in Neo4j"),
});

export type CourseModule = z.infer<typeof CourseModuleSchema>;

export const CourseSyllabusSchema = z
  .array(CourseModuleSchema)
  .min(1, "Course must have at least one module");

// ─── Course create/update schema ─────────────────────────────────────────────

export const CourseCreateSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be under 200 characters"),

  code: z
    .string()
    .min(2, "Course code must be at least 2 characters")
    .max(20, "Course code must be under 20 characters")
    .regex(/^[A-Za-z0-9\-_]+$/, "Course code must be alphanumeric (hyphens and underscores allowed)")
    .toUpperCase(),

  description: z
    .string()
    .max(5000, "Description must be under 5000 characters")
    .optional()
    .nullable(),

  institution_id: z.string().uuid("Institution ID must be a valid UUID"),

  is_published: z.boolean().default(false),

  price: z
    .number()
    .min(0, "Price must be a positive number or zero")
    .optional()
    .nullable(),

  modules: CourseSyllabusSchema.optional(),

  metadata: z
    .record(z.unknown())
    .optional()
    .nullable(),
});

export type CourseCreate = z.infer<typeof CourseCreateSchema>;

export const CourseUpdateSchema = CourseCreateSchema.partial().omit({ institution_id: true });
export type CourseUpdate = z.infer<typeof CourseUpdateSchema>;
