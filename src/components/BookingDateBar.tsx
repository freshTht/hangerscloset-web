import React, { useState, useMemo } from 'react';
import { HeaderToolbar, ToolbarDivider } from './HeaderToolbar';
import {
  FILTER_TABS,
  type BookingFilterTab,
} from './BookingFilterSheet';
import {
  BookingSortDialog,
  type BookingSortKey,
  BOOKING_SORT_OPTIONS,
} from './BookingSortDialog';
import {
  formatDateThaiShort,
  formatDateThaiShortWithYear,
  addDaysISO,
} from '../lib/bookingAvailability';
import './BookingDateBar.css';

export interface BookingDateBarProps {
  selectedDate: string;
  today: string;
  isAllDates?: boolean;
  statusFilter?: BookingFilterTab;
  statusFilters?: BookingFilterTab[];
  tabCounts: Record<BookingFilterTab, number>;
  selectedSort?: BookingSortKey;
  filterSheetOpen?: boolean;
  calendarSheetOpen?: boolean;
  sortDialogOpen?: boolean;
  onDateChange: (newDate: string) => void;
  onFilterClick: () => void;
  onCalendarClick?: () => void;
  onSortClick?: () => void;
  onSelectSort?: (sort: BookingSortKey) => void;
}

/**
 * BookingDateBar - BeerCSS Toolbar component for date navigation and filter triggering on Bookings page.
 * Uses shared `<HeaderToolbar>` (`nav.toolbar.secondary-container`) with `.max` spacer for consistency with InventoryPage.
 */
