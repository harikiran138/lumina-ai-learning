# Lumina — Neo4j AuraDB (Free Tier)

## Instance Spec

| Setting | Value |
|---------|-------|
| Provider | Neo4j AuraDB Free |
| Nodes | 200,000 limit |
| Relationships | 400,000 limit |
| Storage | 200 MB |
| Region | GCP us-central1 (closest to ap-south-1) |

## Setup

1. Go to https://console.neo4j.io
2. Create Free instance → copy credentials
3. Download the connection file (`.env`)

## Connection

```
NEO4J_URI=bolt+s://<AURA_ID>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<generated-by-aura>
```

## Knowledge Graph Schema

```cypher
// Course → Concept → Prerequisite
CREATE (c:Course {id: $course_id, name: $name})
CREATE (k:Concept {id: $concept_id, name: $name, difficulty: $difficulty})
CREATE (c)-[:HAS_CONCEPT]->(k)
CREATE (k)-[:REQUIRES]->(prereq:Concept {id: $prereq_id})
```

## Seed Script

```bash
cd backend
python scripts/seed_knowledge_graph.py
```

## Cost

Free (AuraDB Free tier — no credit card required)
Upgrade to AuraDB Professional ($65/month) for production scale.
