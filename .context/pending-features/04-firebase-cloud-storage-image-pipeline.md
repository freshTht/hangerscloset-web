# Feature 04: Firebase Cloud Storage Image Pipeline

- **Priority**: Rank #4 (Infrastructure & Reliability)
- **RICE Score**: **5.8** (Reach: 8, Impact: 2, Confidence: 90%, Effort: 2.5)
- **Status**: Implemented

---

## 1. Problem Statement & Business Benefit
Currently, uploaded images in the Add/Edit sheet are downscaled to client-side JPEG data URLs (base64) and stored directly in Firestore documents. While this avoids external storage configuration in early prototypes, it introduces severe architectural constraints:
- **Firestore 1 MiB Document Limit**: Base64 images consume significant document quota.
- **Bandwidth & Latency**: Querying `inventory` downloads the image bytes inside the document payload even when viewing only text attributes.
- **No Browser CDN Caching**: Base64 strings inside documents bypass HTTP caching headers.

### Key Benefits:
- **Clean Storage Separation**: Uploads apparel photos directly to Firebase Cloud Storage at `/inventory/{itemId}/{timestamp}.webp`.
- **Automatic Client-Side Compression**: Converts user photos (often 5–15 MB from iPhone/Android cameras) into optimized WebP/JPEG ($\sim 150\text{–}300\text{ KB}$) before upload.
- **Real-Time Upload Progress**: Provides smooth visual feedback during upload.
- **Global CDN Caching**: Public Firebase Storage URLs leverage Google Cloud's multi-region edge caches.

---

## 2. User Scenarios & UX Flow

1. Staff clicks the photo placeholder or **"เปลี่ยน"** button in `InventorySheet`.
2. Staff selects a high-resolution dress photo from their camera or photo library.
3. Client-side canvas/compression utility resizes image to maximum $1200\text{px}$ dimension at 85% WebP quality in $<200\text{ms}$.
4. A progress indicator appears over the photo preview:
   - Beer CSS `.shape.loading-indicator` or a slim progress bar (`progress[value]`).
5. Upon upload completion, the Storage download URL is saved in `formData.imageUrl`.
6. On item deletion, associated images in Cloud Storage are safely cleaned up.

---

## 3. Architecture & Service Design

### A. Storage Service Interface (`src/services/storage/types.ts`)
```ts
export interface IStorageService {
  uploadItemImage(
    file: File | Blob,
    itemCode: string,
    onProgress?: (percent: number) => void
  ): Promise<string>; // Returns persistent download URL
  deleteImage(imageUrl: string): Promise<void>;
}
```

### B. Dual-Mode Implementation
- **Mock Mode**: Generates a fast `URL.createObjectURL` or preserves static asset map with simulated upload delay.
- **Firebase Mode**: Uses Firebase Storage SDK (`uploadBytesResumable`, `getDownloadURL`, `deleteObject`).

---

## 4. Cloud Storage Security Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /inventory/{allPaths=**} {
      // Anyone can view inventory photos (fast CDN delivery)
      allow read: if true;
      // Only authenticated, allowed staff can upload or delete photos
      allow write: if request.auth != null &&
        request.resource.size < 10 * 1024 * 1024 && // Max 10MB
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 5. UI Guidelines
- Do NOT use radial circular spinners (`progress.circle`).
- Use Beer CSS native shape loader:
  `<div className="shape loading-indicator extra" role="status" />`
  or linear progress:
  `<progress className="max" value={progressPercent} max="100"></progress>`.

---

## 6. Acceptance Criteria
- [x] Large camera photos are compressed client-side before upload to $<400\text{ KB}$.
- [x] Uploading photos to Firebase Storage generates a secure `https://firebasestorage.googleapis.com/...` URL.
- [x] Upload progress is clearly displayed to staff without blocking navigation.
- [x] Mock mode allows testing photo additions without Firebase Storage credentials.
- [x] Replaced photos or deleted items clean up orphaned storage blobs.

---

## 7. Agent Kickoff Prompt
```text
Please implement Feature 04: Firebase Cloud Storage Image Pipeline as defined in .context/pending-features/04-firebase-cloud-storage-image-pipeline.md.
First, run /plan to design client-side image compression, the storage service layer with mock and Firebase implementations, UI progress feedback in InventorySheet, and storage.rules configuration. Verify with pnpm build and pnpm test.
```
