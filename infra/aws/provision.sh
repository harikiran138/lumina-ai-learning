#!/usr/bin/env bash
# =============================================================================
# Lumina AWS Provisioning Script
# Creates ALL new resources — NEVER modifies existing ones.
# Safe to run in an account that already has other resources.
#
# Usage:
#   chmod +x infra/aws/provision.sh
#   ./infra/aws/provision.sh
#
# Prerequisites:
#   aws cli configured (aws sts get-caller-identity must succeed)
#   jq installed
#
# What it creates (all tagged lumina:env=production):
#   - S3 bucket
#   - RDS PostgreSQL (db.t3.micro)
#   - ElastiCache Redis (cache.t3.micro)
#   - Security groups
#   - EC2 t3.large with Docker + docker-compose installed
#   - Output: infra/aws/.env.aws  (ready to paste into backend/.env)
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
REGION="${AWS_REGION:-ap-south-1}"
PROJECT="lumina"
ENV="production"
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# Unique suffix to prevent name collisions with existing resources
SUFFIX=$(openssl rand -hex 4)
PREFIX="${PROJECT}-${ENV}"

# Resource names (all new, unique)
VPC_NAME="${PREFIX}-vpc-${SUFFIX}"
SG_EC2_NAME="${PREFIX}-ec2-sg-${SUFFIX}"
SG_RDS_NAME="${PREFIX}-rds-sg-${SUFFIX}"
SG_REDIS_NAME="${PREFIX}-redis-sg-${SUFFIX}"
DB_SUBNET_GROUP="${PREFIX}-db-subnet-${SUFFIX}"
REDIS_SUBNET_GROUP="${PREFIX}-redis-subnet-${SUFFIX}"
RDS_ID="${PREFIX}-pg-${SUFFIX}"
REDIS_ID="${PREFIX}-redis-${SUFFIX}"
S3_BUCKET="${PREFIX}-media-${SUFFIX}"
EC2_NAME="${PREFIX}-app-${SUFFIX}"
KEY_NAME="${PREFIX}-key-${SUFFIX}"

# Credentials (auto-generated)
DB_PASSWORD=$(openssl rand -base64 20 | tr -dc 'A-Za-z0-9' | head -c 20)
DB_USER="lumina_user"
DB_NAME="lumina_db"

OUTPUT_ENV="$(dirname "$0")/.env.aws"

echo "============================================================"
echo "  Lumina AWS Provisioner"
echo "  Region   : $REGION"
echo "  Account  : $ACCOUNT"
echo "  Suffix   : $SUFFIX"
echo "  All names are unique — existing resources untouched"
echo "============================================================"
echo ""

# ── Helper ────────────────────────────────────────────────────────────────────
tag() {
  echo "[{Key=Project,Value=${PROJECT}},{Key=Env,Value=${ENV}},{Key=Name,Value=$1}]"
}

# ── Step 1: Find or use default VPC ──────────────────────────────────────────
echo "[1/9] Resolving VPC and subnets..."
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" --output text --region "$REGION")

if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
  echo "  No default VPC. Creating one..."
  VPC_ID=$(aws ec2 create-default-vpc --region "$REGION" --query Vpc.VpcId --output text)
fi
echo "  VPC: $VPC_ID"

SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=${VPC_ID}" "Name=defaultForAz,Values=true" \
  --query "Subnets[*].SubnetId" --output text --region "$REGION")
SUBNET_ARR=($SUBNET_IDS)
SUBNET_1="${SUBNET_ARR[0]}"
SUBNET_2="${SUBNET_ARR[1]:-${SUBNET_ARR[0]}}"
echo "  Subnets: $SUBNET_1  $SUBNET_2"

# ── Step 2: Security Groups ───────────────────────────────────────────────────
echo "[2/9] Creating security groups..."

