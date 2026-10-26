import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to load simple .env key-value pairs
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

// 1. Resolve environment variables
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

console.log(`🎯 Target Project: ${projectId}`);
console.log(`📁 Target Database: ${databaseId}`);

// 2. Obtain Firebase CLI access token for authorized administrative write
function getAdminAccessToken() {
  if (process.env.FIREBASE_TOKEN) return process.env.FIREBASE_TOKEN;

  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.tokens?.access_token) {
        return config.tokens.access_token;
      }
    } catch {
      // Ignore
    }
  }
  return null;
}

const accessToken = getAdminAccessToken();
if (!accessToken) {
  console.error(
    '❌ No Firebase CLI access token found. Please run "npx firebase-tools login" first.'
  );
  process.exit(1);
}

// 3. Read and parse items from mockInventory.ts
const mockInventoryPath = path.join(projectRoot, 'src', 'data', 'mockInventory.ts');
const rawTs = fs.readFileSync(mockInventoryPath, 'utf-8');

// Build map of image var -> asset path
const importRegex = /import\s+(img_[a-z0-9_]+)\s+from\s+['"]\.\.\/assets\/images\/([^'"]+)['"]/g;
const imageMap = {};
let match;
while ((match = importRegex.exec(rawTs)) !== null) {
  imageMap[match[1]] = `/src/assets/images/${match[2]}`;
}

const arrayMatch = rawTs.match(/export const mockInventory:\s*InventoryItem\[\]\s*=\s*(\[[\s\S]*\]);/);
if (!arrayMatch) {
  console.error('❌ Could not parse mockInventory array from src/data/mockInventory.ts');
  process.exit(1);
}

let jsonStr = arrayMatch[1];
for (const [varName, filePath] of Object.entries(imageMap)) {
  jsonStr = jsonStr.replaceAll(new RegExp(`imageUrl:\\s*${varName}`, 'g'), `imageUrl: "${filePath}"`);
}

const parseItems = new Function(`return ${jsonStr};`);
const items = parseItems();

console.log(`📦 Loaded ${items.length} clothing items from source dataset.`);

// Helper to convert JS values to Firestore REST API value format
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// 4. Build batch commit request for inventory and metadata schemas
const writes = items.map((item) => {
  const { id: _ignored, ...itemData } = item;
  // Normalize tags and note
  if (!itemData.tags && itemData.type) {
    itemData.tags = [itemData.type];
  }
  if (itemData.note === undefined) {
    itemData.note = null;
  }

  const fields = {};
  for (const [key, val] of Object.entries(itemData)) {
    if (val !== undefined) {
      fields[key] = toFirestoreValue(val);
    }
  }

  const docPath = `projects/${projectId}/databases/${databaseId}/documents/inventory/${item.code}`;
  return {
    update: {
      name: docPath,
      fields,
    },
  };
});

// Extract distinct metadata options and build writes
const brandSet = new Set();
const colorSet = new Set();
const sizeSet = new Set(['XS', 'S', 'M', 'L', 'XL', 'Free size']);
const tagSet = new Set();

items.forEach((item) => {
  if (item.brand && item.brand.trim() && item.brand.trim() !== '-') brandSet.add(item.brand.trim());
  if (item.color && item.color.trim()) colorSet.add(item.color.trim());
  if (item.size && item.size.trim()) sizeSet.add(item.size.trim());
  if (Array.isArray(item.tags)) {
    item.tags.forEach((t) => t && t.trim() && tagSet.add(t.trim()));
  } else if (item.type && item.type.trim()) {
    tagSet.add(item.type.trim());
  }
});

const metadataWrites = [];
const addMetaDoc = (col, name) => {
  const docId = encodeURIComponent(name.toLowerCase().replace(/[\/\s]+/g, '_'));
  metadataWrites.push({
    update: {
      name: `projects/${projectId}/databases/${databaseId}/documents/${col}/${docId}`,
      fields: { name: toFirestoreValue(name) },
    },
  });
};

brandSet.forEach((b) => addMetaDoc('brands', b));
colorSet.forEach((c) => addMetaDoc('colors', c));
sizeSet.forEach((s) => addMetaDoc('sizes', s));
tagSet.forEach((t) => addMetaDoc('tags', t));

const allWrites = [...writes, ...metadataWrites];

console.log(
  `🚀 Committing batch write of ${allWrites.length} documents (${writes.length} items, ${metadataWrites.length} metadata options) via Firestore REST API...`
);

const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:commit`;
const response = await fetch(commitUrl, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ writes: allWrites }),
});

if (!response.ok) {
  const errText = await response.text();
  console.error(`❌ Batch commit failed with status ${response.status}: ${errText}`);
  process.exit(1);
}

const result = await response.json();
console.log(`🎉 Successfully seeded ${result.writeResults?.length ?? items.length} clothing items into Firestore!`);
console.log(`✨ Collection: "inventory" in database "${databaseId}" is ready.`);
