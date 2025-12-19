# Reward Function Design

The reward function $R(s, a, s')$ is the critical signal steering the agent's behavior. It is a linear combination of weighted components.

$$ R = w_M \cdot R_{mastery} + w_E \cdot R_{engage} + w_R \cdot R_{retention} - w_F \cdot P_{fatigue} - w_P \cdot P_{penalty} $$

## 1. Components

### **$R_{mastery}$ (Learning Gain)**
*   Reward for increasing the "probability correct" of any concept.
*   **Formula**: $\sum_{c} (P_c(t+1) - P_c(t))$
*   *Incentive*: Teach new things; fix weak things.

### **$R_{engage}$ (Engagement Maintenance)**
*   Reward for keeping engagement high.
*   **Formula**: $E_{t+1}$ (Magnitude of engagement state).
*   *Incentive*: Avoid boring or frustrating the user.

### **$R_{retention}$ (Delta Stability)**
*   Reward for increasing the *stability* (memory durability) of concepts.
*   **Formula**: $\sum_{c} \log(S_c(t+1)) - \log(S_c(t))$
*   *Incentive*: Prioritize reviews that boost long-term memory (Spaced Repetition).

### **$P_{fatigue}$ (Fatigue Cost)**
*   Penalty for high accumulated fatigue.
*   **Formula**: $F_{t+1}^2$ (Quadratic penalty to discourage pushing near limits).
*   *Incentive*: Suggest "Rest" before burnout.

### **$P_{penalty}$ (Policy Constraints)**
*   **Illegal Moves**: Large negative reward for trying to Advance without prerequisites.
*   **Churn**: Negative reward for toggling between topics too rapidly without progress.

## 2. Weight Tuning

Weights ($w$) are hyperparameters to be tuned during training or defined by the specific "teaching philosophy" mode selected by the educator.

*   **Standard Mode**: Balanced weights.
*   **Cram Mode**: High $w_M$, Low $w_R$, Low $w_F$ (Short-term gain, ignores fatigue/retention).
*   **Deep Learning Mode**: High $w_R$, High $w_E$ (Focus on retention and depth).
