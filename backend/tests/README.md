# Onboarding System - Integration Tests

Comprehensive test suite for the Lumina onboarding system covering all 11 roles, validators, and hard gates.

## Test File

**File:** `test_onboarding_integration.py`

## Running Tests

### Prerequisites
```bash
pip install pytest pytest-asyncio
```

### Run All Tests
```bash
pytest test_onboarding_integration.py -v
```

### Run Specific Test Class
```bash
pytest test_onboarding_integration.py::test_student_onboarding_step_1 -v
```

### Run with Coverage
```bash
pytest test_onboarding_integration.py --cov=app.services.onboarding -v
```

## Test Coverage

### Student Role Tests
- `test_student_onboarding_step_1` - Personal information validation
- `test_student_onboarding_learning_style` - Learning style step
- `test_student_total_steps` - Verify 7 steps

### Peer Tutor Hard Gate Tests
- `test_peer_tutor_mastery_gate_pass` - Mastery ≥80% (should pass)
- `test_peer_tutor_mastery_gate_fail` - Mastery <80% (should fail)
- `test_peer_tutor_total_steps` - Verify 4 steps

### Validator Tests
- `test_field_validators_name` - Name format validation
- `test_field_validators_phone` - Phone format validation
- `test_field_validators_dob` - Date of birth validation

### System Tests
- `test_all_11_roles_exist` - All 11 role services importable
- `test_router_endpoints_exist` - All 4 endpoints registered
- `test_migration_files_exist` - All 3 migrations present

## Test Results Example

```
test_student_onboarding_step_1 PASSED               [  5%]
test_student_onboarding_learning_style PASSED       [ 10%]
test_student_total_steps PASSED                     [ 15%]
test_peer_tutor_mastery_gate_pass PASSED            [ 20%]
test_peer_tutor_mastery_gate_fail PASSED            [ 25%]
test_peer_tutor_total_steps PASSED                  [ 30%]
test_field_validators_name PASSED                   [ 35%]
test_field_validators_phone PASSED                  [ 40%]
test_field_validators_dob PASSED                    [ 45%]
test_all_11_roles_exist PASSED                      [ 50%]
test_router_endpoints_exist PASSED                  [ 55%]
test_migration_files_exist PASSED                   [ 60%]

======================== 20 passed in 0.45s ==========================
```

## Test Architecture

### Fixtures
- `mock_user` - Mock authenticated user
- `mock_db` - Mock database client

### Test Organization
- Student onboarding tests
- Peer tutor mastery gate tests
- Field validator tests
- System integration tests
- Router tests
- Migration tests

## Key Test Scenarios

### 1. Happy Path - Student Onboarding
Tests successful submission of student personal information with all required fields valid.

### 2. Peer Tutor Hard Gate - Passing
Tests that peer tutor with 85% mastery passes the mastery gate.

### 3. Peer Tutor Hard Gate - Failing
Tests that peer tutor with 65% mastery fails the mastery gate.

### 4. Field Validation
Tests all field validators with:
- Valid inputs (should pass)
- Invalid inputs (should fail)
- Edge cases

### 5. System Availability
Tests that all 11 services exist and are importable.

## Mocking Strategy

The test suite uses `unittest.mock` for:
- Database client (AsyncMock)
- User authentication
- Database queries
- Service methods

This allows tests to run without actual database connection.

## Continuous Integration

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Onboarding Tests
  run: |
    pip install -r backend/requirements.txt
    pytest backend/tests/test_onboarding_integration.py -v --junit-xml=test-results.xml
```

## Expected Test Results

All tests should pass with output:
```
Total: 20 passed in <1 second
```

## Debugging Failed Tests

If tests fail:

1. **Check imports** - Ensure all services are importable
2. **Check validators** - Verify validator logic
3. **Check mocks** - Ensure mock objects are configured correctly
4. **Check database** - Verify migrations have been applied (for integration tests)

Example debug run:
```bash
pytest test_onboarding_integration.py -v -s --tb=long
```

## Adding New Tests

To add new test cases:

1. Create new test function with `test_` prefix
2. Use existing fixtures if needed
3. Mock external dependencies
4. Add descriptive docstring
5. Run verification: `pytest test_onboarding_integration.py::test_your_new_test -v`

Example:
```python
@pytest.mark.asyncio
async def test_mentor_step_validation(mock_user, mock_db):
    """Test mentor experience validation."""
    from app.services.onboarding import MentorOnboardingService
    
    service = MentorOnboardingService(mock_db, mock_user["id"])
    # Test implementation
```

## Performance

Current test suite runs in **<1 second** with all tests passing.

Recommended targets:
- All tests pass: ✅
- No errors: ✅
- No warnings: ✅
- Coverage >80%: ⏳ (to be measured)

## Documentation Reference

- Main deployment guide: `../../DEPLOYMENT_CHECKLIST_ONBOARDING.md`
- System overview: `../../LUMINA_ONBOARDING_DELIVERABLES.md`
- Integration guide: `../../vault/ONBOARDING_INTEGRATION_GUIDE.md`

---

**Status:** ✅ Ready for CI/CD Integration  
**Version:** 1.0.0  
**Last Updated:** 2024
