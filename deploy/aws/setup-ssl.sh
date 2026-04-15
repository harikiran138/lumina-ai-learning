#!/usr/bin/env bash
# ============================================================
# Lumina SSL/HTTPS Setup — Let's Encrypt via Certbot
# ============================================================
# Run this on the EC2 server AFTER you have a domain name
# pointing to your EC2 IP (13.232.166.186).
#
# Usage (on EC2):
#   bash /opt/lumina/setup-ssl.sh yourdomain.com admin@yourdomain.com
#
# What it does:
#   1. Installs Certbot
#   2. Obtains SSL certificate for your domain
#   3. Updates nginx config to serve HTTPS
#   4. Sets up auto-renewal cron
# ============================================================

set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"
APP_DIR="${APP_DIR:-/opt/lumina}"
COMPOSE_FILE="$APP_DIR/docker-compose.lumina.yml"
NGINX_CONF="$APP_DIR/deploy/aws/nginx.conf"

echo "=== SSL Setup for $DOMAIN ==="

# ─── Install Certbot ────────────────────────────────────────
if ! command -v certbot >/dev/null 2>&1; then
  echo "Installing Certbot..."
  if command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y python3-certbot-nginx || \
    (sudo dnf install -y python3-pip && sudo pip3 install certbot certbot-nginx)
  else
    sudo apt-get install -y certbot python3-certbot-nginx 2>/dev/null || \
    sudo pip3 install certbot certbot-nginx
  fi
fi

# ─── Obtain certificate using webroot (nginx must be running) ─
echo "Obtaining certificate for $DOMAIN ..."

# Ensure webroot directory exists (served by nginx /.well-known/)
sudo mkdir -p /var/www/certbot

# Stop nginx container momentarily if standalone mode needed
# (or use webroot if nginx is already serving /.well-known/)
sg docker -c "docker compose --project-name lumina -f $COMPOSE_FILE exec nginx \
  certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN" 2>/dev/null || \
sudo certbot certonly \
  --standalone \
  --preferred-challenges http \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  --pre-hook "docker compose --project-name lumina -f $COMPOSE_FILE stop nginx" \
  --post-hook "docker compose --project-name lumina -f $COMPOSE_FILE start nginx"

# ─── Update nginx config to enable HTTPS ────────────────────
echo "Updating nginx config for HTTPS..."

cat > /tmp/nginx-ssl.conf << NGINXEOF
upstream frontend {
    server frontend:3000;
    keepalive 16;
}

upstream backend {
    server backend:8000;
    keepalive 16;
}

limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=30r/s;

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml text/javascript image/svg+xml;

    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_set_header   Connection        "";
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location = /health {
        proxy_pass http://backend/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }

    location ~ ^/(docs|redoc|openapi.json) {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    location /ws/ {
        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       \$host;
        proxy_set_header   X-Real-IP  \$remote_addr;
        proxy_read_timeout 3600s;
    }

    location / {
        proxy_pass         http://frontend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       \$host;
        proxy_set_header   X-Real-IP  \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }
}
NGINXEOF

sudo cp /tmp/nginx-ssl.conf "$NGINX_CONF"
echo "nginx.conf updated with SSL config."

# ─── Restart nginx to load new config ────────────────────────
echo "Reloading nginx..."
sg docker -c "docker compose --project-name lumina -f $COMPOSE_FILE restart nginx"

# ─── Auto-renewal cron ───────────────────────────────────────
echo "Setting up certificate auto-renewal..."
CRON_CMD="0 3 * * * certbot renew --quiet --post-hook \"docker compose --project-name lumina -f $COMPOSE_FILE restart nginx\""
(crontab -l 2>/dev/null | grep -v certbot; echo "$CRON_CMD") | crontab -
echo "Cron job added: renews at 3am daily."

echo ""
echo "=== SSL Setup Complete ==="
echo "Your site is now available at: https://$DOMAIN"
echo "Certificate will auto-renew every 60 days."
