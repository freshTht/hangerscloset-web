import React, { useMemo } from 'react';
import { HeaderToolbar, ToolbarDivider } from './HeaderToolbar';
import {
  FILTER_TABS,
  type BookingFilterTab,
} from './BookingFilterSheet';
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
  statusFilter: BookingFilterTab;
  tabCounts: Record<BookingFilterTab, number>;
  filterSheetOpen?: boolean;
  calendarSheetOpen?: boolean;
  onDateChange: (newDate: string) => void;
  onFilterClick: () => void;
  onCalendarClick?: () => void;
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
  tabCounts,
  filterSheetOpen = false,
  calendarSheetOpen = false,
  onDateChange,
  onFilterClick,
  onCalendarClick,
}) => {
  const currentFilterTab = useMemo(
    () => FILTER_TABS.find((t) => t.id === statusFilter),
    [statusFilter]
  );

  const currentFilterLabel = useMemo(() => {
    if (statusFilter === 'active') return 'ตัวกรอง';
    if (statusFilter === 'available') return 'ว่าง';
    return currentFilterTab?.label ?? 'ตัวกรอง';
  }, [statusFilter, currentFilterTab]);

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

      {/* BeerCSS Max Spacer: Pushes Filter Dropdown to Far Right */}
      <div className="max" />

      {/* Filter Dropdown Button */}
      <button
        type="button"
        className={`chip small bold no-margin ${
          statusFilter !== 'active' ? 'primary' : 'tertiary-container'
        } hc-datebar-filter-btn`}
        data-testid="booking-filter-dropdown"
        aria-label={`ตัวกรองสถานะ: ${currentFilterTab?.label ?? currentFilterLabel}`}
        title={`ตัวกรองสถานะ: ${currentFilterTab?.label ?? currentFilterLabel}`}
        aria-haspopup="dialog"
        aria-expanded={filterSheetOpen}
        onClick={onFilterClick}
      >
        <i className="small">tune</i>
        <span className="hc-datebar-filter-label">{currentFilterLabel}</span>
        <span
          className={`hc-datebar-badge ${
            statusFilter !== 'active' ? 'is-active-filter' : ''
          }`.trim()}
        >
          {tabCounts[statusFilter]}
        </span>
        <i className="tiny">arrow_drop_down</i>
      </button>
    </HeaderToolbar>
  );
};
