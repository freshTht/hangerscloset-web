import React, { useState, useMemo, useRef } from 'react';
import { getTodayISO, type Booking } from '../types/booking';
import { Stack } from './Stack';
import { Modal } from '../common/components/Modal';
import './StatusBadge.css';
import './BookingCalendar.css';

export interface BookingCalendarProps {
  isOpen?: boolean;
  selectedDate: string;
  today?: string;
  bookings: Booking[];
  onSelectDate: (isoDate: string) => void;
  onClose?: () => void;
}

const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const WEEKDAY_LABELS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

interface DayEntry {
  booking: Booking;
  itemCode: string;
  windowType: 'rental' | 'cleaning';
}

function buildMonthGrid(year: number, monthIndex: number): (string | null)[] {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const startWeekday = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const m = String(monthIndex + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    cells.push(`${year}-${m}-${dayStr}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function parseYearMonth(isoDate: string, fallbackIso: string): [number, number] {
  const target = /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate : fallbackIso;
  const parts = target.split('-').map(Number);
  return [parts[0], parts[1] - 1];
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  isOpen = true,
  selectedDate,
  today,
  bookings,
  onSelectDate,
  onClose,
}) => {
  const todayIso = useMemo(() => today ?? getTodayISO(), [today]);
  const [initialYear, initialMonth] = parseYearMonth(selectedDate, todayIso);

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);
  const [prevOpen, setPrevOpen] = useState<boolean>(isOpen);
  const [prevSelectedDate, setPrevSelectedDate] = useState<string>(selectedDate);

  if ((isOpen && !prevOpen) || selectedDate !== prevSelectedDate) {
    setPrevOpen(isOpen);
    setPrevSelectedDate(selectedDate);
    const [y, m] = parseYearMonth(selectedDate, todayIso);
    setViewYear(y);
    setViewMonth(m);
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const entriesByDate = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    for (const cellDate of cells) {
      if (!cellDate) continue;
      const dayEntries: DayEntry[] = [];
      for (const b of bookings) {
        if (cellDate >= b.startDate && cellDate <= b.cleaningEndDate) {
          const windowType: 'rental' | 'cleaning' =
            cellDate <= b.endDate ? 'rental' : 'cleaning';
          for (const li of b.items) {
            dayEntries.push({
              booking: b,
              itemCode: li.itemCode,
              windowType,
            });
          }
        }
      }
      map.set(cellDate, dayEntries);
    }
    return map;
  }, [cells, bookings]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const [y, m] = parseYearMonth(todayIso, todayIso);
    setViewYear(y);
    setViewMonth(m);
    onSelectDate(todayIso);
    onClose?.();
  };

  const handleDaySelect = (isoDate: string) => {
    onSelectDate(isoDate);
    onClose?.();
  };

  return (
    <Modal
      visible={isOpen}
      variant="floating"
      onClose={onClose ?? (() => {})}
      id="booking-calendar-dialog"
      testId="booking-calendar-dialog"
      overlayTestId="booking-calendar-backdrop"
      overlayClassName="hc-calendar-dialog-overlay"
      className="hc-calendar-dialog"
      ariaLabel="เลือกวันที่จากปฏิทิน"
      dialogRef={dialogRef}
    >
      <Stack orientation="column" gap="medium">
          {/* Calendar Header: Month Navigation + Close Button */}
          <Stack
            orientation="row"
            align="center"
            justify="space-between"
            gap="small"
            wrap
          >
            <Stack orientation="row" align="center" gap="tiny">
              <button
                type="button"
                className="circle transparent small no-margin hc-booking-calendar-nav-btn"
                onClick={handlePrevMonth}
                aria-label="เดือนก่อนหน้า"
              >
                <i>chevron_left</i>
              </button>
              <h6 className="bold no-margin">
                {THAI_MONTHS_FULL[viewMonth]} {viewYear + 543}
              </h6>
              <button
                type="button"
                className="circle transparent small no-margin hc-booking-calendar-nav-btn"
                onClick={handleNextMonth}
                aria-label="เดือนถัดไป"
              >
                <i>chevron_right</i>
              </button>
            </Stack>

            {onClose && (
              <button
                ref={closeBtnRef}
                type="button"
                className="circle transparent small no-margin hc-booking-calendar-nav-btn"
                onClick={onClose}
                aria-label="ปิดปฏิทิน"
              >
                <i>close</i>
              </button>
            )}
          </Stack>

          {/* Legend & Today Quick Jump */}
          <Stack orientation="row" align="center" gap="small" wrap>
            <span className="chip tiny primary-container no-margin">
              วันเช่าชุด
            </span>
            <span className="chip tiny hc-status-badge-laundry no-margin">
              วันซัก/เตรียมชุด
            </span>
            <button
              type="button"
              className="border small round no-margin hc-booking-calendar-today-btn"
              onClick={handleToday}
            >
              วันนี้
            </button>
          </Stack>

          {/* Weekday Headers */}
          <div className="hc-booking-calendar-grid">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="center-align small-text bold secondary-text hc-booking-calendar-weekday-header"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar 7-Column Grid */}
          <div className="hc-booking-calendar-grid">
            {cells.map((isoDate, idx) => {
              if (!isoDate) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="surface-container-low hc-booking-calendar-empty-cell"
                  />
                );
              }

              const dayNum = Number(isoDate.split('-')[2]);
              const isToday = isoDate === todayIso;
              const isSelected = isoDate === selectedDate;
              const entries = entriesByDate.get(isoDate) ?? [];

              return (
                <button
                  key={isoDate}
                  type="button"
                  onClick={() => handleDaySelect(isoDate)}
                  aria-label={`วันที่ ${isoDate}`}
                  aria-pressed={isSelected}
                  className={`no-margin hc-booking-calendar-day-btn ${
                    isSelected
                      ? 'secondary-container is-selected'
                      : 'surface-container-low'
                  }`}
                >
                  <Stack
                    orientation="row"
                    align="center"
                    justify="space-between"
                  >
                    <span
                      className={`small-text ${
                        isToday ? 'bold primary-text' : ''
                      }`}
                    >
                      {dayNum}
                    </span>
                    {entries.length > 0 && (
                      <span className="hc-micro-text bold primary-text">
                        {entries.length}
                      </span>
                    )}
                  </Stack>

                  {entries.length > 0 && (
                    <Stack
                      orientation="row"
                      align="center"
                      gap="tiny"
                      wrap
                      className="hc-booking-calendar-mobile-dots"
                    >
                      {entries.slice(0, 4).map((entry, eIdx) => (
                        <span
                          key={`${entry.booking.id}-${entry.itemCode}-${eIdx}`}
                          className={`hc-booking-calendar-dot ${entry.windowType}`}
                        />
                      ))}
                    </Stack>
                  )}
                </button>
              );
            })}
          </div>
        </Stack>
      </Modal>
    );
  };
