import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { InventoryCard } from '../components/InventoryCard';
import { InventoryCardSkeleton } from '../components/InventoryCardSkeleton';
import { InventorySheet } from '../components/InventorySheet';
import { InventoryFilterSheet } from '../components/InventoryFilterSheet';
import { InventorySortDialog } from '../components/InventorySortDialog';
import { EmptyState } from '../components/EmptyState';
import { useInventory } from '../hooks/useInventory';
import { useIsMobile } from '../hooks/useIsMobile';
import { useMetadataOptions } from '../hooks/useMetadataOptions';
import {
  useFilteredInventory,
  INITIAL_INVENTORY_FILTER,
  countActiveFilters,
  mergeUniqueStrings,
  getItemTags,
} from '../hooks/useFilteredInventory';
import {
  INVENTORY_SORT_OPTIONS,
  type InventoryFilterState,
  type InventorySortOption,
} from '../types/catalogFilter';
import type { InventoryItem } from '../types/inventory';

interface SheetState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  item?: InventoryItem | null;
}

export const InventoryPage: React.FC = () => {
  const { items, loading, error, provider, addItem, updateItem, deleteItem } =
    useInventory();
  const isMobile = useIsMobile();
  const {
    sizes: metaSizes,
    brands: metaBrands,
    colors: metaColors,
    tags: metaTags,
  } = useMetadataOptions();

  const [filter, setFilter] = useState<InventoryFilterState>(
    INITIAL_INVENTORY_FILTER
  );
  const [sort, setSort] = useState<InventorySortOption>('code_asc');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const slot = document.getElementById('page-header-slot');
    if (slot) {
      setHeaderSlot(slot);
    }
  }, []);

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

  const [sheetState, setSheetState] = useState<SheetState>({
    isOpen: false,
    mode: 'add',
    item: null,
  });

  const filteredItems = useFilteredInventory(items, filter, sort);
  const activeFilterCount = countActiveFilters(filter);
  const hasSearchQuery = filter.searchQuery.trim().length > 0;
  const hasNonDefaultSort = sort !== 'code_asc';
  const hasAppliedFilters = activeFilterCount > 0 || hasSearchQuery || hasNonDefaultSort;

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const handleOpenAdd = () => {
    setSheetState({
      isOpen: true,
      mode: 'add',
      item: null,
    });
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSheetState({
      isOpen: true,
      mode: 'edit',
      item,
    });
  };

  const handleCloseSheet = () => {
    setSheetState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmitSheet = async (data: Omit<InventoryItem, 'id'>) => {
    if (sheetState.mode === 'edit' && sheetState.item) {
      await updateItem(sheetState.item.id, data);
    } else {
      await addItem(data);
    }
  };

  const handleDeleteSheet = async (id: string) => {
    await deleteItem(id);
  };

  const handleResetAllFilters = () => {
    setFilter(INITIAL_INVENTORY_FILTER);
    setSort('code_asc');
  };

  const handleToggleSearch = () => {
    setSearchExpanded((prev) => !prev);
  };

  const handleOpenQuickFilter = () => {
    setQuickAddMode(true);
    setFilterSheetOpen(true);
  };

  const selectedSize = filter.selectedSizes[0] ?? '';
  const selectedBrand = filter.selectedBrands[0] ?? '';
  const selectedColor = filter.selectedColors[0] ?? '';

  const handleSelectSize = (size: string) => {
    setFilter((prev) => ({
      ...prev,
      selectedSizes: size ? [size] : [],
    }));
  };

  const handleSelectBrand = (brand: string) => {
    setFilter((prev) => ({
      ...prev,
      selectedBrands: brand ? [brand] : [],
    }));
  };

  const handleSelectColor = (color: string) => {
    setFilter((prev) => ({
      ...prev,
      selectedColors: color ? [color] : [],
    }));
  };

  const handleAddSearchTag = (tag: string) => {
    if (!filter.selectedTags.includes(tag)) {
      setFilter((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, tag],
      }));
    }
  };

  const handleRemoveSearchTag = (tag: string) => {
    setFilter((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.filter((t) => t !== tag),
    }));
  };

  const currentSortLabel =
    INVENTORY_SORT_OPTIONS.find((opt) => opt.value === sort)?.label ?? '';

  const renderActiveFilterBar = () => {
    return (
      <div className="active-filters-sticky-wrapper">
        <div
          className="row no-wrap items-center no-margin"
          data-testid="active-filters-bar"
          style={{
            gap: '8px',
            paddingBottom: '2px',
          }}
        >
          <div
            className="row no-wrap items-center scroll no-margin"
            style={{
              gap: '8px',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* 1. Static Dropdown: Size */}
            <select
              aria-label="ตัวกรองไซส์"
              data-testid="filter-select-size"
              value={selectedSize}
              onChange={(e) => handleSelectSize(e.target.value)}
              className={`chip small no-margin ${selectedSize ? 'fill primary' : 'border'}`}
              style={{
                height: '32px',
                padding: '0 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                backgroundColor: selectedSize ? 'var(--primary)' : 'transparent',
                color: selectedSize ? 'var(--on-primary)' : 'var(--on-surface)',
              }}
            >
              <option value="">ไซส์: ทั้งหมด</option>
              {availableSizes.map((s) => (
                <option key={s} value={s}>
                  ไซส์: {s}
                </option>
              ))}
            </select>

            {/* 2. Static Dropdown: Brand */}
            <select
              aria-label="ตัวกรองแบรนด์"
              data-testid="filter-select-brand"
              value={selectedBrand}
              onChange={(e) => handleSelectBrand(e.target.value)}
              className={`chip small no-margin ${selectedBrand ? 'fill primary' : 'border'}`}
              style={{
                height: '32px',
                padding: '0 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                backgroundColor: selectedBrand ? 'var(--primary)' : 'transparent',
                color: selectedBrand ? 'var(--on-primary)' : 'var(--on-surface)',
              }}
            >
              <option value="">แบรนด์: ทั้งหมด</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* 3. Static Dropdown: Color */}
            <select
              aria-label="ตัวกรองสี"
              data-testid="filter-select-color"
              value={selectedColor}
              onChange={(e) => handleSelectColor(e.target.value)}
              className={`chip small no-margin ${selectedColor ? 'fill primary' : 'border'}`}
              style={{
                height: '32px',
                padding: '0 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                backgroundColor: selectedColor ? 'var(--primary)' : 'transparent',
                color: selectedColor ? 'var(--on-primary)' : 'var(--on-surface)',
              }}
            >
              <option value="">สี: ทั้งหมด</option>
              {availableColors.map((c) => (
                <option key={c} value={c}>
                  สี: {c}
                </option>
              ))}
            </select>

            {/* Additional Facet Chips: Search query */}
            {hasSearchQuery && (
              <button
                type="button"
                className="chip small fill primary-container no-margin"
                onClick={() => setFilter((prev) => ({ ...prev, searchQuery: '' }))}
                aria-label={`ลบคำค้นหา ${filter.searchQuery.trim()}`}
              >
                <i>search</i>
                <span>ค้นหา: "{filter.searchQuery.trim()}"</span>
                <i>close</i>
              </button>
            )}

            {/* Additional Facet Chips: Selected Tags */}
            {filter.selectedTags.map((tag) => (
              <button
                key={`tag-${tag}`}
                type="button"
                className="chip small fill secondary-container no-margin"
                onClick={() => handleRemoveSearchTag(tag)}
                aria-label={`ลบตัวกรองแท็ก ${tag}`}
              >
                <span>#{tag}</span>
                <i>close</i>
              </button>
            ))}

            {/* Additional Facet Chips: Duration */}
            {filter.durationDaysFilter !== null &&
              filter.durationDaysFilter !== undefined && (
                <button
                  type="button"
                  className="chip small fill secondary-container no-margin"
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, durationDaysFilter: null }))
                  }
                  aria-label={`ลบตัวกรองระยะเวลา ${filter.durationDaysFilter} วัน`}
                >
                  <span>เช่า {filter.durationDaysFilter} วัน</span>
                  <i>close</i>
                </button>
              )}

            {/* Additional Facet Chips: Min Price */}
            {filter.minPrice !== null && filter.minPrice !== undefined && (
              <button
                type="button"
                className="chip small fill secondary-container no-margin"
                onClick={() => setFilter((prev) => ({ ...prev, minPrice: null }))}
                aria-label={`ลบตัวกรองราคาต่ำสุด`}
              >
                <span>ราคา ≥ ฿{filter.minPrice.toLocaleString('en-US')}</span>
                <i>close</i>
              </button>
            )}

            {/* Additional Facet Chips: Max Price */}
            {filter.maxPrice !== null && filter.maxPrice !== undefined && (
              <button
                type="button"
                className="chip small fill secondary-container no-margin"
                onClick={() => setFilter((prev) => ({ ...prev, maxPrice: null }))}
                aria-label={`ลบตัวกรองราคาสูงสุด`}
              >
                <span>ราคา ≤ ฿{filter.maxPrice.toLocaleString('en-US')}</span>
                <i>close</i>
              </button>
            )}

            {/* Additional Facet Chips: Owner */}
            {filter.selectedOwners.map((owner) => (
              <button
                key={`owner-${owner}`}
                type="button"
                className="chip small fill secondary-container no-margin"
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    selectedOwners: prev.selectedOwners.filter((o) => o !== owner),
                  }))
                }
                aria-label={`ลบตัวกรองเจ้าของ ${owner}`}
              >
                <span>เจ้าของ: {owner}</span>
                <i>close</i>
              </button>
            ))}

            {/* Additional Facet Chips: Sort */}
            {hasNonDefaultSort && (
              <button
                type="button"
                className="chip small fill tertiary-container no-margin"
                onClick={() => setSort('code_asc')}
                aria-label={`รีเซ็ตการจัดเรียง ${currentSortLabel}`}
              >
                <i>sort</i>
                <span>เรียง: {currentSortLabel}</span>
                <i>close</i>
              </button>
            )}

            {/* "+ ฟิลเตอร์" Quick add drawer */}
            <button
              type="button"
              data-testid="btn-add-filter"
              className="chip small fill primary-container bold no-margin"
              onClick={handleOpenQuickFilter}
              aria-label="เพิ่มฟิลเตอร์"
              title="เพิ่ม 1 ฟิลเตอร์ด่วน"
            >
              <i>add</i>
              <span>ฟิลเตอร์</span>
            </button>

            {/* Clear All button */}
            {hasAppliedFilters && (
              <button
                type="button"
                className="chip small border no-margin"
                onClick={handleResetAllFilters}
                aria-label="เคลียร์"
                title="เคลียร์"
              >
                <i>clear_all</i>
                <span>เคลียร์</span>
              </button>
            )}
          </div>

          {/* Search Toggle Icon Button on the right of filter bar */}
          <button
            type="button"
            className={`circle small no-margin ${searchExpanded || hasSearchQuery || filter.selectedTags.length > 0 ? 'fill primary' : 'transparent border'}`}
            onClick={handleToggleSearch}
            aria-label="ค้นหา"
            title="ค้นหาและแท็ก"
            data-testid="filter-bar-search-toggle"
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <i>{searchExpanded ? 'close' : 'search'}</i>
          </button>
        </div>

        {/* Expandable Search + Tag Filter Box */}
        {searchExpanded && (
          <div
            className="round surface-container-low border small-padding margin-top"
            data-testid="filter-search-box"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              className="row items-center no-margin"
              style={{
                gap: '8px',
                width: '100%',
              }}
            >
              <i className="small secondary-text">search</i>
              <input
                ref={searchInputRef}
                type="search"
                aria-label="ค้นหาชุดในคลัง"
                placeholder="ค้นหารหัส, ชื่อชุด, แบรนด์, สี, ไซส์..."
                value={filter.searchQuery}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))
                }
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--on-surface)',
                  height: '32px',
                  minWidth: 0,
                  fontSize: '13px',
                }}
              />
              {filter.searchQuery && (
                <button
                  type="button"
                  className="circle transparent small no-margin"
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, searchQuery: '' }))
                  }
                  aria-label="ล้างคำค้นหา"
                  style={{
                    width: '24px',
                    height: '24px',
                    minWidth: '24px',
                    minHeight: '24px',
                    padding: 0,
                  }}
                >
                  <i className="tiny">close</i>
                </button>
              )}
            </div>

            {/* Quick Tag Selector Chips */}
            {availableTags.length > 0 && (
              <div
                className="row no-wrap items-center scroll no-margin"
                style={{
                  gap: '6px',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  paddingTop: '2px',
                  paddingBottom: '2px',
                }}
              >
                <span className="micro-text secondary-text bold" style={{ whiteSpace: 'nowrap' }}>
                  แท็ก:
                </span>
                {availableTags.map((t) => {
                  const isSelected = filter.selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      data-testid={`tag-chip-${t}`}
                      className={`chip tiny no-margin ${isSelected ? 'fill primary' : 'border'}`}
                      style={{
                        height: '24px',
                        padding: '0 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() =>
                        isSelected ? handleRemoveSearchTag(t) : handleAddSearchTag(t)
                      }
                    >
                      <span>#{t}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const countText =
    filteredItems.length === items.length
      ? `${items.length} ชุด`
      : `${filteredItems.length}/${items.length} ชุด`;

  return (
    <>
      {loading ? (
        <div
          className="grid"
          aria-busy="true"
          aria-label="กำลังโหลดรายการสินค้า"
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="s12 m6 l4">
              <InventoryCardSkeleton />
            </div>
          ))}
        </div>
      ) : error ? (
        <article className="border error-container round margin">
          <div className="row items-center">
            <i className="error-text">error</i>
            <div className="max">
              <h6 className="bold no-margin error-text">
                เกิดข้อผิดพลาดในการโหลดข้อมูล
              </h6>
              <p className="no-margin secondary-text">{error.message}</p>
            </div>
          </div>
        </article>
      ) : items.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="ไม่พบรายการเสื้อผ้าในคลัง"
          description={
            provider === 'firebase'
              ? 'คุณสามารถใช้คำสั่ง pnpm seed:firestore เพื่อนำเข้าข้อมูลจำลองเริ่มต้น หรือกดปุ่ม + ด้านล่างเพื่อเพิ่มชุด'
              : 'ยังไม่มีข้อมูลในคลังสินค้า กดปุ่ม + ด้านล่างเพื่อเพิ่มชุดใหม่'
          }
          actionIcon="add"
          actionText="เพิ่มชุดแรก"
          onAction={handleOpenAdd}
        />
      ) : (
        <>
          {headerSlot
            ? createPortal(renderActiveFilterBar(), headerSlot)
            : renderActiveFilterBar()}

          {filteredItems.length === 0 ? (
            <EmptyState
              testId="empty-filter-results"
              icon="search_off"
              title="ไม่พบชุดที่ตรงกับเงื่อนไขการค้นหา"
              description="ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูรายการชุดทั้งหมด"
              actionIcon="restart_alt"
              actionText="ล้างตัวกรองทั้งหมด"
              onAction={handleResetAllFilters}
            />
          ) : (
            <div className="grid">
              {filteredItems.map((item) => (
                <div key={item.id} className="s12 m6 l4">
                  <InventoryCard item={item} onEdit={handleOpenEdit} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Spacing using Beer CSS built-in helpers */}
      <div className="extra-space"></div>
      <div className="large-space"></div>

      {/* Responsive Floating Bottom Toolbar + Expandable Search Bar */}
      <div
        className={`fixed bottom ${isMobile ? 'center' : 'right'} margin front`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'center' : 'flex-end',
          gap: '8px',
          maxWidth: 'calc(100vw - 24px)',
        }}
      >
        <nav className="center-align tiny-space no-margin">
          <nav className="toolbar secondary-container medium-elevate">
            <span className="bold" data-testid="inventory-count-badge">
              {countText}
            </span>
            <button
              className={`circle no-margin ${
                hasNonDefaultSort ? 'fill primary' : 'transparent'
              }`}
              type="button"
              onClick={() => setSortDialogOpen(true)}
              aria-label="จัดเรียง"
              title="จัดเรียง"
            >
              <i>sort</i>
            </button>
          </nav>
          <button
            className="extra circle primary medium-elevate no-margin"
            type="button"
            onClick={handleOpenAdd}
            aria-label="เพิ่มชุด"
            title="เพิ่มชุด"
          >
            <i>add</i>
          </button>
        </nav>
      </div>

      {/* Add / Edit Sheet Component */}
      <InventorySheet
        isOpen={sheetState.isOpen}
        mode={sheetState.mode}
        item={sheetState.item}
        onClose={handleCloseSheet}
        onSubmit={handleSubmitSheet}
        onDelete={handleDeleteSheet}
      />

      {/* Multi-Facet Filter Sheet */}
      <InventoryFilterSheet
        isOpen={filterSheetOpen}
        items={items}
        filter={filter}
        filteredCount={filteredItems.length}
        quickAddMode={quickAddMode}
        onChangeFilter={setFilter}
        onResetFilter={() => setFilter(INITIAL_INVENTORY_FILTER)}
        onClose={() => setFilterSheetOpen(false)}
      />

      {/* Sort Dialog */}
      <InventorySortDialog
        isOpen={sortDialogOpen}
        sort={sort}
        onSelectSort={setSort}
        onClose={() => setSortDialogOpen(false)}
      />
    </>
  );
};
