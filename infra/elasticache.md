# Lumina — AWS ElastiCache (Redis)

## Instance Spec

| Setting | Value |
|---------|-------|
| Node type | `cache.t3.micro` (0.5 GB RAM) |
| Engine | Redis 7 |
| Mode | Single-node (no cluster) |
| maxmemory-policy | `allkeys-lru` |
| maxmemory | 400 MB |
| Persistence | **Off** (cache only — sessions/queue survive Redis restart via DB) |

## Connection

```
REDIS_URL=redis://<ELASTICACHE_ENDPOINT>:6379/0
CELERY_BROKER_URL=redis://<ELASTICACHE_ENDPOINT>:6379/1
CELERY_RESULT_BACKEND=redis://<ELASTICACHE_ENDPOINT>:6379/2
```

## Database Allocation

| DB index | Use |
|----------|-----|
| 0 | Application cache (leaderboard, profile, course) |
| 1 | Celery broker queue |
| 2 | Celery result backend |

## Security Group Rules

- Inbound: TCP 6379 from EC2 security group only
- No public internet access

## Cost

~$12–15/month (cache.t3.micro, ap-south-1)
Free tier: 750 hours/month for first 12 months.
