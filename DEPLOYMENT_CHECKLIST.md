# TreasureHunt Deployment Checklist

## Pre-Deployment (Before pushing to GitHub)

- [ ] All environment variables configured in Oracle Cloud
- [ ] Database connection string verified
- [ ] Stripe keys configured (test mode for now)
- [ ] OAuth credentials set up
- [ ] All tests passing (`pnpm test`)
- [ ] Build successful locally (`pnpm build`)
- [ ] Docker image builds successfully (`docker build -t treasure-hunt .`)

## Oracle Cloud Setup

- [ ] Oracle Cloud free tier account created
- [ ] Container Registry created (`treasure-hunt` repository)
- [ ] Auth token generated for GitHub
- [ ] Container instance created or Compute instance ready
- [ ] Public IP address noted
- [ ] Security groups/firewall rules allow ports 80, 443, 8080
- [ ] All GitHub secrets configured

## GitHub Configuration

- [ ] Repository created and code pushed
- [ ] GitHub Actions workflow file in place (`.github/workflows/deploy.yml`)
- [ ] All secrets configured:
  - [ ] `ORACLE_COMPARTMENT_ID`
  - [ ] `ORACLE_CONTAINER_INSTANCE_ID`
  - [ ] `ORACLE_AUTH_TOKEN`
  - [ ] `ORACLE_REGION`
  - [ ] `ORACLE_CONFIG`
  - [ ] `ORACLE_PRIVATE_KEY`

## Domain & DNS Setup

- [ ] GoDaddy account access verified
- [ ] garagesalemap.app domain owned
- [ ] DNS A record updated to Oracle Cloud IP
- [ ] DNS propagation verified (`nslookup garagesalemap.app`)
- [ ] Domain resolves to correct IP address

## SSL/HTTPS Configuration

- [ ] Nginx installed on Oracle instance
- [ ] Let's Encrypt certificate obtained
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate auto-renewal enabled
- [ ] HTTPS working (https://garagesalemap.app)

## Deployment Execution

- [ ] Code committed and pushed to main branch
- [ ] GitHub Actions workflow triggered
- [ ] Docker image built successfully
- [ ] Image pushed to Container Registry
- [ ] Container deployed to Oracle Cloud
- [ ] Application responding on port 8080
- [ ] Nginx reverse proxy routing traffic
- [ ] Domain accessible via HTTPS

## Post-Deployment Verification

- [ ] https://garagesalemap.app loads successfully
- [ ] https://garagesalemap.app/explore accessible
- [ ] Map displays correctly
- [ ] Geolocation working
- [ ] Category filters functional
- [ ] Route optimization working
- [ ] No console errors in browser DevTools
- [ ] Mobile view responsive on S24 Ultra

## Monitoring & Maintenance

- [ ] Application logs accessible (`docker logs treasure-hunt`)
- [ ] Health check endpoint responding
- [ ] Database connections stable
- [ ] SSL certificate valid and auto-renewing
- [ ] Automated backups configured (if applicable)
- [ ] Monitoring alerts set up (optional)

## Troubleshooting Checklist

If deployment fails, verify:

- [ ] Docker image builds locally without errors
- [ ] All environment variables are set correctly
- [ ] Oracle Cloud instance has sufficient resources
- [ ] Network security groups allow required ports
- [ ] GitHub Actions secrets are not expired
- [ ] Domain DNS records are correctly configured
- [ ] SSL certificate is valid and not expired
- [ ] Application logs show no critical errors
- [ ] Database is accessible from Oracle instance
- [ ] Nginx configuration is syntactically correct

## Quick Commands

```bash
# Test Docker build locally
docker build -t treasure-hunt .
docker run -p 8080:8080 treasure-hunt

# SSH into Oracle instance
ssh -i your-key.key ubuntu@YOUR_ORACLE_IP

# View application logs
docker logs -f treasure-hunt

# Check DNS resolution
nslookup garagesalemap.app
dig garagesalemap.app

# Verify SSL certificate
openssl s_client -connect garagesalemap.app:443

# Restart application
docker restart treasure-hunt

# Update and redeploy
git push origin main  # GitHub Actions handles the rest
```

---

**Once all items are checked, your TreasureHunt app will be live at https://garagesalemap.app! 🚀**
