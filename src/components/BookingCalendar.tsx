import React, { useState, useMemo } from 'react';
import {
  formatDateThaiShort,
  getTodayISO,
  type Booking,
  type BookingItemStatus,
} from '../types/booking';
import { useIsMobile } from '../hooks/useIsMobile';
import { BookingCard } from './BookingCard';
import { Stack } from './Stack';

export interface BookingCalendarProps {
  bookings: Booking[];
  onEditBooking: (booking: Booking) => void;
  onAdvanceItemStatus: (
    bookingId: string,
    itemId: string,
    nextStatus: BookingItemStatus
  ) => Promise<void> | void;
  onToggleDepositRefunded?: (booking: Booking) => Promise<void> | void;
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

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  onEditBooking,
  onAdvanceItemStatus,
  onToggleDepositRefunded,
}) => {
  const isMobile = useIsMobile();
  const todayIso = getTodayISO();
  const initialParts = todayIso.split('-').map(Number);

  const [viewYear, setViewYear] = useState<number>(initialParts[0]);
  const [viewMonth, setViewMonth] = useState<number>(initialParts[1] - 1);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

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

  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter(
      (b) => selectedDate >= b.startDate && selectedDate <= b.cleaningEndDate
    );
  }, [bookings, selectedDate]);

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
    const parts = todayIso.split('-').map(Number);
    setViewYear(parts[0]);
    setViewMonth(parts[1] - 1);
    setSelectedDate(todayIso);
  };

  return (
    <Stack orientation="column" gap="medium">
      <article className="border round surface medium-padding no-margin">
        <Stack orientation="column" gap="medium">
          {/* Calendar Header */}
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
                className="circle transparent small no-margin"
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
                className="circle transparent small no-margin"
                onClick={handleNextMonth}
                aria-label="เดือนถัดไป"
              >
                <i>chevron_right</i>
              </button>
            </Stack>

            <Stack orientation="row" align="center" gap="small" wrap>
              <span className="chip tiny primary-container no-margin">
                วันเช่าชุด
              </span>
              <span className="chip tiny status-badge-laundry no-margin">
                วันซัก/เตรียมชุด
              </span>
              <button
                type="button"
                className="border small round no-margin"
                onClick={handleToday}
              >
                วันนี้
              </button>
            </Stack>
          </Stack>

          {/* Weekday Headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: '4px',
            }}
          >
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="center-align small-text bold secondary-text"
                style={{ padding: '4px 0' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar 7-Column Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: '4px',
            }}
          >
            {cells.map((isoDate, idx) => {
              if (!isoDate) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="round surface-container-low"
                    style={{
                      minHeight: isMobile ? '52px' : '84px',
                      opacity: 0.35,
                    }}
                  />
                );
              }

              const dayNum = Number(isoDate.split('-')[2]);
              const isToday = isoDate === todayIso;
              const isSelected = isoDate === selectedDate;
              const entries = entriesByDate.get(isoDate) ?? [];
              const visiblePills = entries.slice(0, 3);
              const overflowCount = Math.max(0, entries.length - 3);

              return (
                <button
                  key={isoDate}
                  type="button"
                  onClick={() => setSelectedDate(isoDate)}
                  aria-label={`วันที่ ${isoDate}`}
                  className={`round no-margin ${
                    isSelected
                      ? 'secondary-container border'
                      : 'surface-container-low'
                  }`}
                  style={{
                    minHeight: isMobile ? '52px' : '84px',
                    minWidth: 0,
                    width: '100%',
                    padding: isMobile ? '4px' : '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    gap: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    border: isSelected
                      ? '2px solid var(--primary)'
                      : '1px solid transparent',
                  }}
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
                    {isMobile && entries.length > 0 && (
                      <span className="micro-text bold primary-text">
                        {entries.length}
                      </span>
                    )}
                  </Stack>

                  {isMobile ? (
                    entries.length > 0 && (
                      <Stack
                        orientation="row"
                        align="center"
                        gap="tiny"
                        wrap
                        style={{ marginTop: 'auto' }}
                      >
                        {entries.slice(0, 4).map((entry, eIdx) => (
                          <span
                            key={`${entry.booking.id}-${entry.itemCode}-${eIdx}`}
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '9999px',
                              backgroundColor:
                                entry.windowType === 'rental'
                                  ? 'var(--primary)'
                                  : '#0288d1',
                              display: 'inline-block',
                            }}
                          />
                        ))}
                      </Stack>
                    )
                  ) : (
                    <Stack
                      orientation="column"
                      gap="tiny"
                      style={{ minWidth: 0, width: '100%' }}
                    >
                      {visiblePills.map((entry, eIdx) => (
                        <span
                          key={`${entry.booking.id}-${entry.itemCode}-${eIdx}`}
                          className={`micro-text bold round ${
                            entry.windowType === 'rental'
                              ? 'primary-container'
                              : 'status-badge-laundry'
                          }`}
                          style={{
                            padding: '1px 6px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          }}
                        >
                          {entry.itemCode}
                        </span>
                      ))}
                      {overflowCount > 0 && (
                        <span className="micro-text secondary-text bold">
                          +{overflowCount} ชุด
                        </span>
                      )}
                    </Stack>
                  )}
                </button>
              );
            })}
          </div>
        </Stack>
      </article>

      {/* Selected Day Bookings List */}
      <Stack orientation="column" gap="small">
        <Stack orientation="row" align="center" justify="space-between">
          <h6 className="bold no-margin">
            รายการวันที่ {formatDateThaiShort(selectedDate)} (
            {selectedDateBookings.length} การจอง)
          </h6>
        </Stack>

        {selectedDateBookings.length === 0 ? (
          <article className="border round surface medium-padding center-align no-margin">
            <p className="secondary-text no-margin">
              ไม่มีคิวเช่าหรือซักชุดในวันที่เลือก
            </p>
          </article>
        ) : (
          <div className="grid">
            {selectedDateBookings.map((booking) => (
              <div key={booking.id} className="s12 m6">
                <BookingCard
                  booking={booking}
                  onEdit={onEditBooking}
                  onAdvanceItemStatus={onAdvanceItemStatus}
                  onToggleDepositRefunded={onToggleDepositRefunded}
                />
              </div>
            ))}
          </div>
        )}
      </Stack>
    </Stack>
  );
};
