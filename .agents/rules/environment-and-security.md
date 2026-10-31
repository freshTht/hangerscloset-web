# Environment Variables, Secrets & Security Guidelines

## 1. Mandatory Rule for Agents: Adding New Environment Variables
Whenever an agent intends to add, modify, or suggest any new environment variable:
1. **Conduct Proper Research**: Investigate whether the key, token, or configuration is sensitive, public, or backend-only.
2. **Formulate a Recommendation**:
   - Explain the purpose of the variable.
   - Specify whether it needs the `VITE_` prefix (client-facing) or must remain server/local-only.
   - Identify security risks and how access is governed (e.g. Firestore Security Rules, IAM).
   - Specify hosting configuration (e.g., Netlify secret scanning treatment).
3. **Confirm with the Human Author**: **DO NOT** add new environment variables to `.env*` or project configuration without explicitly explaining the recommendation and receiving confirmation from the human author.

---

## 2. Vite Client Bundling Context
- Any variable prefixed with `VITE_` is statically injected by Vite into client-side JavaScript assets (`dist/assets/*.js`) during build time.
- **Any user can view `VITE_*` variable values** by inspecting network requests or browser source files.
- Never rely on `VITE_` variables to hide private secrets or restrict unauthorized actions.

---

## 3. Allowed / Safe Client-Facing Variables (`VITE_` Prefix)
These variables identify public endpoints and project resources; they **do not grant authorization by themselves**:

| Variable | Description | Security Notes |
| :--- | :--- | :--- |
| `VITE_DATA_PROVIDER` | Service layer mode (`"firebase"` or `"mock"`). | Purely internal app switch; no credentials. |
| `VITE_FIREBASE_API_KEY` | Public Google Cloud API key (`AIzaSy...`). | Identifies the Firebase project for API routing and billing quotas. **Does NOT authorize database read/write access**. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Redirect domain (`<project>.firebaseapp.com`). | Public URL used for OAuth and sign-in redirects. |
| `VITE_FIREBASE_PROJECT_ID` | GCP Project ID (e.g. `hangerscloset`). | Public identifier visible in all Firestore API endpoints. |
| `VITE_FIREBASE_STORAGE_BUCKET`| GCS bucket name (`<project>.firebasestorage.app`). | Public asset bucket address. Governed by Cloud Storage rules. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Project number. | Public routing key for Web Push notifications. |
| `VITE_FIREBASE_APP_ID` | Web client registration ID. | Public app identifier. |
| `VITE_ALLOWED_EMAILS` | Comma-separated list of permitted emails. | Client-side fallback whitelist. Server authorization is strictly enforced by `firestore.rules`. |

> **Netlify Hosting Rule**: Because these values appear in plain text in build output, **do not mark `VITE_*` variables as "Secret" or "Sensitive" in Netlify**, or add them to `SECRETS_SCAN_OMIT_KEYS` in `netlify.toml` to prevent false positive build failures.

---

## 4. Strictly Forbidden in Frontend (`NEVER` Use `VITE_` Prefix)
These credentials must **NEVER** be committed to repository files, embedded into client bundles, or prefixed with `VITE_`:

- ❌ **Firebase Admin SDK Service Accounts**: JSON key files or private keys containing `-----BEGIN PRIVATE KEY-----`. These grant root admin bypass access to all Firestore data. (Permitted only in backend functions or local CLI maintenance scripts such as `scripts/seedFirestore.mjs`).
- ❌ **Database Passwords / Connection Strings**: PostgreSQL, MongoDB, or direct database credentials.
- ❌ **Payment Processor Secret Keys**: Stripe secret keys (`sk_live_...`, `sk_test_...`) or webhook signing secrets.
- ❌ **Third-Party AI / API Secrets**: Gemini Developer API keys, OpenAI secret keys, Anthropic API keys.
- ❌ **Session Secrets & Private JWT Keys**: Private encryption keys or signing salts.

---

## 5. Security Architecture: Zero-Trust Client
Security in `hangerscloset-web` is enforced on the server, not the client:
- **Cloud Firestore Security Rules** (`firestore.rules`): Controls all document read/write permissions based on `request.auth` and verified user claims.
- **Default Deny**: `match /{document=**} { allow read, write: if false; }` ensures no collection is accessible without explicit rules.
- **Authorized Domains**: Firebase Auth restricts logins strictly to approved domains configured in the Firebase Console.
