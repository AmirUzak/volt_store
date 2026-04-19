#!/bin/bash

# SSL Certificate Setup Script for Let's Encrypt
# This script initializes SSL certificates using Let's Encrypt and certbot
# Usage: bash setup-ssl.sh <domain> [staging]
# Example: bash setup-ssl.sh yourdomain.com
#          bash setup-ssl.sh yourdomain.com staging (for testing)

set -e

DOMAIN="${1:-localhost}"
USE_STAGING="${2:-}"

if [ -z "$DOMAIN" ]; then
    echo "Usage: bash setup-ssl.sh <domain> [staging]"
    echo "Example: bash setup-ssl.sh example.com"
    exit 1
fi

echo "=================================================="
echo "Let's Encrypt SSL Certificate Setup"
echo "=================================================="
echo "Domain: $DOMAIN"
echo "Staging: ${USE_STAGING:-production}"
echo ""

# Build staging/production arguments
CERTBOT_ARGS=""
if [ "$USE_STAGING" = "staging" ]; then
    echo "⚠️  Using Let's Encrypt staging server (for testing)"
    CERTBOT_ARGS="--staging"
fi

# Ensure volumes exist
echo "📁 Creating volume directories..."
docker volume create letsencrypt 2>/dev/null || true
docker volume create certbot_webroot 2>/dev/null || true

# Start nginx and ensure certbot_webroot is accessible
echo "🚀 Starting nginx container..."
docker compose -p volt up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to start..."
sleep 5

# Run certbot to get initial certificate
echo "🔐 Running certbot to obtain certificate for $DOMAIN..."
docker run --rm \
    --volumes-from volt-nginx \
    -v letsencrypt:/etc/letsencrypt \
    -v certbot_webroot:/var/www/certbot \
    certbot/certbot certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        $CERTBOT_ARGS \
        --agree-tos \
        --no-eff-email \
        --email "admin@$DOMAIN" \
        -v

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Certificate obtained successfully!"
    echo "📍 Certificate location: /etc/letsencrypt/live/$DOMAIN/"
    echo ""
    echo "📝 Update nginx.conf with your domain:"
    echo "   Change 'localhost' to '$DOMAIN' in these lines:"
    echo "   - ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;"
    echo "   - ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;"
    echo ""
    echo "🔄 Restarting containers with SSL..."
    docker compose -p volt up -d --build
    
    echo ""
    echo "✨ SSL Setup Complete!"
    echo "🌐 Your site is now available at https://$DOMAIN"
    echo ""
else
    echo ""
    echo "❌ Certificate generation failed!"
    echo "Troubleshooting:"
    echo "1. Ensure port 80 is accessible from the internet"
    echo "2. Verify domain is pointing to this server's IP"
    echo "3. Try staging first: bash setup-ssl.sh $DOMAIN staging"
    exit 1
fi
