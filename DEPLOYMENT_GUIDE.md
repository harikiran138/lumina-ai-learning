# Lumina AI Learning Platform - Production Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy the Lumina AI Learning Platform to an AWS EC2 instance with production-grade setup, including:

- Docker & Docker Compose
- Nginx reverse proxy with HTTPS
- Auto-update deployment workflow
- Health monitoring
- Zero-downtime updates

## Prerequisites

- AWS account with EC2 instance named "lumina" (existing)
- Domain name (with DNS configured to EC2 IP)
- SSH access to EC2 instance
- Git repository access

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                    │
│            Port 80 → 443 (SSL/TLS Termination)               │
└─────────────────────────────────────────────────────────────┘
              │
              ├──────────────────────────┬──────────────────────┤
              ↓                          ↓                      ↓
┌──────────────────────┐   ┌──────────────────────┐  ┌─────────────────┐
│  Frontend (Next.js)  │   │  Backend (FastAPI)   │  │  ML Service     │
│      Port 3000       │   │      Port 8000       │  │   Port 5000     │
└──────────────────────┘   └──────────────────────┘  └─────────────────┘
              │                    │
              └───────┬────────────┘
                      ↓
┌──────────────────────────────────────────────────────────────┐
│         Backend Services (Docker Compose Network)            │
├──────────────────────────────────────────────────────────────┤
│  PostgreSQL (5432)  │  Redis (6379)  │  Neo4j (7687)         │
│   MinIO (9000)      │                                         │
└──────────────────────────────────────────────────────────────┘
```

## Phase 1: EC2 Instance Setup

### Step 1.1 - Identify EC2 Instance Using AWS CLI

```bash
# Get instance details by name "lumina"
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=lumina" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress,SecurityGroups[0].GroupId]' \
  --output text

# Expected output:
# i-0xxxxxxxxxxxxx  <PUBLIC_IP>  sg-0xxxxxxxxxxxxx

# Save these for reference
export INSTANCE_ID="i-0xxxxxxxxxxxxx"
export PUBLIC_IP="<PUBLIC_IP>"
export SECURITY_GROUP="sg-0xxxxxxxxxxxxx"
export LUMINA_DOMAIN="yourdomain.com"  # Update with your domain
```

### Step 1.2 - Configure Security Group

```bash
# Open required ports
aws ec2 authorize-security-group-ingress \
  --group-id "$SECURITY_GROUP" \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0  # SSH (restrict to your IP in production)

aws ec2 authorize-security-group-ingress \
  --group-id "$SECURITY_GROUP" \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0  # HTTP

aws ec2 authorize-security-group-ingress \
  --group-id "$SECURITY_GROUP" \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0  # HTTPS

aws ec2 authorize-security-group-ingress \
  --group-id "$SECURITY_GROUP" \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0  # Frontend (optional - use Nginx instead)

aws ec2 authorize-security-group-ingress \
  --group-id "$SECURITY_GROUP" \
  --protocol tcp \
  --port 8000 \
  --cidr 0.0.0.0/0  # Backend (optional - use Nginx instead)

aws ec2 authorize-security-group-ingress \
  --group-ip-permission IpProtocol=tcp,FromPort=9000,ToPort=9000,IpRanges='[{IpCidr=0.0.0.0/0}]' \
  --group-id "$SECURITY_GROUP"  # MinIO (optional)

echo "Security group configured with required ports open"
```

### Step 1.3 - SSH into EC2 Instance

```bash
# Connect to the instance
ssh -i "your-key-pair.pem" ubuntu@$PUBLIC_IP

# Once connected, run remaining commands on the instance
```

### Step 1.4 - System Updates

```bash
# On EC2 instance:
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git gnupg apt-transport-https ca-certificates
```

## Phase 2: Install Docker & Docker Compose

### Step 2.1 - Install Docker

```bash
# On EC2 instance:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Verify installation
docker --version
docker run hello-world
```

### Step 2.2 - Install Docker Compose

```bash
# On EC2 instance:
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Step 2.3 - Configure Docker to Start on Boot

