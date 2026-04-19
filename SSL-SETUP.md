# SSL/HTTPS Setup with Let's Encrypt

This guide explains how to enable HTTPS on your Volt e-commerce application using Let's Encrypt certificates managed by certbot.

## Overview

The setup includes:
- **Nginx** configured as reverse proxy with SSL/TLS support
- **Certbot** container running certificate renewal automation
- **HTTP → HTTPS redirection** (except for Let's Encrypt validation)
- **Security headers** (HSTS, CSP, X-Frame-Options, etc.)
- **Automatic certificate renewal** every 12 hours

## Prerequisites

Before setting up SSL, ensure:
1. Your domain is **publicly accessible** and pointing to this server's IP address
2. **Port 80** is open to the internet (required for Let's Encrypt validation via ACME HTTP-01 challenge)
3. **Port 443** is open to the internet (required for HTTPS traffic)
4. You have a valid **domain name** (not `localhost`)

## Architecture

```
Internet (Port 80/443)
        ↓
Nginx (SSL/TLS termination)
        ↓
Backend (Port 4000) + Frontend (Port 3000)
        ↓
HTTP headers: X-Forwarded-Proto: https
```

- Certbot validates ownership using HTTP-01 challenge (puts file in `/.well-known/acme-challenge/`)
- Certificate stored in shared volume `letsencrypt:/etc/letsencrypt`
- Nginx reads certificates from volume and terminates SSL
- Certbot container runs renewal check every 12 hours

## Setup Steps

### Step 1: Choose Your Domain

Replace `yourdomain.com` with your actual domain in the commands below.

**Important:** The domain **must be reachable** from the internet before you proceed.

### Step 2: Run Setup Script

Choose your OS:

#### Linux / macOS
```bash
bash setup-ssl.sh yourdomain.com
```

#### Windows (PowerShell)
```powershell
.\setup-ssl.ps1 -Domain yourdomain.com
```

#### Testing First (Recommended)

To test without hitting Let's Encrypt rate limits:

**Linux / macOS:**
```bash
bash setup-ssl.sh yourdomain.com staging
```

**Windows:**
```powershell
.\setup-ssl.ps1 -Domain yourdomain.com -Staging
```

The staging environment uses untrusted certificates but has much higher rate limits.

### Step 3: Update nginx.conf

After the script obtains certificates, update `nginx.conf` with your domain:

```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

Replace `yourdomain.com` with your actual domain.

### Step 4: Rebuild and Deploy

```bash
docker compose -p volt up -d --build
```

Verify all containers are running:
```bash
docker compose -p volt ps
```

Test HTTPS access:
```bash
curl -I https://yourdomain.com
```

You should see:
- HTTP 200 with valid SSL certificate
- Header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Configuration Details

### nginx.conf Changes

1. **HTTP Server (Port 80)**
   - Serves Let's Encrypt ACME challenges at `/.well-known/acme-challenge/`
   - Redirects all other traffic to HTTPS
   - Allows `/health` endpoint unencrypted (for load balancers)

2. **HTTPS Server (Port 443)**
   - Serves all application traffic with SSL/TLS
   - SSL protocols: TLSv1.2, TLSv1.3
   - Added security headers:
     - `Strict-Transport-Security`: Forces HTTPS for 1 year
     - `X-Content-Type-Options: nosniff`: Prevents MIME sniffing
     - `X-Frame-Options: SAMEORIGIN`: Prevents clickjacking

### docker-compose.yml Changes

1. **nginx service**
   - Added port `443:443`
   - Added volume mounts:
     - `letsencrypt:/etc/letsencrypt:ro` — Read-only access to certificates
     - `certbot_webroot:/var/www/certbot:ro` — ACME challenge directory

2. **New certbot service**
   - Automatically renews certificates every 12 hours
   - Uses webroot method (no downtime during renewal)
   - Restarts automatically if stopped

3. **Volume definitions**
   - `letsencrypt` — Persists certificate data across restarts
   - `certbot_webroot` — Shared directory for ACME validation

## Certificate Renewal

Certificates are automatically renewed by the `certbot` container:
- Runs renewal check every 12 hours
- Renews if certificate expires within 30 days
- **No downtime** — renewal uses webroot method
- Nginx remains operational during renewal

Monitor renewal logs:
```bash
docker compose -p volt logs certbot
```

## Troubleshooting

### Certificate Generation Failed

**Error: "Could not successfully receive certificate"**

**Causes:**
1. Domain not pointing to this server's IP
2. Port 80 not accessible from internet
3. DNS not propagated yet (wait 15-30 minutes after changing DNS records)
4. Firewall blocking port 80 or 443

**Solution:**
```bash
# Test port accessibility
curl -I http://yourdomain.com

# Verify DNS resolution
nslookup yourdomain.com
```

### Rate Limit Hit

Let's Encrypt has rate limits:
- 50 certificates per domain per week
- 5 duplicate certificates per week
- 5 failures per domain per hour

**If you hit limits:**
1. Wait 1 hour before retry
2. Use `--staging` flag for testing
3. Delete certificate volume and try again:
   ```bash
   docker volume rm letsencrypt
   docker compose -p volt up -d --build
   ```

### Nginx Won't Start with SSL

Check nginx logs:
```bash
docker compose -p volt logs nginx
```

**Common issues:**
- Certificate path wrong in nginx.conf
- Certificate doesn't exist yet
- Nginx container not restarted after certificate obtained

**Solution:**
```bash
# Verify certificate exists
docker volume inspect letsencrypt
docker run --rm -v letsencrypt:/certs alpine ls /certs/live/

# Restart nginx
docker compose -p volt restart nginx
```

### Certificate Renewal Not Happening

Check certbot logs:
```bash
docker compose -p volt logs certbot
```

Verify certbot is running:
```bash
docker compose -p volt ps | grep certbot
```

If not running:
```bash
docker compose -p volt up -d certbot
```

## Environment Variables

Add to `.env`:

```bash
# Optional: Email for certificate expiration notifications
CERTBOT_EMAIL=admin@yourdomain.com

# Optional: Nginx domain (if different from deployment domain)
NGINX_SERVER_NAME=yourdomain.com
```

## Manual Certificate Operations

### Renew Certificate Now (Skip 12h Wait)

```bash
docker compose -p volt exec certbot certbot renew --force-renewal -v
```

### Delete and Regenerate Certificate

```bash
# Remove old certificate
docker volume rm letsencrypt
docker volume rm certbot_webroot

# Regenerate
docker compose -p volt up -d --build
bash setup-ssl.sh yourdomain.com
```

### View Certificate Details

```bash
docker compose -p volt exec certbot certbot certificates
```

## Security Best Practices

✅ **Currently Implemented:**
- HTTPS-only (HTTP redirects to HTTPS)
- TLS 1.2+ (no older protocols)
- Strong cipher suites
- HSTS header (1 year, includes subdomains)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Automatic certificate renewal
- Rate limiting on API (Redis-backed)

🔒 **Additional Hardening (Optional):**
- Add `Content-Security-Policy` header in nginx
- Enable `Certificate Transparency` logging
- Set up monitoring/alerts for certificate expiration
- Regular security audits using tools like `ssl-labs.com`

## Testing Your HTTPS Setup

```bash
# Quick test
curl -I https://yourdomain.com

# Verbose with cert details
curl -v https://yourdomain.com

# Check certificate expiration
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | grep -A 5 "Verify return code"

# Verify HSTS header
curl -i https://yourdomain.com | grep Strict-Transport-Security
```

## References

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [NGINX SSL Configuration](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

## Support

If you encounter issues:
1. Check logs: `docker compose -p volt logs -f`
2. Verify DNS: `nslookup yourdomain.com`
3. Check ports: `sudo netstat -an | grep :80` and `sudo netstat -an | grep :443`
4. Review Let's Encrypt rate limits at: https://letsencrypt.org/docs/rate-limits/
