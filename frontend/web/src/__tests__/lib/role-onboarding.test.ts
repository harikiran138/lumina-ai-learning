import { describe, expect, it } from "vitest";

import { validateRoleStep } from "@/lib/role-onboarding";

function getFieldErrors(result: any) {
  return result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
}

describe("role onboarding validation", () => {
  it("rejects teacher setup without an institution id (Step 1)", () => {
    const result = validateRoleStep("teacher", 1, {
      fullName: "Dr. Meera Iyer",
      employeeId: "FAC-204",
      collegeId: "",
      department: "Computer Science",
      designation: "Assistant Professor",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getFieldErrors(result).collegeId?.[0]).toContain("Institution ID");
    }
  });

  it("rejects parent linking without at least one student", () => {
    const result = validateRoleStep("parent", 2, {
      studentIds: [],
      monitoringGoals: ["attendance"],
      checkInFrequency: "Weekly",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getFieldErrors(result).studentIds?.[0]).toContain("linked student");
    }
  });

  it("rejects peer tutor setup without a student id", () => {
    const result = validateRoleStep("peer_tutor", 1, {
      fullName: "Rahul Menon",
      studentId: "",
      cgpa: 8.6,
      availability: "Weekday evenings",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getFieldErrors(result).studentId?.[0]).toContain("Student ID");
    }
  });

  it("requires ethics approval for full researcher data access", () => {
    const result = validateRoleStep("researcher", 2, {
      dataAccessLevel: "full",
      publications: ["Learning Analytics Journal 2025"],
      ethicsApproval: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getFieldErrors(result).ethicsApproval?.[0]).toContain("Ethics approval");
    }
  });

  it("accepts a complete teacher teaching scope step (Step 2)", () => {
    const result = validateRoleStep("teacher", 2, {
      subjects: ["Physics", "Mathematics"],
      experienceYears: 4,
      teachingMode: "both",
      hourlyRate: 1200,
    });

    expect(result.success).toBe(true);
  });
});
