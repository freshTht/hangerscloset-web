import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useFilteredInventory,
  filterAndSortInventory,
  countActiveFilters,
  INITIAL_INVENTORY_FILTER,
} from '../useFilteredInventory';
import type { InventoryItem } from '../../types/inventory';
import type { InventoryFilterState } from '../../types/catalogFilter';

const SAMPLE_ITEMS: InventoryItem[] = [
  {
    id: '1',
    code: 'AVL02',
    name: 'ชุดเดรสผ้าซาตินสีฟ้า',
    brand: 'Avaalene',
    color: 'Blue',
    size: 'M',
    status: 'available',
    tags: ['เดรส', 'ออกงาน'],
    owner: 'คุณแอน',
    accessories: 'เข็มขัดมุก',
    note: 'ซักแห้งเท่านั้น',
    imageUrl: 'https://example.com/1.jpg',
    rentalPrices: [
      { durationDays: 1, price: 350 },
      { durationDays: 3, price: 550 },
      { durationDays: 5, price: 750 },
    ],
  },
  {
    id: '2',
    code: 'AVL01',
    name: 'กระโปรงพลีทสีชมพู',
    brand: 'Lululala',
    color: 'Pink',
    size: 'S',
    status: 'reserved',
    tags: ['กระโปรง', 'คาเฟ่'],
    owner: 'ร้าน Hanger',
    accessories: null,
    note: 'ผ้านิ่มใส่สบาย',
    imageUrl: 'https://example.com/2.jpg',
    rentalPrices: [
      { durationDays: 1, price: 200 },
      { durationDays: 3, price: 350 },
    ],
  },
  {
    id: '3',
    code: 'AVL10',
    name: 'กางเกงลินินสีขาว',
    brand: 'basics by sita',
    color: 'White',
    size: 'L',
    status: 'laundry',
    type: 'กางเกง', // Legacy type fallback
    owner: 'คุณแอน',
    accessories: 'หมวกสาน',
    note: null,
    imageUrl: 'https://example.com/3.jpg',
    rentalPrices: [
      { durationDays: 1, price: 290 },
      { durationDays: 3, price: 450 },
      { durationDays: 5, price: 600 },
    ],
  },
];

