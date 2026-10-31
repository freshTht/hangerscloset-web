import { useMemo } from 'react';
import type { InventoryItem } from '../types/inventory';
import type {
  InventoryFilterState,
  InventorySortOption,
} from '../types/catalogFilter';

export const INITIAL_INVENTORY_FILTER: InventoryFilterState = {
  searchQuery: '',
  selectedBrands: [],
  selectedColors: [],
  selectedSizes: [],
  selectedTags: [],
  selectedOwners: [],
  minPrice: null,
  maxPrice: null,
  durationDaysFilter: null,
};

export function getItemTags(item: InventoryItem): string[] {
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    return item.tags;
  }
  if (typeof item.type === 'string' && item.type.trim().length > 0) {
    return [item.type.trim()];
  }
  return [];
}

export function getLowestPrice(item: InventoryItem): number {
  if (!Array.isArray(item.rentalPrices) || item.rentalPrices.length === 0) {
    return 0;
  }
  return Math.min(...item.rentalPrices.map((tier) => tier.price));
}

export function countActiveFilters(filter: InventoryFilterState): number {
  let count = 0;
  count += filter.selectedBrands.length;
  count += filter.selectedColors.length;
  count += filter.selectedSizes.length;
  count += filter.selectedTags.length;
  count += filter.selectedOwners.length;
  if (filter.durationDaysFilter !== null && filter.durationDaysFilter !== undefined) {
    count += 1;
  }
  if (filter.minPrice !== null && filter.minPrice !== undefined) {
    count += 1;
  }
  if (filter.maxPrice !== null && filter.maxPrice !== undefined) {
    count += 1;
  }
  return count;
}

export function filterAndSortInventory(
  items: InventoryItem[],
  filter: InventoryFilterState,
  sort: InventorySortOption = 'code_asc'
): InventoryItem[] {
  const query = filter.searchQuery.trim().toLowerCase();
  const hasMinPrice = filter.minPrice !== null && filter.minPrice !== undefined;
  const hasMaxPrice = filter.maxPrice !== null && filter.maxPrice !== undefined;
  const hasDuration =
    filter.durationDaysFilter !== null && filter.durationDaysFilter !== undefined;

  const filtered = items.filter((item) => {
    const itemTags = getItemTags(item);

    // 1. Keyword search across code, name, brand, color, size, owner, accessories, note, tags
    if (query.length > 0) {
      const searchableFields = [
        item.code,
        item.name,
        item.brand,
        item.color,
        item.size,
        item.owner ?? '',
        item.accessories ?? '',
        item.note ?? '',
        ...itemTags,
      ];
      const matchesQuery = searchableFields.some((val) =>
        val.toLowerCase().includes(query)
      );
      if (!matchesQuery) return false;
    }

    // 2. Brand facet (OR within facet)
    if (filter.selectedBrands.length > 0) {
      const itemBrandLower = item.brand.trim().toLowerCase();
      const matchesBrand = filter.selectedBrands.some(
        (b) => b.trim().toLowerCase() === itemBrandLower
      );
      if (!matchesBrand) return false;
    }

    // 3. Color facet (OR within facet)
    if (filter.selectedColors.length > 0) {
      const itemColorLower = item.color.trim().toLowerCase();
      const matchesColor = filter.selectedColors.some(
        (c) => c.trim().toLowerCase() === itemColorLower
      );
      if (!matchesColor) return false;
    }

    // 4. Size facet (OR within facet)
    if (filter.selectedSizes.length > 0) {
      const itemSizeLower = item.size.trim().toLowerCase();
      const matchesSize = filter.selectedSizes.some(
        (s) => s.trim().toLowerCase() === itemSizeLower
      );
      if (!matchesSize) return false;
    }

    // 5. Tags facet (OR within facet)
    if (filter.selectedTags.length > 0) {
      const lowerItemTags = itemTags.map((t) => t.trim().toLowerCase());
      const matchesTag = filter.selectedTags.some((selectedTag) =>
        lowerItemTags.includes(selectedTag.trim().toLowerCase())
      );
      if (!matchesTag) return false;
    }

    // 6. Owner facet (OR within facet)
    if (filter.selectedOwners.length > 0) {
      const itemOwnerLower = (item.owner ?? '').trim().toLowerCase();
      const matchesOwner = filter.selectedOwners.some(
        (o) => o.trim().toLowerCase() === itemOwnerLower
      );
      if (!matchesOwner) return false;
    }

    // 7. Duration tier + price range filter
    if (hasDuration) {
      const matchingTier = (item.rentalPrices ?? []).find(
        (tier) => tier.durationDays === filter.durationDaysFilter
      );
      if (!matchingTier) return false;
      if (hasMinPrice && matchingTier.price < (filter.minPrice as number)) {
        return false;
      }
      if (hasMaxPrice && matchingTier.price > (filter.maxPrice as number)) {
        return false;
      }
    } else if (hasMinPrice || hasMaxPrice) {
      const lowestPrice = getLowestPrice(item);
      if (hasMinPrice && lowestPrice < (filter.minPrice as number)) {
        return false;
      }
      if (hasMaxPrice && lowestPrice > (filter.maxPrice as number)) {
        return false;
      }
    }

    return true;
  });

  // Sort filtered items
  return [...filtered].sort((a, b) => {
    switch (sort) {
      case 'code_asc':
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      case 'code_desc':
        return b.code.localeCompare(a.code, undefined, { numeric: true });
      case 'name_asc':
        return (
          a.name.localeCompare(b.name, 'th') ||
          a.code.localeCompare(b.code, undefined, { numeric: true })
        );
      case 'price_asc': {
        const diff = getLowestPrice(a) - getLowestPrice(b);
        return diff !== 0
          ? diff
          : a.code.localeCompare(b.code, undefined, { numeric: true });
      }
      case 'price_desc': {
        const diff = getLowestPrice(b) - getLowestPrice(a);
        return diff !== 0
          ? diff
          : a.code.localeCompare(b.code, undefined, { numeric: true });
      }
      case 'brand_asc':
        return (
          a.brand.localeCompare(b.brand, 'th') ||
          a.code.localeCompare(b.code, undefined, { numeric: true })
        );
      default:
        return a.code.localeCompare(b.code, undefined, { numeric: true });
    }
  });
}

export function useFilteredInventory(
  items: InventoryItem[],
  filter: InventoryFilterState,
  sort: InventorySortOption = 'code_asc'
): InventoryItem[] {
  return useMemo(
    () => filterAndSortInventory(items, filter, sort),
    [items, filter, sort]
  );
}
