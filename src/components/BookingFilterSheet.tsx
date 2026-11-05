import React, { useEffect } from 'react';
import {
  BOOKING_STATUS_ORDER,
  BOOKING_STATUS_META,
  type BookingItemStatus,
} from '../types/booking';

export type BookingFilterTab = 'active' | 'available' | BookingItemStatus;

export type BookingSortKey =
  | 'startDate_asc'
  | 'startDate_desc'
  | 'code_asc'
  | 'code_desc'
  | 'createdAt_desc';

export const FILTER_TABS: { id: BookingFilterTab; label: string }[] = [
  { id: 'active', label: 'กำลังดำเนินการ' },
  { id: 'available', label: 'ว่าง (พร้อมเช่า)' },
  ...BOOKING_STATUS_ORDER.map((status) => ({
    id: status,
    label: BOOKING_STATUS_META[status].label,
  })),
];

export const SORT_OPTIONS: { key: BookingSortKey; label: string; icon: string }[] = [
  { key: 'startDate_asc', label: 'วันรับชุด (ใกล้สุดก่อน)', icon: 'event' },
  { key: 'startDate_desc', label: 'วันรับชุด (ไกลสุดก่อน)', icon: 'schedule' },
  { key: 'code_asc', label: 'รหัสชุด (A-Z)', icon: 'sort_by_alpha' },
  { key: 'code_desc', label: 'รหัสชุด (Z-A)', icon: 'sort_by_alpha' },
  { key: 'createdAt_desc', label: 'วันที่ทำรายการล่าสุด', icon: 'history' },
];

export function getBookingFilterIcon(id: BookingFilterTab): string {
  switch (id) {
    case 'active':
      return 'pending_actions';
    case 'available':
      return 'check_circle';
    case 'reserved':
      return 'schedule';
    case 'pending_delivery':
      return 'local_shipping';
    case 'delivered':
      return 'checkroom';
    case 'pending_return':
      return 'assignment_return';
    case 'in_laundry':
      return 'local_laundry_service';
    case 'returned':
      return 'done_all';
    default:
      return 'filter_list';
  }
}

export interface BookingFilterSheetProps {
  isOpen: boolean;
  selectedFilter: BookingFilterTab;
  tabCounts: Record<BookingFilterTab, number>;
  selectedSort: BookingSortKey;
  onSelectFilter: (filter: BookingFilterTab) => void;
  onSelectSort: (sort: BookingSortKey) => void;
  onClose: () => void;
}

export const BookingFilterSheet: React.FC<BookingFilterSheetProps> = ({
  isOpen,
  selectedFilter,
  tabCounts,
  selectedSort,
  onSelectFilter,
  onSelectSort,
  onClose,
}) => {
  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCustomized = selectedFilter !== 'active' || selectedSort !== 'startDate_asc';

  return (
    <>
      <div
        className="overlay active"
        onClick={onClose}
        aria-hidden={!isOpen}
        style={{ zIndex: 1000 }}
      />

      <dialog
        id="booking-filter-sheet"
        className="bottom active"
        open={isOpen}
        aria-modal="true"
        aria-label="ตัวกรองและจัดเรียงรายการจอง"
        style={{
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          borderRadius: '20px 20px 0 0',
          maxWidth: '540px',
          width: '100%',
          margin: '0 auto',
          padding: '16px 20px 20px',
          maxHeight: '85dvh',
          overflowY: 'auto',
          background: 'var(--surface-container-low)',
        }}
      >
        {/* Drag pill handle */}
        <div
          style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--outline-variant)',
            margin: '0 auto 12px',
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div
          className="row items-center no-margin"
          style={{ gap: '8px', marginBottom: '16px', flexShrink: 0 }}
        >
          <i className="primary-text">tune</i>
          <h6 className="bold no-margin">ตัวกรองและจัดเรียง</h6>
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

        {/* Section 1: Status Picker (2-Column Grid) */}
        <div style={{ marginBottom: '18px', flexShrink: 0 }}>
          <div
            className="small-text secondary-text bold"
            style={{ marginBottom: '8px' }}
          >
            สถานะการจอง
          </div>

          <div
            role="tablist"
            aria-label="ตัวกรองสถานะการจอง"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '8px',
            }}
          >
            {FILTER_TABS.map((tab) => {
              const isSelected = selectedFilter === tab.id;
              const count = tabCounts[tab.id] ?? 0;
              const icon = getBookingFilterIcon(tab.id);

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  className={`row items-center no-margin ${
                    isSelected ? 'primary-container bold' : 'surface-container-high'
                  }`}
                  onClick={() => onSelectFilter(tab.id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '10px',
                    border: isSelected
                      ? '1.5px solid var(--primary)'
                      : '1px solid var(--outline-variant)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '4px',
                    minHeight: '40px',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      minWidth: 0,
                      flex: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <i
                      className={`small ${isSelected ? 'primary-text' : 'secondary-text'}`}
                      style={{ flexShrink: 0, fontSize: '16px' }}
                    >
                      {icon}
                    </i>
                    <span
                      style={{
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={tab.label}
                    >
                      {tab.label}
                    </span>
                  </div>

                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '10.5px',
                      padding: '1px 5px',
                      borderRadius: '6px',
                      backgroundColor: isSelected
                        ? 'var(--primary)'
                        : 'var(--surface-container-highest, rgba(255, 255, 255, 0.08))',
                      color: isSelected
                        ? 'var(--on-primary)'
                        : 'var(--on-surface-variant)',
                      flexShrink: 0,
                      minWidth: '16px',
                      textAlign: 'center',
                      lineHeight: '14px',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Sorting Options (Structured 2-Column Grid) */}
        <div style={{ marginBottom: '18px', flexShrink: 0 }}>
          <div
            className="small-text secondary-text bold"
            style={{ marginBottom: '8px' }}
          >
            จัดเรียงตาม
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '8px',
            }}
          >
            {SORT_OPTIONS.map((opt) => {
              const isSelected = selectedSort === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`chip small no-margin ${
                    isSelected ? 'fill primary bold' : 'border surface-container-high'
                  }`}
                  onClick={() => onSelectSort(opt.key)}
                  style={{
                    cursor: 'pointer',
                    minHeight: '34px',
                    height: '34px',
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    width: '100%',
                    boxSizing: 'border-box',
                    borderRadius: '8px',
                    gridColumn: opt.key === 'createdAt_desc' ? 'span 2' : undefined,
                  }}
                >
                  <i className="tiny" style={{ fontSize: '14px', flexShrink: 0 }}>
                    {isSelected ? 'check' : opt.icon}
                  </i>
                  <span
                    style={{
                      fontSize: '11.5px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="row items-center no-margin"
          style={{
            paddingTop: '12px',
            borderTop: '1px solid var(--surface-variant)',
            flexShrink: 0,
            gap: '10px',
            width: '100%',
          }}
        >
          <button
            type="button"
            className="transparent secondary-text small-text no-margin"
            onClick={() => {
              onSelectFilter('active');
              onSelectSort('startDate_asc');
            }}
            disabled={!isCustomized}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              opacity: isCustomized ? 1 : 0.4,
              cursor: isCustomized ? 'pointer' : 'default',
            }}
          >
            <i className="small">restart_alt</i>
            <span>รีเซ็ต</span>
          </button>

          <div className="max" />

          <button
            type="button"
            className="primary round no-margin bold"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              minHeight: '38px',
            }}
          >
            <span>ดูผลลัพธ์</span>
          </button>
        </div>
      </dialog>
    </>
  );
};
