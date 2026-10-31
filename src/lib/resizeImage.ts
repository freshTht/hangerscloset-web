/**
 * Converts a base64 data URL into a binary Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
  const binaryStr = atob(parts[1] ?? '');
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Reads an image File, downscales it (keeping aspect ratio) so the longest side
 * is at most `maxSize` (default 1200px), and returns a compressed WebP (or JPEG fallback)
 * Blob suitable for uploading to Firebase Cloud Storage.
 */
export function compressImageToBlob(
  file: File,
  maxSize = 1200,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไฟล์รูปภาพไม่ถูกต้อง'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(new Blob([file], { type: file.type || 'image/webp' }));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
                return;
              }
              const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve(dataUrlToBlob(jpegDataUrl));
            },
            'image/webp',
            quality
          );
          return;
        }

        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrlToBlob(dataUrl));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads an image File, downscales it (keeping aspect ratio) so the longest side
 * is at most `maxSize`, and returns a compressed JPEG data URL.
 */
export function resizeImageFile(
  file: File,
  maxSize = 900,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไฟล์รูปภาพไม่ถูกต้อง'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
