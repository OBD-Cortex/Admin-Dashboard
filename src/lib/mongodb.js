/**
 * MongoDB Client Singleton — OBD-Cortex
 * ──────────────────────────────────────
 * Maintains a single MongoClient across all Next.js API route invocations.
 * In development, the client is cached on `globalThis` to survive hot-reloads.
 * In production, the module scope is sufficient.
 */

import { MongoClient } from 'mongodb';
import { loadEnvSecrets } from './env';

// Ensure env secrets are loaded before building the URI
loadEnvSecrets();

function buildUri() {
    // Priority 1: Full MONGO_URI from environment
    if (process.env.MONGO_URI) return process.env.MONGO_URI;

    // Priority 2: Build from individual variables (UNAME, PW, C_URL)
    const username = process.env.UNAME;
    const password = process.env.PW;
    const clusterUrl = process.env.C_URL;

    if (clusterUrl) {
        const cleanUrl = clusterUrl.replace('mongodb+srv://', '').split('/')[0];
        const user = encodeURIComponent(username || '');
        const pw = encodeURIComponent(password || '');
        return `mongodb+srv://${user}:${pw}@${cleanUrl}/?retryWrites=true&w=majority`;
    }

    // Fallback: local MongoDB
    return 'mongodb://localhost:27017/rag_db';
}

const uri = buildUri();

const options = {
    serverSelectionTimeoutMS: 5000,
    appName: 'obd-cortex-admin-next',
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
    // In dev, use a global variable to preserve the client across hot-reloads
    if (!globalThis._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalThis._mongoClientPromise = client.connect();
    }
    clientPromise = globalThis._mongoClientPromise;
} else {
    // In production, create a single client instance
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

/**
 * Returns the connected MongoClient instance.
 * Usage:  const client = await getClient();
 *         const db = client.db('rag_db');
 */
export async function getClient() {
    return clientPromise;
}

/**
 * Returns the `devices` collection handle directly.
 * Usage:  const col = await getDevicesCollection();
 *         const docs = await col.find({}).toArray();
 */
export async function getDevicesCollection() {
    const c = await clientPromise;
    return c.db('rag_db').collection('devices');
}

export default clientPromise;
