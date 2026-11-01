export type InventoryStatus = 'available' | 'reserved' | 'laundry';

export interface RentalPriceTier {
  durationDays: number;
  price: number;
}

export type RentalPrices = RentalPriceTier[];

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  brand: string;
  color: string;
  size: string;
  type?: string;
  tags?: string[];
  note?: string | null;
  accessories?: string | null;
  owner?: string | null;
  imageFile?: string;
  imageUrl: string;
  rentalPrices: RentalPrices;
  status: InventoryStatus;
}

/**
 * Normalizes item tags from data sources, supporting legacy string type fallbacks
 * while ensuring clean, trimmed string arrays.
 */
export function normalizeItemTags(tags: unknown, legacyType?: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
  }
  if (typeof legacyType === 'string' && legacyType.trim().length > 0) {
    return [legacyType.trim()];
  }
  return [];
}
