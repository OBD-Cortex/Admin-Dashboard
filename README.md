# OBD-Cortex Admin Dashboard — Next.js (Hostinger Deployment Guide)

This is the full-stack Next.js version of the OBD-Cortex administrative control panel. It combines the frontend dashboard and backend API in a single deployable application.

---

## Features

- **Dashboard**: Real-time device statistics (total, manufactured, registered, paired)
- **Device Management**: Search, filter, provision, and delete devices
- **QR Code Labels**: Generate and download QR codes (PNG/SVG) for device tokens
- **Authentication**: Password-protected admin access with cookie-based sessions
- **Hostinger Native**: Built for Hostinger's managed Node.js hosting with Next.js support

---

## Project Structure

```
Admin-Dashboard/
├── package.json            # Dependencies & scripts
├── next.config.mjs         # Next.js configuration
├── jsconfig.json           # Path aliases (@/)
├── .env.local              # Local credentials (gitignored)
├── .gitignore
│
├── src/
│   ├── middleware.js        # Auth guard (runs before every request)
│   │
│   ├── app/
│   │   ├── layout.js       # Root layout (fonts, meta)
│   │   ├── globals.css     # Complete design system
│   │   ├── page.js         # Dashboard (main page)
│   │   ├── login/
│   │   │   └── page.js     # Login page
│   │   └── api/
│   │       ├── auth/route.js       # Login/logout/session check
│   │       ├── health/route.js     # Health check
│   │       ├── stats/route.js      # Dashboard statistics
│   │       ├── devices/route.js    # List/search devices
│   │       ├── generate/route.js   # Provision new devices
│   │       ├── delete/route.js     # Delete a device
│   │       ├── unpair/route.js     # Administrative device unlinking
│   │       ├── ingest/
│   │       │   ├── route.js        # Multipart document uploading
│   │       │   └── status/route.js # Ingestion job status polling
│   │       ├── knowledge/
│   │       │   ├── route.js        # List ingested documents
│   │       │   └── [source]/route.js # Delete specific document index
│   │       └── qr/route.js         # QR code streaming
│   │
│   ├── components/          # React UI components
│   │   ├── Header.js
│   │   ├── StatsGrid.js
│   │   ├── DeviceTable.js
│   │   ├── ActionBar.js
│   │   ├── GenerateModal.js
│   │   ├── QRModal.js
│   │   ├── Toast.js
│   │   ├── UploadModal.js
│   │   └── KnowledgeBase.js
│   │
│   └── lib/                 # Server utilities
│       ├── env.js           # Dynamic env loader
│       ├── auth.js          # Session token utilities
│       ├── requireAuth.js   # HTTP Route Authentication Guard
│       └── ragApi.js        # Centralized FastAPI RAG backend client
│
└── README.md
```

### Architecture Refactoring & Modular Client

The API routes in this application are structured as lightweight security and routing proxies forwarding client requests to the Python FastAPI backend server. 

To maintain clean code standards and a robust modular approach:
1. **Centralized Client (`src/lib/ragApi.js`)**: Encapsulates VM backend communication details. It handles target URL reconstruction, automatic API key injection (`X-API-Key`), parsing of FastAPI error payloads, and unified connection timeout/network failure exceptions (translating raw socket errors to clear `502 Bad Gateway` status codes).
2. **Standardized Authorization (`src/lib/requireAuth.js`)**: Evaluates HTTP-only cookie JWT signatures. Correctly catches and isolates authorization failures inside route handlers to avoid masked status code overrides.
3. **Next.js 15 Compatibility**: Routes utilizing dynamic path variables (such as `/api/knowledge/[source]/route.js`) await the async `params` object prior to destructuring, conforming to Next.js 15 routing parameters specifications.
4. **Emoji Restrictions**: Visual indicators use inline SVG path glyphs or ASCII shapes rather than emojis, adhering to code standard constraints.
5. **UI Component Consolidation**: Repetitive UI dialogs (Generate, QR, Upload) have been refactored into a single, highly reusable `<Modal>` component to ensure visual consistency and completely eliminate layout duplication.

---

## Step-by-Step Hostinger Deployment

### 1. Create Node.js Web App in Hostinger hPanel

1. Log in to **Hostinger hPanel**.
2. Go to **Websites** → select your domain → **Node.js**.
3. Click **Create Application** and configure:
   - **Framework**: Next.js
   - **Node.js Version**: 24.x (or latest available)
   - **Root Directory**: Name of the uploaded folder (e.g., `Admin-Dashboard`)
   - **Build Command**: `npm run build`
   - **Package Manager**: npm
   - **Output Directory**: `.next`
4. Click **Create**.

### 2. Upload the Project Files

1. Zip the contents of your local `Admin-Dashboard/` directory.
   - **Include**: `package.json`, `next.config.mjs`, `jsconfig.json`, `src/`, `README.md`, `.gitignore`
   - **Exclude**: `node_modules/`, `.next/`, `.env.local`
2. Go to **File Manager** and open the app directory.
3. Upload and extract the zip file.
4. Delete the zip after extraction.

### 3. Configure Environment Variables

#### Option A: Hostinger Dashboard (Recommended)
In your Node.js app settings, add these environment variables:
```
RAG_API_URL=http://your-fastapi-droplet-ip:8000
MOBILE_API_KEY=your_secure_backend_api_key
ADMIN_PASSWORD_HASH=your_sha256_password_hash
SESSION_SECRET=your_secure_random_session_secret
```

> [!TIP]
> You can generate a SHA-256 hash of your password in a Linux terminal by running:
> ```bash
> echo -n "your_admin_password" | sha256sum
> ```

#### Option B: File-based (Advanced)
1. Navigate to your home directory (`/home/uXXXXXXX/`).
2. Create `.env_secrets/.env` with the variables above.
3. The app automatically scans this location on startup.

### 4. Deploy

1. In the Node.js app dashboard, click **NPM Install** → wait for completion.
2. Click **Build** → Hostinger runs `npm run build`.
3. Click **Start** or **Restart**.
4. Visit your domain — you should see the login page.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `RAG_API_URL` | Yes | The URL of the FastAPI VM server |
| `MOBILE_API_KEY` | Yes | The shared secret API key to communicate with the FastAPI server |
| `ADMIN_PASSWORD_HASH` | Yes | Hex-encoded SHA-256 hash of the dashboard admin password |
| `SESSION_SECRET` | Yes | Cryptographic secret key used for signing session cookies |
| `MAINTENANCE` | Optional | Set to `1` to put the app in maintenance mode (returns 503 HTML/JSON) |

---

## Local Development

```bash
cd Admin-Dashboard
npm install
# Edit .env.local with your credentials
npm run dev
# Open http://localhost:3000
```

---

## MongoDB Atlas IP Whitelisting

Ensure your Hostinger server's IP address (or `0.0.0.0/0` for testing) is added to **MongoDB Atlas → Network Access → IP Whitelist**.
