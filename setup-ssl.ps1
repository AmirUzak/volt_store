# SSL Certificate Setup Script for Let's Encrypt (PowerShell)
# This script initializes SSL certificates using Let's Encrypt and certbot
# Usage: .\setup-ssl.ps1 -Domain yourdomain.com [-Staging]
# Example: .\setup-ssl.ps1 -Domain example.com
#          .\setup-ssl.ps1 -Domain example.com -Staging

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [switch]$Staging = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================="
Write-Host "Let's Encrypt SSL Certificate Setup"
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Domain: $Domain"
Write-Host "Staging: $(if ($Staging) { 'Yes (testing)' } else { 'No (production)' })"
Write-Host ""

# Build staging/production arguments
$certbotArgs = ""
if ($Staging) {
    Write-Host "⚠️  Using Let's Encrypt staging server (for testing)"
    $certbotArgs = "--staging"
}

# Ensure volumes exist
Write-Host "📁 Creating volume directories..."
docker volume create letsencrypt 2>$null
docker volume create certbot_webroot 2>$null

# Start nginx
Write-Host "🚀 Starting nginx container..."
docker compose -p volt up -d nginx

# Wait for nginx to be ready
Write-Host "⏳ Waiting for nginx to start..."
Start-Sleep -Seconds 5

# Run certbot
Write-Host "🔐 Running certbot to obtain certificate for $Domain..." -ForegroundColor Green
docker run --rm `
    --volumes-from volt-nginx `
    -v letsencrypt:/etc/letsencrypt `
    -v certbot_webroot:/var/www/certbot `
    certbot/certbot certbot certonly `
        --webroot `
        -w /var/www/certbot `
        -d "$Domain" `
        $certbotArgs `
        --agree-tos `
        --no-eff-email `
        --email "admin@$Domain" `
        -v

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Certificate obtained successfully!" -ForegroundColor Green
    Write-Host "📍 Certificate location: /etc/letsencrypt/live/$Domain/"
    Write-Host ""
    Write-Host "📝 Update nginx.conf with your domain:"
    Write-Host "   Change 'localhost' to '$Domain' in these lines:"
    Write-Host "   - ssl_certificate /etc/letsencrypt/live/$Domain/fullchain.pem;"
    Write-Host "   - ssl_certificate_key /etc/letsencrypt/live/$Domain/privkey.pem;"
    Write-Host ""
    Write-Host "🔄 Restarting containers with SSL..."
    docker compose -p volt up -d --build
    
    Write-Host ""
    Write-Host "✨ SSL Setup Complete!" -ForegroundColor Green
    Write-Host "🌐 Your site is now available at https://$Domain"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Certificate generation failed!" -ForegroundColor Red
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure port 80 is accessible from the internet"
    Write-Host "2. Verify domain is pointing to this server's IP"
    Write-Host "3. Try staging first: .\setup-ssl.ps1 -Domain $Domain -Staging"
    exit 1
}
