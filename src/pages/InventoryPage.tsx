import React, { useState, useRef, useEffect } from 'react';
import { InventoryCard } from '../components/InventoryCard';
import { InventoryCardSkeleton } from '../components/InventoryCardSkeleton';
import { InventorySheet } from '../components/InventorySheet';
import { InventoryFilterSheet } from '../components/InventoryFilterSheet';
import { InventorySortDialog } from '../components/InventorySortDialog';
import { useInventory } from '../hooks/useInventory';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  useFilteredInventory,
  INITIAL_INVENTORY_FILTER,
  countActiveFilters,
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

  const [filter, setFilter] = useState<InventoryFilterState>(
    INITIAL_INVENTORY_FILTER
  );
  const [sort, setSort] = useState<InventorySortOption>('code_asc');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [sheetState, setSheetState] = useState<SheetState>({
    isOpen: false,
    mode: 'add',
    item: null,
  });

  const filteredItems = useFilteredInventory(items, filter, sort);
  const activeFilterCount = countActiveFilters(filter);
  const hasSearchQuery = filter.searchQuery.trim().length > 0;
  const hasNonDefaultSort = sort !== 'code_asc';
  const hasAnyActiveFilterOrSort =
    activeFilterCount > 0 || hasSearchQuery || hasNonDefaultSort;

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

  const currentSortLabel =
    INVENTORY_SORT_OPTIONS.find((opt) => opt.value === sort)?.label ?? '';

  const renderActiveFilterBar = () => {
    if (!hasAnyActiveFilterOrSort) return null;

    return (
      <div
        className="row wrap items-center bottom-margin"
        data-testid="active-filters-bar"
        style={{ gap: '8px' }}
      >
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

        {filter.selectedSizes.map((size) => (
          <button
            key={`size-${size}`}
            type="button"
            className="chip small fill secondary-container no-margin"
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                selectedSizes: prev.selectedSizes.filter((s) => s !== size),
              }))
            }
            aria-label={`ลบตัวกรองไซส์ ${size}`}
          >
            <span>ไซส์: {size}</span>
            <i>close</i>
          </button>
        ))}

        {filter.selectedBrands.map((brand) => (
          <button
            key={`brand-${brand}`}
            type="button"
            className="chip small fill secondary-container no-margin"
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                selectedBrands: prev.selectedBrands.filter((b) => b !== brand),
              }))
            }
            aria-label={`ลบตัวกรองแบรนด์ ${brand}`}
          >
            <span>แบรนด์: {brand}</span>
            <i>close</i>
          </button>
        ))}

        {filter.selectedColors.map((color) => (
          <button
            key={`color-${color}`}
            type="button"
            className="chip small fill secondary-container no-margin"
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                selectedColors: prev.selectedColors.filter((c) => c !== color),
              }))
            }
            aria-label={`ลบตัวกรองสี ${color}`}
          >
            <span>สี: {color}</span>
            <i>close</i>
          </button>
        ))}

        {filter.selectedTags.map((tag) => (
          <button
            key={`tag-${tag}`}
            type="button"
            className="chip small fill secondary-container no-margin"
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                selectedTags: prev.selectedTags.filter((t) => t !== tag),
              }))
            }
            aria-label={`ลบตัวกรองแท็ก ${tag}`}
          >
            <span>แท็ก: {tag}</span>
            <i>close</i>
          </button>
        ))}

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

        <button
          type="button"
          className="chip small border no-margin"
          onClick={handleResetAllFilters}
        >
          <i>restart_alt</i>
          <span>ล้างตัวกรองทั้งหมด</span>
        </button>
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
        <div
          className="center-align middle-align padding"
          style={{ minHeight: '50vh' }}
        >
          <i className="extra secondary-text">inventory_2</i>
          <h5 className="secondary-text">ไม่พบรายการเสื้อผ้าในคลัง</h5>
          <p className="secondary-text">
            {provider === 'firebase'
              ? 'คุณสามารถใช้คำสั่ง pnpm seed:firestore เพื่อนำเข้าข้อมูลจำลองเริ่มต้น หรือกดปุ่ม + ด้านล่างเพื่อเพิ่มชุด'
              : 'ยังไม่มีข้อมูลในคลังสินค้า กดปุ่ม + ด้านล่างเพื่อเพิ่มชุดใหม่'}
          </p>
          <div className="space" />
          <button
            type="button"
            className="primary round"
            onClick={handleOpenAdd}
          >
            <i>add</i>
            <span>เพิ่มชุดแรก</span>
          </button>
        </div>
      ) : (
        <>
          {renderActiveFilterBar()}

          {filteredItems.length === 0 ? (
            <div
              className="center-align middle-align padding"
              data-testid="empty-filter-results"
              style={{ minHeight: '45vh' }}
            >
              <i className="extra secondary-text">search_off</i>
              <h5 className="secondary-text">
                ไม่พบชุดที่ตรงกับเงื่อนไขการค้นหา
              </h5>
              <p className="secondary-text">
                ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูรายการชุดทั้งหมด
              </p>
              <div className="space" />
              <button
                type="button"
                className="primary round"
                onClick={handleResetAllFilters}
              >
                <i>restart_alt</i>
                <span>ล้างตัวกรองทั้งหมด</span>
              </button>
            </div>
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
        {searchExpanded && (
          <div
            className="surface-container-highest round medium-elevate row items-center no-margin"
            data-testid="floating-search-bar"
            style={{
              padding: '4px 12px',
              width: isMobile ? 'min(360px, calc(100vw - 24px))' : '340px',
              boxSizing: 'border-box',
              gap: '6px',
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
                height: '38px',
                minWidth: 0,
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
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  minHeight: '28px',
                  padding: 0,
                }}
              >
                <i className="small">close</i>
              </button>
            )}
            <button
              type="button"
              className="circle transparent small no-margin"
              onClick={() => setSearchExpanded(false)}
              aria-label="ซ่อนช่องค้นหา"
              style={{
                width: '28px',
                height: '28px',
                minWidth: '28px',
                minHeight: '28px',
                padding: 0,
              }}
            >
              <i className="small">keyboard_arrow_down</i>
            </button>
          </div>
        )}

        <nav className="center-align tiny-space no-margin">
          <nav className="toolbar secondary-container medium-elevate">
            <span className="bold" data-testid="inventory-count-badge">
              {countText}
            </span>
            <button
              className={`circle no-margin ${
                searchExpanded || hasSearchQuery ? 'fill primary' : 'transparent'
              }`}
              type="button"
              onClick={handleToggleSearch}
              aria-label="ค้นหา"
              title="ค้นหา"
            >
              <i>search</i>
            </button>
            <button
              className={`circle no-margin ${
                activeFilterCount > 0 ? 'fill primary' : 'transparent'
              }`}
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              aria-label="ตัวกรอง"
              title="ตัวกรอง"
              style={{ position: 'relative' }}
            >
              <i>tune</i>
              {activeFilterCount > 0 && (
                <span
                  className="badge circle small primary"
                  data-testid="active-filter-badge"
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
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
