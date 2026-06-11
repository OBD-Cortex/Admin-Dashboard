# OBD-Cortex: Admin Dashboard Frontend

The **Admin Dashboard** is a secure Next.js App Router application hosted on Hostinger. It serves as the fleet management console for administrators to provision devices, monitor live statuses, and trigger manual vector ingestion jobs.

---

## Service Architecture

This Next.js control plane leverages Server-First rendering principles:
1.  **Server Actions Core:** All database mutators and backend service integrations use Server Actions (`src/app/actions.js`). This completely shields endpoints and sensitive tokens from exposure to the user's browser.
2.  **Edge Runtime Guard:** Secure cookies auth runs inside the V8 Edge Runtime (using `middleware.js`). Browser-native `atob()` handles JWT parsing instead of Node-specific `Buffer` module to prevent crashes in the V8 Edge runtime environment.
3.  **Encapsulated API Key Forwarding:** Outgoing backend API requests are proxied via `fetchFromRag()` inside `src/lib/ragApi.js`. The browser client never handles the `MOBILE_API_KEY`.
4.  **Static Security Baseline:** The application utilizes standard HTTPS (SSL auto-provisioned by Hostinger) and injects strict security headers (CSP, HSTS, X-Frame-Options Deny) on every page.

---

## Repository Structure

*   `src/app/actions.js`: Implements Server Actions for device pairing, document deletes, and status updates.
*   `src/middleware.js`: Injects security headers, blocks maintenance traffic, and verifies the session cookies.
*   `src/lib/ragApi.js`: Centralized fetch proxy communicating with the backend APIs.
*   `src/components/`: Modular React components (e.g. `DeviceTable.js`, `KnowledgeBase.js`, `UploadModal.js`).

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
4.  Configure `RAG_API_URL` and `MOBILE_API_KEY` inside `.env`.
5.  Start the local dev server:
    ```bash
    npm run dev
    ```

---

## Deployment Guide

*   Refer to [INSTALL.md](file:///home/bodz/OBD-Cortex/Admin-Dashboard/INSTALL.md) for Hostinger setup and runtime version parameters.

