# Lumina AWS Deployment Infrastructure

This directory contains the adapted AWS deployment infrastructure from the **Nadimpalli Informatics LLP** project. It allows you to use your existing AWS credentials and patterns to manage a dedicated EC2 instance for the **Lumina AI Learning** project.

## 📁 Directory Structure
```text
deployment/aws/
├── aws-infrastructure.sh  # Creates EC2, Security Group, and Key Pair
├── install-docker.sh      # Installs Docker, Docker Compose, and Git on EC2
├── deploy-to-aws.sh       # Syncs project files and starts services
└── README.md              # This file
```

## 🚀 Getting Started

### 1. Initialize AWS Infrastructure
This script will create a new EC2 instance named `lumina-production` and a security group `lumina-security-group`.

```bash
# Make script executable
chmod +x deployment/aws/*.sh

# Run infrastructure setup
./deployment/aws/aws-infrastructure.sh
```
*Wait for the script to finish. It will save the configuration to `deployment/aws/aws-config.env`.*

### 2. Install Docker & Tools
Next, run the installation script to set up Docker on your new instance. This script is intended to be run locally, and it will execute commands on the remote instance.

```bash
# Get the PUBLIC_IP from aws-config.env if not known
./deployment/aws/install-docker.sh [PUBLIC_IP_ADDRESS]
```

### 3. Deploy the Project
Finally, use the main deployment script to push your files and start the Lumina application.

```bash
./deployment/aws/deploy-to-aws.sh
```

## 🌐 Public Access
Once deployed, you can access the project components at:
- **Frontend**: `http://[PUBLIC_IP]:8001`
- **Backend (API)**: `http://[PUBLIC_IP]:8000`
- **Grafana**: `http://[PUBLIC_IP]:3003`

## 🛠️ Maintenance & Monitoring

### View Service Logs
```bash
# SSH into the server first
ssh -i deploy/lumina-deploy-key.pem ec2-user@[PUBLIC_IP]
cd /opt/lumina
docker-compose logs -f
```

### Restart Services
```bash
ssh -i deploy/lumina-deploy-key.pem ec2-user@[PUBLIC_IP] 'cd /opt/lumina && docker-compose restart'
```

---
**Note**: This setup uses the same AWS profile/credentials configured for the Nadimpalli project. Ensure your AWS CLI is configured correctly (`aws configure`).
