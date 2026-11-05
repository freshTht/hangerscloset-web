/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef } from 'react';
import { type BookingItemStatus } from '../types/booking';
import './BookingFilterSheet.css';

export type BookingFilterTab = 'active' | 'available' | BookingItemStatus;

export type BookingSortKey =
  | 'startDate_asc'
  | 'startDate_desc'
  | 'code_asc'
  | 'code_desc'
  | 'createdAt_desc';

export const FILTER_TABS = [
  { id: 'active', label: 'กำลังดำเนินการ' },
  { id: 'available', label: 'ว่าง (พร้อมเช่า)' },
  { id: 'reserved', label: 'จองแล้ว' },
  { id: 'pending_delivery', label: 'รอส่งมอบ' },
  { id: 'delivered', label: 'ส่งมอบแล้ว' },
  { id: 'pending_return', label: 'รอรับคืน' },
  { id: 'in_laundry', label: 'ส่งซัก' },
  { id: 'returned', label: 'รับคืนเสร็จสิ้น' },
] as const;

export const SORT_OPTIONS = [
  { key: 'startDate_asc', label: 'วันรับชุด (ใกล้สุดก่อน)', icon: 'event' },
  { key: 'startDate_desc', label: 'วันรับชุด (ไกลสุดก่อน)', icon: 'schedule' },
  { key: 'code_asc', label: 'รหัสชุด (A-Z)', icon: 'sort_by_alpha' },
  { key: 'code_desc', label: 'รหัสชุด (Z-A)', icon: 'sort_by_alpha' },
  { key: 'createdAt_desc', label: 'วันที่ทำรายการล่าสุด', icon: 'history' },
] as const;

function getBookingFilterIcon(id: BookingFilterTab): string {
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Capture trigger focus on open, focus inside dialog, and restore trigger focus on close
  useEffect(() => {
    if (isOpen) {
      if (
        document.activeElement instanceof HTMLElement &&
        !dialogRef.current?.contains(document.activeElement)
      ) {
        previousActiveElementRef.current = document.activeElement;
      }
      const timer = window.setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(timer);
    } else if (previousActiveElementRef.current) {
      const prev = previousActiveElementRef.current;
      previousActiveElementRef.current = null;
      if (document.contains(prev)) {
        prev.focus();
      }
    }
  }, [isOpen]);

  // ESC key + Tab focus trap listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled):not([tabindex="-1"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!active || !dialogRef.current.contains(active)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCustomized =
    selectedFilter !== 'active' || selectedSort !== 'startDate_asc';

  return (
    <>
      <div
        className="overlay active hc-filter-sheet-overlay"
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <dialog
        ref={dialogRef}
        id="booking-filter-sheet"
        className="bottom active hc-filter-sheet-dialog"
        open={isOpen}
        aria-modal="true"
        aria-label="ตัวกรองและจัดเรียงรายการจอง"
      >
        {/* Drag pill handle */}
        <div className="hc-filter-sheet-handle" />

        {/* Header */}
        <div className="row items-center no-margin hc-filter-sheet-header">
          <i className="primary-text">tune</i>
          <h6 className="bold no-margin">ตัวกรองและจัดเรียง</h6>
          <div className="max" />
          <button
            ref={closeBtnRef}
            type="button"
            className="circle transparent no-margin hc-filter-sheet-close-btn"
            onClick={onClose}
            aria-label="ปิดตัวกรอง"
          >
            <i>close</i>
          </button>
        </div>

        {/* Section 1: Status Picker (2-Column Grid) */}
        <div className="hc-filter-sheet-section">
          <div className="small-text secondary-text bold hc-filter-sheet-section-title">
            สถานะการจอง
          </div>

          <div
            role="tablist"
            aria-label="ตัวกรองสถานะการจอง"
            className="hc-filter-sheet-grid"
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
                  className={`row items-center no-margin hc-filter-sheet-tab-btn ${
                    isSelected
                      ? 'primary-container bold is-selected'
                      : 'surface-container-high'
                  }`}
                  onClick={() => onSelectFilter(tab.id)}
                >
                  <div className="hc-filter-sheet-tab-label-wrap">
                    <i
                      className={`small hc-filter-sheet-tab-icon ${
                        isSelected ? 'primary-text' : 'secondary-text'
                      }`}
                    >
                      {icon}
                    </i>
                    <span
                      className="small-text hc-filter-sheet-tab-label"
                      title={tab.label}
                    >
                      {tab.label}
                    </span>
                  </div>

                  <span
                    className={`hc-micro-text hc-filter-sheet-tab-count ${
                      isSelected ? 'is-selected' : ''
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Sorting Options (Structured 2-Column Grid) */}
        <div className="hc-filter-sheet-section">
          <div className="small-text secondary-text bold hc-filter-sheet-section-title">
            จัดเรียงตาม
          </div>

          <div className="hc-filter-sheet-grid">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = selectedSort === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`chip small no-margin hc-filter-sheet-sort-btn ${
                    isSelected
                      ? 'fill primary bold'
                      : 'border surface-container-high'
                  } ${opt.key === 'createdAt_desc' ? 'span-2' : ''}`.trim()}
                  onClick={() => onSelectSort(opt.key)}
                >
                  <i className="tiny hc-filter-sheet-sort-icon">
                    {isSelected ? 'check' : opt.icon}
                  </i>
                  <span className="small-text hc-filter-sheet-sort-label">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="row items-center no-margin hc-filter-sheet-footer">
          <button
            type="button"
            className="transparent secondary-text small-text no-margin hc-filter-sheet-reset-btn"
            onClick={() => {
              onSelectFilter('active');
              onSelectSort('startDate_asc');
            }}
            disabled={!isCustomized}
          >
            <i className="small">restart_alt</i>
            <span>รีเซ็ต</span>
          </button>

          <div className="max" />

          <button
            type="button"
            className="primary round no-margin bold hc-filter-sheet-apply-btn"
            onClick={onClose}
          >
            <span>ดูผลลัพธ์</span>
          </button>
        </div>
      </dialog>
    </>
  );
};
