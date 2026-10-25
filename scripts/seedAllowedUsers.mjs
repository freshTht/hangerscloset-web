import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const envLocal = loadEnvFile(path.join(projectRoot, '.env.firebase.local'));
const envFallback = loadEnvFile(path.join(projectRoot, '.env.local'));

const projectId =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  envLocal.VITE_FIREBASE_PROJECT_ID ||
  envFallback.VITE_FIREBASE_PROJECT_ID ||
  'hangers-closet';

const databaseId =
  process.env.VITE_FIREBASE_DATABASE_ID ||
  envLocal.VITE_FIREBASE_DATABASE_ID ||
  envFallback.VITE_FIREBASE_DATABASE_ID ||
  'hangerscloset';

function getAdminAccessToken() {
  if (process.env.FIREBASE_TOKEN) return process.env.FIREBASE_TOKEN;

  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.tokens?.access_token) return config.tokens.access_token;
    } catch {}
  }
  return null;
}

const accessToken = getAdminAccessToken();
if (!accessToken) {
  console.error('❌ No Firebase CLI access token found. Please run "npx firebase-tools login" first.');
  process.exit(1);
}

// Emails passed as CLI arguments, or default to developer & staff
const emailsToAdd = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['fresh.thit@gmail.com', 'staff@hangerscloset.com'];

console.log(`🔐 Seeding allowed users into project "${projectId}" (database: "${databaseId}"):`);
for (const rawEmail of emailsToAdd) {
  const email = rawEmail.trim().toLowerCase();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/allowed_users/${encodeURIComponent(email)}`;

  const body = {
    fields: {
      email: { stringValue: email },
      enabled: { booleanValue: true },
      role: { stringValue: 'staff' },
      updatedAt: { timestampValue: new Date().toISOString() },
    },
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`❌ Failed to add "${email}":`, res.status, await res.text());
  } else {
    console.log(`✅ Allowed user added: "${email}"`);
  }
}

console.log('🎉 Done.');
