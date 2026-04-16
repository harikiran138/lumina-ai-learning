# Lumina — AWS RDS (PostgreSQL)

## Instance Spec

| Setting | Value |
|---------|-------|
| Instance class | `db.t3.micro` (2 vCPU, 1 GB RAM) |
| Engine | PostgreSQL 15 |
| Storage | 20 GB `gp3` SSD |
| Auto-scale storage | **Off** (cost control) |
| Multi-AZ | **Off** (dev/demo) |
| Publicly accessible | **Off** (EC2-only via SG) |
| Backup retention | 7 days |
| Deletion protection | Off (re-enable for production) |

## Connection String

```
DATABASE_URL=postgresql+asyncpg://lumina_user:<PASSWORD>@<RDS_ENDPOINT>:5432/lumina_db
```

## Security Group Rules

- Inbound: TCP 5432 from EC2 security group only
- No public internet access

## Migrations

```bash
# Run from EC2 after deploy
cd /opt/lumina/backend
alembic upgrade head
```

## Cost

~$13–15/month (db.t3.micro, 20 GB gp3, ap-south-1)
Free tier eligible for first 12 months.
