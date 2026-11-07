import React, { useMemo } from 'react';
import {
  HeaderToolbar,
  type HeaderToolbarVariant,
  type HeaderToolbarElevation,
} from '../common/components';
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
  calendarSheetOpen?: boolean;
  onDateChange: (newDate: string) => void;
  onCalendarClick?: () => void;
  variant?: HeaderToolbarVariant;
  elevation?: HeaderToolbarElevation;
  outlined?: boolean;
  sticky?: boolean;
}

/**
 * BookingDateBar - BeerCSS Toolbar component for date navigation on Bookings page.
 * Features a horizontally compact connected date navigator (Prev, Date Picker, Next) and defaults to blurred background with clean outline.
 */
export const BookingDateBar: React.FC<BookingDateBarProps> = ({
  selectedDate,
  today,
  isAllDates = false,
  calendarSheetOpen = false,
  onDateChange,
  onCalendarClick,
  variant,
  elevation,
  outlined,
  sticky = true,
}) => {
  const dateButtonLabel = useMemo(() => {
    if (isAllDates) return 'แสดงทุกวัน (คลิกเพื่อเลือกวัน)';
    if (selectedDate === today) return `${formatDateThaiShort(selectedDate)} (วันนี้)`;
    return formatDateThaiShortWithYear(selectedDate);
  }, [isAllDates, selectedDate, today]);

  const isToday = selectedDate === today && !isAllDates;

  return (
    <HeaderToolbar
      testId="bookings-date-bar"
      variant={variant}
      elevation={elevation}
      outlined={outlined}
      sticky={sticky}
    >
      {/* Horizontally Compact Connected Date Navigator (Prev, Date Picker, Next) */}
      <nav
        className="group connected no-margin hc-datebar-nav-group"
        role="group"
        aria-label="เลือกและนำทางวันที่"
      >
        {/* Previous Day Button */}
        <button
          type="button"
          className="left-round small no-margin hc-datebar-nav-btn hc-datebar-chevron"
          onClick={() => onDateChange(addDaysISO(selectedDate, -1))}
          aria-label="วันก่อนหน้า"
          title="วันก่อนหน้า"
        >
          <i className="hc-datebar-chevron-icon" aria-hidden="true">chevron_left</i>
        </button>

        {/* Date Picker Trigger (opens BookingCalendar sheet) */}
        <button
          type="button"
          className="no-round small bold no-margin hc-datebar-nav-btn hc-datebar-picker-btn"
          data-testid="booking-date-picker-btn"
          aria-label="เลือกวันที่"
          title="คลิกเพื่อเลือกวันที่"
          aria-haspopup="dialog"
          aria-expanded={calendarSheetOpen}
          onClick={onCalendarClick}
        >
          <i className="small hc-datebar-cal-icon" aria-hidden="true">calendar_month</i>
          <span className="hc-datebar-picker-text">{dateButtonLabel}</span>
          <i className="tiny hc-datebar-arrow-icon" aria-hidden="true">arrow_drop_down</i>
        </button>

        {/* Next Day Button */}
        <button
          type="button"
          className="right-round small no-margin hc-datebar-nav-btn hc-datebar-chevron"
          onClick={() => onDateChange(addDaysISO(selectedDate, 1))}
          aria-label="วันถัดไป"
          title="วันถัดไป"
        >
          <i className="hc-datebar-chevron-icon" aria-hidden="true">chevron_right</i>
        </button>
      </nav>

      {/* Return to Today Quick-Jump: Always visible, disabled when already today */}
      <button
        type="button"
        disabled={isToday}
        className="chip small primary-container bold no-margin hc-datebar-today-btn"
        onClick={() => onDateChange(today)}
        title="กลับไปวันนี้"
        aria-label="กลับไปวันนี้"
        data-testid="booking-date-today-btn"
      >
        <span className="hc-datebar-today-text">วันนี้</span>
      </button>
    </HeaderToolbar>
  );
};
