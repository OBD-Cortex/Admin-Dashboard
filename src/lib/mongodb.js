/**
 * MongoDB Client Connection Manager — OBD-Cortex Admin
 * ──────────────────────────────────────────────────
 * This module establishes and exports a single, pooled MongoDB connection instance
 * shared across all serverless API routes.
 * 
 * Maintainability Considerations:
 * 1. Connection Leaks: Next.js runs in a serverless-like runtime. To prevent 
 *    exhausting database sockets, we cache the connection promise.
 * 2. Hot-Reload Safety: During local development (`next dev`), Next.js clears 
 *    the module cache on every code change. Caching the client promise on the 
 *    Node `globalThis` object prevents establishing new connection pools on every edit.
 */

import { MongoClient } from 'mongodb';
import { loadEnvSecrets } from './env';

// Legacy hook to ensure configurations are initialized before building the URI
loadEnvSecrets();

// The primary connection string. Must be set at the OS/Hosting level.
const uri = process.env.MONGO_URI;

// Connection Pool Configuration
const options = {
    // Fail fast after 5 seconds if MongoDB Atlas is unreachable (prevent hanging requests)
    serverSelectionTimeoutMS: 5000,
    // Tag all transactions for Atlas Real-Time Performance profiling
    appName: 'obd-cortex-admin-next',
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
    // In development mode, check if a global client promise already exists.
    // This survives Next.js live-reload cycles and prevents connection socket leaks.
    if (!globalThis._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalThis._mongoClientPromise = client.connect();
    }
    clientPromise = globalThis._mongoClientPromise;
} else {
    // In production hosting (Hostinger Node.js), a single persistent client 
    // instance is sufficient across the runtime process lifecycle.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

/**
 * Retrieves the cached MongoClient instance.
 * @returns {Promise<MongoClient>} A promise that resolves to the connected client.
 */
export async function getClient() {
    return clientPromise;
}

/**
 * Accesses the 'devices' collection directly.
 * Encapsulates the target database ('rag_db') and collection ('devices') mappings.
 * @returns {Promise<Collection>} MongoDB collection handle.
 */
export async function getDevicesCollection() {
    const c = await clientPromise;
    return c.db('rag_db').collection('devices');
}

export default clientPromise;
