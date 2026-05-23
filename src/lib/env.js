/**
 * Dynamic Environment Loader — OBD-Cortex
 * ────────────────────────────────────────
 * Scans ~/.env_secrets for database credentials on Hostinger,
 * then falls back to parent directory .env files.
 *
 * Next.js auto-loads .env.local for local dev, but Hostinger's
 * production runtime does NOT — so we manually parse env files
 * from the home directory for deployed environments.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

let _loaded = false;

export function loadEnvSecrets() {
    if (_loaded) return;
    _loaded = true;

    const home = os.homedir();
    let envFile = null;

    // 1. Check ~/.env_secrets/.env  or  ~/.env_secrets (as a file)
    if (home) {
        const secretsEnv = path.join(home, '.env_secrets', '.env');
        const secretsDirect = path.join(home, '.env_secrets');

        if (fs.existsSync(secretsEnv)) {
            envFile = secretsEnv;
        } else if (fs.existsSync(secretsDirect) && !fs.statSync(secretsDirect).isDirectory()) {
            envFile = secretsDirect;
        }
    }

    // 2. Fallback: search up to 3 parent directories from project root
    if (!envFile) {
        let dir = process.cwd();
        for (let i = 0; i < 3; i++) {
            const testPath = path.join(dir, '.env');
            if (fs.existsSync(testPath)) {
                envFile = testPath;
                break;
            }
            const parent = path.dirname(dir);
            if (parent === dir) break;
            dir = parent;
        }
    }

    if (!envFile) return;

    // Parse the env file manually (same logic as the PHP and Express versions)
    const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;

        const key = trimmed.slice(0, eqIndex).trim();
        let val = trimmed.slice(eqIndex + 1).trim();

        // Strip surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }

        // Only set if not already defined (don't override Hostinger's panel env vars)
        if (!process.env[key]) {
            process.env[key] = val;
        }
    }
}
