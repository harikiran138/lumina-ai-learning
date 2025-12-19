# Simulation Test Plan

To validate the Pathway Agent's policy before deployment, we run it against simulated learner personas defined in `rl/learning_environment.md`.

## 1. Test Scenarios (Personas)

### **Scenario A: The Fast Learner**
*   **Profile**: High initial mastery, high learning rate, low fatigue.
*   **Expected Behavior**:
    *   Agent should rapidly choose `Advance` actions.
    *   Agent should skip redundant reviews.
    *   Graph traversal should be near-linear (Concept A -> B -> C).
*   **Success Metric**: Reaches end of curriculum in < $N$ steps with > 90% average mastery.

### **Scenario B: The Struggling Learner**
*   **Profile**: Low learning rate, high forgetting rate (low stability).
*   **Expected Behavior**:
    *   Agent should frequent `Review` actions.
    *   Agent should not `Advance` until stability thresholds are met.
    *   Agent should detect loops (failure to progress) and trigger "Remedial" divergence.
*   **Success Metric**: No "Churn" (oscillating between two concepts); eventually masters foundation.

### **Scenario C: The Fatigued Learner**
*   **Profile**: Fatigue accumulates 2x faster than normal.
*   **Expected Behavior**:
    *   Agent should interleave `Rest` actions frequently (e.g., every 15 mins).
    *   Agent should switch to easier "Passive" content when fatigue is high.
*   **Success Metric**: Fatigue never hits 1.0 (Burnout); Session duration is maximized safely.

### **Scenario D: The Inconsistent Learner (Noise)**
*   **Profile**: Randomly answers correctly or incorrectly regardless of mastery.
*   **Expected Behavior**:
    *   Agent should increase sampling (repeat questions) to reduce uncertainty (Aleatoric).
    *   Confidence intervals should be wide.
*   **Success Metric**: Agent does not make confident `Advance` decisions on noisy data.

## 2. Execution Harness
```python
def run_simulation(persona, max_steps=1000):
   env = PathwayGym(persona)
   agent = load_trained_policy()
   
   history = []
   for _ in range(max_steps):
       obs = env.get_obs()
       action = agent.predict(obs)
       obs, reward, done, info = env.step(action)
       history.append(info)
       if done: break
   
   return analyze_history(history)
```