# EC2 — allow 80, 443, 22, 8000, 3000
SG_EC2=$(aws ec2 create-security-group \
  --group-name "$SG_EC2_NAME" \
  --description "Lumina EC2 app server" \
  --vpc-id "$VPC_ID" \
  --region "$REGION" \
  --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$SG_EC2" --region "$REGION" \
  --ip-permissions \
  '[{"IpProtocol":"tcp","FromPort":22,"ToPort":22,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
    {"IpProtocol":"tcp","FromPort":80,"ToPort":80,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
    {"IpProtocol":"tcp","FromPort":443,"ToPort":443,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
    {"IpProtocol":"tcp","FromPort":8000,"ToPort":8000,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
    {"IpProtocol":"tcp","FromPort":3000,"ToPort":3000,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]}]' \
  > /dev/null
echo "  EC2 SG: $SG_EC2"

# RDS — allow 5432 from EC2 SG only
SG_RDS=$(aws ec2 create-security-group \
  --group-name "$SG_RDS_NAME" \
  --description "Lumina RDS — EC2 only" \
  --vpc-id "$VPC_ID" \
  --region "$REGION" \
  --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$SG_RDS" --region "$REGION" \
  --protocol tcp --port 5432 --source-group "$SG_EC2" > /dev/null
echo "  RDS SG: $SG_RDS"

# Redis — allow 6379 from EC2 SG only
SG_REDIS=$(aws ec2 create-security-group \
  --group-name "$SG_REDIS_NAME" \
  --description "Lumina ElastiCache — EC2 only" \
  --vpc-id "$VPC_ID" \
  --region "$REGION" \
  --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$SG_REDIS" --region "$REGION" \
  --protocol tcp --port 6379 --source-group "$SG_EC2" > /dev/null
echo "  Redis SG: $SG_REDIS"

# ── Step 3: S3 Bucket ────────────────────────────────────────────────────────
echo "[3/9] Creating S3 bucket: $S3_BUCKET"
if [ "$REGION" = "us-east-1" ]; then
  aws s3api create-bucket --bucket "$S3_BUCKET" --region "$REGION" > /dev/null
else
  aws s3api create-bucket --bucket "$S3_BUCKET" --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" > /dev/null
fi
aws s3api put-bucket-versioning --bucket "$S3_BUCKET" \
  --versioning-configuration Status=Enabled > /dev/null
aws s3api put-public-access-block --bucket "$S3_BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" > /dev/null
echo "  Bucket created and locked (private)"

# CORS for signed URL downloads
aws s3api put-bucket-cors --bucket "$S3_BUCKET" --cors-configuration '{
  "CORSRules":[{
    "AllowedOrigins":["*"],
    "AllowedMethods":["GET","PUT","POST"],
    "AllowedHeaders":["*"],
    "MaxAgeSeconds":3000
  }]
}' > /dev/null

# ── Step 4: RDS PostgreSQL ───────────────────────────────────────────────────
echo "[4/9] Creating RDS subnet group..."
aws rds create-db-subnet-group \
  --db-subnet-group-name "$DB_SUBNET_GROUP" \
  --db-subnet-group-description "Lumina RDS subnets" \
  --subnet-ids "$SUBNET_1" "$SUBNET_2" \
  --region "$REGION" > /dev/null

echo "[4/9] Creating RDS instance: $RDS_ID (db.t3.micro, 20 GB gp3) ..."
echo "  This takes 5–10 minutes. Output will continue after it becomes available."
aws rds create-db-instance \
  --db-instance-identifier "$RDS_ID" \
  --db-instance-class "db.t3.micro" \
  --engine postgres \
  --engine-version "15" \
  --master-username "$DB_USER" \
  --master-user-password "$DB_PASSWORD" \
  --db-name "$DB_NAME" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --no-multi-az \
  --no-publicly-accessible \
  --vpc-security-group-ids "$SG_RDS" \
  --db-subnet-group-name "$DB_SUBNET_GROUP" \
  --backup-retention-period 7 \
  --no-deletion-protection \
  --tags "Key=Project,Value=${PROJECT}" "Key=Env,Value=${ENV}" \
  --region "$REGION" > /dev/null
echo "  RDS creation started (polling for availability)..."
aws rds wait db-instance-available \
  --db-instance-identifier "$RDS_ID" \
  --region "$REGION"
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$RDS_ID" \
  --region "$REGION" \
  --query "DBInstances[0].Endpoint.Address" --output text)
echo "  RDS endpoint: $RDS_ENDPOINT"

# ── Step 5: ElastiCache Redis ────────────────────────────────────────────────
echo "[5/9] Creating ElastiCache subnet group..."
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name "$REDIS_SUBNET_GROUP" \
  --cache-subnet-group-description "Lumina Redis subnets" \
  --subnet-ids "$SUBNET_1" "$SUBNET_2" \
  --region "$REGION" > /dev/null

echo "[5/9] Creating ElastiCache Redis cluster: $REDIS_ID (cache.t3.micro) ..."
aws elasticache create-cache-cluster \
  --cache-cluster-id "$REDIS_ID" \
  --cache-node-type "cache.t3.micro" \
  --engine redis \
  --engine-version "7.0" \
  --num-cache-nodes 1 \
  --cache-subnet-group-name "$REDIS_SUBNET_GROUP" \
  --security-group-ids "$SG_REDIS" \
  --tags "Key=Project,Value=${PROJECT}" "Key=Env,Value=${ENV}" \
  --region "$REGION" > /dev/null
echo "  ElastiCache creation started (polling)..."
aws elasticache wait cache-cluster-available \
  --cache-cluster-id "$REDIS_ID" \
  --region "$REGION"
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id "$REDIS_ID" \
  --show-cache-node-info \
  --region "$REGION" \
  --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" --output text)
echo "  Redis endpoint: $REDIS_ENDPOINT"

# ── Step 6: EC2 Key Pair ─────────────────────────────────────────────────────
echo "[6/9] Creating EC2 key pair: $KEY_NAME ..."
KEY_DIR="$(dirname "$0")/keys"
mkdir -p "$KEY_DIR"
aws ec2 create-key-pair \
  --key-name "$KEY_NAME" \
  --region "$REGION" \
  --query "KeyMaterial" --output text > "${KEY_DIR}/${KEY_NAME}.pem"
chmod 400 "${KEY_DIR}/${KEY_NAME}.pem"
echo "  Key saved: ${KEY_DIR}/${KEY_NAME}.pem"

# ── Step 7: EC2 t3.large ─────────────────────────────────────────────────────
echo "[7/9] Fetching latest Amazon Linux 2023 AMI..."
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-*-x86_64" \
            "Name=state,Values=available" \
  --query "sort_by(Images,&CreationDate)[-1].ImageId" \
  --output text --region "$REGION")
echo "  AMI: $AMI_ID"

# User-data: install Docker, docker-compose, clone repo and start
USER_DATA=$(cat <<'USERDATA'
#!/bin/bash
set -e
yum update -y
yum install -y docker git curl
systemctl enable docker
systemctl start docker
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
usermod -aG docker ec2-user
mkdir -p /opt/lumina
chown ec2-user:ec2-user /opt/lumina
echo "Docker and docker-compose installed. Ready for deployment."
USERDATA
)

echo "[7/9] Launching EC2 t3.large: $EC2_NAME ..."
INSTANCE_JSON=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type "t3.large" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_EC2" \
  --subnet-id "$SUBNET_1" \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3","DeleteOnTermination":true}}]' \
  --user-data "$USER_DATA" \
  --associate-public-ip-address \
  --tag-specifications \
    "ResourceType=instance,Tags=[{Key=Name,Value=${EC2_NAME}},{Key=Project,Value=${PROJECT}},{Key=Env,Value=${ENV}}]" \
    "ResourceType=volume,Tags=[{Key=Project,Value=${PROJECT}}]" \
  --region "$REGION")