```bash
# On EC2 instance:
sudo systemctl enable docker
sudo systemctl enable docker-compose || echo "docker-compose service not available (OK)"
```

## Phase 3: Install Node.js & Python

### Step 3.1 - Install Node.js (LTS)

```bash
# On EC2 instance:
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Step 3.2 - Install Python 3.11+

```bash
# On EC2 instance:
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Set python3 to use 3.11
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Verify
python3 --version
pip3 --version
```

## Phase 4: Install Nginx & Let's Encrypt

### Step 4.1 - Install Nginx

```bash
# On EC2 instance:
sudo apt-get install -y nginx

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### Step 4.2 - Install Certbot (Let's Encrypt SSL)

```bash
# On EC2 instance:
sudo apt-get install -y certbot python3-certbot-nginx

# Generate SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d $LUMINA_DOMAIN -d www.$LUMINA_DOMAIN \
  --agree-tos --email admin@$LUMINA_DOMAIN --non-interactive

# Verify certificate
ls -la /etc/letsencrypt/live/$LUMINA_DOMAIN/
```

## Phase 5: Clone Repository & Setup

### Step 5.1 - Clone Repository

```bash
# On EC2 instance:
cd /home/ubuntu
git clone https://github.com/yourusername/lumina-ai-learning.git
cd lumina-ai-learning

# Checkout main branch
git checkout main
```

### Step 5.2 - Setup Environment Variables

```bash
# On EC2 instance:
# In backend/ directory, create .env.prod file
cat > /home/ubuntu/lumina-ai-learning/backend/.env.prod << 'EOF'
# API Configuration
API_V1_STR=/api
ENVIRONMENT=production
SECRET_KEY=your-super-secret-key-change-this
JWT_SECRET=your-jwt-secret-key-change-this

# Supabase Configuration
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# AI Services
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lumina
REDIS_URL=redis://localhost:6379
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=lumina-neo4j-password

# Email
SENDGRID_API_KEY=your-sendgrid-key
GMAIL_ADDRESS=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=["https://your-domain.com","https://www.your-domain.com"]

# Storage
MINIO_URL=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Security
SECURE_COOKIES=true
SENTRY_DSN=your-sentry-dsn-optional

# Logging
REDACT_PII_LOGS=true
LOG_LEVEL=INFO
EOF

# Set proper permissions
chmod 600 /home/ubuntu/lumina-ai-learning/backend/.env.prod
```

### Step 5.3 - Setup Frontend Environment

```bash
# On EC2 instance:
cat > /home/ubuntu/lumina-ai-learning/frontend/.env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_ENVIRONMENT=production
EOF

chmod 600 /home/ubuntu/lumina-ai-learning/frontend/.env.production
```

## Phase 6: Deploy with Docker Compose

### Step 6.1 - Navigate to Project

```bash
# On EC2 instance:
cd /home/ubuntu/lumina-ai-learning
```

### Step 6.2 - Create/Update docker-compose.prod.yml

The production Docker Compose file is in the repository. Review [docker-compose.prod.yml](./docker-compose.prod.yml).

### Step 6.3 - Start Services

```bash
# On EC2 instance:
# First time startup with service initialization
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
sleep 30
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Step 6.4 - Run Database Migrations

```bash
# On EC2 instance:
# Connect to backend container
docker-compose -f docker-compose.prod.yml exec backend bash

# Run migrations (if using Alembic or similar)
cd /app
alembic upgrade head
# or
python3 -m app.db.migrate  # depends on your setup

