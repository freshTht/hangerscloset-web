import type { IStorageService } from './types';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(blob);
  });
}

export class MockStorageService implements IStorageService {
  readonly providerName = 'mock' as const;
  private uploadedUrls: Set<string> = new Set();

  async uploadItemImage(
    file: File | Blob,
    _itemCode: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    onProgress?.(35);

    let url: string;
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      url = URL.createObjectURL(file);
    } else {
      url = await blobToDataUrl(file);
    }

    this.uploadedUrls.add(url);
    onProgress?.(100);
    return url;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;
    this.uploadedUrls.delete(imageUrl);
    if (
      imageUrl.startsWith('blob:') &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      URL.revokeObjectURL(imageUrl);
    }
  }

  hasUploadedUrl(url: string): boolean {
    return this.uploadedUrls.has(url);
  }
}

export const mockStorageService = new MockStorageService();
