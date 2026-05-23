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
OBD-Admin-Next/
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
│   │       ├── auth/route.js      # Login/logout/session check
│   │       ├── health/route.js    # Health check
│   │       ├── stats/route.js     # Dashboard statistics
│   │       ├── devices/route.js   # List/search devices
│   │       ├── generate/route.js  # Provision new devices
│   │       ├── delete/route.js    # Delete a device
│   │       └── qr/route.js       # QR code streaming
│   │
│   ├── components/          # React UI components
│   │   ├── Header.js
│   │   ├── StatsGrid.js
│   │   ├── DeviceTable.js
│   │   ├── ActionBar.js
│   │   ├── GenerateModal.js
│   │   ├── QRModal.js
│   │   └── Toast.js
│   │
│   └── lib/                 # Server utilities
│       ├── mongodb.js       # MongoDB connection singleton
│       ├── env.js           # Dynamic env loader
│       └── auth.js          # Session token utilities
│
└── README.md
```

---

## Step-by-Step Hostinger Deployment

### 1. Create Node.js Web App in Hostinger hPanel

1. Log in to **Hostinger hPanel**.
2. Go to **Websites** → select your domain → **Node.js**.
3. Click **Create Application** and configure:
   - **Framework**: Next.js
   - **Node.js Version**: 24.x (or latest available)
   - **Root Directory**: Name of the uploaded folder (e.g., `OBD-Admin-Next`)
   - **Build Command**: `npm run build`
   - **Package Manager**: npm
   - **Output Directory**: `.next`
4. Click **Create**.

### 2. Upload the Project Files

1. Zip the contents of your local `OBD-Admin-Next/` directory.
   - **Include**: `package.json`, `next.config.mjs`, `jsconfig.json`, `src/`, `README.md`, `.gitignore`
   - **Exclude**: `node_modules/`, `.next/`, `.env.local`
2. Go to **File Manager** and open the app directory.
3. Upload and extract the zip file.
4. Delete the zip after extraction.

### 3. Configure Environment Variables

#### Option A: Hostinger Dashboard (Recommended)
In your Node.js app settings, add these environment variables:
```
UNAME=your_mongodb_username
PW=your_mongodb_password
C_URL=cluster0.abc.mongodb.net
ADMIN_PASSWORD=your_secure_admin_password
SESSION_SECRET=any_random_string_here
```

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
| `UNAME` | Yes | MongoDB Atlas username |
| `PW` | Yes | MongoDB Atlas password |
| `C_URL` | Yes | MongoDB cluster URL (e.g., `cluster0.abc.mongodb.net`) |
| `ADMIN_PASSWORD` | Yes | Password for the admin login page |
| `SESSION_SECRET` | Recommended | Secret key for signing session cookies |
| `MONGO_URI` | Alternative | Full MongoDB URI (overrides UNAME/PW/C_URL) |
| `MAINTENANCE` | Optional | Set to `1` to put the app in maintenance mode (returns 503 HTML/JSON) |

---

## Local Development

```bash
cd OBD-Admin-Next
npm install
# Edit .env.local with your credentials
npm run dev
# Open http://localhost:3000
```

---

## MongoDB Atlas IP Whitelisting

Ensure your Hostinger server's IP address (or `0.0.0.0/0` for testing) is added to **MongoDB Atlas → Network Access → IP Whitelist**.
