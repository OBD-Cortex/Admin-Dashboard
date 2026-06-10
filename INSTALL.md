# Admin Dashboard Deployment Guide

This guide outlines how to deploy the Next.js Admin Dashboard onto **Hostinger**, utilizing its native seamless deployment workflow.

## System Requirements
- Node.js 18+ (if running locally)
- A Hostinger Web Hosting or VPS plan with Next.js support.

## Environment Variables
Before deploying, you must configure your environment variables. Create a `.env` file at the root of the project:

```env
# The URL pointing to your DigitalOcean Admin-Service deployment
RAG_API_URL=https://admin.yourdomain.com

# A highly secure random string used to sign session cookies
SESSION_SECRET=your_super_secret_cookie_signing_key_here

# The SHA-256 hash of your desired administrator login password
ADMIN_PASSWORD_HASH=your_sha256_hashed_password_here

# The internal API key to authenticate requests against the Admin-Service backend
MOBILE_API_KEY=your_secure_backend_api_key_here
```

## Hostinger Native Deployment Workflow

Hostinger provides a native pipeline for deploying Next.js applications seamlessly without needing manual `npm run build` or SSH access for startup.

1. **Upload Codebase:** Use Hostinger's Git integration or File Manager to upload this repository to your designated `public_html` or application root directory.
2. **Configure Environment:** In the Hostinger hPanel for your domain, locate the "Environment Variables" section and inject the variables from the `.env` file above.
3. **Trigger Build:** Use the hPanel interface to install dependencies (`npm install`) and trigger the Next.js build process.
4. **Attach Subdomain:** If running on a dedicated server or specific Hostinger plan, ensure your Hostinger DNS zones route your designated subdomain (e.g., `dashboard.yourdomain.com`) directly to this application's output port.
5. **SSL/TLS:** Hostinger will automatically provision and renew a Let's Encrypt SSL certificate for your attached domain.

Your dashboard will now be fully accessible securely over HTTPS!