# Exit container
exit
```

## Phase 7: Configure Nginx Reverse Proxy

### Step 7.1 - Update Nginx Configuration

The Nginx config is provided in [nginx/lumina-prod.conf](./nginx/lumina-prod.conf).

```bash
# On EC2 instance:
# Copy config
sudo cp /home/ubuntu/lumina-ai-learning/deploy/nginx/lumina-prod.conf \
  /etc/nginx/sites-available/lumina-prod.conf

# Update domain in config
sudo sed -i "s/your-domain.com/$LUMINA_DOMAIN/g" \
  /etc/nginx/sites-available/lumina-prod.conf

# Enable site
sudo ln - s /etc/nginx/sites-available/lumina-prod.conf \
  /etc/nginx/sites-enabled/lumina-prod.conf \
  2>/dev/null || true

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 7.2 - Test HTTPS

```bash
# On EC2 instance:
curl -I https://$LUMINA_DOMAIN/

# Expected: 200 OK or redirect response (not SSL error)
```

## Phase 8: Setup Auto-Update Workflow

### Step 8.1 - Create deploy.sh Script

The deployment script is in [deploy/deploy.sh](./deploy/deploy.sh).

```bash
# On EC2 instance:
# Copy deploy script
sudo cp /home/ubuntu/lumina-ai-learning/deploy/deploy.sh /usr/local/bin/lumina-deploy
sudo chmod +x /usr/local/bin/lumina-deploy

# Test deployment (this will pull latest and restart)
# lumina-deploy
```

### Step 8.2 - Setup GitHub Actions (Optional)

For automatic deployment on push to main:

1. Set up GitHub repository secrets:
   - `AWS_EC2_IP`: Your EC2 public IP
   - `AWS_EC2_USER`: ubuntu
   - `AWS_EC2_KEY`: Your SSH private key (base64 encoded)

2. Use the provided GitHub Actions workflow: [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)

## Phase 9: Health Checks & Monitoring

### Step 9.1 - Verify Services

```bash
# On EC2 instance or local:
# Frontend
curl https://$LUMINA_DOMAIN/ -I

# Backend health
curl https://$LUMINA_DOMAIN/api/health

# API docs
curl https://$LUMINA_DOMAIN/api/docs

# Logs
docker-compose -f /home/ubuntu/lumina-ai-learning/docker-compose.prod.yml logs --tail=100 backend
```

### Step 9.2 - Monitor Containers

```bash
# On EC2 instance:
# Watch container status
watch -n 2 'docker-compose -f /home/ubuntu/lumina-ai-learning/docker-compose.prod.yml ps'

# Check resource usage
docker stats
```

## Phase 10: Zero-Downtime Deployments

The deploy.sh script handles zero-downtime updates using:

1. Health checks before routing
2. Gradual service restart
3. Connection draining

```bash
# On EC2 instance:
# Deploy new version
lumina-deploy

# No downtime - existing connections complete before restart
```

## Troubleshooting

### Containers not starting?

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Rebuild containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### SSL Certificate issues?

```bash
# Renew certificate
sudo certbot renew

# Check renewal status
sudo certbot certificates
```

### Port conflicts?

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443

# Kill if necessary
sudo kill -9 <PID>
```

## Maintenance

###Backup Database

```bash
# On EC2 instance:
# Backup PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres lumina > /backups/lumina-$(date +%Y%m%d).sql
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Update Dependencies

```bash
# On EC2 instance:
cd /home/ubuntu/lumina-ai-learning

# Pull latest code
git pull origin main

# Rebuild and restart with zero downtime
lumina-deploy
```

## Success Checklist

- [ ] EC2 instance running and accessible
- [ ] Security groups configured correctly
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] Services running and healthy
- [ ] Nginx reverse proxy working
- [ ] HTTPS certificate installed and working
- [ ] Frontend accessible at https://your-domain.com
- [ ] Backend API accessible at https://your-domain.com/api
- [ ] Database migrations completed
- [ ] Deployment script working
- [ ] Health checks passing

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Review deployment guide
- Check AWS security groups and EC2 status
- Verify domain DNS configuration

