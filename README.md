# OBD-Cortex: Admin Dashboard

The **Admin Dashboard** is a modern Next.js frontend application designed to manage the OBD-Cortex ecosystem. It provides administrators with a highly secure, centralized interface to monitor IoT telemetry, manage provisioned Raspberry Pi devices, and ingest extensive technical vehicle documentation into the global RAG (Retrieval-Augmented Generation) knowledge base.

## Architecture Overview

This frontend acts as the control plane for the entire system:
1. **Server Actions First**: All data mutations and remote service integrations use Next.js Server Actions (`src/app/actions.js`), completely eliminating bloated client-side API routes and shielding backend endpoints from the browser.
2. **Stateless Security**: Utilizes a robust, zero-dependency, HTTP-only cookie session mechanism built natively on Node's cryptographic primitives.
3. **Decoupled Connectivity**: All backend communication is proxied through the server to the `Admin-Service` via the centralized `ragApi.js` fetch layer, ensuring secure API key transmission without leaking credentials to the client.

## Repository Structure

- `src/app/`: Next.js App Router definitions, Server Actions, and primary layout components.
- `src/components/`: Reusable React components (Knowledge Base tables, File Upload modals, etc.).
- `src/lib/`: Core utilities including the RAG API wrapper and stateless authentication mechanics.
- `public/`: Static assets.

## Local Development (Quick Start)

To run this frontend locally for development or evaluation:
1. Ensure **Node.js 18+** is installed.
2. Install dependencies: `npm install`
3. Copy the example environment variables: `cp .env.example .env` and fill in the values.
4. Start the Next.js development server: `npm run dev`

## Deployment

Please refer to `INSTALL.md` for complete configuration and deployment instructions onto Hostinger.
