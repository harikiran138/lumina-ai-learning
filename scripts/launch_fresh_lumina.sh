#!/bin/bash
# ============================================================================
# Lumina Fresh Cloud Launch Script
# Description: Automated setup of a brand new instance for Lumina v2.
# ============================================================================

set -e

KEY_NAME="lumina-fresh-key"
SG_NAME="lumina-fresh-sg"
AMI_ID="ami-095cc90aa5ddff518" # Ubuntu 22.04 LTS (ap-south-1)
INSTANCE_TYPE="t3.medium"
REGION="ap-south-1"

echo "✨ Starting Fresh Provisioning for Lumina Cloud..."

# 1. Create a New Key Pair
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" > /dev/null 2>&1; then
    echo "🔑 Creating NEW key pair: $KEY_NAME..."
    aws ec2 create-key-pair --key-name "$KEY_NAME" --query 'KeyMaterial' --output text > "${KEY_NAME}.pem"
    chmod 400 "${KEY_NAME}.pem"
    echo "✓ New key pair created and saved to ./${KEY_NAME}.pem"
else
    echo "🔑 Key pair '$KEY_NAME' already exists. Using it."
fi

# 2. Create a New Security Group
if ! aws ec2 describe-security-groups --group-names "$SG_NAME" > /dev/null 2>&1; then
    echo "🛡️ Creating NEW security group: $SG_NAME..."
    SG_ID=$(aws ec2 create-security-group --group-name "$SG_NAME" --description "Lumina Fresh Security Group" --query 'GroupId' --output text)
    
    # Authorize unique ports
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 # SSH
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3000 --cidr 0.0.0.0/0 # Frontend
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 8000 --cidr 0.0.0.0/0 # Backend
    echo "✓ New security group configured."
else
    SG_ID=$(aws ec2 describe-security-groups --group-names "$SG_NAME" --query 'SecurityGroups[0].GroupId' --output text)
    echo "🛡️ Using existing security group: $SG_NAME ($SG_ID)"
fi

# 3. Launch NEW Instance
echo "🚀 Launching BRAND NEW instance ($INSTANCE_TYPE)..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --user-data "file://scripts/user_data.sh" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=Lumina-Fresh-Prod}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "🛰️ New Instance started: $INSTANCE_ID"

# 4. Wait for Public IP
echo "⏳ Monitoring for Public IP address..."
while [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "None" ]; do
    sleep 5
    PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
done

echo ""
echo "🌟 Lumina Fresh Instance is LIVE!"
echo "🌐 Public URL: http://$PUBLIC_IP:3000"
echo "🔌 API Docs: http://$PUBLIC_IP:8000/docs"
echo "🔑 SSH Access: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP"
echo ""
echo "🚀 Deployment Status: The instance is currently building the Lumina stack."
echo "📜 Monitor progress: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP 'tail -f /var/log/cloud-init-output.log'"
