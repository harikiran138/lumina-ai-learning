# Deploy Directory

This is the **single, canonical** deployment asset directory for Lumina.

## Contents

| Path | Purpose |
|------|---------|
| `deploy.sh` | Host update/deploy helper (runs on EC2 or VM) |
| `nginx/` | Nginx site config and proxy parameters |
| `aws/` | AWS cloud provisioning & bootstrap scripts (formerly `deployment/aws/`) |

## Subdirectory Guide

### `nginx/`
Consumed directly on a host or VM:
- `lumina-prod.conf` — Nginx reverse-proxy site config
- `proxy_params.conf` — shared proxy headers

### `aws/`
Cloud-specific automation:
- `aws-infrastructure.sh` — provision EC2, security groups, key pair
- `deploy-to-aws.sh` — push a release to EC2
- `deploy-on-ec2.sh` — runs on the EC2 instance to pull & restart
- `bootstrap-ec2.sh` — first-time EC2 bootstrap
- `install-docker.sh` — install Docker on a fresh instance
- `setup-ssl.sh` — certbot / Let's Encrypt setup
- `docker-compose.full.yml` / `docker-compose.ec2.yml` — compose variants
- `nginx.conf` — EC2-specific Nginx config
- `aws-config.env` — key/region variables (git-ignored)
- `.env.production.example` — production env template
