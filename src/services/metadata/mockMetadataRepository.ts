import { mockInventory } from '../../data/mockInventory';
import type { IMetadataRepository, MetadataCategory } from './types';

function extractFromMock(): Record<MetadataCategory, Set<string>> {
  const brands = new Set<string>();
  const colors = new Set<string>();
  const sizes = new Set<string>();
  const tags = new Set<string>();

  for (const item of mockInventory) {
    if (item.brand && item.brand.trim() && item.brand.trim() !== '-') {
      brands.add(item.brand.trim());
    }
    if (item.color && item.color.trim()) {
      colors.add(item.color.trim());
    }
    if (item.size && item.size.trim()) {
      sizes.add(item.size.trim());
    }
    if (Array.isArray(item.tags)) {
      for (const t of item.tags) {
        if (t && t.trim()) tags.add(t.trim());
      }
    } else if (item.type && item.type.trim()) {
      tags.add(item.type.trim());
    }
  }

  // Common sizes defaults if not present
  ['XS', 'S', 'M', 'L', 'XL', 'Free size'].forEach((s) => sizes.add(s));

  return { brands, colors, sizes, tags };
}

export class MockMetadataRepository implements IMetadataRepository {
  readonly providerName = 'mock' as const;
  private data: Record<MetadataCategory, Set<string>>;
  private listeners: Record<MetadataCategory, Set<(options: string[]) => void>> = {
    brands: new Set(),
    colors: new Set(),
    sizes: new Set(),
    tags: new Set(),
  };

  constructor() {
    this.data = extractFromMock();
  }

  private notify(category: MetadataCategory): void {
    const list = this.getSorted(category);
    for (const listener of this.listeners[category]) {
      listener(list);
    }
  }

  private getSorted(category: MetadataCategory): string[] {
    return Array.from(this.data[category]).sort((a, b) =>
      a.localeCompare(b, 'th', { sensitivity: 'base' })
    );
  }

  async getOptions(category: MetadataCategory): Promise<string[]> {
    return this.getSorted(category);
  }

  subscribe(
    category: MetadataCategory,
    callback: (options: string[]) => void
  ): () => void {
    this.listeners[category].add(callback);
    callback(this.getSorted(category));
    return () => {
      this.listeners[category].delete(callback);
    };
  }

  async addOption(category: MetadataCategory, name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('ชื่อตัวเลือกไม่สามารถเว้นว่างได้');
    }
    this.data[category].add(trimmed);
    this.notify(category);
    return trimmed;
  }
}

export const mockMetadataRepository = new MockMetadataRepository();