INSTANCE_ID=$(echo "$INSTANCE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['Instances'][0]['InstanceId'])")
echo "  Instance: $INSTANCE_ID — waiting for running state..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
EC2_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --region "$REGION" \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)
echo "  EC2 public IP: $EC2_IP"

# ── Step 8: Write output .env.aws ────────────────────────────────────────────
echo "[8/9] Writing $OUTPUT_ENV ..."
cat > "$OUTPUT_ENV" <<ENV
# ================================================================
# Lumina AWS Environment — auto-generated by provision.sh
# Suffix: ${SUFFIX}   Region: ${REGION}   Account: ${ACCOUNT}
# Copy the contents below into backend/.env (KEEP SECRETS SAFE)
# ================================================================

# === CORE ===
ENVIRONMENT=production
SECRET_KEY=REPLACE_WITH_openssl_rand_hex_32
JWT_SECRET=REPLACE_WITH_openssl_rand_hex_32
JWT_REFRESH_SECRET=REPLACE_WITH_openssl_rand_hex_32

# === DATABASE (RDS PostgreSQL) ===
DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}
POSTGRES_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}

# === CACHE (ElastiCache Redis) ===
REDIS_URL=redis://${REDIS_ENDPOINT}:6379/0
CELERY_BROKER_URL=redis://${REDIS_ENDPOINT}:6379/1
CELERY_RESULT_BACKEND=redis://${REDIS_ENDPOINT}:6379/2

# === OBJECT STORAGE (S3) ===
AWS_REGION=${REGION}
AWS_ACCESS_KEY_ID=REPLACE_WITH_IAM_KEY
AWS_SECRET_ACCESS_KEY=REPLACE_WITH_IAM_SECRET
AWS_BUCKET_NAME=${S3_BUCKET}

# === SUPABASE (Auth) ===
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# === GRAPH DB (Neo4j AuraDB Free) ===
NEO4J_URI=bolt+s://REPLACE.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=

# === AI / LLM ===
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_SIMPLE_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_COMPLEX_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_FALLBACK_MODEL=openai/gpt-4o-mini
HF_TOKEN=

# === ML SERVICE ===
FAISS_KEEP_IN_MEMORY=true
TROCR_LOAD_ON_DEMAND=true

# === OBSERVABILITY ===
SENTRY_DSN=

# === FRONTEND ===
NEXT_PUBLIC_API_URL=/api
FRONTEND_URL=http://${EC2_IP}

# === EC2 SSH ===
# ssh -i ${KEY_DIR}/${KEY_NAME}.pem ec2-user@${EC2_IP}
ENV

echo "  Written to: $OUTPUT_ENV"

# ── Step 9: Resource summary ─────────────────────────────────────────────────
echo ""
echo "[9/9] Provisioning complete!"
echo "================================================================"
echo "  EC2 IP         : $EC2_IP"
echo "  EC2 SSH        : ssh -i ${KEY_DIR}/${KEY_NAME}.pem ec2-user@${EC2_IP}"
echo "  RDS endpoint   : $RDS_ENDPOINT"
echo "  Redis endpoint : $REDIS_ENDPOINT"
echo "  S3 bucket      : $S3_BUCKET"
echo "  Instance ID    : $INSTANCE_ID"
echo ""
echo "  NEXT STEPS:"
echo "  1. Copy infra/aws/.env.aws → backend/.env (fill in API keys)"
echo "  2. scp -i ${KEY_DIR}/${KEY_NAME}.pem -r . ec2-user@${EC2_IP}:/opt/lumina"
echo "  3. SSH in and run:"
echo "     cd /opt/lumina && docker-compose -f docker-compose.aws.yml up -d --build"
echo "================================================================"
