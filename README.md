# OBD-Cortex: Admin Dashboard Frontend

The **Admin Dashboard** is a secure Next.js App Router application hosted on Hostinger. It serves as the fleet management console for administrators to provision devices, monitor live statuses, and trigger manual vector ingestion jobs.

---

## Service Architecture

This Next.js control plane leverages Server-First rendering principles:
1.  **Server Actions Core:** All database mutators and backend service integrations use Server Actions (`src/app/actions.ts`). This completely shields endpoints and sensitive tokens from exposure to the user's browser.
2.  **Edge Runtime Guard:** Secure cookies auth runs inside the V8 Edge Runtime (using `middleware.js`). Browser-native `atob()` handles JWT parsing instead of Node-specific `Buffer` module to prevent crashes in the V8 Edge runtime environment.
3.  **Encapsulated Credentials Forwarding:** Outgoing backend API requests are proxied via `fetchFromAdminService()` inside [adminServiceApi.ts](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/lib/adminServiceApi.ts). The browser client never handles the `ADMIN_JWT_SECRET`.
4.  **Static Security Baseline:** The application utilizes standard HTTPS (SSL auto-provisioned by Hostinger) and injects strict security headers (CSP, HSTS, X-Frame-Options Deny) on every page.

---

## Repository Structure

*   [actions.ts](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/app/actions.ts): Implements Server Actions for device pairing, document deletes, and status updates.
*   [middleware.js](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/middleware.js): Injects security headers, blocks maintenance traffic, and verifies the session cookies.
*   `src/lib/`: Core TypeScript utilities including [adminServiceApi.ts](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/lib/adminServiceApi.ts) (FastAPI admin client), [auth.ts](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/lib/auth.ts) (timing-safe credential validator), [session.ts](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/lib/session.ts) (stateless session tokens), and [env.ts](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/lib/env.ts) (environment sanity checker).
*   `src/components/`: Modular React components (e.g., [DeviceTable.tsx](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/components/DeviceTable.tsx), [KnowledgeBase.tsx](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/components/KnowledgeBase.tsx), [UploadModal.tsx](file:///home/bodz/OBD-Cortex/Admin-Dashboard/src/components/UploadModal.tsx)).

---

## Local Development Setup

To evaluate this dashboard locally:
1.  Verify **Node.js 18+** is installed.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Copy environment variables:
    ```bash
    cp .env.example .env
    ```
4.  Configure `ADMIN_SERVICE_URL` and `ADMIN_JWT_SECRET` inside `.env`.
5.  Start the local dev server:
    ```bash
    npm run dev
    ```

---

## Deployment Guide

*   Refer to [INSTALL.md](file:///home/bodz/OBD-Cortex/Admin-Dashboard/INSTALL.md) for Hostinger setup and runtime version parameters.

