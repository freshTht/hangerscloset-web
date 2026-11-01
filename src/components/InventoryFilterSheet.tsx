import React, { useEffect, useMemo } from 'react';
import type { InventoryItem } from '../types/inventory';
import type { InventoryFilterState } from '../types/catalogFilter';
import {
  getItemTags,
  countActiveFilters,
  mergeUniqueStrings,
} from '../hooks/useFilteredInventory';
import { useIsMobile } from '../hooks/useIsMobile';
import { useMetadataOptions } from '../hooks/useMetadataOptions';
import { Stack } from './Stack';

export interface InventoryFilterSheetProps {
  isOpen: boolean;
  items: InventoryItem[];
  filter: InventoryFilterState;
  filteredCount: number;
  quickAddMode?: boolean;
  onChangeFilter: (nextFilter: InventoryFilterState) => void;
  onResetFilter: () => void;
  onClose: () => void;
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
  quickAddMode = false,
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

  const isSelected = (list: string[], option: string): boolean =>
    list.some((item) => item.trim().toLowerCase() === option.trim().toLowerCase());

  // In quickAddMode, exclude filters that are already applied (except tags!)
  const displayedSizes = useMemo(() => {
    return quickAddMode
      ? availableSizes.filter((s) => !isSelected(filter.selectedSizes, s))
      : availableSizes;
  }, [availableSizes, filter.selectedSizes, quickAddMode]);

  const displayedBrands = useMemo(() => {
    return quickAddMode
      ? availableBrands.filter((b) => !isSelected(filter.selectedBrands, b))
      : availableBrands;
  }, [availableBrands, filter.selectedBrands, quickAddMode]);

  const displayedColors = useMemo(() => {
    return quickAddMode
      ? availableColors.filter((c) => !isSelected(filter.selectedColors, c))
      : availableColors;
  }, [availableColors, filter.selectedColors, quickAddMode]);

  const displayedOwners = useMemo(() => {
    return quickAddMode
      ? availableOwners.filter((o) => !isSelected(filter.selectedOwners, o))
      : availableOwners;
  }, [availableOwners, filter.selectedOwners, quickAddMode]);

  const displayedDurations = useMemo(() => {
    return quickAddMode
      ? availableDurations.filter((d) => filter.durationDaysFilter !== d)
      : availableDurations;
  }, [availableDurations, filter.durationDaysFilter, quickAddMode]);

  // Tags are multi-selectable, so show all tags
  const displayedTags = availableTags;

  const handleSelectSize = (size: string) => {
    if (quickAddMode) {
      onChangeFilter({
        ...filter,
        selectedSizes: [...filter.selectedSizes, size],
      });
      onClose();
    } else {
      onChangeFilter({
        ...filter,
        selectedSizes: toggleArrayItem(filter.selectedSizes, size),
      });
    }
  };

  const handleSelectBrand = (brand: string) => {
    if (quickAddMode) {
      onChangeFilter({
        ...filter,
        selectedBrands: [...filter.selectedBrands, brand],
      });
      onClose();
    } else {
      onChangeFilter({
        ...filter,
        selectedBrands: toggleArrayItem(filter.selectedBrands, brand),
      });
    }
  };

  const handleSelectColor = (color: string) => {
    if (quickAddMode) {
      onChangeFilter({
        ...filter,
        selectedColors: [...filter.selectedColors, color],
      });
      onClose();
    } else {
      onChangeFilter({
        ...filter,
        selectedColors: toggleArrayItem(filter.selectedColors, color),
      });
    }
  };

  const handleSelectOwner = (owner: string) => {
    if (quickAddMode) {
      onChangeFilter({
        ...filter,
        selectedOwners: [...filter.selectedOwners, owner],
      });
      onClose();
    } else {
      onChangeFilter({
        ...filter,
        selectedOwners: toggleArrayItem(filter.selectedOwners, owner),
      });
    }
  };

