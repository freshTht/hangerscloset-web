import { describe, it, expect, vi } from 'vitest';
import { MockStorageService } from '../mockStorageService';
import { isFirebaseStorageUrl } from '../firebaseStorageService';

describe('MockStorageService', () => {
  it('uploads an image blob, reports progress, and returns a URL', async () => {
    const service = new MockStorageService();
    const progressSpy = vi.fn();
    const blob = new Blob(['fake-image-bytes'], { type: 'image/webp' });

    const url = await service.uploadItemImage(blob, 'AVL01', progressSpy);

    expect(url).toBeTruthy();
    expect(progressSpy).toHaveBeenCalledWith(35);
    expect(progressSpy).toHaveBeenCalledWith(100);
    expect(service.hasUploadedUrl(url)).toBe(true);
  });

  it('cleans up uploaded URL on deleteImage', async () => {
    const service = new MockStorageService();
    const blob = new Blob(['fake-image-bytes'], { type: 'image/webp' });

    const url = await service.uploadItemImage(blob, 'AVL01');
    expect(service.hasUploadedUrl(url)).toBe(true);

    await service.deleteImage(url);
    expect(service.hasUploadedUrl(url)).toBe(false);
  });
});

describe('isFirebaseStorageUrl', () => {
  it('identifies Firebase Storage URLs and ignores local asset paths', () => {
    expect(
      isFirebaseStorageUrl(
        'https://firebasestorage.googleapis.com/v0/b/hangers-closet.firebasestorage.app/o/inventory%2FAVL01%2F123.webp?alt=media'
      )
    ).toBe(true);
    expect(isFirebaseStorageUrl('gs://hangers-closet.firebasestorage.app/inventory/1.webp')).toBe(
      true
    );
    expect(isFirebaseStorageUrl('/src/assets/images/avl01.jpg')).toBe(false);
    expect(isFirebaseStorageUrl('')).toBe(false);
  });
});
