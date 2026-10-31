import React, { useEffect, useMemo } from 'react';
import type { InventoryItem } from '../types/inventory';
import type { InventoryFilterState } from '../types/catalogFilter';
import { getItemTags, countActiveFilters } from '../hooks/useFilteredInventory';
import { useIsMobile } from '../hooks/useIsMobile';
import { useMetadataOptions } from '../hooks/useMetadataOptions';
import { Stack } from './Stack';

export interface InventoryFilterSheetProps {
  isOpen: boolean;
  items: InventoryItem[];
  filter: InventoryFilterState;
  filteredCount: number;
  onChangeFilter: (nextFilter: InventoryFilterState) => void;
  onResetFilter: () => void;
  onClose: () => void;
}

function mergeUniqueStrings(primary: string[], secondary: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of [...primary, ...secondary]) {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}

function toggleArrayItem(list: string[], value: string): string[] {
  const exists = list.some(
    (item) => item.trim().toLowerCase() === value.trim().toLowerCase()
  );
  if (exists) {
    return list.filter(
      (item) => item.trim().toLowerCase() !== value.trim().toLowerCase()
    );
  }
  return [...list, value];
}

export const InventoryFilterSheet: React.FC<InventoryFilterSheetProps> = ({
  isOpen,
  items,
  filter,
  filteredCount,
  onChangeFilter,
  onResetFilter,
  onClose,
}) => {
  const isMobile = useIsMobile();
  const { brands: metaBrands, colors: metaColors, sizes: metaSizes, tags: metaTags } =
    useMetadataOptions();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const availableSizes = useMemo(
    () =>
      mergeUniqueStrings(
        metaSizes,
        items.map((item) => item.size)
      ),
    [metaSizes, items]
  );

  const availableBrands = useMemo(
    () =>
      mergeUniqueStrings(
        metaBrands,
        items.map((item) => item.brand)
      ),
    [metaBrands, items]
  );

  const availableColors = useMemo(
    () =>
      mergeUniqueStrings(
        metaColors,
        items.map((item) => item.color)
      ),
    [metaColors, items]
  );

  const availableTags = useMemo(
    () =>
      mergeUniqueStrings(
        metaTags,
        items.flatMap((item) => getItemTags(item))
      ),
    [metaTags, items]
  );

  const availableOwners = useMemo(
    () =>
      mergeUniqueStrings(
        [],
        items.map((item) => item.owner ?? '')
      ),
    [items]
  );

  const availableDurations = useMemo(() => {
    const daySet = new Set<number>([1, 3, 5]);
    for (const item of items) {
      for (const tier of item.rentalPrices ?? []) {
        if (tier.durationDays > 0) {
          daySet.add(tier.durationDays);
        }
      }
    }
    return Array.from(daySet).sort((a, b) => a - b);
  }, [items]);

  const activeCount = countActiveFilters(filter);

  const isSelected = (list: string[], option: string): boolean =>
    list.some((item) => item.trim().toLowerCase() === option.trim().toLowerCase());

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (!raw) {
      onChangeFilter({ ...filter, minPrice: null });
      return;
    }
    const parsed = parseFloat(raw);
    onChangeFilter({
      ...filter,
      minPrice: isNaN(parsed) ? null : parsed,
    });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (!raw) {
      onChangeFilter({ ...filter, maxPrice: null });
      return;
    }
    const parsed = parseFloat(raw);
    onChangeFilter({
      ...filter,
      maxPrice: isNaN(parsed) ? null : parsed,
    });
  };

  const sheetClass = isMobile
    ? `bottom s ${isOpen ? 'active' : ''}`
    : `right medium m l ${isOpen ? 'active' : ''}`;

  const renderChipGroup = (
    options: string[],
    selectedList: string[],
    onToggle: (opt: string) => void,
    testIdPrefix: string
  ) => (
    <div className="row wrap no-margin" style={{ gap: '8px' }}>
      {options.map((opt) => {
        const selected = isSelected(selectedList, opt);
        return (
          <button
            key={opt}
            type="button"
            data-testid={`${testIdPrefix}-${opt}`}
            aria-pressed={selected}
            className={
              selected ? 'chip fill primary no-margin' : 'chip border no-margin'
            }
            onClick={() => onToggle(opt)}
          >
            {selected && <i>check</i>}
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <div
        className={`overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
        style={{ zIndex: 1000, pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      <dialog
        id="inventory-filter-sheet"
        className={sheetClass.trim()}
        open={isOpen}
        aria-hidden={!isOpen}
        aria-label="ตัวกรองสินค้า"
        style={{
          zIndex: 1001,
          display: isOpen ? 'flex' : undefined,
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          ...(isMobile
            ? {
                maxHeight: '90dvh',
                width: '100%',
                maxWidth: '100vw',
                borderRadius: '20px 20px 0 0',
                padding: '12px 16px 16px 16px',
                margin: 0,
              }
            : {
                width: '480px',
                maxWidth: '90vw',
                height: '100dvh',
                padding: '20px',
              }),
        }}
      >
        {/* Header */}
        <div
          className="row items-center no-margin"
          style={{ paddingBottom: '8px', flexShrink: 0, gap: '8px' }}
        >
          <i>tune</i>
          <h6 className="bold no-margin">ตัวกรองสินค้า</h6>
          {activeCount > 0 && (
            <span className="chip small primary no-margin">{activeCount}</span>
          )}
          <div className="max" />
          <button
            type="button"
            className="circle transparent no-margin"
            onClick={onClose}
            aria-label="ปิดตัวกรอง"
            style={{
              width: '36px',
              height: '36px',
              minWidth: '36px',
              minHeight: '36px',
              padding: 0,
            }}
          >
            <i>close</i>
          </button>
        </div>

        {/* Scrollable Filter Sections */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            paddingTop: '8px',
            paddingBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minHeight: 0,
          }}
        >
          {/* Rental Duration & Price Range Section */}
          <Stack
            orientation="column"
            padding="medium"
            gap="medium"
            className="round tertiary-container"
          >
            <Stack orientation="row" align="center" gap="small">
              <i>payments</i>
              <span className="bold small-text">ระยะเวลาเช่า & ช่วงราคา</span>
            </Stack>

            <div className="row wrap no-margin" style={{ gap: '8px' }}>
              <button
                type="button"
                data-testid="filter-duration-all"
                aria-pressed={
                  filter.durationDaysFilter === null ||
                  filter.durationDaysFilter === undefined
                }
                className={
                  filter.durationDaysFilter === null ||
                  filter.durationDaysFilter === undefined
                    ? 'chip fill primary no-margin'
                    : 'chip border surface no-margin'
                }
                onClick={() =>
                  onChangeFilter({ ...filter, durationDaysFilter: null })
                }
              >
                <span>ทั้งหมด</span>
              </button>
              {availableDurations.map((days) => {
                const selected = filter.durationDaysFilter === days;
                return (
                  <button
                    key={days}
                    type="button"
                    data-testid={`filter-duration-${days}`}
                    aria-pressed={selected}
                    className={
                      selected
                        ? 'chip fill primary no-margin'
                        : 'chip border surface no-margin'
                    }
                    onClick={() =>
                      onChangeFilter({
                        ...filter,
                        durationDaysFilter: selected ? null : days,
                      })
                    }
                  >
                    {selected && <i>check</i>}
                    <span>{days} วัน</span>
                  </button>
                );
              })}
            </div>

            <div className="grid no-margin" style={{ gap: '12px' }}>
              <div className="s6">
                <div className="field label border surface round no-margin">
                  <input
                    id="filter-min-price"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="50"
                    value={
                      filter.minPrice !== null && filter.minPrice !== undefined
                        ? String(filter.minPrice)
                        : ''
                    }
                    onChange={handleMinPriceChange}
                    placeholder=" "
                  />
                  <label htmlFor="filter-min-price">ราคาต่ำสุด (฿)</label>
                </div>
              </div>
              <div className="s6">
                <div className="field label border surface round no-margin">
                  <input
                    id="filter-max-price"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="50"
                    value={
                      filter.maxPrice !== null && filter.maxPrice !== undefined
                        ? String(filter.maxPrice)
                        : ''
                    }
                    onChange={handleMaxPriceChange}
                    placeholder=" "
                  />
                  <label htmlFor="filter-max-price">ราคาสูงสุด (฿)</label>
                </div>
              </div>
            </div>
          </Stack>

          {/* Sizes Facet */}
          {availableSizes.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" gap="small">
                <i className="small">height</i>
                <span className="bold small-text">ไซส์ (Size)</span>
              </Stack>
              {renderChipGroup(
                availableSizes,
                filter.selectedSizes,
                (size) =>
                  onChangeFilter({
                    ...filter,
                    selectedSizes: toggleArrayItem(filter.selectedSizes, size),
                  }),
                'filter-size'
              )}
            </Stack>
          )}

          {/* Brands Facet */}
          {availableBrands.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" gap="small">
                <i className="small">sell</i>
                <span className="bold small-text">แบรนด์ (Brand)</span>
              </Stack>
              {renderChipGroup(
                availableBrands,
                filter.selectedBrands,
                (brand) =>
                  onChangeFilter({
                    ...filter,
                    selectedBrands: toggleArrayItem(filter.selectedBrands, brand),
                  }),
                'filter-brand'
              )}
            </Stack>
          )}

          {/* Colors Facet */}
          {availableColors.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" gap="small">
                <i className="small">palette</i>
                <span className="bold small-text">สี (Color)</span>
              </Stack>
              {renderChipGroup(
                availableColors,
                filter.selectedColors,
                (color) =>
                  onChangeFilter({
                    ...filter,
                    selectedColors: toggleArrayItem(filter.selectedColors, color),
                  }),
                'filter-color'
              )}
            </Stack>
          )}

          {/* Tags Facet */}
          {availableTags.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" gap="small">
                <i className="small">tag</i>
                <span className="bold small-text">แท็ก / หมวดหมู่ (Tags)</span>
              </Stack>
              {renderChipGroup(
                availableTags,
                filter.selectedTags,
                (tag) =>
                  onChangeFilter({
                    ...filter,
                    selectedTags: toggleArrayItem(filter.selectedTags, tag),
                  }),
                'filter-tag'
              )}
            </Stack>
          )}

          {/* Owners Facet */}
          {availableOwners.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" gap="small">
                <i className="small">person</i>
                <span className="bold small-text">เจ้าของ / ฝากเช่า (Owner)</span>
              </Stack>
              {renderChipGroup(
                availableOwners,
                filter.selectedOwners,
                (owner) =>
                  onChangeFilter({
                    ...filter,
                    selectedOwners: toggleArrayItem(filter.selectedOwners, owner),
                  }),
                'filter-owner'
              )}
            </Stack>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="row items-center no-margin"
          style={{
            paddingTop: '12px',
            borderTop: '1px solid var(--surface-variant)',
            flexShrink: 0,
            gap: '8px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            className="border round no-margin"
            onClick={onResetFilter}
            disabled={activeCount === 0 && !filter.searchQuery.trim()}
          >
            <i>restart_alt</i>
            <span>ล้างตัวกรอง</span>
          </button>

          <div className="max" />

          <button
            type="button"
            className="primary round no-margin"
            onClick={onClose}
          >
            <i>check</i>
            <span>ดูผลลัพธ์ ({filteredCount} ชุด)</span>
          </button>
        </div>
      </dialog>
    </>
  );
};