describe('useFilteredInventory & filterAndSortInventory', () => {
  it('returns all items sorted by code_asc by default (numeric aware)', () => {
    const { result } = renderHook(() =>
      useFilteredInventory(SAMPLE_ITEMS, INITIAL_INVENTORY_FILTER, 'code_asc')
    );
    expect(result.current.map((i) => i.code)).toEqual(['AVL01', 'AVL02', 'AVL10']);
  });

  it('filters by keyword search across code, name, brand, color, owner, accessories, note, and tags', () => {
    const withQuery = (q: string): InventoryFilterState => ({
      ...INITIAL_INVENTORY_FILTER,
      searchQuery: q,
    });

    // By code
    expect(filterAndSortInventory(SAMPLE_ITEMS, withQuery('avl10')).map((i) => i.id)).toEqual(['3']);
    // By name
    expect(filterAndSortInventory(SAMPLE_ITEMS, withQuery('ซาติน')).map((i) => i.id)).toEqual(['1']);
    // By brand
    expect(filterAndSortInventory(SAMPLE_ITEMS, withQuery('sita')).map((i) => i.id)).toEqual(['3']);
    // By color
    expect(filterAndSortInventory(SAMPLE_ITEMS, withQuery('pink')).map((i) => i.id)).toEqual(['2']);
    // By owner
    expect(filterAndSortInventory(SAMPLE_ITEMS, withQuery('คุณแอน')).map((i) => i.id)).toEqual(['1', '3']);
    // By accessories
    expect(filterAndSortInventory(SAMPLE_ITEMS, withQuery('เข็มขัดมุก')).map((i) => i.id)).toEqual(['1']);
    // By note
    expect(filterAndSortInventory(SAMPLE_ITEMS, withQuery('ซักแห้ง')).map((i) => i.id)).toEqual(['1']);
    // By tag
    expect(filterAndSortInventory(SAMPLE_ITEMS, withQuery('คาเฟ่')).map((i) => i.id)).toEqual(['2']);
    // By legacy type
    expect(filterAndSortInventory(SAMPLE_ITEMS, withQuery('กางเกง')).map((i) => i.id)).toEqual(['3']);
  });

  it('applies OR logic within a facet and AND logic across multiple facets', () => {
    // OR within brands
    const multiBrandFilter: InventoryFilterState = {
      ...INITIAL_INVENTORY_FILTER,
      selectedBrands: ['Avaalene', 'Lululala'],
    };
    expect(filterAndSortInventory(SAMPLE_ITEMS, multiBrandFilter).map((i) => i.id)).toEqual([
      '2',
      '1',
    ]);

    // AND across brand + size
    const brandAndSizeFilter: InventoryFilterState = {
      ...INITIAL_INVENTORY_FILTER,
      selectedBrands: ['Avaalene', 'Lululala'],
      selectedSizes: ['M'],
    };
    expect(filterAndSortInventory(SAMPLE_ITEMS, brandAndSizeFilter).map((i) => i.id)).toEqual([
      '1',
    ]);

    // AND across owner + color + tag
    const ownerColorTagFilter: InventoryFilterState = {
      ...INITIAL_INVENTORY_FILTER,
      selectedOwners: ['คุณแอน'],
      selectedColors: ['White'],
      selectedTags: ['กางเกง'],
    };
    expect(filterAndSortInventory(SAMPLE_ITEMS, ownerColorTagFilter).map((i) => i.id)).toEqual([
      '3',
    ]);
  });

  it('filters by durationDaysFilter and price range accurately', () => {
    // Item 2 only has 1-day and 3-day tiers, not 5-day
    const fiveDayFilter: InventoryFilterState = {
      ...INITIAL_INVENTORY_FILTER,
      durationDaysFilter: 5,
    };
    expect(filterAndSortInventory(SAMPLE_ITEMS, fiveDayFilter).map((i) => i.id)).toEqual([
      '1',
      '3',
    ]);

    // 3-day tier between 400 and 600 -> Item 1 (550) and Item 3 (450)
    const threeDayRangeFilter: InventoryFilterState = {
      ...INITIAL_INVENTORY_FILTER,
      durationDaysFilter: 3,
      minPrice: 400,
      maxPrice: 600,
    };
    expect(filterAndSortInventory(SAMPLE_ITEMS, threeDayRangeFilter).map((i) => i.id)).toEqual([
      '1',
      '3',
    ]);

    // Without durationDaysFilter, checks lowest tier price (200, 290, 350)
    const lowestPriceRange: InventoryFilterState = {
      ...INITIAL_INVENTORY_FILTER,
      minPrice: 250,
      maxPrice: 320,
    };
    expect(filterAndSortInventory(SAMPLE_ITEMS, lowestPriceRange).map((i) => i.id)).toEqual([
      '3',
    ]);
  });

  it('sorts items across all 6 sort modes', () => {
    expect(
      filterAndSortInventory(SAMPLE_ITEMS, INITIAL_INVENTORY_FILTER, 'code_asc').map(
        (i) => i.code
      )
    ).toEqual(['AVL01', 'AVL02', 'AVL10']);

    expect(
      filterAndSortInventory(SAMPLE_ITEMS, INITIAL_INVENTORY_FILTER, 'code_desc').map(
        (i) => i.code
      )
    ).toEqual(['AVL10', 'AVL02', 'AVL01']);

    expect(
      filterAndSortInventory(SAMPLE_ITEMS, INITIAL_INVENTORY_FILTER, 'name_asc').map(
        (i) => i.name
      )
    ).toEqual([
      'กระโปรงพลีทสีชมพู',
      'กางเกงลินินสีขาว',
      'ชุดเดรสผ้าซาตินสีฟ้า',
    ]);

    expect(
      filterAndSortInventory(SAMPLE_ITEMS, INITIAL_INVENTORY_FILTER, 'price_asc').map(
        (i) => i.id
      )
    ).toEqual(['2', '3', '1']);

    expect(
      filterAndSortInventory(SAMPLE_ITEMS, INITIAL_INVENTORY_FILTER, 'price_desc').map(
        (i) => i.id
      )
    ).toEqual(['1', '3', '2']);

    expect(
      filterAndSortInventory(SAMPLE_ITEMS, INITIAL_INVENTORY_FILTER, 'brand_asc').map(
        (i) => i.brand
      )
    ).toEqual(['Avaalene', 'basics by sita', 'Lululala']);
  });

  it('counts active facet filters properly via countActiveFilters', () => {
    expect(countActiveFilters(INITIAL_INVENTORY_FILTER)).toBe(0);
    expect(
      countActiveFilters({
        ...INITIAL_INVENTORY_FILTER,
        searchQuery: 'dress', // searchQuery is separate from facet badge count
        selectedBrands: ['Avaalene', 'Lululala'],
        selectedSizes: ['S'],
        durationDaysFilter: 3,
        minPrice: 200,
        maxPrice: 600,
      })
    ).toBe(6);
  });
});
