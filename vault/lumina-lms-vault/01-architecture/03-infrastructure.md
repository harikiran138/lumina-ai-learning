# Infrastructure

> **File:** `01-architecture/03-infrastructure.md`
> **Related:** [[01-architecture/01-system-architecture]], [[07-operations/01-deployment]]
> **Last Updated:** 2026-04-15

Hosting, storage, services, and environment configuration for Lumina.

---

## Deployment Model

Lumina is **self-hosted** — designed to run on hardware owned or managed by the institution (college server, college-managed VPS). There is no mandatory cloud dependency. Every service can run on a single Linux server or be split across multiple machines.

## Services and Ports (Default)

| Service | Default Port | Technology |
|---|---|---|
| Next.js frontend | 3000 | Node.js process or Docker container |
| FastAPI backend | 8000 | Uvicorn ASGI server |
| AI Engine | 8001 | Uvicorn ASGI server |
| Supabase PostgreSQL | 5432 | PostgreSQL 15 |
| Redis | 6379 | Redis 7 |
| MinIO | 9000 (API), 9001 (Console) | MinIO server |
| Neo4j | 7474 (HTTP), 7687 (Bolt) | Neo4j 5 |

## Environment Variables

### Backend (`.env`)

```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/lumina
REDIS_URL=redis://localhost:6379/0
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=<key>
MINIO_SECRET_KEY=<secret>
MINIO_BUCKET_LECTURES=lumina-lectures
MINIO_BUCKET_ASSIGNMENTS=lumina-assignments
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>
ANTHROPIC_API_KEY=<key>
GOOGLE_API_KEY=<key>
JWT_SECRET=<64-char random string>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30
INSTITUTION_SMTP_HOST=<college SMTP>
INSTITUTION_SMTP_PORT=587
```

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
```

## MinIO Bucket Layout

| Bucket | Contents | Access |
|---|---|---|
| `lumina-lectures` | Uploaded lecture PDFs and videos | Backend pre-signed URL only |
| `lumina-assignments` | Student assignment uploads and handwriting scans | Backend pre-signed URL only |
| `lumina-generated` | AI-generated PPTs and PDFs from Assessment agent | Backend pre-signed URL only |
| `lumina-avatars` | User profile photos | Public read, backend write |

## Database — Supabase PostgreSQL

Supabase is used as the managed PostgreSQL host (or self-hosted using the Supabase Docker stack). The application connects via `asyncpg` through SQLAlchemy's async engine. Row-Level Security (RLS) policies are enabled on sensitive tables.

Key RLS policies:
- `audit_logs`: INSERT only — no UPDATE or DELETE for any database role
- `counselling_notes`: SELECT restricted to the owning Counselor role; content stored as ciphertext
- `parent_child_links`: SELECT restricted to verified parent accounts

## Neo4j — Knowledge Graph

Neo4j stores the course knowledge graph. Each institution has a separate namespace (using Neo4j label prefixing with institution_id). Nodes are knowledge components; edges are prerequisite relationships.

```
(:KC {id, name, institution_id}) -[:PREREQUISITE_OF]-> (:KC)
(:Course {id, institution_id}) -[:CONTAINS]-> (:KC)
```

## Scaling Considerations

For a single engineering college (500–5000 students), all services can run on a single server with:
- 16 GB RAM
- 8 CPU cores
- 500 GB SSD

For larger deployments (5000+ students), the AI Engine should be separated onto a GPU-equipped machine due to TrOCR and PPO inference costs.
