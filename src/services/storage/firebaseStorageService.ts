import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../../lib/firebase';
import type { IStorageService } from './types';

function sanitizeCode(itemCode: string): string {
  const cleaned = itemCode.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned || 'unassigned';
}

function getExtensionFromMime(mimeType: string): string {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  return 'webp';
}

export function isFirebaseStorageUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('.firebasestorage.app') ||
    url.startsWith('gs://')
  );
}

export class FirebaseStorageService implements IStorageService {
  readonly providerName = 'firebase' as const;

  uploadItemImage(
    file: File | Blob,
    itemCode: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    if (!isFirebaseConfigured || !storage) {
      return Promise.reject(new Error('Firebase Cloud Storage ยังไม่ได้ตั้งค่า'));
    }

    const safeCode = sanitizeCode(itemCode);
    const contentType = file.type || 'image/webp';
    const ext = getExtensionFromMime(contentType);
    const uniqueSuffix = Math.random().toString(36).slice(2, 7);
    const storagePath = `inventory/${safeCode}/${Date.now()}-${uniqueSuffix}.${ext}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    });

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            onProgress?.(percent);
          }
        },
        (error) => {
          console.error('[FirebaseStorage] Upload failed:', error);
          reject(new Error('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.(100);
            resolve(downloadUrl);
          } catch (err) {
            console.error('[FirebaseStorage] Failed to get download URL:', err);
            reject(new Error('ไม่สามารถดึงลิงก์รูปภาพได้'));
          }
        }
      );
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!isFirebaseConfigured || !storage || !isFirebaseStorageUrl(imageUrl)) {
      return;
    }

    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'storage/object-not-found') {
        return;
      }
      console.warn('[FirebaseStorage] Could not delete image:', error);
    }
  }
}

export const firebaseStorageService = new FirebaseStorageService();
