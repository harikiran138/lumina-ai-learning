# Lumnia Learning Management System - TODO

## Phase 4: Personalized Learning Pathways Engine (Completed)

### Core Components (✓)
1. ✓ Skill Graph Service
   - Implemented SkillGraphService using NetworkX
   - Added SkillNode models and prerequisite management
   - Completed graph traversal and validation logic

2. ✓ Pathway Generator
   - Created services/pathway_generator.py
   - Implemented personalized pathway generation
   - Added learning style and difficulty adaptations

### 2. Update /api/generate-pathway Endpoint
- [ ] Import and use `pathway_generator` instead of `personalization_engine`
- [ ] Update endpoint to pass correct parameters to pathway generator
- [ ] Ensure response format matches frontend expectations

### 3. Add /api/student/pathway Endpoint
- [ ] Create new endpoint for serving adaptive content to students
- [ ] Implement logic to fetch student's current pathway
- [ ] Add "Recommended Next Step" functionality
- [ ] Include pathway metadata (estimated time, prerequisites)

### 4. Enhance Pathway Generation Logic
- [ ] Ensure pathway generator fetches student mastery levels from DB
- [ ] Adjust lessons based on previous scores, time spent, and streaks
- [ ] Implement adaptive difficulty adjustment
- [ ] Add learning style filtering for content

### 5. Database Integration
- [ ] Ensure pathway data is stored in `learning_pathways` table
- [ ] Update student skill levels in `skill_levels` table
- [ ] Track learning activities in `learning_activities` table

### 6. Testing and Validation
- [ ] Test pathway generation with sample student data
- [ ] Verify adaptive recommendations work correctly
- [ ] Ensure API endpoints return proper JSON responses
- [ ] Test with Postman or similar tool

## Dependencies
- SQLAlchemy models for new tables (skills, learning_pathways, etc.)
- Vector store integration for content retrieval
- Embedding service for skill matching

## Notes
- The `pathway_generator.py` has advanced logic but needs DB fixes
- Current `/api/generate-pathway` uses simple LLM approach
- Need to ensure backward compatibility with existing frontend calls
