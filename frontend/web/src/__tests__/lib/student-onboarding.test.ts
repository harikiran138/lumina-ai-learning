import { describe, expect, it } from "vitest";

import {
  studentPersonalSchema,
  studentPreferencesSchema,
  studentProfileSchema,
  studentSubjectsSchema,
} from "@/lib/student-onboarding";

describe("studentPersonalSchema", () => {
  it("accepts a complete valid personal details payload", () => {
    const result = studentPersonalSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "2005-05-01",
      gender: "female",
      phoneNumber: "+91 9000000000",
      email: "student@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid phone numbers", () => {
    const result = studentPersonalSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "2005-05-01",
      gender: "female",
      phoneNumber: "123",
      email: "student@example.com",
    });

    expect(result.success).toBe(false);
  });
});

describe("studentSubjectsSchema", () => {
  it("requires at least one subject", () => {
    const result = studentSubjectsSchema.safeParse({ subjectIds: [] });
    expect(result.success).toBe(false);
  });
});

describe("studentProfileSchema", () => {
  it("accepts a blank parent email", () => {
    const result = studentProfileSchema.safeParse({
      emergencyContact: "+91 9888888888",
      parentEmail: "",
    });

    expect(result.success).toBe(true);
  });
});

describe("studentPreferencesSchema", () => {
  it("requires learning style selections and a valid self assessment", () => {
    const result = studentPreferencesSchema.safeParse({
      learningStyles: ["visual_learner"],
      selfAssessment: "intermediate",
    });

    expect(result.success).toBe(true);
  });
});
