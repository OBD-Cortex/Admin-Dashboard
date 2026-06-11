# Admin Dashboard Deployment Guide

This guide outlines how to deploy the Next.js Admin Dashboard onto **Hostinger**, utilizing its native seamless deployment workflow.

---

## System Requirements
- Node.js 18+ (if running locally)
- A Hostinger Web Hosting or VPS plan with Next.js support.

---

## Node Version Compatibility Warning

> [!WARNING]
> **Runtime Version Mismatch:** The dashboard configures package parameters for Node `20.19.0` or higher (`"engines": {"node": ">=20.19.0"}`).
> Before triggering the build on Hostinger, ensure you select **Node.js 20** or higher in your Hostinger configuration manager. Deploying on an older Node runtime (such as Node 16 or 18) will cause Next.js build script parsing errors or runtime dependency failures.

---

## Environment Variables

Before deploying, configure your environment variables. Create a `.env` file at the root of the project:

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

---

## Hostinger Native Deployment Workflow

Hostinger provides a native pipeline for deploying Next.js applications seamlessly without needing manual `npm run build` or SSH access for startup.

1.  **Upload Codebase:** Use Hostinger's Git integration or File Manager to upload this repository to your designated `public_html` or application root directory.
2.  **Configure Environment:** In the Hostinger hPanel for your domain, locate the "Environment Variables" section and inject the variables from the `.env` file above.
3.  **Configure Node.js Version:** In hPanel, make sure your Node.js configuration specifies **Node 20+** to prevent compilation crashes.
4.  **Trigger Build:** Use the hPanel interface to install dependencies (`npm install`) and trigger the Next.js build process.
5.  **Attach Subdomain:** If running on a dedicated server or specific Hostinger plan, ensure your Hostinger DNS zones route your designated subdomain (e.g., `dashboard.yourdomain.com`) directly to this application's output port.
6.  **SSL/TLS:** Hostinger will automatically provision and renew a Let's Encrypt SSL certificate for your attached domain.

Your dashboard will now be fully accessible securely over HTTPS!