export const BookingDateBar: React.FC<BookingDateBarProps> = ({
  selectedDate,
  today,
  isAllDates = false,
  statusFilter,
  statusFilters,
  tabCounts,
  selectedSort,
  filterSheetOpen = false,
  calendarSheetOpen = false,
  sortDialogOpen,
  onDateChange,
  onFilterClick,
  onCalendarClick,
  onSortClick,
  onSelectSort,
}) => {
  const [internalSortOpen, setInternalSortOpen] = useState(false);
  const isSortOpen = sortDialogOpen ?? internalSortOpen;
  const handleSortClick = onSortClick ?? (() => setInternalSortOpen(true));
  const handleSelectSort = (sort: BookingSortKey) => {
    onSelectSort?.(sort);
    if (!onSortClick) setInternalSortOpen(false);
  };

  const currentSortOption = useMemo(
    () => BOOKING_SORT_OPTIONS.find((opt) => opt.key === selectedSort),
    [selectedSort]
  );
  const isCustomSort = selectedSort !== 'startDate_asc';

  const activeFilters = useMemo<BookingFilterTab[]>(() => {
    if (statusFilters && statusFilters.length > 0) return statusFilters;
    if (statusFilter) return [statusFilter];
    return ['all'];
  }, [statusFilters, statusFilter]);

  const isAll =
    activeFilters.includes('all') ||
    activeFilters.includes('active') ||
    activeFilters.length === 0;

  const currentFilterLabel = useMemo(() => {
    if (isAll) return 'ตัวกรอง';
    if (activeFilters.length === 1) {
      if (activeFilters[0] === 'available') return 'ว่าง';
      const tab = FILTER_TABS.find((t) => t.id === activeFilters[0]);
      return tab?.label ?? 'ตัวกรอง';
    }
    return `${activeFilters.length} สถานะ`;
  }, [isAll, activeFilters]);

  const activeCount = useMemo(() => {
    if (isAll) {
      return tabCounts.all ?? tabCounts.active ?? 0;
    }
    return activeFilters.reduce((sum, s) => sum + (tabCounts[s] ?? 0), 0);
  }, [isAll, activeFilters, tabCounts]);

  const dateButtonLabel = useMemo(() => {
    if (isAllDates) return 'แสดงทุกวัน (คลิกเพื่อเลือกวัน)';
    if (selectedDate === today) return `${formatDateThaiShort(selectedDate)} (วันนี้)`;
    return formatDateThaiShortWithYear(selectedDate);
  }, [isAllDates, selectedDate, today]);

  return (
    <HeaderToolbar testId="bookings-date-bar">
      {/* Previous Day Button */}
      <button
        type="button"
        className="circle small transparent no-margin hc-datebar-chevron"
        onClick={() => onDateChange(addDaysISO(selectedDate, -1))}
        aria-label="วันก่อนหน้า"
        title="วันก่อนหน้า"
      >
        <i className="hc-datebar-chevron-icon">chevron_left</i>
      </button>

      {/* Date Picker Trigger (opens BookingCalendar sheet) */}
      <div className="hc-datebar-picker-wrap">
        <button
          type="button"
          className="chip small primary-container bold no-margin hc-datebar-picker-btn"
          data-testid="booking-date-picker-btn"
          aria-label="เลือกวันที่"
          title="คลิกเพื่อเลือกวันที่"
          aria-haspopup="dialog"
          aria-expanded={calendarSheetOpen}
          onClick={onCalendarClick}
        >
          <i className="small">calendar_month</i>
          <span className="hc-datebar-picker-text">{dateButtonLabel}</span>
          <i className="tiny">arrow_drop_down</i>
        </button>
      </div>

      {/* Next Day Button */}
      <button
        type="button"
        className="circle small transparent no-margin hc-datebar-chevron"
        onClick={() => onDateChange(addDaysISO(selectedDate, 1))}
        aria-label="วันถัดไป"
        title="วันถัดไป"
      >
        <i className="hc-datebar-chevron-icon">chevron_right</i>
      </button>

      {/* Return to Today Quick-Jump (Shown only when selectedDate !== today) */}
      {selectedDate !== today && !isAllDates && (
        <button
          type="button"
          className="chip small primary-container bold no-margin hc-datebar-today-btn"
          onClick={() => onDateChange(today)}
          title="กลับไปวันนี้"
          aria-label="กลับไปวันนี้"
        >
          <span className="hc-datebar-today-text">วันนี้</span>
        </button>
      )}

      {/* Material 3 Expressive Divider separating Date Navigation from Status Filter */}
      <ToolbarDivider />

      {/* BeerCSS Max Spacer: Pushes Sort & Filter to Far Right */}
      <div className="max" />

      {/* Sort Button */}
      {selectedSort && (
        <>
          <button
            type="button"
            className={`chip small bold no-margin ${
              isCustomSort ? 'primary' : 'tertiary-container'
            } hc-datebar-sort-btn`}
            data-testid="booking-sort-button"
            aria-label={`จัดเรียงตาม: ${currentSortOption?.label ?? 'วันรับชุด'}`}
            title={`จัดเรียงตาม: ${currentSortOption?.label ?? 'วันรับชุด'}`}
            aria-haspopup="dialog"
            aria-expanded={isSortOpen}
            onClick={handleSortClick}
          >
            <i className="small">sort</i>
            <span className="hc-datebar-sort-label">
              {isCustomSort ? currentSortOption?.label : 'จัดเรียง'}
            </span>
            <i className="tiny">arrow_drop_down</i>
          </button>

          {/* Self-contained dialog when not controlled externally */}
          {!onSortClick && onSelectSort && (
            <BookingSortDialog
              isOpen={internalSortOpen}
              selectedSort={selectedSort}
              onSelectSort={handleSelectSort}
              onClose={() => setInternalSortOpen(false)}
            />
          )}
        </>
      )}

      {/* Filter Dropdown Button */}
      <button
        type="button"
        className={`chip small bold no-margin ${
          !isAll ? 'primary' : 'tertiary-container'
        } hc-datebar-filter-btn`}
        data-testid="booking-filter-dropdown"
        aria-label={`ตัวกรองสถานะ: ${currentFilterLabel}`}
        title={`ตัวกรองสถานะ: ${currentFilterLabel}`}
        aria-haspopup="dialog"
        aria-expanded={filterSheetOpen}
        onClick={onFilterClick}
      >
        <i className="small">tune</i>
        <span className="hc-datebar-filter-label">{currentFilterLabel}</span>
        <span
          className={`hc-datebar-badge ${
            !isAll ? 'is-active-filter' : ''
          }`.trim()}
        >
          {activeCount}
        </span>
        <i className="tiny">arrow_drop_down</i>
      </button>
    </HeaderToolbar>
  );
};
