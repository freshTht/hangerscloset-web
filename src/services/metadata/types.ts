export type MetadataCategory = 'brands' | 'colors' | 'sizes' | 'tags';

export interface IMetadataRepository {
  readonly providerName: 'mock' | 'firebase';
  getOptions(category: MetadataCategory): Promise<string[]>;
  subscribe(category: MetadataCategory, callback: (options: string[]) => void): () => void;
  addOption(category: MetadataCategory, name: string): Promise<string>;
}
