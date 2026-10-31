export type InventorySortOption =
  | 'code_asc'
  | 'code_desc'
  | 'name_asc'
  | 'price_asc'
  | 'price_desc'
  | 'brand_asc';

export interface InventoryFilterState {
  searchQuery: string;
  selectedBrands: string[];
  selectedColors: string[];
  selectedSizes: string[];
  selectedTags: string[];
  selectedOwners: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  durationDaysFilter?: number | null;
}

export interface SortOptionMeta {
  value: InventorySortOption;
  label: string;
  icon: string;
}

export const INVENTORY_SORT_OPTIONS: SortOptionMeta[] = [
  { value: 'code_asc', label: 'รหัสสินค้า (A → Z)', icon: 'sort_by_alpha' },
  { value: 'code_desc', label: 'รหัสสินค้า (Z → A)', icon: 'sort_by_alpha' },
  { value: 'name_asc', label: 'ชื่อสินค้า (ก → ฮ / A → Z)', icon: 'title' },
  { value: 'price_asc', label: 'ราคาเช่า (ต่ำ → สูง)', icon: 'trending_up' },
  { value: 'price_desc', label: 'ราคาเช่า (สูง → ต่ำ)', icon: 'trending_down' },
  { value: 'brand_asc', label: 'แบรนด์ (A → Z)', icon: 'sell' },
];