  const handleSelectDuration = (days: number | null) => {
    if (quickAddMode && days !== null) {
      onChangeFilter({
        ...filter,
        durationDaysFilter: days,
      });
      onClose();
    } else {
      onChangeFilter({
        ...filter,
        durationDaysFilter: filter.durationDaysFilter === days ? null : days,
      });
    }
  };

  const activeCount = countActiveFilters(filter);

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
        aria-label={quickAddMode ? 'เลือกตัวกรองเพิ่ม' : 'ตัวกรองสินค้า'}
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
                padding: '12px 16px calc(16px + env(safe-area-inset-bottom)) 16px',
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
          className="row no-margin"
          style={{ paddingBottom: '8px', flexShrink: 0, gap: '8px' }}
        >
          <i>{quickAddMode ? 'add' : 'tune'}</i>
          <Stack orientation="column" gap="none">
            <h6 className="bold no-margin">
              {quickAddMode ? 'เพิ่ม 1 ฟิลเตอร์' : 'ตัวกรองสินค้า'}
            </h6>
            {quickAddMode && (
              <span className="hc-micro-text secondary-text">
                เลือก 1 ตัวกรองเพื่อเพิ่มและใช้งานทันที
              </span>
            )}
          </Stack>
          {activeCount > 0 && !quickAddMode && (
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
              {!quickAddMode && (
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
              )}
              {displayedDurations.map((days) => {
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
                    onClick={() => handleSelectDuration(days)}
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

            {quickAddMode && (filter.minPrice !== null || filter.maxPrice !== null) && (
              <div className="row no-margin right-align">
                <button
                  type="button"
                  className="chip fill primary small no-margin"
                  onClick={onClose}
                >
                  <i>check</i>
                  <span>ใช้ช่วงราคานี้</span>
                </button>
              </div>
            )}
          </Stack>

          {/* Sizes Facet */}
          {displayedSizes.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" gap="small">
                <i className="small">height</i>
                <span className="bold small-text">ไซส์ (Size)</span>
              </Stack>
              {renderChipGroup(
                displayedSizes,
                filter.selectedSizes,
                handleSelectSize,
                'filter-size'
              )}
            </Stack>
          )}

          {/* Brands Facet */}
          {displayedBrands.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" gap="small">
                <i className="small">sell</i>
                <span className="bold small-text">แบรนด์ (Brand)</span>
              </Stack>
              {renderChipGroup(
                displayedBrands,
                filter.selectedBrands,
                handleSelectBrand,
                'filter-brand'
              )}
            </Stack>
          )}

          {/* Colors Facet */}
          {displayedColors.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" gap="small">
                <i className="small">palette</i>
                <span className="bold small-text">สี (Color)</span>
              </Stack>
              {renderChipGroup(
                displayedColors,
                filter.selectedColors,
                handleSelectColor,
                'filter-color'
              )}
            </Stack>
          )}

          {/* Tags Facet (Multi-select) */}
          {displayedTags.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" justify="space-between">
                <Stack orientation="row" align="center" gap="small">
                  <i className="small">tag</i>
                  <span className="bold small-text">แท็ก / หมวดหมู่ (Tags)</span>
                </Stack>
                {quickAddMode && (
                  <button
                    type="button"
                    className="chip fill primary small no-margin"
                    onClick={onClose}
                  >
                    <i>check</i>
                    <span>ใช้แท็กที่เลือก ({filter.selectedTags.length})</span>
                  </button>
                )}
              </Stack>
              {renderChipGroup(
                displayedTags,
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
          {displayedOwners.length > 0 && (
            <Stack orientation="column" gap="small">
              <Stack orientation="row" align="center" gap="small">
                <i className="small">person</i>
                <span className="bold small-text">เจ้าของ / ฝากเช่า (Owner)</span>
              </Stack>
              {renderChipGroup(
                displayedOwners,
                filter.selectedOwners,
                handleSelectOwner,
                'filter-owner'
              )}
            </Stack>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="row no-margin"
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
