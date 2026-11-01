import React, { useRef, useMemo } from 'react';
import {
  FILTER_TABS,
  type BookingFilterTab,
} from './BookingFilterSheet';
import {
  formatDateThaiShort,
  formatDateThaiShortWithYear,
  addDaysISO,
} from '../lib/bookingAvailability';

export interface BookingDateBarProps {
  selectedDate: string;
  today: string;
  isAllDates?: boolean;
  statusFilter: BookingFilterTab;
  tabCounts: Record<BookingFilterTab, number>;
  filterSheetOpen?: boolean;
  onDateChange: (newDate: string) => void;
  onFilterClick: () => void;
}

/**
 * BookingDateBar - BeerCSS Toolbar component for date navigation and filter triggering on Bookings page.
 * Uses BeerCSS `<nav className="toolbar ...">` with `.max` spacer for robust responsive layout.
 */
export const BookingDateBar: React.FC<BookingDateBarProps> = ({
  selectedDate,
  today,
  isAllDates = false,
  statusFilter,
  tabCounts,
  filterSheetOpen = false,
  onDateChange,
  onFilterClick,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

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
    <nav
      data-testid="bookings-date-bar"
      className="toolbar surface-container-low border round bottom-margin"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '48px',
        height: '48px',
        padding: '0 8px',
        gap: '4px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Previous Day Button */}
      <button
        type="button"
        className="circle transparent no-margin"
        onClick={() => onDateChange(addDaysISO(selectedDate, -1))}
        aria-label="วันก่อนหน้า"
        title="วันก่อนหน้า"
        style={{
          width: '32px',
          height: '32px',
          minWidth: '32px',
          minHeight: '32px',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i style={{ fontSize: '18px' }}>chevron_left</i>
      </button>

      {/* Date Picker Trigger with hidden native input */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', minWidth: 0 }}>
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              onDateChange(e.target.value);
            }
          }}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: 0,
            height: 0,
          }}
          tabIndex={-1}
          aria-hidden="true"
        />
        <button
          type="button"
          className="chip surface-container-high border bold no-margin"
          onClick={() => {
            if (dateInputRef.current) {
              if ('showPicker' in HTMLInputElement.prototype) {
                try {
                  dateInputRef.current.showPicker();
                } catch {
                  dateInputRef.current.focus();
                }
              } else {
                dateInputRef.current.focus();
              }
            }
          }}
          aria-label="เลือกวันที่"
          title="คลิกเพื่อเลือกวันที่"
          style={{
            minHeight: '32px',
            height: '32px',
            padding: '0 8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            borderRadius: '8px',
            minWidth: 0,
            cursor: 'pointer',
          }}
        >
          <i className="small" style={{ fontSize: '16px', flexShrink: 0 }}>
            calendar_month
          </i>
          <span
            style={{
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            {dateButtonLabel}
          </span>
          <i className="tiny" style={{ fontSize: '14px', flexShrink: 0 }}>
            arrow_drop_down
          </i>
        </button>
      </div>

      {/* Next Day Button */}
      <button
        type="button"
        className="circle transparent no-margin"
        onClick={() => onDateChange(addDaysISO(selectedDate, 1))}
        aria-label="วันถัดไป"
        title="วันถัดไป"
        style={{
          width: '32px',
          height: '32px',
          minWidth: '32px',
          minHeight: '32px',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i style={{ fontSize: '18px' }}>chevron_right</i>
      </button>

      {/* Return to Today Quick-Jump (Shown only when selectedDate !== today) */}
      {selectedDate !== today && !isAllDates && (
        <button
          type="button"
          className="chip surface-container-high border primary-text bold no-margin"
          onClick={() => onDateChange(today)}
          title="กลับไปวันนี้"
          aria-label="กลับไปวันนี้"
          style={{
            height: '32px',
            minHeight: '32px',
            padding: '0 8px',
            borderRadius: '8px',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <span style={{ fontSize: '11.5px' }}>วันนี้</span>
        </button>
      )}

      {/* BeerCSS Max Spacer: Pushes Filter Dropdown to Far Right */}
      <div className="max" />

      {/* Filter Dropdown Button */}
      <button
        type="button"
        className={`chip surface-container-high ${
          statusFilter !== 'active' ? 'primary' : 'border'
        } bold no-margin`}
        data-testid="booking-filter-dropdown"
        aria-label={`ตัวกรองสถานะ: ${currentFilterTab?.label ?? currentFilterLabel}`}
        title={`ตัวกรองสถานะ: ${currentFilterTab?.label ?? currentFilterLabel}`}
        aria-haspopup="dialog"
        aria-expanded={filterSheetOpen}
        onClick={onFilterClick}
        style={{
          minHeight: '32px',
          height: '32px',
          padding: '0 8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          borderRadius: '8px',
          cursor: 'pointer',
          flexShrink: 0,
          maxWidth: '145px',
        }}
      >
        <i className="small" style={{ fontSize: '16px', flexShrink: 0 }}>
          tune
        </i>
        <span
          style={{
            fontSize: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {currentFilterLabel}
        </span>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: '6px',
            backgroundColor:
              statusFilter !== 'active'
                ? 'var(--on-primary)'
                : 'var(--primary)',
            color:
              statusFilter !== 'active'
                ? 'var(--primary)'
                : 'var(--on-primary)',
            lineHeight: '14px',
            flexShrink: 0,
          }}
        >
          {tabCounts[statusFilter]}
        </span>
        <i className="tiny" style={{ fontSize: '14px', flexShrink: 0 }}>
          arrow_drop_down
        </i>
      </button>
    </nav>
  );
};
