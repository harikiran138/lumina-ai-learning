# Policy Optimization Strategy

## 1. Algorithm Selection
We utilize **Proximal Policy Optimization (PPO)** (Schulman et al., 2017).
*   **Why**: PPO offers a good balance of sample efficiency and stability compared to DQN or REINFORCE. It handles both discrete (Action Type) and continuous/high-dimensional (Parameter selection) action spaces well.

## 2. Network Architecture

### **Input Layer (Observation)**
*   State Vector $S_t$ (Normalized features).
*   Dimension: ~$50-100$ floats (depending on number of active concepts in the window).

### **Shared Encoder**
*   Multi-Layer Perceptron (MLP) with 2-3 hidden layers (e.g., 64, 64).
*   *Optional*: LSTM/GRU layer if handling history explicitly instead of stacking frames.

### **Heads**
1.  **Actor Head (Policy $\pi$)**:
    *   **Action Type**: Softmax over 4 discrete actions (Continue, Review, Advance, Rest).
    *   **Target Selection**: Pointer Network or Masked Softmax over available Concept IDs.
2.  **Critic Head (Value $V$)**:
    *   Estimates $V(S_t)$ for advantage calculation.

## 3. Training Process
1.  **Collection Phase**: Run $N$ parallel environments with the current policy for $T$ steps. Collect trajectories.
2.  **Advantage Estimation**: Use Generalized Advantage Estimation (GAE).
3.  **Optimization**: Update weights to maximize PPO objective (clipped surrogate objective).
4.  **Evaluation**: Run separate evaluation episodes on held-out "Student Persona" seeds to check for overfitting.

## 4. Cold Start vs. Online Learning
*   **Pre-training**: The policy is pre-trained offline using the Learning Environment (Task 4.1).
*   **Online Adaptation**: In production, the agent can fine-tune weights slowly (low learning rate) based on real student trajectories, or use simple "Contextual Bandits" on top of the pre-trained PPO core for personalization.
