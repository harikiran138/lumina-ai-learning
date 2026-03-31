#!/bin/bash
# ============================================================================
# Lumina EC2 Auto-Launch Script
# Description: Fully automates the cloud provisioning via AWS CLI.
# ============================================================================

set -e

KEY_NAME="lumina-instance-key"
SG_NAME="lumina-instance-sg"
AMI_ID="ami-053b0d53c279acc90" # Ubuntu 22.04 LTS (us-east-1)
INSTANCE_TYPE="t3.medium"
REGION="us-east-1"

echo "🎨 Provisioning Lumina Cloud Infrastructure..."

# 1. Create Key Pair if it doesn't exist
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" > /dev/null 2>&1; then
    echo "🔑 Creating key pair: $KEY_NAME..."
    aws ec2 create-key-pair --key-name "$KEY_NAME" --query 'KeyMaterial' --output text > "${KEY_NAME}.pem"
    chmod 400 "${KEY_NAME}.pem"
    echo "✓ Key pair created and saved to ./${KEY_NAME}.pem"
else
    echo "🔑 Using existing key pair: $KEY_NAME"
fi

# 2. Create Security Group if it doesn't exist
if ! aws ec2 describe-security-groups --group-names "$SG_NAME" > /dev/null 2>&1; then
    echo "🛡️ Creating security group: $SG_NAME..."
    SG_ID=$(aws ec2 create-security-group --group-name "$SG_NAME" --description "Lumina Security Group" --query 'GroupId' --output text)
    
    # Authorize ports
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 # SSH
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3000 --cidr 0.0.0.0/0 # Frontend
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 8000 --cidr 0.0.0.0/0 # Backend
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 # HTTP
    echo "✓ Security group configured."
else
    SG_ID=$(aws ec2 describe-security-groups --group-names "$SG_NAME" --query 'SecurityGroups[0].GroupId' --output text)
    echo "🛡️ Using existing security group: $SG_NAME ($SG_ID)"
fi

# 3. Launch the Instance
echo "🚀 Launching EC2 instance ($INSTANCE_TYPE)..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --user-data "file://scripts/user_data.sh" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=Lumina-Server}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "🛰️ Instance started: $INSTANCE_ID"

# 4. Wait for Public IP
echo "⏳ Waiting for public IP address..."
while [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "None" ]; do
    sleep 5
    PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
done

echo ""
echo "✨ Lumina Provisioning Complete!"
echo "🌐 Public URL: http://$PUBLIC_IP:3000"
echo "🔑 SSH Access: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP"
echo ""
echo "🚀 Deployment Status: The instance is currently installing Docker and cloning Lumina."
echo "📜 Monitor logs: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP 'tail -f /var/log/cloud-init-output.log'"
