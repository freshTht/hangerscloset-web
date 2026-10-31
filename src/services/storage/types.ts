export type StorageProviderType = 'mock' | 'firebase';

export interface IStorageService {
  readonly providerName: StorageProviderType;
  uploadItemImage(
    file: File | Blob,
    itemCode: string,
    onProgress?: (percent: number) => void
  ): Promise<string>;
  deleteImage(imageUrl: string): Promise<void>;
}
