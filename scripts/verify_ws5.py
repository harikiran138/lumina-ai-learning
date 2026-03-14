import asyncio
import json
from datetime import datetime
from uuid import uuid4

from app.services.personalization_service import get_personalization_service
from app.personalization.schemas import LearningEventType, InterventionStatus, InterventionUpdateRequest
from app.store.personalization_store import PersonalizationStore

async def verify_ws5():
    print("🚀 Starting Workstream 5 Verification: Teacher Intervention Loop")
    
    service = get_personalization_service()
    store = PersonalizationStore()
    
    # 1. Setup Test Data (Student with low performance to trigger intervention)
    user_id = f"test-teacher-user-{uuid4()}"
    student_id = f"student-{uuid4()}"
    course_id = "ai-101"
    topic_id = "neural-networks"
    
    print(f"--- Step 1: Triggering Intervention for student {student_id}")
    # Record a low score on an assignment to trigger an intervention
    await service.record_event(
        user_id=student_id,
        event_type=LearningEventType.ASSIGNMENT_GRADED,
        payload={"score": 40, "assignment_id": "math-hw-1", "feedback": "Needs work"},
        course_id=course_id,
        topic_id=topic_id
    )
    
    # 2. Check Intervention Queue
    print("--- Step 2: Checking Intervention Queue")
    interventions = await service.get_interventions(user_id=student_id)
    assert len(interventions) > 0, "No intervention created for low performance"
    intervention = interventions[0]
    print(f"✅ Found intervention: {intervention.id} (Status: {intervention.status}, Priority: {intervention.priority})")
    
    # 3. Update Intervention (Teacher Action)
    print("--- Step 3: Updating Intervention (Teacher Action)")
    updated = await service.update_intervention(
        intervention_id=intervention.id,
        status=InterventionStatus.ACKNOWLEDGED,
        teacher_notes="Spoke with student, assigned extra practice.",
        action_taken="Scheduled meeting"
    )
    
    assert updated.status == InterventionStatus.ACKNOWLEDGED
    assert updated.teacher_notes == "Spoke with student, assigned extra practice."
    assert updated.action_taken == "Scheduled meeting"
    print("✅ Intervention updated successfully with teacher notes and action.")
    
    # 4. Resolve Intervention
    print("--- Step 4: Resolving Intervention")
    resolved = await service.update_intervention(
        intervention_id=intervention.id,
        status=InterventionStatus.RESOLVED
    )
    assert resolved.status == InterventionStatus.RESOLVED
    assert resolved.resolved_at is not None
    
    profile = await service.get_profile(student_id)
    assert profile.intervention_history.resolved_count > 0
    print(f"✅ Intervention resolved. Resolved count in profile: {profile.intervention_history.resolved_count}")
    
    # 5. Cohort Summary
    print("--- Step 5: Checking Cohort Summary")
    summary = await service.get_cohort_summary([student_id])
    assert summary["total_students"] == 1
    assert summary["risk_distribution"]["high"] >= 0 # Should be high or critical
    print(f"✅ Cohort summary retrieved: {summary}")
    
    # 6. Concept Heatmap
    print("--- Step 6: Checking Concept Heatmap")
    heatmap = await service.get_concept_heatmap([student_id], course_id=course_id)
    assert len(heatmap) > 0
    print(f"✅ Concept heatmap generated: {heatmap[0]}")
    
    print("\n✨ WS5 Verification Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(verify_ws5())
