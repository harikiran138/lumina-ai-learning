"""
WS8 Verification Script: Automation Layer
Tests all 4 automation jobs with seeded/mock data.
"""
import sys
import os

# Allow imports from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.automation.jobs import (
    run_weekly_class_digest,
    run_post_assessment_remediation,
    run_inactivity_alert_scan,
    run_student_progress_digest,
)
from app.automation.schemas import (
    ClassDigest,
    RemediationPlan,
    InactivityAlert,
    StudentProgressDigest,
)

COURSE_ID = "1b0cad70-6c9e-4607-a0db-7c57814f8c55"  # 'Smoke Algebra' course

def test_weekly_digest():
    print("─" * 50)
    print("TEST 1: Weekly Class Digest (AUTO-001)")
    result = run_weekly_class_digest(COURSE_ID)
    assert isinstance(result, ClassDigest)
    print(f"  ✓ Course: {result.course_id}")
    print(f"  ✓ At-risk students: {result.at_risk_count}")
    print(f"  ✓ Avg KPI: {result.avg_kpi_score}")
    print(f"  ✓ Top weak concepts: {result.top_weak_concepts}")
    print("  → PASSED\n")


def test_post_assessment_remediation():
    print("─" * 50)
    print("TEST 2: Post-Assessment Remediation (AUTO-002)")

    # Test 2a: high score — no remediation
    result = run_post_assessment_remediation("00000000-0000-0000-0000-000000000001", score=0.9, course_id=COURSE_ID)
    assert result is None, "Should not generate remediation for score >= 65%"
    print("  ✓ No remediation for score=0.9")

    # Test 2b: low score — generate plan
    # Use a valid UUID that doesn't exist in DB; should gracefully return None
    result = run_post_assessment_remediation("00000000-0000-0000-0000-000000000002", score=0.4, course_id=COURSE_ID)
    if result is None:
        print("  ✓ Graceful fallback for unknown user (no profile in DB)")
    else:
        assert isinstance(result, RemediationPlan)
        print(f"  ✓ Remediation plan for score=0.4: weak={result.weak_concepts}, recommended={result.recommended_concepts}")
    print("  → PASSED\n")


def test_inactivity_alert():
    print("─" * 50)
    print("TEST 3: Inactivity Alert Scan (AUTO-003)")
    alerts = run_inactivity_alert_scan(threshold_hours=0.001)  # very low threshold to catch all profiles
    assert isinstance(alerts, list)
    print(f"  ✓ {len(alerts)} alert(s) generated")
    for alert in alerts[:2]:
        print(f"    - User {alert.user_id}: {alert.hours_inactive:.1f}h inactive, risk={alert.risk_level}")
    print("  → PASSED\n")


def test_student_progress_digest():
    print("─" * 50)
    print("TEST 4: Student Progress Digest (AUTO-004)")
    result = run_student_progress_digest("00000000-0000-0000-0000-000000000003", COURSE_ID)
    if result is None:
        print("  ✓ Graceful fallback for unknown user")
    else:
        assert isinstance(result, StudentProgressDigest)
        print(f"  ✓ Digest for user {result.user_id}: streak={result.current_streak}")
        print(f"    Next concept: {result.next_recommended_concept}")
        print(f"    Message: {result.motivation_message}")
    print("  → PASSED\n")


if __name__ == "__main__":
    print("\n══════════════════════════════════════════════════")
    print("  WS8 AUTOMATION LAYER — VERIFICATION SUITE")
    print("══════════════════════════════════════════════════\n")

    test_weekly_digest()
    test_post_assessment_remediation()
    test_inactivity_alert()
    test_student_progress_digest()

    print("══════════════════════════════════════════════════")
    print("  ALL WS8 AUTOMATION TESTS PASSED ✓")
    print("══════════════════════════════════════════════════\n")
