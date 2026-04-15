#!/bin/bash

# AWS Infrastructure Setup Script for Lumina AI Learning
# This script creates the necessary AWS infrastructure for deploying the Lumina app.
# It leverages existing AWS credentials (shared with Nadimpalli Informatics).

set -e  # Exit on error

echo "🚀 AWS Infrastructure Setup for Lumina AI Learning"
echo "================================================"

# Configuration
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.medium}"
REGION="${AWS_REGION:-ap-south-1}"
KEY_NAME="${KEY_NAME:-lumina-deploy-key}"
SECURITY_GROUP_NAME="lumina-security-group"
INSTANCE_NAME="lumina-production"

echo ""
echo "📋 Configuration:"
echo "  Instance Type: $INSTANCE_TYPE"
echo "  Region: $REGION"
echo "  Key Pair: $KEY_NAME"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Using the same credentials as Nadimpalli Informatics."
    echo "   Ensure you have configured 'aws configure' on your machine."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ Authenticated as Account: $ACCOUNT_ID"

# Create or verify key pair
echo ""
echo "🔑 Setting up SSH key pair..."
# Use the same 'deploy' folder pattern if it exists in the root
mkdir -p "$(dirname "$0")/../../deploy"
KEY_FILE="deploy/${KEY_NAME}.pem"

if aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$REGION" &> /dev/null; then
    echo "✅ Key pair '$KEY_NAME' already exists in AWS."
else
    echo "📝 Creating new key pair..."
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --region "$REGION" \
        --query 'KeyMaterial' \
        --output text > "$KEY_FILE"
    
    chmod 400 "$KEY_FILE"
    echo "✅ Key pair created and saved to $KEY_FILE"
fi

# Create security group
echo ""
echo "🛡️  Setting up security group..."
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
    --region "$REGION" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "None")

if [ "$SECURITY_GROUP_ID" = "None" ] || [ -z "$SECURITY_GROUP_ID" ]; then
    echo "📝 Creating security group..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name "$SECURITY_GROUP_NAME" \
        --description "Security group for Lumina AI Learning application" \
        --region "$REGION" \
        --query 'GroupId' \
        --output text)
    
    echo "✅ Security group created: $SECURITY_GROUP_ID"
    
    # Add inbound rules
    echo "📝 Adding security group rules..."
    
    # SSH (port 22)
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "$REGION"
    
    # HTTP (port 80)
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION"
    
    # HTTPS (port 443)
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION"

    # Lumina Frontend (port 8001)
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp --port 8001 --cidr 0.0.0.0/0 --region "$REGION"

    # Lumina Backend (port 8000)
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp --port 8000 --cidr 0.0.0.0/0 --region "$REGION"

    # Grafana (port 3003)
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp --port 3003 --cidr 0.0.0.0/0 --region "$REGION"
    
    echo "✅ Security group rules configured"
else
    echo "✅ Security group already exists: $SECURITY_GROUP_ID"
fi

# Get latest Amazon Linux 2023 AMI
echo ""
echo "🔍 Finding latest Amazon Linux 2023 AMI..."
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" \
    --region "$REGION" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text)

echo "✅ Using AMI: $AMI_ID"

# Launch EC2 instance
echo ""
echo "🚀 Launching EC2 instance..."
EXISTING_INSTANCE=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,pending,stopped,stopping" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text 2>/dev/null || echo "None")

if [ "$EXISTING_INSTANCE" != "None" ] && [ ! -z "$EXISTING_INSTANCE" ]; then
    echo "⚠️  Instance '$INSTANCE_NAME' already exists: $EXISTING_INSTANCE"
    INSTANCE_ID="$EXISTING_INSTANCE"
else
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id "$AMI_ID" \
        --instance-type "$INSTANCE_TYPE" \
        --key-name "$KEY_NAME" \
        --security-group-ids "$SECURITY_GROUP_ID" \
        --region "$REGION" \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
        --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":40,"VolumeType":"gp3"}}]' \
        --query 'Instances[0].InstanceId' \
        --output text)
    
    echo "✅ Instance launched: $INSTANCE_ID"
    echo "⏳ Waiting for instance to be running..."
    aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
    echo "✅ Instance is now running"
fi

# Get instance details
INSTANCE_INFO=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" --query 'Reservations[0].Instances[0]')
PUBLIC_IP=$(echo "$INSTANCE_INFO" | jq -r '.PublicIpAddress')
PRIVATE_IP=$(echo "$INSTANCE_INFO" | jq -r '.PrivateIpAddress')

echo ""
echo "📊 Instance Details:"
echo "  Instance ID: $INSTANCE_ID"
echo "  Public IP: $PUBLIC_IP"
echo "  Private IP: $PRIVATE_IP"

# Save configuration
CONFIG_FILE="$(dirname "$0")/aws-config.env"
echo "💾 Saving configuration to $CONFIG_FILE..."
cat > "$CONFIG_FILE" << EOF
# AWS Infrastructure Configuration for Lumina
# Generated on $(date)
AWS_REGION=$REGION
INSTANCE_ID=$INSTANCE_ID
INSTANCE_TYPE=$INSTANCE_TYPE
PUBLIC_IP=$PUBLIC_IP
PRIVATE_IP=$PRIVATE_IP
SECURITY_GROUP_ID=$SECURITY_GROUP_ID
KEY_NAME=$KEY_NAME
KEY_FILE=$KEY_FILE
EOF

echo "✅ Configuration saved."
echo ""
echo "Next Steps:"
echo "  1. Run './deploy/aws/install-docker.sh $PUBLIC_IP' to set up the environment."
echo "  2. Run './deploy/aws/deploy-to-aws.sh' to deploy the Lumina project."
