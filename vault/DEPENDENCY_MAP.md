# System Dependency Map

This map identifies critical paths and functional dependencies across the Lumina ecosystem. Use this to identify single points of failure.

## 🕸 Dependency Graph

```mermaid
graph TD
    subgraph Core_Infrastructure
        SB[(Supabase DB)]
        SENT[Sentinel Middleware]
        REDIS((Redis Blacklist))
    end

    subgraph Authentication
        AUTH[[Auth Module]]
    end

    subgraph Learning_Engine
        STUD[[Student Domain]]
        AI[[AI Intelligence]]
        Q[AI Answer Queue]
    end

    subgraph Institutional_Control
        FAC[[Faculty Domain]]
        GOV[[Governance/HOD]]
    end

    %% Dependencies
    SENT --> AUTH
    AUTH --> STUD
    AUTH --> AI
    AUTH --> FAC
    AUTH --> GOV
    
    SB -.-> AUTH
    SB -.-> STUD
    SB -.-> AI
    SB -.-> FAC
    
    REDIS -.-> AUTH
    
    STUD --> AI
    AI --> Q
    Q --> FAC
    FAC --> GOV
    FAC --> STUD
```

## 🚨 Critical Nodes (High Risk)

| Component | Why it is Critical | Impact Radius |
| :--- | :--- | :--- |
| **Sentinel Middleware** | Every request passes through here (L5 Security). Failure blocks all users. | System-wide |
| **Supabase Client** | Primary data persistence. Client failure drops all stateful operations. | System-wide |
| **AI Answer Queue** | Bridge between student queries and teacher verification. Loop errors break AI flow. | AI, Faculty |
| **JWT Blacklist (Redis)** | Required for secure logouts. If Redis fails, tokens cannot be revoked. | Security |

## 🔄 Flow-Critical Paths
1. **User Auth Path**: UI -> Core Middleware -> Auth Router -> User Store -> Supabase.
2. **AI Tutoring Path**: Student Dashboard -> AI Router -> ai_answer_queue -> Background Runner -> Teacher Dashboard.
3. **Approval Cascade**: Teacher Grading -> HOD Verification -> Admin Resolution -> Student Dashboard.

---
[[START_HERE]] | [[IMPACT]] | [[DECISION_FLOW]]
